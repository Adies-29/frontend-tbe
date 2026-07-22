import { useState } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { apiFetch } from '../../../utils/apiFetch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function usePotonganCustom() {
    const token = useAuthStore((state) => state.token);
    const queryClient = useQueryClient();

    // State untuk Notifikasi
    const [notif, setNotif] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
        show: false,
        message: "",
        type: "success"
    });
    const closeNotif = () => setNotif(prev => ({ ...prev, show: false }));

    // ==========================================
    // 1. FETCH DATA PEGAWAI (Untuk Dropdown Form)
    // ==========================================
    const { data: listPegawai = [], isLoading: isLoadingPegawai } = useQuery({
        queryKey: ['pegawaiListPotongan'],
        queryFn: async () => {
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/pegawai`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await response.json();
            if (!response.ok) throw new Error("Gagal mengambil data pegawai");
            return result.data || [];
        },
        enabled: !!token
    });

    // ==========================================
    // 2. FETCH DAFTAR POTONGAN CUSTOM
    // ==========================================
    const { data: listPotongan = [], isLoading: isLoadingPotongan } = useQuery({
        queryKey: ['potonganCustomList'],
        queryFn: async () => {
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/potongan-custom`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await response.json();
            if (!response.ok) throw new Error("Gagal mengambil data potongan custom");
            
            // Flatten data
            return (result.data || []).map((item: any) => ({
                id: String(item.id),
                nama_pegawai: item.pegawai?.nama || "Tanpa Nama",
                pegawai_id: String(item.pegawai_id),
                tanggal_diberikan: item.tanggal_diberikan,
                keterangan: item.keterangan,
                nominal: item.nominal
            }));
        },
        enabled: !!token
    });

    // ==========================================
    // 3. MUTASI: TAMBAH POTONGAN BATCH
    // ==========================================
    const createPotonganMutation = useMutation({
        mutationFn: async (payload: { pegawai_ids: string[], tanggal_diberikan?: string, tanggals?: string[], keterangan: string, nominal: number }) => {
            const dates = payload.tanggals && payload.tanggals.length > 0
                ? payload.tanggals
                : (payload.tanggal_diberikan ? [payload.tanggal_diberikan] : []);

            const promises = [];
            for (const id of payload.pegawai_ids) {
                for (const tgl of dates) {
                    promises.push(
                        (async () => {
                            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/potongan-custom`, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "Authorization": `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                    pegawai_id: id,
                                    tanggal_diberikan: tgl,
                                    keterangan: payload.keterangan,
                                    nominal: payload.nominal
                                })
                            });
                            const result = await response.json();
                            if (!response.ok || !result.success) throw new Error(result.message || "Gagal menambah potongan.");
                            return result;
                        })()
                    );
                }
            }
            return await Promise.all(promises);
        },
        onSuccess: (results) => {
            setNotif({ show: true, message: `Sukses menambahkan ${results.length} data potongan!`, type: "success" });
            queryClient.invalidateQueries({ queryKey: ['potonganCustomList'] });
            queryClient.invalidateQueries({ queryKey: ['rekapGaji'] });
        },
        onError: (error: any) => {
            setNotif({ show: true, message: error.message || "Terjadi kesalahan.", type: "error" });
        }
    });

    // ==========================================
    // 4. MUTASI: UPDATE POTONGAN
    // ==========================================
    const updatePotonganMutation = useMutation({
        mutationFn: async (payload: { id: string; pegawai_id: string; tanggal_diberikan: string; keterangan: string; nominal: number }) => {
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/potongan-custom/${payload.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    pegawai_id: payload.pegawai_id,
                    tanggal_diberikan: payload.tanggal_diberikan,
                    keterangan: payload.keterangan,
                    nominal: payload.nominal
                })
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || "Gagal memperbarui potongan.");
            return result;
        },
        onSuccess: () => {
            setNotif({ show: true, message: "Sukses memperbarui data potongan!", type: "success" });
            queryClient.invalidateQueries({ queryKey: ['potonganCustomList'] });
            queryClient.invalidateQueries({ queryKey: ['rekapGaji'] });
        },
        onError: (error: any) => {
            setNotif({ show: true, message: error.message || "Gagal memperbarui.", type: "error" });
        }
    });

    // ==========================================
    // 5. MUTASI: HAPUS POTONGAN
    // ==========================================
    const deletePotonganMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/potongan-custom/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || "Gagal menghapus potongan.");
            return result;
        },
        onSuccess: (result) => {
            setNotif({ show: true, message: `Sukses! ${result.message}`, type: "success" });
            queryClient.invalidateQueries({ queryKey: ['potonganCustomList'] });
            queryClient.invalidateQueries({ queryKey: ['rekapGaji'] });
        },
        onError: (error: any) => {
            setNotif({ show: true, message: error.message || "Gagal menghapus.", type: "error" });
        }
    });

    const handleDeletePotongan = (id: string) => {
        deletePotonganMutation.mutate(id);
    };

    return {
        listPegawai,
        listPotongan,
        isLoadingPegawai,
        isLoadingPotongan,
        isCreating: createPotonganMutation.isPending,
        isUpdating: updatePotonganMutation.isPending,
        notif,
        closeNotif,
        createPotongan: createPotonganMutation.mutate,
        updatePotongan: updatePotonganMutation.mutate,
        handleDeletePotongan
    };
}

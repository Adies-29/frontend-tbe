import { useState } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { apiFetch } from '../../../utils/apiFetch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useBonusCustom() {
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
        queryKey: ['pegawaiListBonus'],
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
    // 2. FETCH DAFTAR BONUS CUSTOM
    // ==========================================
    const { data: listBonus = [], isLoading: isLoadingBonus } = useQuery({
        queryKey: ['bonusCustomList'],
        queryFn: async () => {
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/bonus-custom`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await response.json();
            if (!response.ok) throw new Error("Gagal mengambil data bonus custom");
            
            // Flatten data untuk DataGrid
            return (result.data || []).map((item: any) => ({
                id: String(item.id),
                nama_pegawai: item.pegawai?.nama || "Tanpa Nama",
                tanggal_diberikan: item.tanggal_diberikan,
                keterangan: item.keterangan,
                nominal: item.nominal
            }));
        },
        enabled: !!token
    });

    // ==========================================
    // 3. MUTASI: TAMBAH BONUS
    // ==========================================
    const createBonusMutation = useMutation({
        mutationFn: async (payload: { pegawai_id: string, tanggal_diberikan: string, keterangan: string, nominal: number }) => {
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/bonus-custom`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || "Gagal menambah bonus.");
            return result;
        },
        onSuccess: (result) => {
            setNotif({ show: true, message: `Sukses! ${result.message}`, type: "success" });
            queryClient.invalidateQueries({ queryKey: ['bonusCustomList'] });
        },
        onError: (error: any) => {
            setNotif({ show: true, message: error.message || "Terjadi kesalahan.", type: "error" });
        }
    });

    // ==========================================
    // 4. MUTASI: HAPUS BONUS
    // ==========================================
    const deleteBonusMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/bonus-custom/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || "Gagal menghapus bonus.");
            return result;
        },
        onSuccess: (result) => {
            setNotif({ show: true, message: `Sukses! ${result.message}`, type: "success" });
            queryClient.invalidateQueries({ queryKey: ['bonusCustomList'] });
            
        },
        onError: (error: any) => {
            setNotif({ show: true, message: error.message || "Gagal menghapus.", type: "error" });
        }
    });

    const handleDeleteBonus = (id: string) => {
        if (window.confirm("Yakin ingin menghapus riwayat bonus ini? (Pastikan gaji bulan tersebut belum di-generate ulang)")) {
            deleteBonusMutation.mutate(id);
        }
    };

    return {
        listPegawai,
        listBonus,
        isLoadingPegawai,
        isLoadingBonus,
        isCreating: createBonusMutation.isPending,
        notif,
        closeNotif,
        createBonus: createBonusMutation.mutate,
        handleDeleteBonus
    };
}
import { apiFetchJson } from '../../../utils/apiFetch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotif } from '../../../hooks/useNotif';

export function usePotonganCustom() {
    const queryClient = useQueryClient();
    const { notif, showNotif, showErrorNotif, closeNotif } = useNotif();

    // ==========================================
    // 1. FETCH DATA PEGAWAI (Untuk Dropdown Form)
    // ==========================================
    const { data: listPegawai = [], isLoading: isLoadingPegawai } = useQuery({
        queryKey: ['pegawai'],
        queryFn: async () => {
            const result = await apiFetchJson('/api/v1/pegawai');
            return result.data || [];
        }
    });

    // ==========================================
    // 2. FETCH DAFTAR POTONGAN CUSTOM
    // ==========================================
    const { data: listPotongan = [], isLoading: isLoadingPotongan } = useQuery({
        queryKey: ['potonganCustomList'],
        queryFn: async () => {
            const result = await apiFetchJson('/api/v1/potongan-custom');
            
            // Flatten data
            return (result.data || []).map((item: any) => ({
                id: String(item.id),
                nama_pegawai: item.pegawai?.nama || "Tanpa Nama",
                pegawai_id: String(item.pegawai_id),
                tanggal_diberikan: item.tanggal_diberikan,
                keterangan: item.keterangan,
                nominal: item.nominal
            }));
        }
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
                            const result = await apiFetchJson('/api/v1/potongan-custom', {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                    pegawai_id: id,
                                    tanggal_diberikan: tgl,
                                    keterangan: payload.keterangan,
                                    nominal: payload.nominal
                                })
                            });
                            return result;
                        })()
                    );
                }
            }
            return await Promise.all(promises);
        },
        onSuccess: (results) => {
            showNotif(`Sukses menambahkan ${results.length} data potongan!`, "success");
            queryClient.invalidateQueries({ queryKey: ['potonganCustomList'] });
            queryClient.invalidateQueries({ queryKey: ['rekapGaji'] });
        },
        onError: (error: any) => {
            showErrorNotif(error);
        }
    });

    // ==========================================
    // 4. MUTASI: UPDATE POTONGAN
    // ==========================================
    const updatePotonganMutation = useMutation({
        mutationFn: async (payload: { id: string; pegawai_id: string; tanggal_diberikan: string; keterangan: string; nominal: number }) => {
            const result = await apiFetchJson(`/api/v1/potongan-custom/${payload.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    pegawai_id: payload.pegawai_id,
                    tanggal_diberikan: payload.tanggal_diberikan,
                    keterangan: payload.keterangan,
                    nominal: payload.nominal
                })
            });
            return result;
        },
        onSuccess: () => {
            showNotif("Sukses memperbarui data potongan!", "success");
            queryClient.invalidateQueries({ queryKey: ['potonganCustomList'] });
            queryClient.invalidateQueries({ queryKey: ['rekapGaji'] });
        },
        onError: (error: any) => {
            showErrorNotif(error);
        }
    });

    // ==========================================
    // 5. MUTASI: HAPUS POTONGAN
    // ==========================================
    const deletePotonganMutation = useMutation({
        mutationFn: async (id: string) => {
            const result = await apiFetchJson(`/api/v1/potongan-custom/${id}`, {
                method: "DELETE"
            });
            return result;
        },
        onSuccess: (result) => {
            showNotif(`Sukses! ${result.message}`, "success");
            queryClient.invalidateQueries({ queryKey: ['potonganCustomList'] });
            queryClient.invalidateQueries({ queryKey: ['rekapGaji'] });
        },
        onError: (error: any) => {
            showErrorNotif(error);
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
        showNotif,
        showErrorNotif,
        closeNotif,
        createPotongan: createPotonganMutation.mutate,
        updatePotongan: updatePotonganMutation.mutate,
        handleDeletePotongan
    };
}

import { apiFetchJson } from '../../../utils/apiFetch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotif } from '../../../hooks/useNotif';

export function useBonusCustom() {
    const queryClient = useQueryClient();
    const { notif, showNotif, closeNotif } = useNotif();

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
    // 2. FETCH DAFTAR BONUS CUSTOM
    // ==========================================
    const { data: listBonus = [], isLoading: isLoadingBonus } = useQuery({
        queryKey: ['bonusCustomList'],
        queryFn: async () => {
            const result = await apiFetchJson('/api/v1/bonus-custom');

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
    // 3. MUTASI: TAMBAH BONUS BATCH
    // ==========================================
    const createBonusMutation = useMutation({
        mutationFn: async (payload: { pegawai_ids: string[], tanggal_diberikan?: string, tanggals?: string[], keterangan: string, nominal: number }) => {
            const dates = payload.tanggals && payload.tanggals.length > 0
                ? payload.tanggals
                : (payload.tanggal_diberikan ? [payload.tanggal_diberikan] : []);

            const promises = [];
            for (const id of payload.pegawai_ids) {
                for (const tgl of dates) {
                    promises.push(
                        apiFetchJson('/api/v1/bonus-custom', {
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
                        })
                    );
                }
            }
            return await Promise.all(promises);
        },
        onSuccess: (results) => {
            showNotif(`Sukses menambahkan ${results.length} data bonus!`, "success");
            queryClient.invalidateQueries({ queryKey: ['bonusCustomList'] });
            queryClient.invalidateQueries({ queryKey: ['rekapGaji'] });
        },
        onError: (error: Error) => {
            showNotif(error.message, "error");
        }
    });

    // ==========================================
    // 4. MUTASI: UPDATE BONUS
    // ==========================================
    const updateBonusMutation = useMutation({
        mutationFn: (payload: { id: string; pegawai_id: string; tanggal_diberikan: string; keterangan: string; nominal: number }) =>
            apiFetchJson(`/api/v1/bonus-custom/${payload.id}`, {
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
            }),
        onSuccess: () => {
            showNotif("Sukses memperbarui data bonus!", "success");
            queryClient.invalidateQueries({ queryKey: ['bonusCustomList'] });
            queryClient.invalidateQueries({ queryKey: ['rekapGaji'] });
        },
        onError: (error: Error) => {
            showNotif(error.message, "error");
        }
    });

    // ==========================================
    // 5. MUTASI: HAPUS BONUS
    // ==========================================
    const deleteBonusMutation = useMutation({
        mutationFn: (id: string) =>
            apiFetchJson(`/api/v1/bonus-custom/${id}`, {
                method: "DELETE"
            }),
        onSuccess: (result: any) => {
            showNotif(result?.message || "Sukses menghapus data bonus!", "success");
            queryClient.invalidateQueries({ queryKey: ['bonusCustomList'] });
            queryClient.invalidateQueries({ queryKey: ['rekapGaji'] });
        },
        onError: (error: Error) => {
            showNotif(error.message, "error");
        }
    });

    const handleDeleteBonus = (id: string) => {
        deleteBonusMutation.mutate(id);
    };

    // ==========================================
    // 6. MUTASI: HAPUS BONUS BATCH
    // ==========================================
    const batchDeleteMutation = useMutation({
        mutationFn: async (ids: string[]) => {
            const promises = ids.map((id) =>
                apiFetchJson(`/api/v1/bonus-custom/${id}`, {
                    method: "DELETE"
                })
            );
            return await Promise.all(promises);
        },
        onSuccess: (results) => {
            showNotif(`Sukses menghapus ${results.length} data bonus!`, "success");
            queryClient.invalidateQueries({ queryKey: ['bonusCustomList'] });
            queryClient.invalidateQueries({ queryKey: ['rekapGaji'] });
        },
        onError: (error: Error) => {
            showNotif(error.message, "error");
        }
    });

    const handleBatchDelete = (ids: string[]) => {
        batchDeleteMutation.mutate(ids);
    };

    const handleBatchAdd = (pegawaiIds: string[], tanggal: string, nominal: number, keterangan: string) => {
        createBonusMutation.mutate({
            pegawai_ids: pegawaiIds,
            tanggal_diberikan: tanggal,
            nominal,
            keterangan
        });
    };

    return {
        listPegawai,
        listBonus,
        isLoadingPegawai,
        isLoadingBonus,
        isCreating: createBonusMutation.isPending,
        isUpdating: updateBonusMutation.isPending,
        notif,
        closeNotif,
        createBonus: createBonusMutation.mutate,
        updateBonus: updateBonusMutation.mutate,
        handleDeleteBonus,
        handleBatchDelete,
        handleBatchAdd
    };
}
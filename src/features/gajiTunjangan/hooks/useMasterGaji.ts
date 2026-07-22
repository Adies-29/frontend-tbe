import { useQuery } from '@tanstack/react-query';
import type { MasterGajiData } from '../components/TabelMasterGaji';
import { apiFetchJson } from '../../../utils/apiFetch';
import { useNotif } from '../../../hooks/useNotif';

export function useMasterGaji() {
    const { notif, showNotif, closeNotif } = useNotif();

    const fetchMasterJabatan = async (): Promise<MasterGajiData[]> => {
        try {
            const result = await apiFetchJson('/api/v1/jabatan');
            const data = result.data || [];

            return data.map((item: any) => {
                let namaDept = "-";
                if (typeof item.departemen === "object" && item.departemen !== null) {
                    namaDept = item.departemen.nama_departemen;
                } else if (typeof item.departemen === "string") {
                    namaDept = item.departemen;
                }
                return {
                    id: String(item.id),
                    nama_jabatan: item.nama_jabatan,
                    departemen: namaDept
                };
            });
        } catch (error) {
            console.error("Gagal memuat master jabatan:", error);
            showNotif("Terjadi kesalahan koneksi.", "error");
            throw error;
        }
    };

    const {
        data: masterJabatanData = [],
        isLoading: isLoadingMaster,
        isError: isErrorMaster,
        refetch,
    } = useQuery({
        queryKey: ['jabatan'],
        queryFn: fetchMasterJabatan
    });

    return {
        masterJabatanData,
        isLoadingMaster,
        isErrorMaster,
        notif,
        closeNotif,
        refetch
    };
}

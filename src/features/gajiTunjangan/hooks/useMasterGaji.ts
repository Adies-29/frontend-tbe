import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/useAuthStore';
import type { MasterGajiData } from '../components/TabelMasterGaji';
import { apiFetch } from '../../../utils/apiFetch';
import { useNotif } from '../../../hooks/useNotif';

export function useMasterGaji() {
    const token = useAuthStore((state) => state.token);
    const { notif, showNotif, closeNotif } = useNotif();

    const fetchMasterJabatan = async (): Promise<MasterGajiData[]> => {
        try {
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/jabatan`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            const result = await response.json();
            if (response.ok && result.success) {
                const data = result.data || [];

                const formattedData: MasterGajiData[] = data.map((item: any) => {
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
                return (formattedData);
            }
            return [];
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
        queryKey: ['master-jabatan'],
        queryFn: fetchMasterJabatan,
        enabled: !!token,
    })

    return {
        masterJabatanData,
        isLoadingMaster,
        isErrorMaster,
        notif,
        closeNotif,
        refetch
    };
}

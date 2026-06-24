import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../../store/useAuthStore";
import type { JadwalShiftData } from "../../../types";
import { apiFetch } from "../../../utils/apiFetch";

export function useMasterShift() {
    const token = useAuthStore((state) => state.token);

    const query = useQuery({
        queryKey: ['masterShift'],
        queryFn: async () => {
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/shifts`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new Error("Sesi Anda telah habis. Silakan login kembali !");
                }
                throw new Error("Gagal memuat data dari server");
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error("Gagal mengambil data");
            }
            
            return result.data as JadwalShiftData[];
        },
        enabled: !!token
    });

   
    return {
        dataJadwalShift: query.data || [],
        isLoading: query.isLoading,
        errorMsg: query.error?.message || "",
        fetchJadwalShift: query.refetch
    };
}

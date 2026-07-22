import { useQuery } from "@tanstack/react-query";
import type { JadwalShiftData } from "../../../types";
import { apiFetchJson } from "../../../utils/apiFetch";

export function useMasterShift() {
    const query = useQuery({
        queryKey: ['shifts'],
        queryFn: async () => {
            const res = await apiFetchJson('/api/v1/shifts');
            return (res.data || []) as JadwalShiftData[];
        }
    });

    return {
        dataJadwalShift: query.data || [],
        isLoading: query.isLoading,
        errorMsg: query.error?.message || "",
        fetchJadwalShift: query.refetch
    };
}

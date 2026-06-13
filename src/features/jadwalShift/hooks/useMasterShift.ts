import { useState, useCallback } from "react";
import { useAuthStore } from "../../../store/useAuthStore";
import type { JadwalShiftData } from "../../../types";
import { apiFetch } from "../../../utils/apiFetch";


export function useMasterShift() {
    const [dataJadwalShift, setDataJadwalShift] = useState<JadwalShiftData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
    const token = useAuthStore((state) => state.token);

    const fetchJadwalShift = useCallback(async () => {
        setIsLoading(true);
        setErrorMsg("");

        try {

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
            if (result.success) {
                setDataJadwalShift(result.data);
            }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: unknown) {
            console.error("Error fetching Jadwal & shift:", error);
            setErrorMsg(error instanceof Error ? error.message : "Terjadi kesalahan tidak terduga");
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        dataJadwalShift,
        isLoading,
        errorMsg,
        fetchJadwalShift
    };
}

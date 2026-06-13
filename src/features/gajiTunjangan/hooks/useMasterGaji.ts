    import { useState, useCallback } from 'react';
    import { useAuthStore } from '../../../store/useAuthStore';
    import type { MasterGajiData } from '../components/TabelMasterGaji';
    import { apiFetch } from '../../../utils/apiFetch';

    export function useMasterGaji() {
        const token = useAuthStore((state) => state.token);
        const [masterJabatanData, setMasterJabatanData] = useState<MasterGajiData[]>([]);
        const [isLoadingMaster, setIsLoadingMaster] = useState(false);
        const [notif, setNotif] = useState<{ show: boolean; message: string; type: "success" | "error" | "info" | "warning" }>({
            show: false,
            message: "",
            type: "success"
        });

        const fetchMasterJabatan = useCallback(async () => {
            setIsLoadingMaster(true);
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
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                    setMasterJabatanData(formattedData);
                }
            } catch (error) {
                console.error("Gagal memuat master jabatan:", error);
                setNotif({ show: true, message: "Terjadi kesalahan koneksi.", type: "error" });
            } finally {
                setIsLoadingMaster(false);
            }
        }, [token]);

        return {
            masterJabatanData,
            isLoadingMaster,
            notif,
            fetchMasterJabatan
        };
    }

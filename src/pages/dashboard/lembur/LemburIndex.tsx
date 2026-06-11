import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";
import { apiFetch } from "../../../utils/apiFetch";
import TabelLembur from "../../../components/ui/tabel/tabelLembur/TabelLembur";
import type { LemburData } from "../../../types";


export default function LemburIndex() {
    const token = useAuthStore((state) => state.token);
    
    const [dataLembur, setDataLembur] = useState<LemburData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLembur = async () => {
        setIsLoading(true);
        try {
          
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/lembur/spl`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (response.ok && result.success) {
                const formattedData = (result.data || []).map((item: LemburData, index: number) => ({
                    ...item,
                    id: item.id || index + 1
                }));
                setDataLembur(formattedData);
            }
        } catch (error) {
            console.error("Error fetching lembur:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLembur();
    }, [token]);

    return (
        <div className="flex flex-col gap-6 w-full">
            <section className="bg-white border border-gray-300 rounded-2xl p-4 shadow-sm w-full min-h-[400px]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h2 className="text-lg font-bold text-black border-l-4 border-red-600 pl-2 mt-1 flex items-center gap-2">
                        <Clock size={20} className="text-red-600" /> Data Perintah Lembur
                    </h2>
                </div>

                <TabelLembur data={dataLembur} isLoading={isLoading} />
            </section>
        </div>
    );
}
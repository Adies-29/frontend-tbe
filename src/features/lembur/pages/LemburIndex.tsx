import { Coffee, Plus } from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";
import { apiFetch } from "../../../utils/apiFetch";
import TabelLembur from "../../../features/lembur/components/TabelLembur";
import type { LemburData } from "../../../types";
import { useQuery } from "@tanstack/react-query";
import Button from "../../../components/common/Button";
import { useNavigate } from "react-router-dom";

export default function LemburIndex() {
    const token = useAuthStore((state) => state.token);
    const navigate = useNavigate();

    const lemburQuery = useQuery({
        queryKey: ['lemburList'],
        queryFn: async () => {
            const [responseLembur, responsePegawai] = await Promise.all([
                apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/lembur/future`, {
                    headers: { "Authorization": `Bearer ${token}` }
                }),
                apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/pegawai`, {
                    headers: { "Authorization": `Bearer ${token}` }
                })
            ]);

            const resultLembur = await responseLembur.json();
            const resultPegawai = responsePegawai.ok ? await responsePegawai.json() : { data: [] };

            if (!responseLembur.ok || !resultLembur.success) {
                throw new Error("Gagal mengambil data lembur");
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const pegawaiMap = new Map((resultPegawai.data || []).map((p: any) => [String(p.id), p.nama]));

            const formattedData = (resultLembur.data || []).map((item: LemburData, index: number) => ({
                ...item,
                id: item.id || index + 1,
                nama: item.nama || item.pegawai?.nama || pegawaiMap.get(String(item.pegawai_id)) || ""
            }));

            return formattedData;
        }
    });

    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
            {/* HEADER */}
            <section data-tour="lembur-header" className="bg-white border border-gray-300 rounded-2xl p-4 md:p-6 shadow-sm w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <Coffee size={28} className="text-amber-600" /> Data Perintah Lembur
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Kelola data perintah kerja lembur pegawai.</p>
                    </div>
                    <div className="w-full md:w-auto">
                        <Button
                            variant="primary"
                            label="Tambah Lembur"
                            icon={<Plus size={16} />}
                            onClick={() => navigate('/dashboard/lembur/tambah-lembur')}
                            className="w-full md:w-auto active:scale-95 py-3 md:py-2 text-[15px] md:text-sm rounded-xl font-bold shadow-md cursor-pointer"
                            data-tour="btn-add-lembur"
                        />
                    </div>
                </div>
            </section>

            {/* TABLE SECTION */}
            <section className="bg-white border border-gray-300 rounded-2xl p-4 md:p-6 shadow-sm w-full min-h-[400px]">
                <div data-tour="lembur-table">
                    <TabelLembur 
                        data={lemburQuery.data || []} 
                        isLoading={lemburQuery.isLoading} 
                        onRefresh={() => lemburQuery.refetch()} 
                    />
                </div>
            </section>
        </div>
    );
}

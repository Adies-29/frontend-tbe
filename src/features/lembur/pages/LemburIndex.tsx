import { Clock, Plus } from "lucide-react";
import { apiFetchJson } from "../../../utils/apiFetch";
import TabelLembur from "../../../features/lembur/components/TabelLembur";
import type { LemburData } from "../../../types";
import { useQuery } from "@tanstack/react-query";
import Button from "../../../components/common/Button";
import { useNavigate } from "react-router-dom";

export default function LemburIndex() {
    const navigate = useNavigate();

    const lemburQuery = useQuery({
        queryKey: ['lemburList'],
        queryFn: async () => {
            const [resultLembur, resultPegawai] = await Promise.all([
                apiFetchJson('/api/v1/lembur/future'),
                apiFetchJson('/api/v1/pegawai').catch(() => ({ data: [] }))
            ]);

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
        <div className="flex flex-col gap-4 md:gap-6 w-full">
            <section data-tour="lembur-header" className="bg-white border border-gray-300 rounded-2xl p-4 md:p-6 shadow-sm w-full min-h-[400px]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-4">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Clock size={28} className="text-red-600" /> Data Perintah Lembur
                    </h1>
                    <div className="w-full md:w-auto">
                        <Button
                            label="Tambah Lembur"
                            icon={<Plus size={18} />}
                            onClick={() => navigate('/dashboard/lembur/tambah-lembur')}
                            className="w-full md:w-auto"
                            data-tour="btn-add-lembur"
                        />
                    </div>
                </div>

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

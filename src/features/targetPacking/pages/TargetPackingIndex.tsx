import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../../store/useAuthStore";
import { apiFetch } from "../../../utils/apiFetch";
import { Plus, Target } from "lucide-react";
import Button from "../../../components/common/Button";
import TabelMatrixPencapaian from "../components/TabelMatrixPencapaian";
import MasterTargetTab from "../components/MasterTargetTab";
import ModalInputPencapaianMassal from "../components/ModalInputPencapaianMassal";
import { useMatrixPencapaian } from "../hooks/useMatrixPencapaian";

export default function TargetPackingIndex() {
    const location = useLocation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const token = useAuthStore(state => state.token);
    
    // Derivasi tab aktif langsung dari location.state agar tidak memicu cascading render
    const activeTab = (location.state?.tab as 'pencapaian' | 'master') || 'pencapaian';

    const hookParams = useMatrixPencapaian();
    const [isModalMassalOpen, setIsModalMassalOpen] = useState(false);

    const saveMassalMutation = useMutation({
        mutationFn: async (payload: { pegawai_ids: number[], tanggals: string[], master_target_id: number, jumlah_pencapaian: number }) => {
            const promises = [];
            for (const id of payload.pegawai_ids) {
                for (const tgl of payload.tanggals) {
                    promises.push(
                        (async () => {
                            const res = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/target/pencapaian`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                    pegawai_id: id,
                                    master_target_id: payload.master_target_id,
                                    tanggal: tgl,
                                    jumlah_pencapaian: payload.jumlah_pencapaian
                                })
                            });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.message || "Gagal menyimpan pencapaian target");
                            return data;
                        })()
                    );
                }
            }
            return Promise.all(promises);
        },
        onSuccess: () => {
            hookParams.showNotif("Pencapaian massal berhasil dibuat!", "success");
            queryClient.invalidateQueries({ queryKey: ['pencapaianList'] });
            setIsModalMassalOpen(false);
        },
        onError: (err: any) => hookParams.showNotif(err.message, "error")
    });

    const handleTabChange = (tab: 'pencapaian' | 'master') => {
        navigate(location.pathname, { replace: true, state: { tab } });
    };

    return (
        <div className="flex flex-col gap-4 md:gap-6 w-full">
            {/* HEADER & TAB NAVIGATION */}
            <section data-tour="target-header" className="bg-white border border-gray-300 rounded-2xl p-4 md:p-6 shadow-sm w-full print:hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <Target size={28} className="text-indigo-600" /> Target Pegawai
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Kelola pencapaian target harian dan harga satuan target.</p>
                    </div>
                    {activeTab === 'pencapaian' && (
                        <div className="flex gap-3 items-center w-full md:w-auto shrink-0">
                            <Button
                                label="Buat Target Massal"
                                icon={<Plus size={16} />}
                                onClick={() => setIsModalMassalOpen(true)}
                                className="w-full md:w-auto font-bold text-xs"
                            />
                        </div>
                    )}
                </div>
                
                {/* TAB NAVIGATION */}
                <div className="flex gap-6 mt-6 border-b border-gray-300">
                    <button
                        data-tour="target-tab-pencapaian"
                        onClick={() => handleTabChange('pencapaian')}
                        className={`pb-3 px-2 text-[15px] md:text-sm font-semibold transition-colors duration-200 ${
                            activeTab === 'pencapaian'
                                ? 'border-b-2 border-indigo-600 text-indigo-700'
                                : 'text-gray-500 hover:text-indigo-600 active:scale-95'
                        }`}
                    >
                        Pencapaian Harian
                    </button>
                    <button
                        data-tour="target-tab-master"
                        onClick={() => handleTabChange('master')}
                        className={`pb-3 px-2 text-[15px] md:text-sm font-semibold transition-colors duration-200 ${
                            activeTab === 'master'
                                ? 'border-b-2 border-indigo-600 text-indigo-700'
                                : 'text-gray-500 hover:text-indigo-600 active:scale-95'
                        }`}
                    >
                        Master Target
                    </button>
                </div>
            </section>

            {/* TAB CONTENT */}
            <div className="w-full">
                {activeTab === 'pencapaian' && <TabelMatrixPencapaian />}
                {activeTab === 'master' && <MasterTargetTab />}
            </div>

            <ModalInputPencapaianMassal
                isOpen={isModalMassalOpen}
                onClose={() => setIsModalMassalOpen(false)}
                listPegawai={hookParams.listPegawai}
                listMasterTargets={hookParams.listMasterTargets}
                targetJabatanNames={hookParams.targetJabatanNames}
                isSaving={saveMassalMutation.isPending}
                onSubmit={async (data, callbacks) => {
                    try {
                        await saveMassalMutation.mutateAsync(data);
                        callbacks.onSuccess();
                    } catch (err) {
                        console.error(err);
                    }
                }}
            />
        </div>
    );
}

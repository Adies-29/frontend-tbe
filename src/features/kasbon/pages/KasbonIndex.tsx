import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../store/useAuthStore";
import { apiFetchJson } from "../../../utils/apiFetch";
import {  Plus } from "lucide-react";
import Button from "../../../components/common/Button";
import Notif from "../../../components/common/Notif";
import TabelKasbon from "../components/TabelKasbon";
import ModalBayarKasbon from "../components/ModalBayarKasbon";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TabelRiwayatKasbon from "../components/TabelRiwayatKasbon";
import { useNotif } from "../../../hooks/useNotif";

export default function KasbonIndex() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const user = useAuthStore((state) => state.user);

    const { notif, showNotif, showErrorNotif, closeNotif } = useNotif();
    
    // State untuk Modal Bayar
    const [isModalBayarOpen, setIsModalBayarOpen] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedKasbon, setSelectedKasbon] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'daftar' | 'riwayat'>('daftar');

    // 1. Ambil Data Kasbon
    const kasbonQuery = useQuery({
        queryKey: ['kasbonList'],
        queryFn: async () => {
            const res = await apiFetchJson('/api/v1/kasbon');
            return res.data || [];
        }
    });

    // 2. Mutasi Update Status
    const statusMutation = useMutation({
        mutationFn: async ({ id, newStatus }: { id: number, newStatus: string }) => {
            const result = await apiFetchJson(`/api/v1/kasbon/${id}/status`, {
                method: 'PATCH',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ status: newStatus, disetujui_oleh: user || null })
            });
            return { newStatus, message: result.message };
        },
        onSuccess: (data) => {
            showNotif(`Status berhasil diubah menjadi ${data.newStatus}`, "success");
            queryClient.invalidateQueries({ queryKey: ['kasbonList'] });
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
            showErrorNotif(error);
        }
    });

    // 3. Mutasi Hapus Kasbon
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const result = await apiFetchJson(`/api/v1/kasbon/${id}`, {
                method: 'DELETE'
            });
            return result;
        },
        onSuccess: () => {
            showNotif("Data kasbon berhasil dihapus", "success");
            queryClient.invalidateQueries({ queryKey: ['kasbonList'] });
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
            showErrorNotif(error);
        }
    });

    // 4. Mutasi Bayar Kasbon
    const bayarMutation = useMutation({
        mutationFn: async ({ id, nominal_bayar, keterangan, metode_pembayaran }: { id: number, nominal_bayar: number, keterangan: string, metode_pembayaran: string }) => {
            const result = await apiFetchJson(`/api/v1/kasbon/${id}/bayar-manual`, {
                method: 'PATCH',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                    nominal_bayar, 
                    keterangan,
                    tanggal_pembayaran: new Date().toISOString().split('T')[0],
                    metode_pembayaran
                })
            });
            return result;
        },
        onSuccess: () => {
            showNotif("Pembayaran kasbon berhasil dicatat", "success");
            setIsModalBayarOpen(false);
            setSelectedKasbon(null);
            queryClient.invalidateQueries({ queryKey: ['kasbonList'] });
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
            showErrorNotif(error);
        }
    });

    const handleBayarClick = (kasbon: any) => {
        setSelectedKasbon(kasbon);
        setIsModalBayarOpen(true);
    };

    const handleBayarSubmit = (nominal: number, keterangan: string, metode: string) => {
        if (selectedKasbon) {
            bayarMutation.mutate({
                id: selectedKasbon.id,
                nominal_bayar: nominal,
                keterangan,
                metode_pembayaran: metode
            });
        }
    };

    return (
        <div className="flex flex-col gap-4 md:gap-6 w-full">
            <Notif show={notif.show} message={notif.message} type={notif.type} onClose={closeNotif} />

            {/* HEADER & TAB NAVIGATION */}
            <section data-tour="kasbon-header" className="bg-white border border-gray-300 rounded-2xl p-4 md:p-6 shadow-sm w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                            Manajemen Kasbon
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Kelola data pinjaman dan potongan cicilan pegawai.</p>
                    </div>
                    <div className="flex gap-3 items-center w-full md:w-auto">
                        <Button
                            variant="success"
                            label="Tambah Kasbon"
                            icon={<Plus size={16} />}
                            onClick={() => navigate('/dashboard/kasbon/tambah')}
                            className="w-full md:w-auto active:scale-95 py-3 md:py-2 text-[15px] md:text-sm rounded-xl font-bold shadow-md cursor-pointer"
                            data-tour="btn-add-kasbon"
                        />
                    </div>
                </div>

                {/* TAB NAVIGATION */}
                <div className="flex gap-6 mt-6 border-b border-gray-300">
                    <button
                        data-tour="kasbon-tab-daftar"
                        className={`pb-3 px-2 text-[15px] md:text-sm font-semibold transition-colors duration-200 ${
                            activeTab === 'daftar' 
                            ? 'border-b-2 border-emerald-600 text-emerald-600' 
                            : 'text-gray-500 hover:text-emerald-600 active:scale-95'
                        }`}
                        onClick={() => setActiveTab('daftar')}
                    >
                        Daftar Kasbon Aktif
                    </button>
                    <button
                        data-tour="kasbon-tab-riwayat"
                        className={`pb-3 px-2 text-[15px] md:text-sm font-semibold transition-colors duration-200 ${
                            activeTab === 'riwayat' 
                            ? 'border-b-2 border-emerald-600 text-emerald-600' 
                            : 'text-gray-500 hover:text-emerald-600 active:scale-95'
                        }`}
                        onClick={() => setActiveTab('riwayat')}
                    >
                        Riwayat Pembayaran
                    </button>
                </div>
            </section>

            <div className="w-full">
                {activeTab === 'daftar' ? (
                    <TabelKasbon 
                        data={kasbonQuery.data || []} 
                        isLoading={kasbonQuery.isLoading} 
                        onDelete={(id) => deleteMutation.mutate(id)} 
                        onStatusChange={(id, newStatus) => statusMutation.mutate({ id, newStatus })}
                        onBayar={handleBayarClick}
                    />
                ) : (
                    <TabelRiwayatKasbon />
                )}
            </div>

            <ModalBayarKasbon
                isOpen={isModalBayarOpen}
                onClose={() => {
                    setIsModalBayarOpen(false);
                    setSelectedKasbon(null);
                }}
                kasbon={selectedKasbon}
                onSubmit={handleBayarSubmit}
                isPending={bayarMutation.isPending}
            />
        </div>
    );
}

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../store/useAuthStore";
import { apiFetchJson } from "../../../utils/apiFetch";
import { Plus, Wallet, Users, CheckCircle2, TrendingUp } from "lucide-react";
import Button from "../../../components/common/Button";

import Notif from "../../../components/common/Notif";
import TabelKasbon from "../components/TabelKasbon";
import ModalBayarKasbon from "../components/ModalBayarKasbon";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TabelRiwayatKasbon from "../components/TabelRiwayatKasbon";
import TabPengaturanKasbon from "../components/TabPengaturanKasbon";
import { useNotif } from "../../../hooks/useNotif";
import { formatRupiah } from "../../../utils/formatCurrency";

export default function KasbonIndex() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const user = useAuthStore((state) => state.user);

    const { notif, showNotif, showErrorNotif, closeNotif } = useNotif();

    // State untuk Modal Bayar
    const [isModalBayarOpen, setIsModalBayarOpen] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedKasbon, setSelectedKasbon] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'daftar' | 'riwayat' | 'pengaturan'>('daftar');

    // 1. Ambil Data Kasbon
    const kasbonQuery = useQuery({
        queryKey: ['kasbonList'],
        queryFn: async () => {
            const res = await apiFetchJson('/api/v1/kasbon');
            return res.data || [];
        }
    });

    // Hitung KPI / Metrik Kasbon
    const metrics = useMemo(() => {
        const list = kasbonQuery.data || [];
        let totalOutstanding = 0;
        let totalPeminjamAktif = 0;
        let totalLunas = 0;
        let totalPlafonPinjaman = 0;

        const uniquePegawai = new Set();

        list.forEach((k: any) => {
            totalPlafonPinjaman += Number(k.nominal_pinjaman) || 0;
            if (k.status === 'Lunas') {
                totalLunas++;
            } else if (k.status === 'Disetujui' && (k.sisa_pinjaman || 0) > 0) {
                totalOutstanding += Number(k.sisa_pinjaman) || 0;
                if (k.pegawai_id) uniquePegawai.add(k.pegawai_id);
            }
        });

        totalPeminjamAktif = uniquePegawai.size;

        return {
            totalOutstanding,
            totalPeminjamAktif,
            totalLunas,
            totalPlafonPinjaman
        };
    }, [kasbonQuery.data]);

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
            queryClient.invalidateQueries({ queryKey: ['riwayatKasbonList'] });
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
            showErrorNotif(error);
        }
    });

    // 5. Mutasi Toggle Pause / Hold Kasbon
    const pauseMutation = useMutation({
        mutationFn: async ({ id, is_paused }: { id: number, is_paused: boolean }) => {
            const result = await apiFetchJson(`/api/v1/kasbon/${id}/toggle-pause`, {
                method: 'PATCH',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ is_paused })
            });
            return result;
        },
        onSuccess: (data) => {
            showNotif(data.message || "Status penangguhan kasbon diperbarui", "success");
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

    const handleTogglePause = (id: number, currentPause: boolean) => {
        pauseMutation.mutate({ id, is_paused: !currentPause });
    };

    return (
        <div className="flex flex-col gap-4 md:gap-6 w-full">
            <Notif show={notif.show} message={notif.message} type={notif.type} onClose={closeNotif} />

            {/* KPI STATS CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 w-full">
                {/* CARD 1: SISA PINJAMAN BERJALAN */}
                <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5 shadow-xs flex items-center gap-3 md:gap-4 relative overflow-hidden">
                    <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 shrink-0">
                        <Wallet size={24} />
                    </div>
                    <div>
                        <p className="text-[11px] md:text-xs font-semibold uppercase tracking-wider text-gray-500">Piutang Berjalan</p>
                        <h3 className="text-base md:text-xl font-black text-gray-900 mt-0.5">
                            {formatRupiah(metrics.totalOutstanding)}
                        </h3>
                    </div>
                </div>

                {/* CARD 2: TOTAL PEMINJAM AKTIF */}
                <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5 shadow-xs flex items-center gap-3 md:gap-4 relative overflow-hidden">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shrink-0">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-[11px] md:text-xs font-semibold uppercase tracking-wider text-gray-500">Peminjam Aktif</p>
                        <h3 className="text-base md:text-xl font-black text-gray-900 mt-0.5">
                            {metrics.totalPeminjamAktif} <span className="text-xs font-normal text-gray-500">Pegawai</span>
                        </h3>
                    </div>
                </div>

                {/* CARD 3: TOTAL PINJAMAN LUNAS */}
                <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5 shadow-xs flex items-center gap-3 md:gap-4 relative overflow-hidden">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shrink-0">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <p className="text-[11px] md:text-xs font-semibold uppercase tracking-wider text-gray-500">Kasbon Lunas</p>
                        <h3 className="text-base md:text-xl font-black text-gray-900 mt-0.5">
                            {metrics.totalLunas} <span className="text-xs font-normal text-gray-500">Transaksi</span>
                        </h3>
                    </div>
                </div>

                {/* CARD 4: TOTAL PLAFON TERSALUR */}
                <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5 shadow-xs flex items-center gap-3 md:gap-4 relative overflow-hidden">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shrink-0">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-[11px] md:text-xs font-semibold uppercase tracking-wider text-gray-500">Total Penyaluran</p>
                        <h3 className="text-base md:text-xl font-black text-gray-900 mt-0.5">
                            {formatRupiah(metrics.totalPlafonPinjaman)}
                        </h3>
                    </div>
                </div>
            </div>

            {/* HEADER & TAB NAVIGATION */}
            <section data-tour="kasbon-header" className="bg-white border border-gray-300 rounded-2xl p-4 md:p-6 shadow-sm w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                            Manajemen Kasbon
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Kelola data pinjaman, potongan cicilan penggajian, dan aturan kehadiran.</p>
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

                {/* TAB NAVIGATION (3 TABS) */}
                <div className="flex gap-4 md:gap-6 mt-6 border-b border-gray-300 overflow-x-auto">
                    <button
                        data-tour="kasbon-tab-daftar"
                        className={`pb-3 px-2 text-[15px] md:text-sm font-semibold transition-colors duration-200 whitespace-nowrap cursor-pointer ${activeTab === 'daftar'
                            ? 'border-b-2 border-emerald-600 text-emerald-600'
                            : 'text-gray-500 hover:text-emerald-600 active:scale-95'
                            }`}
                        onClick={() => setActiveTab('daftar')}
                    >
                        Daftar Kasbon Aktif
                    </button>
                    <button
                        data-tour="kasbon-tab-riwayat"
                        className={`pb-3 px-2 text-[15px] md:text-sm font-semibold transition-colors duration-200 whitespace-nowrap cursor-pointer ${activeTab === 'riwayat'
                            ? 'border-b-2 border-emerald-600 text-emerald-600'
                            : 'text-gray-500 hover:text-emerald-600 active:scale-95'
                            }`}
                        onClick={() => setActiveTab('riwayat')}
                    >
                        Riwayat Pembayaran
                    </button>
                    <button
                        data-tour="kasbon-tab-pengaturan"
                        className={`pb-3 px-2 text-[15px] md:text-sm font-semibold transition-colors duration-200 whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${activeTab === 'pengaturan'
                            ? 'border-b-2 border-emerald-600 text-emerald-600 font-bold'
                            : 'text-gray-500 hover:text-emerald-600 active:scale-95'
                            }`}
                        onClick={() => setActiveTab('pengaturan')}
                    >
                        Pengaturan & Kebijakan
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
                        onTogglePause={handleTogglePause}
                    />
                ) : activeTab === 'riwayat' ? (
                    <TabelRiwayatKasbon />
                ) : (
                    <TabPengaturanKasbon onShowNotif={showNotif} />
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


import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../store/useAuthStore";
import { apiFetch } from "../../../utils/apiFetch";
import { Wallet } from "lucide-react";
import Button from "../../../components/common/Button";
import Notif from "../../../components/common/Notif";
import TabelKasbon from "../components/TabelKasbon";
import ModalBayarKasbon from "../components/ModalBayarKasbon";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TabelRiwayatKasbon from "../components/TabelRiwayatKasbon";

export default function KasbonIndex() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);

    const [notif, setNotif] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
        show: false, message: "", type: "success"
    });
    
    // State untuk Modal Bayar
    const [isModalBayarOpen, setIsModalBayarOpen] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedKasbon, setSelectedKasbon] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'daftar' | 'riwayat'>('daftar');

    // 1. Ambil Data Kasbon
    const kasbonQuery = useQuery({
        queryKey: ['kasbonList'],
        queryFn: async () => {
            const res = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/kasbon`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message || "Gagal load data kasbon");
            return result.data || [];
        }
    });

    // 2. Mutasi Update Status
    const statusMutation = useMutation({
        mutationFn: async ({ id, newStatus }: { id: number, newStatus: string }) => {
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/kasbon/${id}/status`, {
                method: 'PATCH',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus, disetujui_oleh: user || null })
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || "Gagal mengubah status");
            return { newStatus, message: result.message };
        },
        onSuccess: (data) => {
            setNotif({ show: true, message: `Status berhasil diubah menjadi ${data.newStatus}`, type: "success" });
            queryClient.invalidateQueries({ queryKey: ['kasbonList'] });
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
            setNotif({ show: true, message: error.message || "Terjadi kesalahan server", type: "error" });
        }
    });

    // 3. Mutasi Hapus Kasbon
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/kasbon/${id}`, {
                method: 'DELETE',
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || "Gagal menghapus kasbon");
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kasbonList'] });
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
            setNotif({ show: true, message: error.message || "Terjadi kesalahan server", type: "error" });
        }
    });

    // 4. Mutasi Bayar Kasbon
    const bayarMutation = useMutation({
        mutationFn: async ({ id, nominal_bayar, keterangan, metode_pembayaran }: { id: number, nominal_bayar: number, keterangan: string, metode_pembayaran: string }) => {
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/kasbon/${id}/bayar-manual`, {
                method: 'PATCH',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    nominal_bayar, 
                    keterangan,
                    tanggal_pembayaran: new Date().toISOString().split('T')[0],
                    metode_pembayaran
                })
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || "Gagal memproses pembayaran");
            return result;
        },
        onSuccess: () => {
            setNotif({ show: true, message: "Pembayaran kasbon berhasil dicatat", type: "success" });
            setIsModalBayarOpen(false);
            setSelectedKasbon(null);
            queryClient.invalidateQueries({ queryKey: ['kasbonList'] });
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
            setNotif({ show: true, message: error.message || "Terjadi kesalahan server", type: "error" });
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
        <div className="flex flex-col gap-6 w-full p-2">
            <Notif show={notif.show} message={notif.message} type={notif.type} onClose={() => setNotif(prev => ({ ...prev, show: false }))} />

            {/* HEADER */}
            <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Wallet size={28} className="text-emerald-600" /> Manajemen Kasbon
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Kelola data pinjaman dan potongan cicilan pegawai.</p>
                </div>
                <div className="flex gap-3 items-center">
                    <Button
                        label="Tambah Kasbon"
                        variant="primary"
                        onClick={() => navigate('/dashboard/kasbon/tambah')}
                    />
                </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex border-b border-gray-200">
                <button
                    className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${
                        activeTab === 'daftar' 
                        ? 'border-emerald-600 text-emerald-600' 
                        : 'border-transparent text-gray-500 hover:text-emerald-600 hover:border-emerald-200'
                    }`}
                    onClick={() => setActiveTab('daftar')}
                >
                    Daftar Kasbon Aktif
                </button>
                <button
                    className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${
                        activeTab === 'riwayat' 
                        ? 'border-emerald-600 text-emerald-600' 
                        : 'border-transparent text-gray-500 hover:text-emerald-600 hover:border-emerald-200'
                    }`}
                    onClick={() => setActiveTab('riwayat')}
                >
                    Riwayat Pembayaran
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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

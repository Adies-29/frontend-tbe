
import { useState, useMemo } from 'react';
import { Wallet, TrendingDown, TrendingUp, Printer, Search, RotateCcw } from 'lucide-react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../../store/useAuthStore';
import { apiFetch } from '../../../../utils/apiFetch';

import Button from '../../../../components/common/Button';
import Notif from '../../../../components/common/Notif';
import ConfirmPopUp from '../../../../components/common/ConfirmPopUp';
import { TabelRekapGaji, type RekapGajiData } from '../../../../features/gajiTunjangan/components/TabelRekapGaji';
import SlipGajiTemplate from '../../../../features/gajiTunjangan/components/SlipGajiTemplate';
import ModalRincianGaji from '../../../../features/gajiTunjangan/components/ModalRincianGaji';
import ModalPreviewSlipGaji from '../../../../features/gajiTunjangan/components/ModalPreviewSlipGaji';
import { useRekapGaji } from '../../hooks/useRekapGaji';
import PeriodSwitcher from '../../../../components/common/PeriodSwitcher';
import { formatRupiah } from '../../../../utils/formatCurrency';

interface TabRekapGajiProps {
    hookParams: ReturnType<typeof useRekapGaji>;
}

export default function TabRekapGaji({ hookParams }: TabRekapGajiProps) {
    const {
        periode,
        filterValue,
        setFilterValue,
        rekapGajiData,
        isLoadingRekap,
        isErrorRekap,
        isModalPreviewOpen,
        setIsModalPreviewOpen,
        summaryCards,
        notif,
        handlePelunasanGaji,
        handleCetakSemuaSlip,
        handlePeriodeChange,
        closeNotif,

        // PopUp Confirm States & Functions
        showConfirmGenerate,
        setShowConfirmGenerate,
        labelPeriode,
        confirmGenerateGaji,
        showConfirmLunas,
        setShowConfirmLunas,
        confirmPelunasanGaji
    } = hookParams;

    const [searchQuery, setSearchQuery] = useState("");
    const [filterDepartemen, setFilterDepartemen] = useState("");
    const [filterJabatan, setFilterJabatan] = useState("");

    const token = useAuthStore((state) => state.token);

    const { data: deptData } = useQuery({
        queryKey: ['departemenList'],
        queryFn: async () => {
            if (!token) return [];
            const res = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/departemen`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const json = await res.json();
            return json.success ? json.data : [];
        },
        enabled: !!token
    });

    const { data: jabatanData } = useQuery({
        queryKey: ['jabatanList'],
        queryFn: async () => {
            if (!token) return [];
            const res = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/jabatan`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const json = await res.json();
            return json.success ? json.data : [];
        },
        enabled: !!token
    });

    const [modalDetail, setModalDetail] = useState<{
        isOpen: boolean;
        type: 'bonus' | 'potongan';
        pegawaiNama: string;
        jabatan: string;
        periodeTanggal?: string;
        totalNominal: number;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rincianData: any;
    }>({
        isOpen: false,
        type: 'bonus',
        pegawaiNama: '',
        jabatan: '',
        periodeTanggal: '',
        totalNominal: 0,
        rincianData: null
    });

    // Calculate unique departments & positions from API list (or fallback to rekapGajiData)
    const uniqueDepartemenList = useMemo(() => {
        if (deptData && deptData.length > 0) {
            return deptData.map((d: any) => d.nama_departemen).filter(Boolean);
        }
        const depts = rekapGajiData
            .map((p: any) => p.departemen)
            .filter((dept: any): dept is string => !!dept && dept !== "-");
        return Array.from(new Set(depts));
    }, [deptData, rekapGajiData]);

    const uniqueJabatanList = useMemo(() => {
        if (jabatanData && jabatanData.length > 0) {
            return jabatanData
                .filter((j: any) => !filterDepartemen || j.departemen?.nama_departemen === filterDepartemen)
                .map((j: any) => j.nama_jabatan)
                .filter(Boolean);
        }
        const jabs = rekapGajiData
            .filter((p: any) => !filterDepartemen || p.departemen === filterDepartemen)
            .map((p: any) => p.jabatan)
            .filter((jab: any): jab is string => !!jab && jab !== "-");
        return Array.from(new Set(jabs));
    }, [jabatanData, rekapGajiData, filterDepartemen]);

    // Filter rekapGajiData berdasarkan pencarian nama atau jabatan pegawai, departemen, dan jabatan
    const filteredRekapGajiData = useMemo(() => {
        return rekapGajiData.filter((item: any) => {
            const q = searchQuery.toLowerCase();
            const matchSearch = !searchQuery.trim() ||
                (item.nama && item.nama.toLowerCase().includes(q)) ||
                (item.jabatan && item.jabatan.toLowerCase().includes(q));
            const matchDept = !filterDepartemen || item.departemen === filterDepartemen;
            const matchJab = !filterJabatan || item.jabatan === filterJabatan;
            return matchSearch && matchDept && matchJab;
        });
    }, [rekapGajiData, searchQuery, filterDepartemen, filterJabatan]);

    const handleShowDetail = (row: RekapGajiData, type: 'bonus' | 'potongan') => {
        setModalDetail({
            isOpen: true,
            type,
            pegawaiNama: row.nama,
            jabatan: row.jabatan,
            periodeTanggal: row.periode_tanggal,
            totalNominal: type === 'bonus' ? row.total_bonus : row.total_potongan,
            rincianData: type === 'bonus' ? row.rincian_bonus : row.rincian_potongan
        });
    };

    const handleCloseModalDetail = () => {
        setModalDetail(prev => ({ ...prev, isOpen: false }));
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            {isErrorRekap && (
                <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm border border-red-300">
                    Gagal memuat data rekap gaji. Pastikan koneksi internet & backend berjalan lancar.
                </div>
            )}
            {/* WIDGETS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><Wallet size={24} /></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Estimasi Pengeluaran</p>
                        <h3 className="text-xl font-bold text-gray-800">
                            {isLoadingRekap ? "Menghitung..." : formatRupiah(summaryCards.estimasiPengeluaran)}
                        </h3>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 rounded-lg"><TrendingUp size={24} /></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Bonus Disalurkan</p>
                        <h3 className="text-xl font-bold text-gray-800">
                            {isLoadingRekap ? "Menghitung..." : formatRupiah(summaryCards.totalBonus)}
                        </h3>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-red-100 text-red-600 rounded-lg"><TrendingDown size={24} /></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Potongan Denda</p>
                        <h3 className="text-xl font-bold text-gray-800">
                            {isLoadingRekap ? "Menghitung..." : formatRupiah(summaryCards.totalPotongan)}
                        </h3>
                    </div>
                </div>
            </div>

            {/* TABEL DATA GAJI */}
            <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col print:hidden">
                <div className="p-4 sm:p-5 border-b border-gray-200 bg-gray-50/70 flex flex-col gap-4">

                    {/* Baris 1: Search & Cetak Slip Gaji */}
                    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                        {/* Search Input */}
                        <div className="relative flex-1 min-w-[240px] max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Cari nama / jabatan..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full border border-slate-300 rounded-xl pl-10 pr-9 py-2 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                                >
                                    &times;
                                </button>
                            )}
                        </div>

                        {/* Filter Periode & Action Buttons */}
                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            <PeriodSwitcher
                                periode={periode}
                                filterValue={filterValue}
                                onPeriodeChange={handlePeriodeChange}
                                onFilterValueChange={setFilterValue}
                            />

                            {(searchQuery || filterDepartemen || filterJabatan) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setFilterDepartemen('');
                                        setFilterJabatan('');
                                    }}
                                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                    title="Reset semua filter"
                                >
                                    <RotateCcw size={13} />
                                    <span className="hidden sm:inline">Reset</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <TabelRekapGaji
                    data={filteredRekapGajiData}
                    onPelunasan={handlePelunasanGaji}
                    onShowDetail={handleShowDetail}
                />

            </section>

            <SlipGajiTemplate data={rekapGajiData} filterValue={filterValue} />

            <ModalRincianGaji
                isOpen={modalDetail.isOpen}
                onClose={handleCloseModalDetail}
                type={modalDetail.type}
                pegawaiNama={modalDetail.pegawaiNama}
                jabatan={modalDetail.jabatan}
                periodeTanggal={modalDetail.periodeTanggal}
                totalNominal={modalDetail.totalNominal}
                rincianData={modalDetail.rincianData}
            />

            <ModalPreviewSlipGaji
                isOpen={isModalPreviewOpen}
                onClose={() => setIsModalPreviewOpen(false)}
                data={rekapGajiData}
                filterValue={filterValue}
                periode={periode}
            />

            <Notif
                show={notif.show}
                message={notif.message}
                type={notif.type}
                onClose={closeNotif}
            />

            {/* Custom PopUp Konfirmasi Generate Gaji */}
            <ConfirmPopUp
                isOpen={showConfirmGenerate}
                onClose={() => setShowConfirmGenerate(false)}
                onConfirm={confirmGenerateGaji}
                title="Generate Gaji Periode Ini?"
                message={`Apakah Anda yakin ingin menghitung dan menerbitkan gaji untuk periode ${labelPeriode}?`}
                confirmText="Ya, Generate"
                variant="primary"
            />

            {/* Custom PopUp Konfirmasi Pelunasan Gaji */}
            <ConfirmPopUp
                isOpen={showConfirmLunas}
                onClose={() => setShowConfirmLunas(false)}
                onConfirm={confirmPelunasanGaji}
                title="Tandai Sebagai Lunas?"
                message="Apakah Anda yakin ingin menandai gaji ini sebagai Lunas? (Tindakan ini akan mengunci slip gaji dan memotong saldo kasbon pegawai secara permanen jika ada)."
                confirmText="Ya, Lunasi"
                variant="warning"
            />
        </div>
    );
}



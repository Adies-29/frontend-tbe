
import { useState, useMemo } from 'react';
import { Wallet, TrendingDown, TrendingUp, Loader2, PlayCircle, Printer, Search, RotateCcw } from 'lucide-react';
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


const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
};

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
        isGenerating,
        isModalPreviewOpen,
        setIsModalPreviewOpen,
        summaryCards,
        notif,
        handleGenerateGaji,
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
            const res = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/departemen`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const json = await res.json();
            return json.success ? json.data : [];
        }
    });

    const { data: jabatanData } = useQuery({
        queryKey: ['jabatanList'],
        queryFn: async () => {
            const res = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/jabatan`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const json = await res.json();
            return json.success ? json.data : [];
        }
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
            .filter((dept): dept is string => !!dept && dept !== "-");
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
            .filter((jab): jab is string => !!jab && jab !== "-");
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
                        
                        {/* Button Cetak Slip Gaji */}
                        <div className="w-full md:w-auto shrink-0">
                            <Button 
                                label="Cetak Slip Gaji" 
                                variant="info" 
                                icon={<Printer size={16} />} 
                                onClick={handleCetakSemuaSlip} 
                                className="w-full md:w-auto font-bold shadow-2xs text-xs py-2 px-4 rounded-xl cursor-pointer animate-in fade-in duration-200"
                            />
                        </div>
                    </div>

                    {/* Baris 2: Filter Pegawai (Left) + Filter Tanggal (Right) */}
                    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between pt-2 border-t border-gray-200/80">
                        {/* Left: Filter Pegawai (Departemen & Jabatan) */}
                        <div className="flex gap-2 w-full md:w-auto items-center">
                            <select
                                value={filterDepartemen}
                                onChange={(e) => {
                                    setFilterDepartemen(e.target.value);
                                    setFilterJabatan('');
                                }}
                                className="border border-slate-300 rounded-xl px-3 py-1.5 bg-white text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs cursor-pointer flex-1 md:flex-none md:w-48 truncate"
                            >
                                <option value="">Semua Dept</option>
                                {uniqueDepartemenList.map((dept, idx) => (
                                    <option key={idx} value={dept}>{dept}</option>
                                ))}
                            </select>

                            <select
                                value={filterJabatan}
                                onChange={(e) => setFilterJabatan(e.target.value)}
                                disabled={!filterDepartemen}
                                className={`border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold shadow-2xs cursor-pointer flex-1 md:flex-none md:w-48 truncate outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 ${!filterDepartemen ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : 'bg-white text-slate-700'}`}
                                title={!filterDepartemen ? "Pilih Departemen terlebih dahulu" : "Filter berdasarkan Jabatan"}
                            >
                                <option value="">Semua Jabatan</option>
                                {uniqueJabatanList.map((jab, idx) => (
                                    <option key={idx} value={jab}>{jab}</option>
                                ))}
                            </select>
                        </div>

                        {/* Right: Filter Tanggal (Periode & Picker) */}
                        <div className="flex gap-2 w-full md:w-auto items-center flex-wrap sm:flex-nowrap md:justify-end">
                            <div className="bg-slate-200/80 p-1 rounded-xl flex items-center gap-1 shadow-inner">
                                <button
                                    type="button"
                                    onClick={() => handlePeriodeChange('minggu')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                        periode === 'minggu' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    Mingguan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handlePeriodeChange('bulan')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                        periode === 'bulan' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    Bulanan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handlePeriodeChange('tahun')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                        periode === 'tahun' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    Tahunan
                                </button>
                            </div>

                            {/* Date Picker Input */}
                            <div className="relative">
                                {periode === "minggu" && <input type="week" value={filterValue} onChange={(e) => setFilterValue(e.target.value)} className="border border-slate-300 rounded-xl px-3 py-1.5 bg-white text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs cursor-pointer" />}
                                {periode === "bulan" && <input type="month" value={filterValue} onChange={(e) => setFilterValue(e.target.value)} className="border border-slate-300 rounded-xl px-3 py-1.5 bg-white text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs cursor-pointer" />}
                                {periode === "tahun" && (
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <DatePicker
                                            views={['year']}
                                            value={filterValue ? dayjs().year(parseInt(filterValue)) : null}
                                            onChange={(newValue: Dayjs | null) => newValue && setFilterValue(newValue.year().toString())}
                                            slotProps={{
                                                textField: {
                                                    size: 'small',
                                                    className: "bg-white flex-1 md:w-32",
                                                    sx: {
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: '12px',
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            height: '35px',
                                                            color: '#334155',
                                                            '& fieldset': { borderColor: '#cbd5e1' },
                                                            '&:hover fieldset': { borderColor: '#94a3b8' },
                                                            '&.Mui-focused fieldset': { borderColor: '#ef4444' },
                                                        },
                                                        '& .MuiOutlinedInput-input': { padding: '6px 12px' },
                                                        '& .MuiIconButton-root': { padding: '4px', color: '#64748b' }
                                                    }
                                                }
                                            }}
                                        />
                                    </LocalizationProvider>
                                )}
                            </div>

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



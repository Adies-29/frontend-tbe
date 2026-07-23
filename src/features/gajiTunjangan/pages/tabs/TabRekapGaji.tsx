
import { useState, useMemo } from 'react';
import { Wallet, TrendingDown, TrendingUp, Loader2, PlayCircle, Printer, Search, RotateCcw } from 'lucide-react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';

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
    rekapGajiParams?: ReturnType<typeof useRekapGaji>;
}

export default function TabRekapGaji({ rekapGajiParams }: TabRekapGajiProps) {
    const localParams = useRekapGaji();
    const params = rekapGajiParams || localParams;

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
    } = params;

    const [searchQuery, setSearchQuery] = useState("");
    const [filterDepartemen, setFilterDepartemen] = useState("");
    const [filterJabatan, setFilterJabatan] = useState("");
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

    // Get unique departments from rekapGajiData
    const uniqueDepartemenList = useMemo(() => {
        const depts = rekapGajiData.map((item: any) => 
            item.pegawai?.jabatan?.departemen?.nama_departemen || item.departemen
        );
        return Array.from(new Set(depts)).filter((d): d is string => !!d && d !== "-");
    }, [rekapGajiData]);

    // Get unique positions from rekapGajiData, optionally filtered by selected department
    const uniqueJabatanList = useMemo(() => {
        const jabs = rekapGajiData
            .filter((item: any) => {
                if (!filterDepartemen) return true;
                const deptName = item.pegawai?.jabatan?.departemen?.nama_departemen || item.departemen;
                return deptName === filterDepartemen;
            })
            .map((item: any) => item.pegawai?.jabatan?.nama_jabatan || item.jabatan);
        return Array.from(new Set(jabs)).filter((j): j is string => !!j && j !== "-");
    }, [rekapGajiData, filterDepartemen]);

    // Filter rekapGajiData berdasarkan pencarian nama atau jabatan pegawai, serta departemen & jabatan
    const filteredRekapGajiData = useMemo(() => {
        let result = rekapGajiData;

        // Filter Departemen
        if (filterDepartemen) {
            result = result.filter((item: any) => {
                const deptName = item.pegawai?.jabatan?.departemen?.nama_departemen || item.departemen;
                return deptName === filterDepartemen;
            });
        }

        // Filter Jabatan
        if (filterJabatan) {
            result = result.filter((item: any) => {
                const jabName = item.pegawai?.jabatan?.nama_jabatan || item.jabatan;
                return jabName === filterJabatan;
            });
        }

        if (!searchQuery.trim()) return result;
        const q = searchQuery.toLowerCase();
        return result.filter((item: any) =>
            (item.nama && item.nama.toLowerCase().includes(q)) ||
            (item.jabatan && item.jabatan.toLowerCase().includes(q))
        );
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
                    {/* Baris Atas: Judul & Cetak Slip Gaji */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Rincian Gaji Pegawai</h2>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                                Rekapitulasi penghitungan gaji dasar, tunjangan, dan potongan pegawai
                            </p>
                        </div>

                        <Button 
                            label="Cetak Slip Gaji" 
                            variant="info" 
                            icon={<Printer size={16} />} 
                            onClick={handleCetakSemuaSlip} 
                            className="w-full sm:w-auto font-bold shadow-2xs"
                        />
                    </div>

                    {/* Baris 1: Search */}
                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 pt-1">
                        {/* Search Pegawai */}
                        <div className="relative min-w-[240px] max-w-md w-full lg:w-auto">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="Cari nama / jabatan..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full border border-slate-300 rounded-xl pl-10 pr-8 py-1.5 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs transition-all"
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
                    </div>

                    {/* Baris 2: Filter Tanggal di Kiri & Filter Pegawai di Kanan */}
                    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between pt-2 border-t border-gray-200/80">
                        {/* Left (Ujung Sisi Kiri): Filter Tanggal */}
                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            {/* Segmented Control Periode Filter */}
                            <div className="bg-slate-200/80 p-1 rounded-xl flex items-center gap-1 shadow-inner">
                                <button
                                    type="button"
                                    onClick={() => handlePeriodeChange('minggu')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                        periode === 'minggu'
                                            ? 'bg-white text-slate-800 shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    Mingguan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handlePeriodeChange('bulan')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                        periode === 'bulan'
                                            ? 'bg-white text-slate-800 shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    Bulanan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handlePeriodeChange('tahun')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                        periode === 'tahun'
                                            ? 'bg-white text-slate-800 shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900'
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
                                                            '& fieldset': {
                                                                borderColor: '#cbd5e1',
                                                            },
                                                            '&:hover fieldset': {
                                                                borderColor: '#94a3b8',
                                                            },
                                                            '&.Mui-focused fieldset': {
                                                                borderColor: '#ef4444',
                                                            },
                                                        },
                                                        '& .MuiOutlinedInput-input': {
                                                            padding: '6px 12px',
                                                        },
                                                        '& .MuiIconButton-root': {
                                                            padding: '4px',
                                                            color: '#64748b'
                                                        }
                                                    }
                                                }
                                            }}
                                        />
                                    </LocalizationProvider>
                                )}
                            </div>
                        </div>

                        {/* Right (Sisi Kanan / Bawah Search): Filter Pegawai */}
                        <div className="flex gap-2 w-full md:w-auto items-center md:justify-end">
                            <select
                                value={filterDepartemen}
                                onChange={(e) => {
                                    setFilterDepartemen(e.target.value);
                                    setFilterJabatan('');
                                }}
                                className="border border-slate-300 rounded-xl px-3 py-1.5 bg-white text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs cursor-pointer flex-1 md:flex-none md:max-w-[150px] truncate"
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
                                className={`border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold shadow-2xs cursor-pointer flex-1 md:flex-none md:max-w-[150px] truncate outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 ${!filterDepartemen ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : 'bg-white text-slate-700'}`}
                                title={!filterDepartemen ? "Pilih Departemen terlebih dahulu" : "Filter berdasarkan Jabatan"}
                            >
                                <option value="">{filterJabatan ? "Semua Jabatan" : "Semua Jabatan"}</option>
                                {uniqueJabatanList.map((jab, idx) => (
                                    <option key={idx} value={jab}>{jab}</option>
                                ))}
                            </select>

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



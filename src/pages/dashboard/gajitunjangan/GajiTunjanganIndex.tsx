import { useCallback, useEffect, useState } from 'react';
// 1. Tambahkan Printer di sini
import { Wallet, TrendingDown, TrendingUp, Loader2, PlayCircle, Printer } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/id'; // Pastikan locale bahasa indonesia tersedia untuk format tanggal print

// IMPORT KOMPONEN TABEL
import { TabelMasterGaji, type MasterGajiData } from '../../../components/ui/tabel/tabelGaji/TabelMasterGaji';
import { TabelRekapGaji, type RekapGajiData } from '../../../components/ui/tabel/tabelGaji/TabelRekapGaji';
import { useAuthStore } from '../../../store/useAuthStore';
import { getSafeErrorMessage } from '../../../utils/errorHandler';
import { apiFetch } from "../../../utils/apiFetch";
import Notif from '../../../components/ui/Notif';

const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
};

export default function GajiTunjanganIndex() {
    const navigate = useNavigate();
    const location = useLocation();
    const token = useAuthStore((state) => state.token);
    
    // State Navigasi & Filter
    const [activeTab, setActiveTab] = useState<'rekap' | 'master'>(location.state?.tab || 'rekap');
    const [periode, setPeriode] = useState("bulan"); 
    const [filterValue, setFilterValue] = useState(""); 

    // State Penampung Data Utama
    const [rekapGajiData, setRekapGajiData] = useState<RekapGajiData[]>([]);
    const [masterJabatanData, setMasterJabatanData] = useState<MasterGajiData[]>([]);

    // State Loading
    const [isLoadingRekap, setIsLoadingRekap] = useState(false);
    const [isLoadingMaster, setIsLoadingMaster] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // State Finansial Ringkasan (Widgets)
    const [summaryCards, setSummaryCards] = useState({
        estimasiPengeluaran: 0,
        totalBonus: 0,
        totalPotongan: 0
    });
    
    const [notif, setNotif] = useState<{ show: boolean; message: string; type: "success" | "error" | "info" | "warning" }>({
        show: false,
        message: "",
        type: "success"
    });

    // ========================================================
    // 2. FUNGSI CETAK SLIP GAJI
    // ========================================================
    const handleCetakSemuaSlip = () => {
        if (rekapGajiData.length === 0) {
            alert("Tidak ada data gaji yang bisa dicetak!");
            return;
        }
        window.print();
    };

    // ========================================================
    // FUNGSI GENERATE GAJI (Diarahkan ke Generate Massal)
    // ========================================================
    const handleGenerateGaji = async () => {
        if (!filterValue) {
            setNotif({ show: true, message: "Harap pilih bulan dan tahun di kalender terlebih dahulu sebelum men-generate gaji.", type: "warning" });
            return;
        }

        const [tahun, bulan] = filterValue.split('-');

        const confirmGenerate = window.confirm(`Apakah Anda yakin ingin menghitung dan menerbitkan gaji untuk periode Bulan ${bulan} Tahun ${tahun}?`);
        if (!confirmGenerate) return;
    
        setIsGenerating(true);
        
        try {
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/gaji/generate-massal`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    periode_bulan: parseInt(bulan),
                    periode_tahun: parseInt(tahun)
                })
            });
    
            const result = await response.json();
    
            if (response.ok && result.success) {
                setNotif({ show: true, message: `Sukses! ${result.message}`, type: "success" });
                // Refresh data tabel agar hasil generate langsung muncul
                fetchRekapGaji(); 
            } else {
                setNotif({ show: true, message: getSafeErrorMessage(response.status), type: "error" });
            }
        } catch (error) {
            console.error("Error generate gaji:", error);
            setNotif({ show: true, message: "Terjadi kesalahan koneksi saat menghitung gaji.", type: "error" });
        } finally {
            setIsGenerating(false);
        }
    };

    // ========================================================
    // FUNGSI FETCH MASTER JABATAN
    // ========================================================
    const fectchMasterJabatan = useCallback(async () => {
        try {
            setIsLoadingMaster(true)
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/jabatan`, {
                method: "GET",
                headers: {
                    "Content-Type" : "application/json",
                    "Authorization" : `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (response.ok && result.success) { 
                const data = result.data || []; 
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const formattedData: MasterGajiData[] = data.map((item: any) => ({
                    id: String(item.id),
                    nama_jabatan: item.nama_jabatan,
                    departemen: item.departemen?.nama_departemen || item.departemen || "-"
                }));
                setMasterJabatanData(formattedData);
            }
        } catch (error) {
            console.error("Gagal memuat master jabatan:", error);
        } finally{
            setIsLoadingMaster(false);
        }
    }, [token]);

    // ========================================================
    // FUNGSI FETCH REKAP GAJI
    // ========================================================
    const fetchRekapGaji = async () => {
        try {
            setIsLoadingRekap(true);
            
            let url = `${import.meta.env.VITE_API_BASE_URL}/api/v1/gaji`; 
            
            if (periode === 'bulan' && filterValue) {
                url = `${import.meta.env.VITE_API_BASE_URL}/api/v1/gaji?filter=${filterValue}`;
            } else if (periode === 'minggu') {
                if (filterValue) {
                    url = `${import.meta.env.VITE_API_BASE_URL}/api/v1/gaji/mingguan?filter=${filterValue}`;
                } else {
                    url = `${import.meta.env.VITE_API_BASE_URL}/api/v1/gaji/mingguan`;
                }
            } else if (periode === 'hari') {
                const tanggalPilihan = filterValue || new Date().toLocaleDateString('en-CA');
                url = `${import.meta.env.VITE_API_BASE_URL}/api/v1/gaji/harian?tanggal=${tanggalPilihan}`;
            }
    
            const response = await apiFetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });
    
            const result = await response.json();
    
            if (response.ok && result.success) {
                const data = result.data || [];
                
                let formattedData: RekapGajiData[] = [];

                if (periode === 'hari') {
                    formattedData = data;
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formattedData = data.map((item: any) => {
                        const isMingguan = periode === 'minggu';
                        const totalBonusMingguan = (item.total_bonus_kerapian_mingguan || 0) + (item.total_bonus_disiplin_mingguan || 0);
        
                        return {
                            id: String(item.id),
                            nama: item.pegawai?.nama || "Tanpa Nama",
                            jabatan: item.pegawai?.jabatan?.nama_jabatan || "-",
                            gaji_dasar: isMingguan ? (item.total_gaji_pokok_mingguan || 0) : (item.gaji_dasar || 0),
                            total_bonus: isMingguan ? totalBonusMingguan : (item.total_bonus || 0),
                            total_potongan: isMingguan ? (item.total_denda_mingguan || 0) : (item.total_potongan || 0),
                            gaji_bersih: isMingguan ? (item.total_pendapatan_bersih_mingguan || 0) : (item.total_gaji || 0),
                            status: isMingguan ? "Lunas/Cair" : (item.status_pembayaran || "Pending")
                        };
                    });
                }
                
                setRekapGajiData(formattedData);

                const totalPengeluaran = formattedData.reduce((sum, curr) => sum + (curr?.gaji_bersih || 0), 0);
                const totalBonusSemua = formattedData.reduce((sum, curr) => sum + (curr?.total_bonus || 0), 0);
                const totalPotonganSemua = formattedData.reduce((sum, curr) => sum + (curr?.total_potongan || 0), 0);

                setSummaryCards({
                    estimasiPengeluaran: totalPengeluaran,
                    totalBonus: totalBonusSemua,
                    totalPotongan: totalPotonganSemua
                });

            } else {
                console.error("Gagal mengambil data gaji:", result.message);
            }
        } catch (error) {
            console.error("Error fetchRekapGaji:", error);
        } finally {
            setIsLoadingRekap(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'master') {
            if (masterJabatanData.length === 0) {
                setTimeout(() => {
                    fectchMasterJabatan();
                }, 0);
            }
        } else if (activeTab === 'rekap') {
            fetchRekapGaji();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const handleFilter = () => {
        if (!filterValue && periode !== "minggu") {
            setNotif({ show: true, message: "Harap pilih tanggal/waktu terlebih dahulu!", type: "warning" });
            return;
        }
        fetchRekapGaji(); 
    };

    const handlePeriodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPeriode(e.target.value);
        setFilterValue(""); 
    };

    const handleNavigasiAturGaji = (id: number | string) => {
        navigate(`/dashboard/gaji-tunjangan/master-gaji/${id}`);
    };

    return (
        <div className="flex flex-col gap-6 w-full p-2">
            
            {/* SISTEM TAB NAVIGASI - Ditambah print:hidden */}
            <div className="flex gap-6 border-b border-gray-200 px-2 print:hidden">
                <button
                    onClick={() => setActiveTab('rekap')}
                    className={`pb-3 text-sm font-bold border-b-2 transition-all duration-200 ${
                        activeTab === 'rekap' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Rekap Gaji Karyawan
                </button>
                <button
                    onClick={() => setActiveTab('master')}
                    className={`pb-3 text-sm font-bold border-b-2 transition-all duration-200 ${
                        activeTab === 'master' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Master Gaji Jabatan
                </button>
            </div>

            {/* KONTEN TAB 1: REKAP GAJI */}
            {activeTab === 'rekap' && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                    
                    {/* WIDGETS - Ditambah print:hidden */}
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

                    {/* TABEL DATA GAJI - Ditambah print:hidden */}
                    <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col print:hidden">
                        <div className="p-4 border-b flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 gap-4">
                            <h2 className="text-lg font-bold text-gray-700">Rincian Gaji Karyawan</h2>
                            
                            <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
                                {/* 3. TOMBOL CETAK SLIP GAJI DISISIPKAN DI SINI */}
                                <button
                                    onClick={handleCetakSemuaSlip}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-colors mr-2"
                                >
                                    <Printer size={16} />
                                    Cetak Slip Gaji
                                </button>

                                <select value={periode} onChange={handlePeriodeChange} className="border border-gray-300 rounded-lg px-3 py-1.5 bg-white outline-none focus:border-red-500 shadow-sm text-sm">
                                    <option value="hari">Harian</option>
                                    <option value="minggu">Mingguan</option>
                                    <option value="bulan">Bulanan</option>
                                    <option value="tahun">Tahunan</option>
                                </select>

                                {periode === "hari" && <input type="date" value={filterValue} onChange={(e) => setFilterValue(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:border-red-500 shadow-sm text-sm" />}
                                {periode === "minggu" && <input type="week" value={filterValue} onChange={(e) => setFilterValue(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:border-red-500 shadow-sm text-sm" />}
                                {periode === "bulan" && <input type="month" value={filterValue} onChange={(e) => setFilterValue(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:border-red-500 shadow-sm text-sm" />}
                                {periode === "tahun" && (
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <DatePicker
                                            views={['year']}
                                            value={filterValue ? dayjs().year(parseInt(filterValue)) : null}
                                            onChange={(newValue: Dayjs | null) => newValue && setFilterValue(newValue.year().toString())}
                                            slotProps={{ textField: { size: 'small', className: "bg-white w-32", sx: { '& .MuiOutlinedInput-root': { borderRadius: '8px' } } } }}
                                        />
                                    </LocalizationProvider>
                                )}
                                
                                <Button label="Filter" onClick={handleFilter} />

                                {/* TOMBOL GENERATE HANYA MUNCUL SAAT PERIODE BULANAN */}
                                {periode === "bulan" && (
                                    <button 
                                        onClick={handleGenerateGaji}
                                        disabled={isGenerating || !filterValue}
                                        className="flex items-center gap-2 bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm hover:bg-red-700 disabled:bg-gray-400 transition-colors ml-2 border border-transparent"
                                    >
                                        {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <PlayCircle size={16} />}
                                        {isGenerating ? "Memproses..." : "Generate Gaji"}
                                    </button>
                                )}
                            </div>
                        </div>

                        <TabelRekapGaji data={rekapGajiData} />

                    </section>
                </div>
            )}

            {/* KONTEN TAB 2: MASTER GAJI JABATAN - Ditambah print:hidden */}
            {activeTab === 'master' && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-300 relative min-h-50 w-full print:hidden">
                    {isLoadingMaster && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                            <Loader2 className="animate-spin text-red-600" size={32} />
                        </div>
                    )}

                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <h1 className="text-xl font-bold text-gray-800 mb-1">Standar Upah & Bonus</h1>
                        <p className="text-sm text-gray-500 mb-6">Atur nominal gaji pokok, tunjangan, dan bonus berdasarkan masing-masing jabatan.</p>
                        
                        <TabelMasterGaji data={masterJabatanData} onAturGaji={handleNavigasiAturGaji} />
                    </div>
                </div>
            )}
    

            {/* ================================================================== */}
            {/* 4. TEMPLATE SLIP GAJI TERSEMBUNYI (HANYA MUNCUL SAAT PRINT)        */}
            {/* ================================================================== */}
            <div className="hidden print:block w-full text-black font-sans printable-area">
                <style>{`
                    @media print {
                        @page { 
                            size: A4 portrait; 
                            margin: 4mm 4mm; 
                        }
                        /* TRICK: Sembunyikan TOTAL seluruh elemen halaman web */
                        body * {
                            visibility: hidden;
                        }
                        /* Kembalikan visibilitas khusus untuk area slip gaji ini saja */
                        .printable-area, .printable-area * {
                            visibility: visible;
                        }
                        /* Posisikan slip di pojok paling atas kertas */
                        .printable-area {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                        }
                        body { 
                            -webkit-print-color-adjust: exact; 
                            background: white; 
                        }
                    }
                `}</style>

                {/* Grid 3 Kolom Kesamping */}
                <div className="grid grid-cols-3 gap-1.5">
                    {rekapGajiData.map((karyawan) => (
                        <div 
                            key={karyawan.id} 
                            className="border border-dashed border-gray-400 p-2 bg-white print:break-inside-avoid flex flex-col justify-between"
                            style={{ height: '35mm', width: '100%', boxSizing: 'border-box' }}
                        >
                            {/* Kop Slip Mini */}
                            <div className="flex justify-between items-center border-b border-gray-800 pb-0.5 mb-1">
                                <div>
                                    <h4 className="text-[8.5px] font-extrabold uppercase tracking-tight text-gray-900">SLIP GAJI</h4>
                                    <p className="text-[6.5px] text-gray-500 font-medium leading-none">
                                        {/* Format bulan menggunakan Dayjs locale indonesia */}
                                        {dayjs(filterValue || undefined).locale('id').format('MMMM YYYY')}
                                    </p>
                                </div>
                                <div className="text-right leading-none">
                                    <h5 className="text-[7.5px] font-black text-gray-900">PT. TIGA BERLIAN (T-Be)</h5>
                                    <p className="text-[5.5px] text-gray-400 italic">Rahasia</p>
                                </div>
                            </div>

                            {/* Identitas Karyawan Mini */}
                            <div className="grid grid-cols-2 gap-x-1 text-[7.5px] leading-tight mb-1">
                                <div className="flex gap-0.5 truncate">
                                    <span className="text-gray-500 shrink-0">Nama:</span>
                                    <span className="font-bold text-gray-900 truncate">{karyawan.nama}</span>
                                </div>
                                <div className="flex gap-0.5 truncate">
                                    <span className="text-gray-500 shrink-0">Jabt:</span>
                                    <span className="font-bold text-gray-900 truncate">{karyawan.jabatan}</span>
                                </div>
                            </div>

                            {/* Rincian Finansial Ultra Padat */}
                            <div className="grid grid-cols-2 gap-x-2 text-[7px] leading-tight bg-gray-50 p-1 rounded border border-gray-100">
                                <div>
                                    <div className="flex justify-between font-bold text-gray-700 border-b border-gray-200 text-[6.5px] mb-0.5">
                                        <span>PENERIMAAN</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Gaji Pokok</span>
                                        <span className="font-medium text-gray-900">{formatRupiah(karyawan.gaji_dasar)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tunj & Bon</span>
                                        <span className="font-medium text-green-700">+{formatRupiah(karyawan.total_bonus)}</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between font-bold text-gray-700 border-b border-gray-200 text-[6.5px] mb-0.5">
                                        <span>POTONGAN</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Pot/Denda</span>
                                        <span className="font-medium text-red-700">-{formatRupiah(karyawan.total_potongan)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Bersih & Total Gaji */}
                            <div className="mt-0.1 pt-0.5 border-t border-gray-300 flex justify-between items-end leading-none">
                                <div>
                                    <span className="text-[6px] uppercase text-gray-400 font-bold block">Take Home Pay</span>
                                    <span className="text-[9.5px] font-black text-blue-900">{formatRupiah(karyawan.gaji_bersih)}</span>
                                </div>
                                <div className="text-center text-[6.5px] w-14 border-b border-gray-400 text-gray-700 font-medium">
                                    Penerima
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
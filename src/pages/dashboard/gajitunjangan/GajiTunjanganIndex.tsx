import { useCallback, useEffect, useState } from 'react';
import { Wallet, TrendingDown, TrendingUp, Loader2, PlayCircle, Printer } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';

// IMPORT KOMPONEN TABEL
import { TabelMasterGaji, type MasterGajiData } from '../../../components/ui/tabel/tabelGaji/TabelMasterGaji';
import { TabelRekapGaji, type RekapGajiData } from '../../../components/ui/tabel/tabelGaji/TabelRekapGaji';
import { useAuthStore } from '../../../store/useAuthStore';
import { getSafeErrorMessage } from '../../../utils/errorHandler';
import { apiFetch } from "../../../utils/apiFetch";
import SlipGajiTemplate from '../../../components/ui/SlipGajiTemplate';
// Tambahkan interface ini di bagian atas file (di bawah import):
interface GajiApiResponse {
    id: number;
    gaji_dasar?: number;
    total_bonus?: number;
    total_potongan?: number;
    total_gaji?: number;
    total_gaji_pokok_mingguan?: number;
    total_bonus_kerapian_mingguan?: number;
    total_bonus_disiplin_mingguan?: number;
    total_denda_mingguan?: number;
    total_pendapatan_bersih_mingguan?: number;
    status_pembayaran?: string;
    pegawai?: {
        nama: string;
        jabatan?: { nama_jabatan: string };
    };
}


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

    const [_notif, setNotif] = useState<{ show: boolean; message: string; type: "success" | "error" | "info" | "warning" }>({
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
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });
    
            const result = await response.json();
            if (response.ok && result.success) {
                const data = result.data || [];
                const formattedData: MasterGajiData[] = data.map((item: { id: number | string; nama_jabatan: string; departemen?: { nama_departemen: string } | string | null }) => {
                    let namaDept = "-";
                    if (typeof item.departemen === "object" && item.departemen !== null) {
                        namaDept = item.departemen.nama_departemen;
                    } else if (typeof item.departemen === "string") {
                        namaDept = item.departemen;
                    }
                    return {
                        id: String(item.id),
                        nama_jabatan: item.nama_jabatan,
                        departemen: namaDept
                    };
                });
                setMasterJabatanData(formattedData);
            }
        } catch (error) {
            console.error("Gagal memuat master jabatan:", error);
            setNotif({ show: true, message: "Terjadi kesalahan koneksi.", type: "error" });
        } finally {
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
                    formattedData = data.map((item: GajiApiResponse) => {
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
            setNotif({ show: true, message: "Terjadi kesalahan koneksi.", type: "error" });
        } finally {
            setIsLoadingRekap(false);
        }
    };

    // Efek untuk memuat data berdasarkan Tab yang aktif
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
                    className={`pb-3 text-sm font-bold border-b-2 transition-all duration-200 ${activeTab === 'rekap' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Rekap Gaji Karyawan
                </button>
                <button
                    onClick={() => setActiveTab('master')}
                    className={`pb-3 text-sm font-bold border-b-2 transition-all duration-200 ${activeTab === 'master' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'
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
            <div className='w-full'>
                {activeTab === 'master' && (
                    <div className="flex flex-col gap-6 animate-in fade-in duration-300 relative min-h-50 w-full print:hidden">
                        {isLoadingMaster && (
                            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                                <Loader2 className="animate-spin text-red-600" size={32} />
                            </div>
                        )}

                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm w-full">
                            <h1 className="text-xl font-bold text-gray-800 mb-1">Standar Upah & Bonus</h1>
                            <p className="text-sm text-gray-500">Atur nominal gaji pokok, tunjangan, dan bonus berdasarkan masing-masing jabatan.</p>

                            <TabelMasterGaji data={masterJabatanData} onAturGaji={handleNavigasiAturGaji} />
                        </div>
                    </div>
                )}

                <SlipGajiTemplate data={rekapGajiData} filterValue={filterValue} />

            </div>


        </div>
    );
}
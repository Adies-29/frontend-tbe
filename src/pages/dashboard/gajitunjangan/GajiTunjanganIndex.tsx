import { useCallback, useEffect, useState } from 'react';
import { Wallet, TrendingDown, TrendingUp, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';

// IMPORT KOMPONEN TABEL YANG BARU DIBUAT (Sesuaikan nama foldernya jika perlu)

import { TabelMasterGaji, type MasterGajiData } from '../../../components/ui/tabel/tabelGaji/TabelMasterGaji';
import { TabelRekapGaji, type RekapGajiData } from '../../../components/ui/tabel/tabelGaji/TabelRekapGaji';
import { useAuthStore } from '../../../store/useAuthStore';
import { string, toJSONSchema } from 'zod';

const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
};



export default function GajiTunjanganIndex() {
    const navigate = useNavigate();
    const location = useLocation();
    const token = useAuthStore((state) => state.token);
    
    // State tab diubah dari 'payroll' menjadi 'rekap'
    const [activeTab, setActiveTab] = useState<'rekap' | 'master'>(location.state?.tab || 'rekap');
    const [periode, setPeriode] = useState("bulan"); 
    const [filterValue, setFilterValue] = useState(""); 

    // State Penampung Data Utama
    const [rekapGajiData, setRekapGajiData] = useState<RekapGajiData[]>([]);
    const [masterJabatanData, setMasterJabatanData] = useState<MasterGajiData[]>([]);

    // State Loading
    const [isLoadingRekap, setIsLoadingRekap] = useState(false);
    const [isLoadingMaster, setIsLoadingMaster] = useState(false);

    // State Finansial Ringkasan (Widgets)
    const [summaryCards, setSummaryCards] = useState({
        estimasiPengeluaran: 0,
        totalBonus: 0,
        totalPotongan: 0
    });

    const fectchMasterJabatan = useCallback(async () => {
        try {
            setIsLoadingMaster(true)
            const response = await fetch (`https://ppm-sooty.vercel.app/api/v1/jabatan`, {
                method: "GET",
                headers: {
                    "Content-Type" : "application/json",
                    "Authorization" : `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (response.ok && result.success) { 
                
                const data = result.data || []; 

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


    const fetchRekapGaji = useCallback(async () => {
        try {
            setIsLoadingRekap(true);
            
            // Tambahkan query parameter untuk filter periode nantinya jika backend sudah siap
            // let url = `https://ppm-sooty.vercel.app/api/v1/gaji?periode=${periode}&waktu=${filterValue}`;
            // let url = `https://ppm-sooty.vercel.app/api/gaji`;

            const response = await fetch(`https://ppm-sooty.vercel.app/api/gaji`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (response.ok && result.success) {
                const data = result.data || [];

                // 1. Mapping Data Backend ke Format Tabel UI
                const formattedData: RekapGajiData[] = data.map((item: any) => ({
                    id: String(item.id),
                    nama: item.pegawai?.nama || "Tanpa Nama",
                    jabatan: item.pegawai?.jabatan?.nama_jabatan || "-", // Asumsi backend akan diupdate mengirim jabatan
                    
                    // Karena backend versi awal kita baru mengirim 'total_gaji', kita siapkan fallback
                    gaji_dasar: item.gaji_dasar || item.total_gaji || 0, 
                    total_bonus: item.total_bonus || 0,
                    total_potongan: item.total_potongan || 0,
                    gaji_bersih: item.total_gaji || 0,
                    status: item.status_pembayaran || "Pending"
                }));

                setRekapGajiData(formattedData);

                // 2. Update Widget Finansial Secara Dinamis (Menjumlahkan semua baris)
                const totalPengeluaran = formattedData.reduce((sum, curr) => sum + curr.gaji_bersih, 0);
                const totalBonusSemua = formattedData.reduce((sum, curr) => sum + curr.total_bonus, 0);
                const totalPotonganSemua = formattedData.reduce((sum, curr) => sum + curr.total_potongan, 0);

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
    }, [token, periode, filterValue]); // Masukkan filter ke dependency

    useEffect(() => {
        if (activeTab === 'master') {
            if (masterJabatanData.length === 0) {
                fectchMasterJabatan();
            }
        } else if (activeTab === 'rekap') {
            // Panggil API saat tab rekap dibuka
            fetchRekapGaji();
        }
    }, [activeTab, fectchMasterJabatan, fetchRekapGaji]);

    const handleFilter = () => {
        if (!filterValue && periode !== "minggu") {
            alert("Harap pilih tanggal/waktu terlebih dahulu!");
            return;
        }
        
        // Panggil ulang API dengan nilai filter terbaru
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
            
            {/* SISTEM TAB NAVIGASI */}
            <div className="flex gap-6 border-b border-gray-200 px-2">
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
                    {/* WIDGETS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><Wallet size={24} /></div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Estimasi Pengeluaran</p>
                                {/* Gunakan state dinamis, beri efek loading jika data sedang ditarik */}
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
                    <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                        <div className="p-4 border-b flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 gap-4">
                            <h2 className="text-lg font-bold text-gray-700">Rincian Gaji Karyawan</h2>
                            
                            <div className="flex gap-2 w-full md:w-auto">
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
                            </div>
                        </div>

                        {/* PANGGIL KOMPONEN TABEL REKAP GAJI DI SINI */}
                        <TabelRekapGaji data={rekapGajiData} />

                    </section>
                </div>
            )}

            {/* KONTEN TAB 2: MASTER GAJI JABATAN */}
            {activeTab === 'master' && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-300 relative min-h-50 w-full">
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
        </div>
    );
}
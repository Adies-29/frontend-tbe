import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import TabelDashboard from "../../components/ui/tabel/TabelDashboard";


export default function DashboardIndex() {
    // 1. STATE UNTUK DATA
    const [currentTime, setCurrentTime] = useState(new Date());
    const [summary, setSummary] = useState({
        total_pegawai: 0,
        hadir_tepat_waktu: 0,
        terlambat: 0,
        belum_hadir: 0,
        dibatalkan_void: 0
    });
    const [rows, setRows] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // 2. JAM BERDETAK
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // 3. FUNGSI TARIK DATA (Dibungkus useCallback agar bisa dilempar ke Tabel)
    const fetchLiveDashboard = useCallback(async () => {
        try {
            const response = await fetch("http://localhost:3000/api/v1/dashboard/live"); 
            const result = await response.json();

            if (response.ok && result.success) {
                setSummary(result.statistik);

                // Format data agar sesuai dengan interface AbsensiData di TabelDashboard
                const formattedRows = result.data_karyawan.map((karyawan: any) => {
                    let labelStatus = "Belum Hadir";
                    if (karyawan.status === 'intime' || karyawan.status === 'ontime') labelStatus = 'Tepat';
                    else if (karyawan.status === 'late') labelStatus = 'Terlambat';
                    else if (karyawan.status === 'void') labelStatus = 'Void';

                    return {
                        id: karyawan.id_pegawai,
                        nama: karyawan.nama,
                        jabatan: karyawan.jabatan,
                        waktu_masuk: karyawan.jam_masuk,
                        status_masuk: labelStatus,
                        waktu_pulang: karyawan.jam_pulang,
                        status_lembur: "-" 
                    };
                });
                
                setRows(formattedRows);
            }
        } catch (error) {
            console.error("Gagal menarik data live dashboard:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 4. AUTO REFRESH (Panggil fungsi tarik data)
    useEffect(() => {
        fetchLiveDashboard(); // Panggil pertama kali

        const refreshInterval = setInterval(fetchLiveDashboard, 30000); // Tiap 30 dtk
        return () => clearInterval(refreshInterval);
    }, [fetchLiveDashboard]);

    // Formatting UI
    const totalHadir = summary.hadir_tepat_waktu + summary.terlambat;

    return (
        <div className="flex flex-col gap-6 w-full">

            {/* KOTAK STATISTIK */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-b-[6px] border-b-blue-500 p-5 flex flex-col items-center justify-center relative hover:-translate-y-1 transition-transform">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Hadir</h3>
                    <p className="text-4xl font-extrabold text-gray-900 mt-2">{totalHadir}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-b-[6px] border-b-green-500 p-5 flex flex-col items-center text-center relative hover:-translate-y-1 transition-transform">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Tepat Waktu</h3>
                    <p className="text-4xl font-extrabold text-gray-900 mt-1">{summary.hadir_tepat_waktu}</p>
                    <p className="text-[10px] text-green-600 font-semibold mt-1 bg-green-50 px-2 py-0.5 rounded-full">Ontime / Intime</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-b-[6px] border-b-red-500 p-5 flex flex-col items-center text-center relative hover:-translate-y-1 transition-transform">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Terlambat</h3>
                    <p className="text-4xl font-extrabold text-gray-900 mt-1">{summary.terlambat}</p>
                    <p className="text-[10px] text-red-600 font-semibold mt-1 bg-red-50 px-2 py-0.5 rounded-full">Diatas toleransi</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-b-[6px] border-b-yellow-400 p-5 flex flex-col items-center justify-center relative hover:-translate-y-1 transition-transform">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Belum Hadir</h3>
                    <p className="text-4xl font-extrabold text-gray-900 mt-2">{summary.belum_hadir}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-b-[6px] border-b-gray-800 p-5 flex flex-col items-center justify-center relative hover:-translate-y-1 transition-transform">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Data Void</h3>
                    <p className="text-4xl font-extrabold text-gray-900 mt-2">{summary.dibatalkan_void}</p>
                </div>
            </div>

            {/* TABEL MUI DATAGRID */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-bold text-gray-800">Aktivitas Absensi Karyawan Hari Ini</h2>
                    {isLoading && (
                        <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold">
                            <Loader2 className="animate-spin" size={16} /> Menyinkronkan...
                        </div>
                    )}
                </div>
                
                {/* PEMANGGILAN KOMPONEN ANAK DENGAN PROPS BARU */}
                <TabelDashboard 
                    data={rows} 
                    onRefresh={fetchLiveDashboard} 
                />
                
            </div>
        </div>
    );
}
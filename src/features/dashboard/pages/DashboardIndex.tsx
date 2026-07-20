import { useState, useEffect, useCallback } from "react";
import { Loader2, PlusCircle } from "lucide-react";
import type { AbsensiData, DashboardKaryawanResponse } from "../../../types";
import { useAuthStore } from "../../../store/useAuthStore";
import { apiFetch } from "../../../utils/apiFetch";
import TabelDashboard from "../components/TabelDashboard";
import ModalInputAbsensi from "../components/ModalInputAbsensi";


export default function DashboardIndex() {
    // 1. STATE UNTUK DATA
    const [_currentTime, setCurrentTime] = useState(new Date());
    const [summary, setSummary] = useState({
        total_pegawai: 0,
        hadir_tepat_waktu: 0,
        terlambat: 0,
        belum_hadir: 0,
        dibatalkan_void: 0
    });

    const [rows, setRows] = useState<AbsensiData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalAbsenOpen, setIsModalAbsenOpen] = useState(false);
    const token = useAuthStore((state) => state.token);

    // 2. JAM BERDETAK
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // 3. FUNGSI TARIK DATA (Dibungkus useCallback agar bisa dilempar ke Tabel)
    const fetchLiveDashboard = useCallback(async () => {
        try {
            const timestamp = new Date().getTime();
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/dashboard/live?_t=${timestamp}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setSummary(result.statistik);

                // Format data agar sesuai dengan interface AbsensiData di TabelDashboard
                const formattedRows = result.data_karyawan.map((karyawan: DashboardKaryawanResponse, index: number) => {
                    let labelStatus = "Belum Hadir";

                    const statusBackend = (karyawan.status || "").toLowerCase();

                    if (statusBackend === 'intime' || statusBackend === 'ontime') labelStatus = 'Tepat';
                    else if (statusBackend === 'late') labelStatus = 'Terlambat';
                    else if (statusBackend === 'void') labelStatus = 'Void';
                    // Jika backend mengirim "Tepat" / "Terlambat" secara langsung dari update kita sebelumnya
                    else if (karyawan.status_masuk === 'Tepat' || karyawan.status_masuk === 'Terlambat' || karyawan.status_masuk === 'Void') {
                        labelStatus = karyawan.status_masuk;
                    }

                    return {
                        // PERBAIKAN UTAMA: Jika karyawan.id kosong, cari pegawai_id. Jika kosong juga, pakai index + 1
                        id: karyawan.id || karyawan.pegawai_id || index + 1,
                        pegawai_id: karyawan.pegawai_id,
                        nama: karyawan.nama || "Tanpa Nama",
                        jabatan: karyawan.jabatan || "-",
                        info_shift: karyawan.info_shift || "-",
                        waktu_masuk: karyawan.waktu_masuk || "-",
                        status_masuk: karyawan.status_masuk || labelStatus,
                        waktu_pulang: karyawan.waktu_pulang || "-",
                        status_lembur: karyawan.status_lembur || "-",
                        is_kerapian: karyawan.is_kerapian || false
                    };
                });

                const sortedRows = formattedRows.sort((a: AbsensiData, b: AbsensiData) => {
                    // Ambil waktu terakhir pegawai A (prioritaskan waktu pulang, jika "-" pakai waktu masuk)
                    const jam_A = a.waktu_pulang !== "-" ? a.waktu_pulang : (a.waktu_masuk !== "-" ? a.waktu_masuk : "00:00:00");

                    // Ambil waktu terakhir pegawai B
                    const jam_B = b.waktu_pulang !== "-" ? b.waktu_pulang : (b.waktu_masuk !== "-" ? b.waktu_masuk : "00:00:00");

                    // Urutkan menurun (Descending) - Waktu paling besar/terbaru ada di atas
                    if (jam_A > jam_B) return -1;
                    if (jam_A < jam_B) return 1;
                    return 0;
                });

                setRows(sortedRows);
            }
        } catch (error) {
            console.error("Gagal menarik data live dashboard:", error);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    // 4. AUTO REFRESH (Hanya jalan jika tab aktif)
    useEffect(() => {
        const timeoutId = setTimeout(fetchLiveDashboard, 0); // Panggil pertama kali

        const refreshInterval = setInterval(() => {
            // Cegah pemuatan data jika tab sedang tidak dilihat (menghemat resource server)
            if (document.visibilityState === 'visible') {
                fetchLiveDashboard();
            }
        }, 30000); // Tiap 30 dtk

        // Tambahan: Langsung tarik data baru ketika pengguna kembali ke tab ini
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchLiveDashboard();
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            clearInterval(refreshInterval);
            clearTimeout(timeoutId);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [fetchLiveDashboard]);


    const totalHadir = summary.hadir_tepat_waktu + summary.terlambat;

    return (
        <div className="flex flex-col gap-4 md:gap-6 w-full">

            {/* KOTAK STATISTIK */}
            <div data-tour="dashboard-stats" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-b-4 border-b-blue-500 p-4 flex flex-col items-center justify-center relative hover:-translate-y-1 transition-transform">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Hadir</h3>
                    <p className="text-3xl font-extrabold text-gray-900 mt-1">{totalHadir}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-b-4 border-b-green-500 p-4 flex flex-col items-center text-center relative hover:-translate-y-1 transition-transform">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tepat Waktu</h3>
                    <p className="text-3xl font-extrabold text-gray-900 mt-1">{summary.hadir_tepat_waktu}</p>
                    <p className="text-[10px] text-green-600 font-semibold mt-1 bg-green-50 px-2 py-0.5 rounded-full">Ontime / Intime</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-b-4 border-b-red-500 p-4 flex flex-col items-center text-center relative hover:-translate-y-1 transition-transform">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Terlambat</h3>
                    <p className="text-3xl font-extrabold text-gray-900 mt-1">{summary.terlambat}</p>
                    <p className="text-[10px] text-red-600 font-semibold mt-1 bg-red-50 px-2 py-0.5 rounded-full">Diatas toleransi</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-b-4 border-b-yellow-400 p-4 flex flex-col items-center justify-center relative hover:-translate-y-1 transition-transform">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Belum Hadir</h3>
                    <p className="text-3xl font-extrabold text-gray-900 mt-1">{summary.belum_hadir}</p>
                </div>
            </div>


            <section data-tour="dashboard-header" className="bg-white border border-gray-300 rounded-2xl p-4 md:p-6 shadow-sm w-full min-h-[400px]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-4">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                        Aktivitas Absensi Pegawai Hari Ini
                    </h1>
                    <div className="w-full md:w-auto">
                        <button 
                            data-tour="btn-input-manual"
                            onClick={() => setIsModalAbsenOpen(true)}
                            className="w-full md:w-auto active:scale-95 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 md:py-2.5 rounded-xl font-semibold text-[15px] md:text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-sm"
                        >
                            <PlusCircle size={18} /> Input Manual
                        </button>
                    </div>
                </div>

                <div data-tour="dashboard-table" className="w-full">
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2 text-sm text-blue-600 font-semibold my-8">
                            <Loader2 className="animate-spin" size={16} /> Menyinkronkan...
                        </div>
                    ) : (
                        <TabelDashboard
                            data={rows}
                            onRefresh={fetchLiveDashboard}
                        />
                    )}
                </div>
            </section>

            <ModalInputAbsensi 
                isOpen={isModalAbsenOpen} 
                onClose={() => setIsModalAbsenOpen(false)} 
                onSuccess={fetchLiveDashboard} 
            />
        </div>
    );
}
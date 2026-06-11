import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import TabelDashboard from "../../components/ui/tabel/TabelDashboard";
import { useAuthStore } from "../../store/useAuthStore";
import type { AbsensiData, DashboardKaryawanResponse } from "../../types";
import { apiFetch } from "../../utils/apiFetch";

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
    const token = useAuthStore((state) => state.token);

    // 2. JAM BERDETAK
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // 3. FUNGSI TARIK DATA (Dibungkus useCallback agar bisa dilempar ke Tabel)
    const fetchLiveDashboard = useCallback(async () => {
        try {
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/dashboard/live`, {
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
                        // PERBAIKAN UTAMA: Jika karyawan.id kosong, cari id_pegawai. Jika kosong juga, pakai index + 1
                        id: karyawan.id || karyawan.id_pegawai || index + 1,
                        nama: karyawan.nama || "Tanpa Nama",
                        jabatan: karyawan.jabatan || "-",
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">

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


            <section className="bg-white border border-gray-300 rounded-2xl p-4 shadow-sm w-full min-h-100">
                <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4 w-full">
                    <h2 className="text-lg font-bold text-gray-800">Aktivitas Absensi Karyawan Hari Ini</h2>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-2">

                        {isLoading ? (
                            <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold">
                                <Loader2 className="animate-spin" size={16} /> Menyinkronkan...
                            </div>
                        ) : (
                            <TabelDashboard
                                data={rows}
                                onRefresh={fetchLiveDashboard}
                            />
                        )}
                    </div>
                </div>
            </section>



        </div>
    );
}
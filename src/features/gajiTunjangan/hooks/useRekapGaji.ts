import { useState, useCallback } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import type { RekapGajiData } from '../components/TabelRekapGaji';
import { apiFetch } from '../../../utils/apiFetch';
import { getSafeErrorMessage } from '../../../utils/errorHandler';


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

export function useRekapGaji() {
    const token = useAuthStore((state) => state.token);
    const [periode, setPeriode] = useState("bulan");
    const [filterValue, setFilterValue] = useState("");
    const [rekapGajiData, setRekapGajiData] = useState<RekapGajiData[]>([]);
    const [isLoadingRekap, setIsLoadingRekap] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    
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

    const fetchRekapGaji = useCallback(async () => {
        setIsLoadingRekap(true);
        try {
            let targetBulan = 0;
            let targetTahun = new Date().getFullYear();

            // 1. TERJEMAHKAN INPUT FILTER KE BULAN & TAHUN
            if (filterValue) {
                if (periode === 'bulan') {
                    const [tahun, bulan] = filterValue.split('-');
                    targetTahun = parseInt(tahun);
                    targetBulan = parseInt(bulan);
                } else if (periode === 'minggu') {
                    const [tahunStr, mingguStr] = filterValue.split('-W');
                    const year = parseInt(tahunStr);
                    const week = parseInt(mingguStr);

                    // Algoritma pencari bulan berdasarkan minggu ke-X
                    const jan4 = new Date(year, 0, 4);
                    const dayOfJan4 = jan4.getDay() || 7;
                    const week1Start = new Date(year, 0, 4 - dayOfJan4 + 1);
                    const startDate = new Date(week1Start.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);

                    targetBulan = startDate.getMonth() + 1;
                    targetTahun = startDate.getFullYear();
                } else if (periode === 'tahun') {
                    targetTahun = parseInt(filterValue);
                }
            }

            // 2. BANGUN URL DINAMIS
            // Backend cukup menerima query parameter ?tahun=2026&bulan=6
            let url = `${import.meta.env.VITE_API_BASE_URL}/api/v1/gaji?tahun=${targetTahun}`;
            if (targetBulan > 0) {
                url += `&bulan=${targetBulan}`;
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

                // 3. MAPPING DATA (KINI SANGAT SERAGAM)
                // Tidak perlu lagi if-else mingguan/bulanan karena database sudah di-unifikasi
                const formattedData: RekapGajiData[] = data.map((item: GajiApiResponse) => ({
                    id: String(item.id),
                    nama: item.pegawai?.nama || "Tanpa Nama",
                    jabatan: item.pegawai?.jabatan?.nama_jabatan || "-",
                    gaji_dasar: item.gaji_dasar || 0,
                    total_bonus: item.total_bonus || 0,
                    total_potongan: item.total_potongan || 0,
                    gaji_bersih: item.total_gaji || 0,
                    status: item.status_pembayaran || "Pending"
                }));

                setRekapGajiData(formattedData);

                // 4. KALKULASI SUMMARY CARDS
                const totalPengeluaran = formattedData.reduce((sum, curr) => sum + (curr.gaji_bersih || 0), 0);
                const totalBonusSemua = formattedData.reduce((sum, curr) => sum + (curr.total_bonus || 0), 0);
                const totalPotonganSemua = formattedData.reduce((sum, curr) => sum + (curr.total_potongan || 0), 0);

                setSummaryCards({
                    estimasiPengeluaran: totalPengeluaran,
                    totalBonus: totalBonusSemua,
                    totalPotongan: totalPotonganSemua
                });
            } else {
                console.error("Gagal mengambil data gaji:", result.message);
                setNotif({ show: true, message: getSafeErrorMessage(response.status), type: "error" });
                setRekapGajiData([]); // Kosongkan tabel jika gagal
            }
        } catch (error) {
            console.error("Error fetchRekapGaji:", error);
            setNotif({ show: true, message: "Terjadi kesalahan koneksi.", type: "error" });
        } finally {
            setIsLoadingRekap(false);
        }
    }, [periode, filterValue, token]);

    const handleGenerateGaji = async () => {
        if (!filterValue) {
            setNotif({ show: true, message: "Harap pilih periode di kalender terlebih dahulu sebelum men-generate gaji.", type: "warning" });
            return;
        }
    
        // 1. Validasi tipe periode di awal untuk mencegah inisialisasi variabel sia-sia
        if (periode !== 'bulan' && periode !== 'minggu') {
            setNotif({ show: true, message: "Sistem Generate Gaji hanya mendukung periode Mingguan dan Bulanan.", type: "warning" });
            return;
        }
    
        // 2. Sekarang variabel aman diinisialisasi karena validasi di atas sudah lolos
        let tanggalMulai = "";
        let tanggalSelesai = "";
        let targetBulan = 1;
        let targetTahun = 2026;
        let labelPeriode = "";
    
        // ==========================================================
        // KALKULASI RENTANG TANGGAL BERDASARKAN MODE PERIODE
        // ==========================================================
        if (periode === 'bulan') {
            // Mode Bulanan: "2026-06"
            const [tahun, bulan] = filterValue.split('-');
            targetTahun = parseInt(tahun);
            targetBulan = parseInt(bulan);
            
            tanggalMulai = `${tahun}-${bulan}-01`;
            const totalHari = new Date(targetTahun, targetBulan, 0).getDate();
            tanggalSelesai = `${tahun}-${bulan}-${String(totalHari).padStart(2, '0')}`;
            
            labelPeriode = `Bulan ${bulan} Tahun ${tahun}`;
    
        } else if (periode === 'minggu') {
            // Mode Mingguan: "2026-W24"
            const [tahunStr, mingguStr] = filterValue.split('-W');
            const year = parseInt(tahunStr);
            const week = parseInt(mingguStr);
    
            // Algoritma ISO 8601 untuk mencari hari Senin di minggu tersebut
            const jan4 = new Date(year, 0, 4); 
            const dayOfJan4 = jan4.getDay() || 7; 
            const week1Start = new Date(year, 0, 4 - dayOfJan4 + 1); 
            
            const startDate = new Date(week1Start.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
            const endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000); // Tambah 6 hari ke hari Minggu
    
            tanggalMulai = startDate.toLocaleDateString('en-CA'); // YYYY-MM-DD
            tanggalSelesai = endDate.toLocaleDateString('en-CA');
            
            // Ambil bulan & tahun berdasarkan hari Senin di minggu tersebut
            targetBulan = startDate.getMonth() + 1;
            targetTahun = startDate.getFullYear();
            
            labelPeriode = `Mingguan (${tanggalMulai} s/d ${tanggalSelesai})`;
        }
    
        // Konfirmasi sebelum eksekusi
        const confirmGenerate = window.confirm(`Apakah Anda yakin ingin menghitung dan menerbitkan gaji untuk periode ${labelPeriode}?`);
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
                    tanggal_mulai: tanggalMulai,
                    tanggal_selesai: tanggalSelesai,
                    periode_bulan: targetBulan,
                    periode_tahun: targetTahun
                })
            });
    
            const result = await response.json();
            if (response.ok && result.success) {
                setNotif({ show: true, message: `Sukses! ${result.message}`, type: "success" });
                // Panggil ulang fungsi load tabel Anda
                // fetchRekapGaji(); 
            } else {
                setNotif({ show: true, message: result.message || "Gagal memproses gaji.", type: "error" });
            }
        } catch (error) {
            console.error("Error generate gaji:", error);
            setNotif({ show: true, message: "Terjadi kesalahan koneksi saat menghitung gaji.", type: "error" });
        } finally {
            setIsGenerating(false);
        }
    };
    
    
    const handleCetakSemuaSlip = () => {
        if (rekapGajiData.length === 0) {
            alert("Tidak ada data gaji yang bisa dicetak!");
            return;
        }
        window.print();
    };

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

    return {
        periode,
        filterValue,
        setFilterValue,
        rekapGajiData,
        isLoadingRekap,
        isGenerating,
        summaryCards,
        notif,
        fetchRekapGaji,
        handleGenerateGaji,
        handleCetakSemuaSlip,
        handleFilter,
        handlePeriodeChange
    };
}

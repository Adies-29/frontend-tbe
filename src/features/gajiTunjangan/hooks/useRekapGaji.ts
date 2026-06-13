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
            let url = `${import.meta.env.VITE_API_BASE_URL}/api/v1/gaji`;

            if (periode === 'bulan' && filterValue) {
                url = `${url}?filter=${filterValue}`;
            } else if (periode === 'minggu') {
                url = filterValue ? `${url}/mingguan?filter=${filterValue}` : `${url}/mingguan`;
            } else if (periode === 'hari') {
                const tanggalPilihan = filterValue || new Date().toLocaleDateString('en-CA');
                url = `${url}/harian?tanggal=${tanggalPilihan}`;
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
    }, [periode, filterValue, token]);

    const handleGenerateGaji = async () => {
        if (!filterValue) {
            setNotif({ show: true, message: "Harap pilih bulan dan tahun di kalender terlebih dahulu sebelum men-generate gaji.", type: "warning" });
            return;
        }

        const [tahun, bulan] = filterValue.split('-');
        
        // =========================================================================
        // TAMBAHAN: Kalkulasi Rentang Tanggal Otomatis (Awal s/d Akhir Bulan)
        // =========================================================================
        const tanggalMulai = `${tahun}-${bulan}-01`;
        const totalHari = new Date(tahun, bulan, 0).getDate(); // Mendapatkan tanggal terakhir di bulan tsb
        const tanggalSelesai = `${tahun}-${bulan}-${String(totalHari).padStart(2, '0')}`;

        // Konfirmasi diperjelas agar HRD tahu rentang pastinya
        const confirmGenerate = window.confirm(`Apakah Anda yakin ingin menghitung dan menerbitkan gaji untuk periode absensi dari ${tanggalMulai} sampai ${tanggalSelesai}?`);
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
                    periode_tahun: parseInt(tahun),
                    // Suntikkan dua parameter baru ini untuk Backend!
                    tanggal_mulai: tanggalMulai, 
                    tanggal_selesai: tanggalSelesai 
                })
            });

            const result = await response.json();
            if (response.ok && result.success) {
                setNotif({ show: true, message: `Sukses! ${result.message}`, type: "success" });
                fetchRekapGaji();
            } else {
                // Tampilkan pesan error spesifik dari backend jika ada (misal: "Sudah pernah diterbitkan")
                setNotif({ show: true, message: result.message || getSafeErrorMessage(response.status), type: "error" });
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

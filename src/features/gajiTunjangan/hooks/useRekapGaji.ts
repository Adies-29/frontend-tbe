import { useState } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import type { RekapGajiData } from '../components/TabelRekapGaji';
import { apiFetch } from '../../../utils/apiFetch';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';



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

const getCurrentWeek = () => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

const getCurrentMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const getCurrentYear = () => {
    return new Date().getFullYear().toString();
};


export function useRekapGaji() {
    const token = useAuthStore((state) => state.token);
    const queryClient = useQueryClient();
    const [periode, setPeriode] = useState("minggu");
    const [filterValue, setFilterValue] = useState(getCurrentWeek());

    const [notif, setNotif] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
        show: false,
        message: "",
        type: "success"
    });

    const fetchRekapGaji = async () => {
        try {
            let targetBulan = 0;
            let targetTahun = new Date().getFullYear();

            if (filterValue) {
                if (periode === 'bulan') {
                    const [tahun, bulan] = filterValue.split('-');
                    targetTahun = parseInt(tahun);
                    targetBulan = parseInt(bulan);
                } else if (periode === 'minggu') {
                    const [tahunStr, mingguStr] = filterValue.split('-W');
                    const year = parseInt(tahunStr);
                    const week = parseInt(mingguStr);

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

            if (!response.ok) {
                throw new Error("Gagal mengambil data dari server");
            }

            if (response.ok && result.success) {
                const data = result.data || [];
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

                const totalPengeluaran = formattedData.reduce((sum, curr) => sum + (curr.gaji_bersih || 0), 0);
                const totalBonusSemua = formattedData.reduce((sum, curr) => sum + (curr.total_bonus || 0), 0);
                const totalPotonganSemua = formattedData.reduce((sum, curr) => sum + (curr.total_potongan || 0), 0);

                return {
                    formattedData,
                    summaryCards: {
                        estimasiPengeluaran: totalPengeluaran,
                        totalBonus: totalBonusSemua,
                        totalPotongan: totalPotonganSemua
                    }
                };
            }
        } catch (error) {
            console.error("Error fetchRekapGaji:", error);
            setNotif({ show: true, message: "Terjadi kesalahan koneksi.", type: "error" });
            throw error;
        }
    };

    const {
        data,
        isLoading: isLoadingRekap,
        isError: isErrorRekap,
        refetch
    } = useQuery({
        queryKey: ['rekapGaji', periode, filterValue],
        queryFn: fetchRekapGaji,
        enabled: !!token
    });

    const rekapGajiData = data?.formattedData || [];
    const summaryCards = data?.summaryCards || {
        estimasiPengeluaran: 0,
        totalBonus: 0,
        totalPotongan: 0
    };

    const generateGajiMutation = useMutation({
        mutationFn: async (payload: any) => {
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/gaji/generate-massal`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || "Gagal memproses gaji.");
            return result;
        },
        onSuccess: (result) => {
            setNotif({ show: true, message: `Sukses! ${result.message}`, type: "success" });
            queryClient.invalidateQueries({ queryKey: ['rekapGaji'] });
        },
        onError: (error: any) => {
            setNotif({ show: true, message: error.message || "Terjadi kesalahan koneksi saat menghitung gaji.", type: "error" });
        }
    });

    const handleGenerateGaji = () => {
        if (!filterValue) {
            setNotif({ show: true, message: "Harap pilih periode di kalender terlebih dahulu sebelum men-generate gaji.", type: "error" });
            return;
        }

        // 1. Validasi tipe periode di awal untuk mencegah inisialisasi variabel sia-sia
        if (periode !== 'bulan' && periode !== 'minggu') {
            setNotif({ show: true, message: "Sistem Generate Gaji hanya mendukung periode Mingguan dan Bulanan.", type: "error" });
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

        generateGajiMutation.mutate({
            tanggal_mulai: tanggalMulai,
            tanggal_selesai: tanggalSelesai,
            periode_bulan: targetBulan,
            periode_tahun: targetTahun
        });
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
            setNotif({ show: true, message: "Harap pilih tanggal/waktu terlebih dahulu!", type: "error" });
            return;
        }
        refetch();
    };

    const handlePeriodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setPeriode(val);
        if (val === "minggu") setFilterValue(getCurrentWeek());
        else if (val === "bulan") setFilterValue(getCurrentMonth());
        else if (val === "tahun") setFilterValue(getCurrentYear());
        else setFilterValue("");
    };

    const closeNotif = () => setNotif(prev => ({ ...prev, show: false }));

    return {
        periode,
        filterValue,
        setFilterValue,
        rekapGajiData,
        isLoadingRekap,
        isGenerating: generateGajiMutation.isPending,
        summaryCards,
        notif,
        isErrorRekap,
        handleGenerateGaji,
        handleCetakSemuaSlip,
        handleFilter,
        handlePeriodeChange,
        closeNotif
    };
}

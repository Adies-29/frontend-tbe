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
                const formattedData = data.map((item: any) => {
                    // Kalkulasi pendukung
                    const totalPotonganKasbon = item.rincian_potongan?.potongan_kasbon || 0;
                    const totalKotor = (item.gaji_dasar || 0) + (item.total_bonus || 0);

                    return {
                        id: String(item.id),
                        nama: item.pegawai?.nama || "Tanpa Nama",
                        jabatan: item.pegawai?.jabatan?.nama_jabatan || "-",
                        shift: "-", // Bisa diambil dari relasi jika ada
                        departemen: "-", // Bisa diambil dari relasi jika ada
                        tipe_penggajian: item.pegawai?.jabatan?.tipe_penggajian || 'Bulanan',
                        periode_tanggal: filterValue, // Cth: "2026-W24"

                        detail_harian: item.detail_harian || [], // <--- Tarik array harian dari DB

                        gaji_dasar: item.gaji_dasar || 0,
                        total_bonus: item.total_bonus || 0,
                        total_potongan: item.total_potongan || 0,
                        gaji_bersih: item.total_gaji || 0,
                        status: item.status_pembayaran || "Pending",

                        // Informasi Keuangan Khusus Template Kas Muda Mudi
                        total_kotor: totalKotor,
                        potongan_bon: totalPotonganKasbon,
                        total_upah: item.total_gaji || 0,

                        // Informasi Hutang & Tabungan Samping Kiri (Sesuai foto)
                        hutang_awal: 0, // Bisa disesuaikan jika ingin narik saldo awal
                        sisa_hutang: 0, // Opsional jika ingin ditarik dari DB kasbon
                        bon_kerupuk_info: 0,
                    };
                });

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

    // ==========================================================
    // FITUR BARU: MUTASI PELUNASAN GAJI
    // ==========================================================
    const pelunasanGajiMutation = useMutation({
        mutationFn: async (id_gaji: string) => {
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/gaji/${id_gaji}/lunas`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || "Gagal memproses pelunasan.");
            return result;
        },
        onSuccess: (result) => {
            setNotif({ show: true, message: `Sukses! ${result.message}`, type: "success" });
            queryClient.invalidateQueries({ queryKey: ['rekapGaji'] }); // Refresh tabel otomatis
        },
        onError: (error: any) => {
            setNotif({ show: true, message: error.message || "Terjadi kesalahan saat pelunasan gaji.", type: "error" });
        }
    });

    const handlePelunasanGaji = (id_gaji: string) => {
        const confirmLunas = window.confirm("Apakah Anda yakin ingin menandai gaji ini sebagai Lunas? (Tindakan ini akan mengunci slip gaji dan memotong saldo kasbon karyawan secara permanen jika ada).");
        if (!confirmLunas) return;

        pelunasanGajiMutation.mutate(id_gaji);
    };

    const handleGenerateGaji = () => {
        if (!filterValue) {
            setNotif({ show: true, message: "Harap pilih periode di kalender terlebih dahulu sebelum men-generate gaji.", type: "error" });
            return;
        }

        if (periode !== 'bulan' && periode !== 'minggu') {
            setNotif({ show: true, message: "Sistem Generate Gaji hanya mendukung periode Mingguan dan Bulanan.", type: "error" });
            return;
        }

        let tanggalMulai = "";
        let tanggalSelesai = "";
        let targetBulan = 1;
        let targetTahun = 2026;
        let labelPeriode = "";

        if (periode === 'bulan') {
            const [tahun, bulan] = filterValue.split('-');
            targetTahun = parseInt(tahun);
            targetBulan = parseInt(bulan);

            const bulanPad = String(targetBulan).padStart(2, '0');
            tanggalMulai = `${tahun}-${bulanPad}-01`;
            const totalHari = new Date(targetTahun, targetBulan, 0).getDate();
            tanggalSelesai = `${tahun}-${bulanPad}-${String(totalHari).padStart(2, '0')}`;

            labelPeriode = `Bulan ${bulanPad} Tahun ${tahun}`;

        } else if (periode === 'minggu') {
            const [tahunStr, mingguStr] = filterValue.split('-W');
            const year = parseInt(tahunStr);
            const week = parseInt(mingguStr);

            const jan4 = new Date(year, 0, 4);
            const dayOfJan4 = jan4.getDay() || 7;
            const week1Start = new Date(year, 0, 4 - dayOfJan4 + 1);

            const startDate = new Date(week1Start.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
            const endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);

            // FORMAT TANGGAL MANUAL KE YYYY-MM-DD UNTUK MENCEGAH ERROR POSTGRES
            const startYear = startDate.getFullYear();
            const startMonth = String(startDate.getMonth() + 1).padStart(2, '0');
            const startDay = String(startDate.getDate()).padStart(2, '0');

            const endYear = endDate.getFullYear();
            const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
            const endDay = String(endDate.getDate()).padStart(2, '0');

            tanggalMulai = `${startYear}-${startMonth}-${startDay}`;
            tanggalSelesai = `${endYear}-${endMonth}-${endDay}`;

            targetBulan = startDate.getMonth() + 1;
            targetTahun = startDate.getFullYear();

            labelPeriode = `Mingguan (${tanggalMulai} s/d ${tanggalSelesai})`;
        }

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
        isPelunasanPending: pelunasanGajiMutation.isPending, // Expose status loading pelunasan
        summaryCards,
        notif,
        isErrorRekap,
        handleGenerateGaji,
        handlePelunasanGaji, // Expose fungsi pelunasan
        handleCetakSemuaSlip,
        handleFilter,
        handlePeriodeChange,
        closeNotif
    };
}
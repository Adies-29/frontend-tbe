import { useState } from 'react';
import { apiFetchJson } from '../../../utils/apiFetch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotif } from '../../../hooks/useNotif';
import { getCurrentWeek, getCurrentMonth, getCurrentYear, parseWeekValue, formatPeriodeGaji } from '../../../utils/dateHelpers';

export function useRekapGaji() {
    const queryClient = useQueryClient();
    const [periode, setPeriode] = useState("minggu");
    const [filterValue, setFilterValue] = useState(getCurrentWeek());
    const { notif, showNotif, closeNotif } = useNotif();

    // =========================================================================
    // GET / FETCH DATA REKAP GAJI
    // =========================================================================
    const fetchRekapGaji = async () => {
        try {
            let targetBulan = 0;
            let targetTahun = new Date().getFullYear();
            let tanggalMulai = "";
            let tanggalSelesai = "";

            // 1. Ekstrak nilai filter
            if (filterValue) {
                if (periode === 'bulan') {
                    const [tahun, bulan] = filterValue.split('-');
                    targetTahun = parseInt(tahun, 10);
                    targetBulan = parseInt(bulan, 10);
                } else if (periode === 'minggu') {
                    const parsed = parseWeekValue(filterValue);
                    if (parsed) {
                        tanggalMulai = parsed.tanggalMulai;
                        tanggalSelesai = parsed.tanggalSelesai;
                        targetBulan = parsed.targetBulan;
                        targetTahun = parsed.targetTahun;
                    }
                } else if (periode === 'tahun') {
                    targetTahun = parseInt(filterValue, 10);
                }
            }

            // 2. Fetch API
            let url = `/api/v1/gaji?tahun=${targetTahun}`;
            if (periode === 'minggu' && tanggalMulai && tanggalSelesai) {
                url += `&tanggal_mulai=${tanggalMulai}&tanggal_selesai=${tanggalSelesai}`;
            } else if (targetBulan > 0) {
                url += `&bulan=${targetBulan}`;
            }

            const result = await apiFetchJson(url);

            let data = result.data || [];

                // Filter tambahan di client-side untuk rentang minggu spesifik
                if (periode === 'minggu' && tanggalMulai && tanggalSelesai) {
                    data = data.filter((item: any) => {
                        if (item.tanggal_awal_periode && item.tanggal_akhir_periode) {
                            return item.tanggal_awal_periode >= tanggalMulai && item.tanggal_akhir_periode <= tanggalSelesai;
                        }
                        return true;
                    });
                }

                // 3. MAPPING KE FORMAT SLIP GAJI LENGKAP & TABEL REKAP
                const formattedData = data.map((item: any) => {
                    const rincianBonus = item.rincian_bonus || {};
                    const rincianPotongan = item.rincian_potongan || {};
                    const infoTabungan = item.informasi_tabungan || {};

                    const totalPotonganKasbon = rincianPotongan.potongan_kasbon || 0;
                    const dendaSistem = (rincianPotongan.denda_sistem_absensi || 0) + (rincianPotongan.denda_alpha_void || 0);

                    // Ekstrak sisa hutang terkini dari array detail_kasbon (ambil yang pertama jika ada)
                    const sisaHutang = rincianPotongan.detail_kasbon?.[0]?.sisa_pinjaman_terkini || 0;

                    return {
                        id: String(item.id),
                        nama: item.pegawai?.nama || "Tanpa Nama",
                        jabatan: item.pegawai?.jabatan?.nama_jabatan || "-",
                        departemen: item.pegawai?.jabatan?.departemen?.nama_departemen || "-",
                        shift: "-", 
                        tipe_penggajian: item.pegawai?.jabatan?.tipe_penggajian || 'Bulanan',
                        periode_tanggal: formatPeriodeGaji(item.tanggal_awal_periode, item.tanggal_akhir_periode, filterValue),

                        detail_harian: item.detail_harian || [],

                        gaji_dasar: item.gaji_dasar || 0,
                        total_bonus: item.total_bonus || 0,
                        total_potongan: item.total_potongan || 0,
                        gaji_bersih: item.total_gaji || 0,
                        status: item.status_pembayaran || "Pending",

                        // JSON Data Lengkap
                        rincian_bonus: rincianBonus,
                        rincian_potongan: rincianPotongan,
                        informasi_tabungan: infoTabungan,

                        // Kalkulasi Bawah
                        total_kotor: (item.gaji_dasar || 0) + (item.total_bonus || 0),
                        potongan_bon: totalPotonganKasbon,
                        denda_sistem: dendaSistem,
                        total_upah: item.total_gaji || 0,
                        sisa_hutang: sisaHutang,
                    };
                });

                // Kalkulasi Summary Atas
                const totalPengeluaran = formattedData.reduce((sum: number, curr: any) => sum + (curr.gaji_bersih || 0), 0);
                const totalBonusSemua = formattedData.reduce((sum: number, curr: any) => sum + (curr.total_bonus || 0), 0);
                const totalPotonganSemua = formattedData.reduce((sum: number, curr: any) => sum + (curr.total_potongan || 0), 0);

                return {
                    formattedData,
                    summaryCards: {
                        estimasiPengeluaran: totalPengeluaran,
                        totalBonus: totalBonusSemua,
                        totalPotongan: totalPotonganSemua
                    }
                };
        } catch (error) {
            console.error("Error fetchRekapGaji:", error);
            showNotif("Terjadi kesalahan koneksi.", "error");
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
        queryFn: fetchRekapGaji
    });

    const rekapGajiData = data?.formattedData || [];
    const summaryCards = data?.summaryCards || {
        estimasiPengeluaran: 0,
        totalBonus: 0,
        totalPotongan: 0
    };

    // =========================================================================
    // MUTASI GENERATE MASSAL
    // =========================================================================
    const generateGajiMutation = useMutation({
        mutationFn: async (payload: any) => {
            const result = await apiFetchJson('/api/v1/gaji/generate-massal', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });
            return result;
        },
        onSuccess: (result) => {
            showNotif(`Sukses ${result.message}`, "success")
            queryClient.invalidateQueries({ queryKey: ['rekapGaji'] });

        },
        onError: (error: any) => {
            showNotif(error.message || "Terjadi kesalahan koneksi saat menghitung gaji.", "error");
        }
    });

    // ==========================================================
    // MUTASI PELUNASAN GAJI
    // ==========================================================
    const pelunasanGajiMutation = useMutation({
        mutationFn: async (id_gaji: string) => {
            const result = await apiFetchJson(`/api/v1/gaji/${id_gaji}/lunas`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            return result;
        },
        onSuccess: (result) => {
            showNotif(`Sukses ${result.message}`, "success")
            queryClient.invalidateQueries({ queryKey: ['rekapGaji'] }); // Refresh tabel otomatis
        },
        onError: (error: any) => {
            showNotif(error.message || "Terjadi kesalahan saat pelunasan gaji.", "error");
        }
    });

    const [showConfirmGenerate, setShowConfirmGenerate] = useState(false);
    const [generateParams, setGenerateParams] = useState<any>(null);
    const [labelPeriode, setLabelPeriode] = useState("");

    const [showConfirmLunas, setShowConfirmLunas] = useState(false);
    const [lunasGajiId, setLunasGajiId] = useState("");

    const handlePelunasanGaji = (id_gaji: string) => {
        setLunasGajiId(id_gaji);
        setShowConfirmLunas(true);
    };

    const confirmPelunasanGaji = () => {
        if (lunasGajiId) {
            pelunasanGajiMutation.mutate(lunasGajiId);
        }
        setShowConfirmLunas(false);
    };

    // ==========================================================
    // HANDLE GENERATE LOGIC
    // ==========================================================
    const handleGenerateGaji = () => {
        if (!filterValue) {
            showNotif("Harap pilih periode di kalender terlebih dahulu sebelum men-generate gaji.", "error");
            return;
        }

        if (periode !== 'bulan' && periode !== 'minggu') {
            showNotif("Sistem Generate Gaji hanya mendukung periode Mingguan dan Bulanan.", "error");
            return;
        }

        let tanggalMulai = "";
        let tanggalSelesai = "";
        let targetBulan = 1;
        let targetTahun = 2026;
        let label = "";

        if (periode === 'bulan') {
            const [tahun, bulan] = filterValue.split('-');
            targetTahun = parseInt(tahun);
            targetBulan = parseInt(bulan);

            const bulanPad = String(targetBulan).padStart(2, '0');
            tanggalMulai = `${tahun}-${bulanPad}-01`;
            const totalHari = new Date(targetTahun, targetBulan, 0).getDate();
            tanggalSelesai = `${tahun}-${bulanPad}-${String(totalHari).padStart(2, '0')}`;

            label = `Bulan ${bulanPad} Tahun ${tahun}`;

        } else if (periode === 'minggu') {
            const parsed = parseWeekValue(filterValue);
            if (!parsed) {
                showNotif("Format minggu tidak valid.", "error");
                return;
            }

            tanggalMulai = parsed.tanggalMulai;
            tanggalSelesai = parsed.tanggalSelesai;
            targetBulan = parsed.targetBulan;
            targetTahun = parsed.targetTahun;

            label = `Mingguan (${tanggalMulai} s/d ${tanggalSelesai})`;
        }

        setGenerateParams({
            tanggal_mulai: tanggalMulai,
            tanggal_selesai: tanggalSelesai,
            periode_bulan: targetBulan,
            periode_tahun: targetTahun
        });
        setLabelPeriode(label);
        setShowConfirmGenerate(true);
    };

    const confirmGenerateGaji = () => {
        if (generateParams) {
            generateGajiMutation.mutate(generateParams);
        }
        setShowConfirmGenerate(false);
    };

    const [isModalPreviewOpen, setIsModalPreviewOpen] = useState(false);

    const handleCetakSemuaSlip = () => {
        const dataLunas = rekapGajiData.filter(
            (item: any) => item.status === 'Lunas' || item.status?.toLowerCase() === 'lunas'
        );
        if (dataLunas.length === 0) {
            showNotif("Tidak ada data gaji berstatus Lunas yang dapat dicetak!", "error");
            return;
        }
        setIsModalPreviewOpen(true);
    };

    const handleFilter = () => {
        if (!filterValue && periode !== "minggu") {
            showNotif("Harap pilih tanggal/waktu terlebih dahulu!", "error");
            return;
        }
        refetch();
    };

    const handlePeriodeChange = (e: React.ChangeEvent<HTMLSelectElement> | string) => {
        const val = typeof e === 'string' ? e : e.target.value;
        setPeriode(val);
        if (val === "minggu") setFilterValue(getCurrentWeek());
        else if (val === "bulan") setFilterValue(getCurrentMonth());
        else if (val === "tahun") setFilterValue(getCurrentYear());
        else setFilterValue("");
    };


    return {
        periode,
        filterValue,
        setFilterValue,
        rekapGajiData,
        isLoadingRekap,
        isGenerating: generateGajiMutation.isPending,
        isPelunasanPending: pelunasanGajiMutation.isPending,
        isModalPreviewOpen,
        setIsModalPreviewOpen,
        summaryCards,
        notif,
        closeNotif,
        isErrorRekap,
        handleGenerateGaji,
        handlePelunasanGaji,
        handleCetakSemuaSlip,
        handleFilter,
        handlePeriodeChange,

        // PopUp Confirm States & Functions
        showConfirmGenerate,
        setShowConfirmGenerate,
        labelPeriode,
        confirmGenerateGaji,
        showConfirmLunas,
        setShowConfirmLunas,
        confirmPelunasanGaji
    };
}
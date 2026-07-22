import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetchJson } from '../../../utils/apiFetch';
import { useNotif } from '../../../hooks/useNotif';
import { getCurrentWeek, getCurrentMonth, getCurrentYear, parseWeekValue } from '../../../utils/dateHelpers';

// Interfaces
export interface ShiftDetail {
    id_jadwal: number;
    kode: string;
    warna: string;
    shift_id: number;
}

export interface PegawaiMatrix {
    id: number;
    nama: string;
    jabatan: string;
    departemen: string;
    jadwal: { [tanggal: string]: ShiftDetail };
}

export interface SelectedCell {
    pegawaiId: number;
    pegawaiNama: string;
    pegawaiJabatan?: string;
    tanggal: string;
    idJadwal?: number;
    shiftId?: number;
    shiftKode?: string;
    warna?: string;
}

export function useMatrixJadwal() {
    const now = new Date();
    const defaultWeekStr = getCurrentWeek();
    const initialParsedWeek = parseWeekValue(defaultWeekStr);

    const [filterStartDate, setFilterStartDate] = useState(initialParsedWeek?.startDate || "");
    const [filterEndDate, setFilterEndDate] = useState(initialParsedWeek?.endDate || "");

    const [periode, setPeriode] = useState("minggu");
    const [filterValue, setFilterValue] = useState(defaultWeekStr);

    const calculateDateRange = (p: string, val: string) => {
        if (!val) return null;
        if (p === "minggu") {
            const parsed = parseWeekValue(val);
            if (parsed) return { start: parsed.startDate, end: parsed.endDate };
        } else if (p === "bulan") {
            const [tahunStr, bulanStr] = val.split('-');
            const year = parseInt(tahunStr, 10);
            const month = parseInt(bulanStr, 10);
            if (!isNaN(year) && !isNaN(month)) {
                const monthPad = String(month).padStart(2, '0');
                const totalDays = new Date(Date.UTC(year, month, 0)).getUTCDate();
                const daysPad = String(totalDays).padStart(2, '0');
                return { start: `${year}-${monthPad}-01`, end: `${year}-${monthPad}-${daysPad}` };
            }
        } else if (p === "tahun") {
            const year = parseInt(val, 10);
            if (!isNaN(year)) {
                return { start: `${year}-01-01`, end: `${year}-12-31` };
            }
        }
        return null;
    };

    const handleFilter = () => {
        const range = calculateDateRange(periode, filterValue);
        if (range) {
            setFilterStartDate(range.start);
            setFilterEndDate(range.end);
        }
    };

    const handleFilterValueChange = (val: string) => {
        setFilterValue(val);
        const range = calculateDateRange(periode, val);
        if (range) {
            setFilterStartDate(range.start);
            setFilterEndDate(range.end);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handlePeriodeChange = (e: any) => {
        const val = typeof e === 'string' ? e : e?.target?.value || e;
        setPeriode(val);

        let defaultVal = "";
        if (val === "minggu") defaultVal = getCurrentWeek();
        else if (val === "bulan") defaultVal = getCurrentMonth();
        else if (val === "tahun") defaultVal = getCurrentYear();

        setFilterValue(defaultVal);
        const range = calculateDateRange(val, defaultVal);
        if (range) {
            setFilterStartDate(range.start);
            setFilterEndDate(range.end);
        }
    };

    const [searchQuery, setSearchQuery] = useState("");
    const [filterDepartemen, setFilterDepartemen] = useState("Bag. Produksi");
    const [filterJabatan, setFilterJabatan] = useState("");


    // Reset filter jabatan ketika departemen berubah
    useEffect(() => {
        setFilterJabatan("");
    }, [filterDepartemen]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformToMatrix = (backendData: any[], allPegawai: any[] = []): PegawaiMatrix[] => {
        const matrixMap: { [key: number]: PegawaiMatrix } = {};

        // Inisialisasi seluruh pegawai master agar tetap tampil di tabel matrix
        allPegawai.forEach(peg => {
            matrixMap[peg.id] = {
                id: peg.id,
                nama: peg.nama || "Tanpa Nama",
                jabatan: peg.jabatan?.nama_jabatan || "-",
                departemen: peg.jabatan?.departemen?.nama_departemen || "-",
                jadwal: {}
            };
        });

        backendData.forEach(item => {
            const pegId = item.pegawai_id;
            if (!matrixMap[pegId]) {
                matrixMap[pegId] = {
                    id: pegId,
                    nama: item.pegawai?.nama || "Tanpa Nama",
                    jabatan: item.pegawai?.jabatan?.nama_jabatan || "-",
                    departemen: item.pegawai?.jabatan?.departemen?.nama_departemen || "-",
                    jadwal: {}
                };
            }

            let warnaBorders = "bg-rose-100 text-rose-700 border-rose-200";
            const kode = item.shifts?.kode_shift || "OFF";
            const jamMasukStr = item.shifts?.jam_masuk;

            if (jamMasukStr) {
                const jam = parseInt(jamMasukStr.substring(0, 2));
                if (jam >= 5 && jam <= 10) {
                    warnaBorders = "bg-gradient-to-br from-amber-100 via-orange-100 to-rose-100 text-orange-800 border-orange-300";
                } else if (jam >= 11 && jam <= 14) {
                    warnaBorders = "bg-sky-100 text-sky-800 border-sky-300";
                } else if (jam >= 15 && jam <= 18) {
                    warnaBorders = "bg-emerald-100 text-emerald-800 border-emerald-300";
                } else {
                    warnaBorders = "bg-indigo-900 text-indigo-100 border-indigo-700 shadow-inner";
                }
            }

            // Sanitasi format YYYY-MM-DD (potong T00:00:00 jika ada)
            const tglKey = item.tanggal ? String(item.tanggal).split('T')[0] : "";

            matrixMap[pegId].jadwal[tglKey] = {
                id_jadwal: item.id,
                kode: kode,
                warna: warnaBorders,
                shift_id: item.shift_id
            };
        });

        return Object.values(matrixMap);
    };

    const queryClient = useQueryClient();

    const { data: listMasterShifts = [] } = useQuery({
        queryKey: ['shifts'],
        queryFn: async () => {
            const res = await apiFetchJson('/api/v1/shifts');
            return res.data || [];
        }
    });

    const { data: listPegawai = [] } = useQuery({
        queryKey: ['pegawai'],
        queryFn: async () => {
            const res = await apiFetchJson('/api/v1/pegawai');
            return res.data || [];
        }
    });

    const { data: matrixKaryawan = [], isLoading, error: jadwalError } = useQuery({
        queryKey: ['jadwalBulanan', filterStartDate, filterEndDate, listPegawai.length],
        queryFn: async () => {
            const res = await apiFetchJson(`/api/v1/jadwal?start_date=${filterStartDate}&end_date=${filterEndDate}`);
            return transformToMatrix(res.data || [], listPegawai);
        },
        enabled: !!filterStartDate && !!filterEndDate
    });

    const errorMsg = jadwalError?.message || "";

    const filteredMatrixKaryawan = useMemo(() => {
        return matrixKaryawan.filter(pegawai => {
            const pegMatch = listPegawai.find((p: any) => p.id === pegawai.id);
            const actualDepartemen = pegMatch?.jabatan?.departemen?.nama_departemen || pegawai.departemen;

            const matchSearch = pegawai.nama.toLowerCase().includes(searchQuery.toLowerCase());
            const matchDepartemen = filterDepartemen === "" || actualDepartemen === filterDepartemen;
            const matchJabatan = filterJabatan === "" || pegawai.jabatan === filterJabatan;
            return matchSearch && matchDepartemen && matchJabatan;
        });
    }, [matrixKaryawan, listPegawai, searchQuery, filterDepartemen, filterJabatan]);

    const uniqueJabatanList = useMemo(() => {
        return Array.from(new Set(
            matrixKaryawan
                .filter(p => {
                    const pegMatch = listPegawai.find((listP: any) => listP.id === p.id);
                    const actualDepartemen = pegMatch?.jabatan?.departemen?.nama_departemen || p.departemen;
                    return filterDepartemen === "" || actualDepartemen === filterDepartemen;
                })
                .map(p => p.jabatan)
                .filter(j => j !== "-")
        ));
    }, [matrixKaryawan, listPegawai, filterDepartemen]);

    const uniqueDepartemenList = useMemo(() => {
        return Array.from(
            new Set(
                matrixKaryawan.map(p => {
                    const pegMatch = listPegawai.find((listP: any) => listP.id === p.id);
                    return pegMatch?.jabatan?.departemen?.nama_departemen || p.departemen;
                }).filter(d => d && d !== "-")
            )
        );
    }, [matrixKaryawan, listPegawai]);

    // Modal Kelola Shift State
    const [selectedCell, setSelectedCell] = useState<SelectedCell>({ pegawaiId: 0, pegawaiNama: "", tanggal: "" });
    const [cellTujuan, setCellTujuan] = useState<SelectedCell | null>(null);
    const [pickerActive, setPickerActive] = useState<'none' | 'asal' | 'tujuan'>('none');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modeAksi, setModeAksi] = useState<'ubah' | 'tukar'>('ubah');
    const [inputShiftId, setInputShiftId] = useState("");

    // (Removed useEffect to fix picker bug)

    // Modal Generate Massal State
    const [isModalMassalOpen, setIsModalMassalOpen] = useState(false);
    const [massalTanggalMulai, setMassalTanggalMulai] = useState("");
    const [massalTanggalSelesai, setMassalTanggalSelesai] = useState("");
    const [massalShiftId, setMassalShiftId] = useState("");

    // Notification State
   const { notif, showNotif, closeNotif } = useNotif();

    // Cascading Filter State
    const [filterLevel1, setFilterLevel1] = useState<'all_karyawan' | 'filter_departemen'>('all_karyawan');
    const [filterLevel2, setFilterLevel2] = useState('');
    const [filterLevel3, setFilterLevel3] = useState('');
    const [selectedPegawaiIds, setSelectedPegawaiIds] = useState<number[]>([]);



    const handleCellClick = (pegawaiId: number, pegawaiNama: string, tglFormat: string, shiftDetail?: ShiftDetail, pegawaiJabatan?: string) => {
        if (pickerActive === 'tujuan') {
            setCellTujuan({
                pegawaiId, pegawaiNama, pegawaiJabatan, tanggal: tglFormat,
                shiftKode: shiftDetail?.kode, warna: shiftDetail?.warna
            });
            setPickerActive('none');
            setIsModalOpen(true);
            return;
        }

        if (pickerActive === 'asal') {
            setSelectedCell({
                pegawaiId, pegawaiNama, pegawaiJabatan, tanggal: tglFormat,
                idJadwal: shiftDetail?.id_jadwal, shiftId: shiftDetail?.shift_id,
                shiftKode: shiftDetail?.kode, warna: shiftDetail?.warna
            });
            setPickerActive('none');
            setIsModalOpen(true);
            return;
        }

        setSelectedCell({
            pegawaiId, pegawaiNama, pegawaiJabatan, tanggal: tglFormat,
            idJadwal: shiftDetail?.id_jadwal, shiftId: shiftDetail?.shift_id,
            shiftKode: shiftDetail?.kode, warna: shiftDetail?.warna
        });

        setInputShiftId(shiftDetail?.shift_id ? String(shiftDetail.shift_id) : "");
        setCellTujuan(null);
        setModeAksi('ubah');
        setIsModalOpen(true);
    };

    const simpanHarianMutation = useMutation({
        mutationFn: async () => {
            const result = await apiFetchJson('/api/v1/jadwal/harian', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pegawai_id: selectedCell.pegawaiId,
                    tanggal: selectedCell.tanggal,
                    shift_id: inputShiftId === "off" || inputShiftId === "" ? null : parseInt(inputShiftId)
                })
            });
            return result;
        },
        onSuccess: () => {
            showNotif("Sukses memperbarui jadwal harian pegawai!", "success");
            setIsModalOpen(false);
            setCellTujuan(null);
            setSelectedCell({ pegawaiId: 0, pegawaiNama: "", tanggal: "" });
            queryClient.invalidateQueries({ queryKey: ['jadwalBulanan'] });
        },
        onError: (err: any) => {
            showNotif(err.message || "Terjadi kesalahan sistem.", "error");
        }
    });

    const handleSimpanShiftHarian = () => simpanHarianMutation.mutate();

    const tukarShiftMutation = useMutation({
        mutationFn: async () => {
            const result = await apiFetchJson('/api/v1/jadwal/tukar-shift', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pegawai_id_asal: selectedCell.pegawaiId,
                    tanggal_asal: selectedCell.tanggal,
                    pegawai_id_tujuan: cellTujuan?.pegawaiId,
                    tanggal_tujuan: cellTujuan?.tanggal
                })
            });
            return result;
        },
        onSuccess: () => {
            showNotif("Pertukaran shift lintas hari berhasil diproses!", "success");
            setIsModalOpen(false);
            setCellTujuan(null);
            setSelectedCell({ pegawaiId: 0, pegawaiNama: "", tanggal: "" });
            queryClient.invalidateQueries({ queryKey: ['jadwalBulanan'] });
        },
        onError: (err: any) => {
            showNotif(err.message || "Terjadi kesalahan sistem saat menukar.", "error");
        }
    });

    const handleProsesTukarShift = () => {
        if (!cellTujuan) return showNotif("Harap pilih jadwal tujuan terlebih dahulu.", "error");
        tukarShiftMutation.mutate();
    };

    const generateMassalMutation = useMutation({
        mutationFn: async () => {
            const result = await apiFetchJson('/api/v1/jadwal/generate-massal', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    list_pegawai_ids: selectedPegawaiIds,
                    tanggal_mulai: massalTanggalMulai,
                    tanggal_selesai: massalTanggalSelesai,
                    shift_id: massalShiftId
                })
            });
            return result;
        },
        onSuccess: (result) => {
            showNotif(`Sukses! ${result.message || ''}`, "success");
            setIsModalMassalOpen(false);
            setMassalTanggalMulai("");
            setMassalTanggalSelesai("");
            setMassalShiftId("");
            setSelectedPegawaiIds([]);
            queryClient.invalidateQueries({ queryKey: ['jadwalBulanan'] });
        },
        onError: (err: any) => {
            showNotif(err.message || "Terjadi kesalahan sistem saat memproses generate massal.", "error");
        }
    });

    const handleProsesGenerateMassal = () => {
        if (!massalTanggalMulai || !massalTanggalSelesai) return showNotif("Harap lengkapi tanggal mulai, tanggal selesai, dan pilihan shift.", "error");
        if (new Date(massalTanggalMulai) > new Date(massalTanggalSelesai)) return showNotif("Tanggal mulai tidak boleh lebih besar dari tanggal selesai!", "error");
        if (selectedPegawaiIds.length === 0) return showNotif("Harap pilih minimal satu pegawai dari daftar target!", "error");
        generateMassalMutation.mutate();
    };

    const isSaving = simpanHarianMutation.isPending || tukarShiftMutation.isPending || generateMassalMutation.isPending;

    return {
        // State Tanggal & Filter
        today: now, filterStartDate, setFilterStartDate, filterEndDate, setFilterEndDate,
        periode, setPeriode, filterValue, setFilterValue, handleFilter, handlePeriodeChange, handleFilterValueChange,
        // State Data
        matrixKaryawan, filteredMatrixKaryawan, searchQuery, setSearchQuery, isLoading, errorMsg, listPegawai, listMasterShifts,
        filterJabatan, setFilterJabatan, filterDepartemen, setFilterDepartemen, uniqueJabatanList, uniqueDepartemenList,
        // State Modal Kelola Shift
        selectedCell, setSelectedCell, cellTujuan, setCellTujuan,
        pickerActive, setPickerActive, isModalOpen, setIsModalOpen,
        modeAksi, setModeAksi, inputShiftId, setInputShiftId,
        // State Modal Massal
        isModalMassalOpen, setIsModalMassalOpen,
        massalTanggalMulai, setMassalTanggalMulai, massalTanggalSelesai, setMassalTanggalSelesai,
        massalShiftId, setMassalShiftId,
        // State Filter Massal
        filterLevel1, setFilterLevel1, filterLevel2, setFilterLevel2,
        filterLevel3, setFilterLevel3, selectedPegawaiIds, setSelectedPegawaiIds,
        // Notif State
        notif, closeNotif,
        // Handler & Flags
        isSaving,
        handleCellClick, handleSimpanShiftHarian, handleProsesTukarShift, handleProsesGenerateMassal
    };
}

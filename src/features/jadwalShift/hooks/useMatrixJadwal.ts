import { useState, useEffect,  useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/useAuthStore';
import { apiFetch } from '../../../utils/apiFetch';


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
    const token = useAuthStore((state) => state.token);

    const now = new Date();

    const getWeekNumber = (d: Date) => {
        const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        return { year: date.getUTCFullYear(), week: weekNo };
    };
    const weekData = getWeekNumber(now);
    const defaultWeekStr = `${weekData.year}-W${weekData.week.toString().padStart(2, '0')}`;

    const currentDay = now.getDay();
    const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    const monday = new Date(now);
    monday.setDate(diff);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const firstDay = monday.toLocaleDateString('en-CA');
    const lastDay = sunday.toLocaleDateString('en-CA');

    const [filterStartDate, setFilterStartDate] = useState(firstDay);
    const [filterEndDate, setFilterEndDate] = useState(lastDay);

    const [periode, setPeriode] = useState("minggu");
    const [filterValue, setFilterValue] = useState(defaultWeekStr);

    const handleFilter = () => {
        if (!filterValue) return;

        let start = "", end = "";
        const year = parseInt(filterValue.substring(0, 4));

        if (periode === "minggu") {
            const week = parseInt(filterValue.substring(6, 8));
            const firstDayOfYear = new Date(year, 0, 1);
            const daysToFirstMonday = (8 - firstDayOfYear.getDay()) % 7;
            const firstMonday = new Date(year, 0, 1 + daysToFirstMonday);
            const startDate = new Date(firstMonday.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
            const endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);

            start = startDate.toLocaleDateString('en-CA');
            end = endDate.toLocaleDateString('en-CA');
        } else if (periode === "bulan") {
            const month = parseInt(filterValue.substring(5, 7));
            start = new Date(year, month - 1, 1).toLocaleDateString('en-CA');
            end = new Date(year, month, 0).toLocaleDateString('en-CA');
        } else if (periode === "tahun") {
            start = new Date(year, 0, 1).toLocaleDateString('en-CA');
            end = new Date(year, 11, 31).toLocaleDateString('en-CA');
        }

        setFilterStartDate(start);
        setFilterEndDate(end);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handlePeriodeChange = (e: any) => {
        setPeriode(e.target.value);
        setFilterValue("");
    };

    const [searchQuery, setSearchQuery] = useState("");
    const [filterDepartemen, setFilterDepartemen] = useState("Bag. Produksi");
    const [filterJabatan, setFilterJabatan] = useState("");


    // Reset filter jabatan ketika departemen berubah
    useEffect(() => {
        setFilterJabatan("");
    }, [filterDepartemen]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformToMatrix = (backendData: any[]): PegawaiMatrix[] => {
        const matrixMap: { [key: number]: PegawaiMatrix } = {};

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

            matrixMap[pegId].jadwal[item.tanggal] = {
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
        queryKey: ['masterShiftList'],
        queryFn: async () => {
            const res = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/shifts`, { headers: { "Authorization": `Bearer ${token}` } });
            const json = await res.json();
            return json.success ? json.data : [];
        },
        enabled: !!token
    });

    const { data: listPegawai = [] } = useQuery({
        queryKey: ['masterPegawaiList'],
        queryFn: async () => {
            const res = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/pegawai`, { headers: { "Authorization": `Bearer ${token}` } });
            const json = await res.json();
            return json.success ? json.data : [];
        },
        enabled: !!token
    });

    const { data: matrixKaryawan = [], isLoading, error: jadwalError } = useQuery({
        queryKey: ['jadwalBulanan', filterStartDate, filterEndDate],
        queryFn: async () => {
            const res = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/jadwal?start_date=${filterStartDate}&end_date=${filterEndDate}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || "Gagal memuat jadwal.");
            return transformToMatrix(json.data);
        },
        enabled: !!token && !!filterStartDate && !!filterEndDate
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
    const [notifState, setNotifState] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({
        show: false,
        message: "",
        type: "success"
    });

    const showNotif = (message: string, type: 'success' | 'error' = 'success') => {
        setNotifState({ show: true, message, type });
    };

    const closeNotif = () => {
        setNotifState(prev => ({ ...prev, show: false }));
    };



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
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/jadwal/harian`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({
                    pegawai_id: selectedCell.pegawaiId,
                    tanggal: selectedCell.tanggal,
                    shift_id: inputShiftId === "off" || inputShiftId === "" ? null : parseInt(inputShiftId)
                })
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || "Gagal memperbarui shift.");
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
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/jadwal/tukar-shift`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({
                    pegawai_id_asal: selectedCell.pegawaiId,
                    tanggal_asal: selectedCell.tanggal,
                    pegawai_id_tujuan: cellTujuan?.pegawaiId,
                    tanggal_tujuan: cellTujuan?.tanggal
                })
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || "Gagal memproses tukar shift.");
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
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/jadwal/generate-massal`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({
                    list_pegawai_ids: selectedPegawaiIds,
                    tanggal_mulai: massalTanggalMulai,
                    tanggal_selesai: massalTanggalSelesai,
                    shift_id: massalShiftId
                })
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || "Gagal melakukan generate massal.");
            return result;
        },
        onSuccess: (result) => {
            showNotif(`Sukses! ${result.message}`, "success");
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
        periode, setPeriode, filterValue, setFilterValue, handleFilter, handlePeriodeChange,
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
        notifState, closeNotif,
        // Handler & Flags
        isSaving,
        handleCellClick, handleSimpanShiftHarian, handleProsesTukarShift, handleProsesGenerateMassal
    };
}

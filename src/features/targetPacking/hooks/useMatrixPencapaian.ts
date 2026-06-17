import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import type { PencapaianTargetData } from '../../../types';
import { apiFetch } from '../../../utils/apiFetch';


export interface TargetDetail {
    master_target_id: number;
    nama_target: string;
    harga_satuan: number;
    jumlah_pencapaian: number;
    nominal: number;
    pencapaian_id: number;
}

export interface PegawaiMatrix {
    id: number;
    nama: string;
    jabatan: string;
    departemen: string;
    pencapaian: { 
        [tanggal: string]: {
            totalPack: number;
            totalNominal: number;
            details: TargetDetail[];
        } 
    };
}

export interface SelectedCell {
    pegawaiId: number;
    pegawaiNama: string;
    pegawaiJabatan?: string;
    tanggal: string;
}

export function useMatrixPencapaian() {
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

    const handlePeriodeChange = (e: any) => {
        setPeriode(e.target.value);
        setFilterValue("");
    };

    const [matrixKaryawan, setMatrixKaryawan] = useState<PegawaiMatrix[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterDepartemen, setFilterDepartemen] = useState("");
    const [filterJabatan, setFilterJabatan] = useState("");

    useEffect(() => {
        setFilterJabatan("");
    }, [filterDepartemen]);

    const [listPegawai, setListPegawai] = useState<any[]>([]);
    const [listMasterTargets, setListMasterTargets] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const filteredMatrixKaryawan = useMemo(() => {
        return matrixKaryawan.filter(pegawai => {
            const matchSearch = pegawai.nama.toLowerCase().includes(searchQuery.toLowerCase());
            const matchDepartemen = filterDepartemen === "" || pegawai.departemen === filterDepartemen;
            const matchJabatan = filterJabatan === "" || pegawai.jabatan === filterJabatan;
            return matchSearch && matchDepartemen && matchJabatan;
        });
    }, [matrixKaryawan, searchQuery, filterDepartemen, filterJabatan]);

    const uniqueJabatanList = useMemo(() => {
        return Array.from(new Set(
            matrixKaryawan
                .filter(p => filterDepartemen === "" || p.departemen === filterDepartemen)
                .map(p => p.jabatan)
                .filter(j => j !== "-")
        ));
    }, [matrixKaryawan, filterDepartemen]);

    const uniqueDepartemenList = useMemo(() => {
        return Array.from(
            new Set(
                matrixKaryawan.map(p => p.departemen).filter(d => d && d !== "-")
            )
        );
    }, [matrixKaryawan]);

    // Modal State
    const [selectedCell, setSelectedCell] = useState<SelectedCell>({ pegawaiId: 0, pegawaiNama: "", tanggal: "" });
    const [isModalOpen, setIsModalOpen] = useState(false);
    
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

    // --- ACTUAL API FETCHES ---
    const loadPegawai = useCallback(async () => {
        try {
            const res = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/pegawai`, {
                method: 'GET',
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setListPegawai(data.data || []);
            }
        } catch (err) {
            console.error("Gagal memuat pegawai:", err);
        }
    }, [token]);

    const loadMasterTargets = useCallback(async () => {
        try {
            const res = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/target/master`, {
                method: 'GET',
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Hanya ambil master target yang masih aktif untuk modal input
                setListMasterTargets((data.data || []).filter((t: any) => t.is_active));
            }
        } catch (err) {
            console.error("Gagal memuat master target:", err);
        }
    }, [token]);

    const transformToMatrix = (pegawaiData: any[], pencapaianData: PencapaianTargetData[]): PegawaiMatrix[] => {
        const matrixMap: { [key: number]: PegawaiMatrix } = {};

        // Inisialisasi semua pegawai
        pegawaiData.forEach(p => {
            matrixMap[p.id] = {
                id: p.id,
                nama: p.nama,
                jabatan: p.jabatan?.nama_jabatan || "-",
                departemen: p.jabatan?.departemen?.nama_departemen || "-",
                pencapaian: {}
            };
        });

        // Masukkan data pencapaian
        pencapaianData.forEach((pencapaian: any) => {
            // Ambil pegawai_id: prioritas dari top-level, fallback dari nested object
            const pegId = pencapaian.pegawai_id ?? pencapaian.pegawai?.id;
            const masterTargetId = pencapaian.master_target_id ?? pencapaian.master_target?.id;

            if (pegId && matrixMap[pegId]) {
                if (!matrixMap[pegId].pencapaian[pencapaian.tanggal]) {
                    matrixMap[pegId].pencapaian[pencapaian.tanggal] = {
                        totalPack: 0,
                        totalNominal: 0,
                        details: []
                    };
                }

                const curr = matrixMap[pegId].pencapaian[pencapaian.tanggal];
                curr.totalPack += pencapaian.jumlah_pencapaian;
                curr.totalNominal += pencapaian.nominal_total_riil;
                
                curr.details.push({
                    master_target_id: masterTargetId,
                    nama_target: pencapaian.master_target?.nama_target || "Unknown",
                    harga_satuan: pencapaian.master_target?.harga_satuan || 0,
                    jumlah_pencapaian: pencapaian.jumlah_pencapaian,
                    nominal: pencapaian.nominal_total_riil,
                    pencapaian_id: pencapaian.id
                });
            }
        });

        return Object.values(matrixMap);
    };

    const loadPencapaianBulanan = useCallback(async () => {
        setIsLoading(true);
        setErrorMsg("");
        
        try {
            const res = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/target/pencapaian?tanggal_mulai=${filterStartDate}&tanggal_selesai=${filterEndDate}`, {
                method: 'GET',
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMatrixKaryawan(transformToMatrix(listPegawai, data.data || []));
            } else {
                throw new Error("Gagal memuat data pencapaian");
            }
        } catch (error: any) {
            setErrorMsg(error.message || "Gagal memuat matrix");
            setMatrixKaryawan(transformToMatrix(listPegawai, []));
        } finally {
            setIsLoading(false);
        }

    }, [filterStartDate, filterEndDate, listPegawai, token]);

    // Initial load
    useEffect(() => {
        loadPegawai();
        loadMasterTargets();
    }, [loadPegawai, loadMasterTargets]);

    // Load pencapaian when pegawai is ready or filter changes
    useEffect(() => {
        if (listPegawai.length > 0) {
            loadPencapaianBulanan();
        }
    }, [listPegawai, loadPencapaianBulanan]);

    const handleCellClick = (pegawaiId: number, pegawaiNama: string, tglFormat: string, pegawaiJabatan?: string) => {
        setSelectedCell({
            pegawaiId, pegawaiNama, pegawaiJabatan, tanggal: tglFormat
        });
        setIsModalOpen(true);
    };

    return {
        // State Tanggal & Filter
        today: now, filterStartDate, setFilterStartDate, filterEndDate, setFilterEndDate,
        periode, setPeriode, filterValue, setFilterValue, handleFilter, handlePeriodeChange,
        // State Data
        matrixKaryawan, filteredMatrixKaryawan, searchQuery, setSearchQuery, isLoading, errorMsg, 
        listPegawai, listMasterTargets,
        filterJabatan, setFilterJabatan, filterDepartemen, setFilterDepartemen, uniqueJabatanList, uniqueDepartemenList,
        // State Modal
        selectedCell, setSelectedCell,
        isModalOpen, setIsModalOpen,
        // Notif State
        notifState, closeNotif, showNotif,
        // Handlers
        isSaving, setIsSaving,
        handleCellClick, loadPencapaianBulanan
    };
}

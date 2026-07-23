import { useState, useMemo, startTransition } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import type { PencapaianTargetData } from '../../../types';
import { apiFetch } from '../../../utils/apiFetch';
import { useQuery } from '@tanstack/react-query';


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

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [searchQuery, setSearchQuery] = useState("");
    const [filterDepartemen, setFilterDepartemen] = useState("");
    const [filterJabatan, setFilterJabatan] = useState("");

    const [isSaving, setIsSaving] = useState(false);

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

    // --- ACTUAL API FETCHES WITH REACT QUERY ---
    const pegawaiQuery = useQuery({
        queryKey: ['pegawaiList'],
        queryFn: async () => {
            const res = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/pegawai`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error("Gagal memuat pegawai");
            return data.data || [];
        }
    });

    const masterTargetsQuery = useQuery({
        queryKey: ['masterTargetListAll'],
        queryFn: async () => {
            const res = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/target/master`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error("Gagal memuat master target");
            return (data.data || []).filter((t: any) => t.is_active);
        }
    });

    // Fetch daftar jabatan untuk mengetahui tipe_penggajian
    const jabatanQuery = useQuery({
        queryKey: ['jabatanListForTarget'],
        queryFn: async () => {
            const res = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/jabatan`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error("Gagal memuat daftar jabatan");
            return data.data || [];
        }
    });

    // Daftar nama jabatan yang bertipe "Target"
    const targetJabatanNames = useMemo(() => {
        if (!jabatanQuery.data) return [];
        return (jabatanQuery.data as any[])
            .filter((j: any) => j.tipe_penggajian === 'Target')
            .map((j: any) => j.nama_jabatan as string);
    }, [jabatanQuery.data]);

    const listPegawai = pegawaiQuery.data || [];
    const listMasterTargets = masterTargetsQuery.data || [];

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
                    shadow_satuan: pencapaian.master_target?.harga_satuan || 0, // Fallback if needed
                    jumlah_pencapaian: pencapaian.jumlah_pencapaian,
                    nominal: pencapaian.nominal_total_riil,
                    pencapaian_id: pencapaian.id
                } as any);
            }
        });

        return Object.values(matrixMap);
    };

    const pencapaianQuery = useQuery({
        queryKey: ['pencapaianList', startDate, endDate],
        queryFn: async () => {
            let url = `${import.meta.env.VITE_API_BASE_URL}/api/v1/target/pencapaian`;
            const params: string[] = [];
            if (startDate) params.push(`tanggal_mulai=${startDate}`);
            if (endDate) params.push(`tanggal_selesai=${endDate}`);
            if (params.length > 0) {
                url += `?${params.join("&")}`;
            }
            const res = await apiFetch(url, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Gagal memuat data pencapaian");
            return data.data || [];
        },
        enabled: listPegawai.length > 0,
        staleTime: 1000 * 60 * 5
    });

    const matrixKaryawan = useMemo(() => {
        if (!pencapaianQuery.data || !listPegawai.length) return [];
        return transformToMatrix(listPegawai, pencapaianQuery.data);
    }, [pencapaianQuery.data, listPegawai]);

    const filteredMatrixKaryawan = useMemo(() => {
        return matrixKaryawan.filter(pegawai => {
            const matchSearch = pegawai.nama.toLowerCase().includes(searchQuery.toLowerCase());
            const matchDepartemen = filterDepartemen === "" || pegawai.departemen === filterDepartemen;
            const matchJabatan = filterJabatan === "" || pegawai.jabatan === filterJabatan;
            // Hanya tampilkan pegawai yang jabatannya bertipe Target
            const isTargetJabatan = targetJabatanNames.length === 0 || targetJabatanNames.includes(pegawai.jabatan);
            return matchSearch && matchDepartemen && matchJabatan && isTargetJabatan;
        });
    }, [matrixKaryawan, searchQuery, filterDepartemen, filterJabatan, targetJabatanNames]);

    const uniqueJabatanList = useMemo(() => {
        return Array.from(new Set(
            matrixKaryawan
                .filter(p => filterDepartemen === "" || p.departemen === filterDepartemen)
                .map(p => p.jabatan)
                .filter(j => j !== "-")
                // Hanya jabatan bertipe Target yang muncul di dropdown
                .filter(j => targetJabatanNames.length === 0 || targetJabatanNames.includes(j))
        ));
    }, [matrixKaryawan, filterDepartemen, targetJabatanNames]);

    const uniqueDepartemenList = useMemo(() => {
        return Array.from(
            new Set(
                matrixKaryawan.map(p => p.departemen).filter(d => d && d !== "-")
            )
        );
    }, [matrixKaryawan]);

    const errorMsg = pencapaianQuery.error?.message || "";

    const handleCellClick = (pegawaiId: number, pegawaiNama: string, tglFormat: string, pegawaiJabatan?: string) => {
        setSelectedCell({
            pegawaiId, pegawaiNama, pegawaiJabatan, tanggal: tglFormat
        });
        setIsModalOpen(true);
    };

    const handleResetFilters = () => {
        setSearchQuery("");
        setFilterDepartemen("");
        setFilterJabatan("");
        setStartDate("");
        setEndDate("");
    };

    return {
        // State Tanggal & Filter
        today: now, startDate, setStartDate, endDate, setEndDate, handleResetFilters,
        // State Data
        matrixKaryawan, filteredMatrixKaryawan, searchQuery, setSearchQuery, isLoading: pencapaianQuery.isLoading || pencapaianQuery.isFetching, errorMsg, 
        listPegawai, listMasterTargets, targetJabatanNames,
        filterJabatan, setFilterJabatan, filterDepartemen, setFilterDepartemen, uniqueJabatanList, uniqueDepartemenList,
        pencapaianData: pencapaianQuery.data || [],
        // State Modal
        selectedCell, setSelectedCell,
        isModalOpen, setIsModalOpen,
        // Notif State
        notifState, closeNotif, showNotif,
        // Handlers
        isSaving, setIsSaving,
        handleCellClick
    };
}

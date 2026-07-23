import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo } from "react";
import {
    DataGrid,
    type GridColDef,
    GridActionsCellItem,
    type GridRowId

} from "@mui/x-data-grid";
import { Pencil, Trash2, Search } from "lucide-react";
import type { PegawaiData } from '../../../types';
import { apiFetchJson } from "../../../utils/apiFetch";
import { defaultDataGridSx } from '../../../components/common/dataGridStyles';
import ConfirmPopUp from '../../../components/common/ConfirmPopUp';
import Notif from '../../../components/common/Notif';
import { useMediaQuery, useTheme } from '@mui/material';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useNotif } from '../../../hooks/useNotif';



interface TabelPegawaiProps {
    data: PegawaiData[];
}



export default function TabelPegawai({ data: initialData }: TabelPegawaiProps) {

    // State untuk menyimpan data baris dan mode edit dari MUI DataGrid
    const [rows, setRows] = useState<PegawaiData[]>(initialData);

    const navigate = useNavigate();

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [showPopUp, setShowPopUp] = useState(false);
    const [hapusId, setHapusId] = useState<GridRowId | null>(null);
    const { notif, showNotif, closeNotif } = useNotif();

    const queryClient = useQueryClient();

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [filterDepartemen, setFilterDepartemen] = useState("");
    const [filterJabatan, setFilterJabatan] = useState("");

    // Compute unique lists from initialData to avoid disappearing when filtered
    const uniqueDepartemenList = useMemo(() => {
        const depts = initialData
            .map((p) => p.jabatan?.departemen?.nama_departemen)
            .filter((d): d is string => !!d);
        return Array.from(new Set(depts));
    }, [initialData]);

    const uniqueJabatanList = useMemo(() => {
        const jabs = initialData
            .filter((p) => !filterDepartemen || p.jabatan?.departemen?.nama_departemen === filterDepartemen)
            .map((p) => p.jabatan?.nama_jabatan)
            .filter((j): j is string => !!j);
        return Array.from(new Set(jabs));
    }, [initialData, filterDepartemen]);

    // Client-side filtering logic
    const filteredRows = useMemo(() => {
        return rows.filter((item) => {
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch = !q || 
                (item.nama && item.nama.toLowerCase().includes(q)) || 
                (item.nik && item.nik.toLowerCase().includes(q)) ||
                (item.jabatan?.nama_jabatan && item.jabatan.nama_jabatan.toLowerCase().includes(q));

            const matchesDept = !filterDepartemen || item.jabatan?.departemen?.nama_departemen === filterDepartemen;
            const matchesJab = !filterJabatan || item.jabatan?.nama_jabatan === filterJabatan;

            return matchesSearch && matchesDept && matchesJab;
        });
    }, [rows, searchQuery, filterDepartemen, filterJabatan]);
    const deletePegawaiMutation = useMutation({
        mutationFn: async (idToDelete: import("@mui/x-data-grid").GridRowId) => {
            await apiFetchJson(`/api/v1/pegawai/${idToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Content-type': 'application/json'
                }
            });
            return idToDelete;
        },
        onSuccess: (deleteId) => {
            setRows((prevRows) => prevRows.filter((row) => String(row.id) !== String(deleteId)));
            showNotif(`Data pegawai berhasil dihapus Id ${deleteId}`, "success");
            queryClient.invalidateQueries({ queryKey: ['pegawai'] });

        },
        onError: (error) => {
            console.error("Gagal menghapus :", error);
            showNotif(error.message || "terjadi kesalahan, Periksa koneksi", 'error');
        },
        onSettled: () => {
            setShowPopUp(false);
            setHapusId(null);
        }
    })


    // Hapus Data (Ikon Tempat Sampah)
    const handleDeleteClick = (id: GridRowId) => () => {
        setHapusId(id);
        setShowPopUp(true);
    };

    const hapus = () => {
        if (!hapusId) return;

        deletePegawaiMutation.mutate(hapusId);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setRows(initialData);
        }, 0);
        return () => clearTimeout(timer);
    }, [initialData]);



    // --- DEFINISI KOLOM ---
    const columns: GridColDef[] = [
        { field: 'id', headerName: 'Id', width: 70 },
        { field: 'nik', headerName: 'NIK', width: 160 },
        {
            field: 'nama',
            headerName: 'Nama Pegawai',
            flex: 1,
            minWidth: 150,
            renderCell: (params) => {
                return (
                    <button
                        // Arahkan ke halaman detail berdasarkan ID karyawan
                        onClick={() => navigate(`/dashboard/data-pegawai/${params.row.id}`)}
                        className="text-black hover:text-red-700 hover:underline font-semibold text-left transition-colors"
                    >
                        {params.value}
                    </button>
                );
            }
        },
        { field: 'no_hp', headerName: 'No. HP', width: 140 },
        { field: 'email', headerName: 'Email', minWidth: 180 },
        {
            field: 'departemen',
            headerName: 'Departemen',
            flex: 1,
            minWidth: 130,
            valueGetter: (_value, row) => row?.jabatan?.departemen?.nama_departemen || "-",
            renderCell: (params) => {
                const namaDept = params.row.jabatan?.departemen?.nama_departemen;
                return namaDept ? <span>{namaDept}</span> : <span className="text-gray-400">-</span>;
            }
        },
        {
            field: 'jabatan',
            headerName: 'Jabatan',
            flex: 1,
            minWidth: 150,
            valueGetter: (_value, row) => row.jabatan?.nama_jabatan || "-",
            renderCell: (params) => {
                return (
                    <span className="font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                        {params.row.jabatan?.nama_jabatan || "Belum ada jabatan"}
                    </span>
                );
            }
        },
        {
            field: 'shift',
            headerName: 'Shift',
            width: 120,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => {
                const namaShift = params.row.shifts?.kode_shift;
                return namaShift ? <span>{namaShift}</span> : <span className="text-gray-400">-</span>;
            }
        },
        {
            field: 'tanggal_bergabung',
            headerName: 'Tgl Bergabung',
            width: 130,
            valueGetter: (_params, row) => {
                // Pastikan mengecek nama field yang baru juga
                if (!row.tanggal_bergabung) return "-";
                const date = new Date(row.tanggal_bergabung);
                return date.toLocaleDateString('id-ID');
            }
        },
        {
            field: 'masakerja',
            headerName: 'Masa Kerja',
            flex: 1,
            minWidth: 130,
            align: 'center',
            headerAlign: 'center',
            valueGetter: (_value, row) => {
                if (!row.tanggal_bergabung) return "-";
                const bergabung = new Date(row.tanggal_bergabung);
                const sekarang = new Date();

                let tahun = sekarang.getFullYear() - bergabung.getFullYear();
                let bulan = sekarang.getMonth() - bergabung.getMonth();
                let hari = sekarang.getDate() - bergabung.getDate();

                if (hari < 0) {
                    bulan--;
                    const prevMonth = new Date(sekarang.getFullYear(), sekarang.getMonth(), 0);
                    hari += prevMonth.getDate();
                }
                if (bulan < 0) {
                    tahun--;
                    bulan += 12;
                }

                if (tahun > 0 && bulan > 0) return `${tahun} Thn ${bulan} Bln`;
                if (tahun > 0) return `${tahun} Tahun`;
                if (bulan > 0) return `${bulan} Bulan`;
                return `${hari} Hari`;
            }
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Aksi',
            width: 100,
            cellClassName: 'actions',
            getActions: ({ id }) => {


                // Jika mode NORMAL, tampilkan Pencil dan Trash
                return [
                    <GridActionsCellItem
                        icon={<Pencil size={20} className="text-gray-600 hover:text-black" />}
                        label="Edit"
                        className="min-w-11 min-h-11 p-2 hover:bg-gray-100 rounded-full transition-colors"
                        onClick={() => navigate(`/dashboard/data-pegawai/edit/${id}`)}
                        color="inherit"
                    />,
                    <GridActionsCellItem
                        icon={<Trash2 size={20} className="text-gray-600 hover:text-red-600" />}
                        label="Delete"
                        className="min-w-11 min-h-11 p-2 hover:bg-red-50 rounded-full transition-colors"
                        onClick={handleDeleteClick(id)}
                        color="inherit"
                    />,
                ];
            },
        },
    ];

    return (
        <div className="w-full bg-white flex flex-col gap-4">
            
            {/* Control Bar: Search & Filters */}
            <div className="p-4 sm:p-5 border border-gray-200 bg-gray-50/70 rounded-xl flex flex-col gap-4">
                
                {/* Baris 1: Search */}
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-60 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Cari nama / jabatan / NIK..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full border border-slate-300 rounded-xl pl-10 pr-9 py-2 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                            >
                                &times;
                            </button>
                        )}
                    </div>
                </div>

                {/* Baris 2: Filters */}
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-start pt-2 border-t border-gray-200/80">
                    <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
                        {/* Filter Departemen */}
                        <select
                            value={filterDepartemen}
                            onChange={(e) => {
                                setFilterDepartemen(e.target.value);
                                setFilterJabatan('');
                            }}
                            className="border border-slate-300 rounded-xl px-3 py-1.5 bg-white text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs cursor-pointer flex-1 md:flex-none md:w-48 truncate"
                        >
                            <option value="">Semua Departemen</option>
                            {uniqueDepartemenList.map((dept, idx) => (
                                <option key={idx} value={dept}>{dept}</option>
                            ))}
                        </select>

                        {/* Filter Jabatan */}
                        <select
                            value={filterJabatan}
                            onChange={(e) => setFilterJabatan(e.target.value)}
                            disabled={!filterDepartemen}
                            className={`border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold shadow-2xs cursor-pointer flex-1 md:flex-none md:w-48 truncate outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 ${!filterDepartemen ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : 'bg-white text-slate-700'}`}
                        >
                            <option value="">{filterDepartemen ? "Semua Jabatan" : "Pilih Departemen Dulu"}</option>
                            {uniqueJabatanList.map((jab, idx) => (
                                <option key={idx} value={jab}>{jab}</option>
                            ))}
                        </select>

                        {/* Reset Button */}
                        {(searchQuery || filterDepartemen || filterJabatan) && (
                            <button
                                onClick={() => {
                                    setSearchQuery("");
                                    setFilterDepartemen("");
                                    setFilterJabatan("");
                                }}
                                className="text-xs text-red-600 hover:text-red-700 font-bold px-2 py-1 transition-colors duration-150 cursor-pointer"
                            >
                                Reset Filter
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <DataGrid
                autoHeight
                rows={filteredRows}
                columns={columns}
                initialState={{
                    pagination: {
                        paginationModel: { page: 0, pageSize: 10 },
                    },
                    columns: {
                        columnVisibilityModel: {
                            id: false,         // Sembunyikan ID
                            nik: false,        // Sembunyikan NIK (karena panjang banget)
                            pin_mesin: false,  // Sembunyikan PIN (cuma butuh pas mau sinkron mesin)
                            email: !isMobile,     // Hilang di layar HP
                            masakerja: !isMobile  // Hilang di layar HP 
                        },
                    },
                }}
                pageSizeOptions={[10, 20]}
                disableRowSelectionOnClick
                sx={{ ...defaultDataGridSx, width: "100%" }}
            />
            <ConfirmPopUp
                isOpen={showPopUp}
                onClose={() => {
                    setShowPopUp(false);
                    setHapusId(null);
                }}
                onConfirm={hapus}
                title="Hapus Data Pegawai?"
                message="Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin menghapus data pegawai ini dari sistem?"
                confirmText="Ya, Hapus"
                variant="danger"
            />
            <Notif
                show={notif.show}
                message={notif.message}
                type={notif.type}
                onClose={closeNotif}
            />
        </div>
    );
}
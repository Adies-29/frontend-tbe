import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from "react";
import {
    DataGrid,
    type GridColDef,
    GridActionsCellItem,
    type GridRowId

} from "@mui/x-data-grid";
import { Pencil, Trash2 } from "lucide-react";
import { useAuthStore } from '../../../store/useAuthStore';
import type { PegawaiData } from '../../../types';


import { apiFetch } from "../../../utils/apiFetch";
import { defaultDataGridSx } from '../../../components/common/dataGridStyles';
import ConfirmPopUp from '../../../components/common/ConfirmPopUp';
import Notif from '../../../components/common/Notif';
import { useMediaQuery, useTheme } from '@mui/material';

import { useQueryClient, useMutation } from '@tanstack/react-query';



interface TabelPegawaiProps {
    data: PegawaiData[];
}



export default function TabelPegawai({ data: initialData }: TabelPegawaiProps) {

    // State untuk menyimpan data baris dan mode edit dari MUI DataGrid
    const [rows, setRows] = useState<PegawaiData[]>(initialData);

    const token = useAuthStore((state) => state.token);
    const navigate = useNavigate();

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [showPopUp, setShowPopUp] = useState(false);
    const [hapusId, setHapusId] = useState<GridRowId | null>(null);
    const [notif, setNotif] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
        show: false,
        message: "",
        type: "success"
    });

    const queryClient = useQueryClient();
    const deletePegawaiMutation = useMutation({
        mutationFn: async (idToDelete: import("@mui/x-data-grid").GridRowId) => {
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/pegawai/${idToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Content-type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Gagal Hapus data dari server");
            }
            return idToDelete;
        },
        onSuccess: (deleteId) => {
            setRows((prevRows) => prevRows.filter((row) => String(row.id) !== String(deleteId)));
            setNotif({ show: true, message: "Data pegawai berhasil dihapus", type: "success" });
            queryClient.invalidateQueries({ queryKey: ['pegawai'] });

        },
        onError: (error) => {
            console.error("Gagal menghapus :", error);
            setNotif({ show: true, message: error.message || "terjadi kesalahan, Periksa koneksi", type: 'error' });
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
                        className="min-w-[44px] min-h-[44px] p-2 hover:bg-gray-100 rounded-full transition-colors"
                        onClick={() => navigate(`/dashboard/data-pegawai/edit/${id}`)}
                        color="inherit"
                    />,
                    <GridActionsCellItem
                        icon={<Trash2 size={20} className="text-gray-600 hover:text-red-600" />}
                        label="Delete"
                        className="min-w-[44px] min-h-[44px] p-2 hover:bg-red-50 rounded-full transition-colors"
                        onClick={handleDeleteClick(id)}
                        color="inherit"
                    />,
                ];
            },
        },
    ];

    return (
        <div className="w-full bg-white">
            <DataGrid
                showToolbar
                autoHeight
                rows={rows}
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
                onClose={() => setNotif({ show: false, message: "", type: "success" })}
            />
        </div>
    );
}
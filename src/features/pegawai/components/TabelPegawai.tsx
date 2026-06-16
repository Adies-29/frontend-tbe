import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from "react";
import { 
    DataGrid, 
    type GridColDef, 
    type GridRowModesModel,  
    GridActionsCellItem, 
    type GridRowId, 
    type GridRowModel,

} from "@mui/x-data-grid";
import { Pencil, Trash2 } from "lucide-react";
import { useAuthStore } from '../../../store/useAuthStore';
import type { PegawaiData } from '../../../types';

import { getSafeErrorMessage } from '../../../utils/errorHandler';
import { apiFetch } from "../../../utils/apiFetch";
import { defaultDataGridSx } from '../../../components/common/dataGridStyles';
import ConfirmPopUp from '../../../components/common/ConfirmPopUp';
import Notif from '../../../components/common/Notif';




interface TabelPegawaiProps {
    data: PegawaiData[];
    onRefresh: () => void; 
}



export default function TabelPegawai({ data: initialData, onRefresh  }: TabelPegawaiProps) {

    // State untuk menyimpan data baris dan mode edit dari MUI DataGrid
    const [rows, setRows] = useState<PegawaiData[]>(initialData);
    const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

    const token = useAuthStore((state) => state.token);
    const navigate = useNavigate();

    const [showPopUp, setShowPopUp] = useState(false);
    const [hapusId, setHapusId] = useState<GridRowId | null>(null);
    const [notif, setNotif] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
        show: false,
        message: "",
        type: "success"
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            setRows(initialData);
        }, 0);
        return () => clearTimeout(timer);
    }, [initialData]);

    // --- FUNGSI-FUNGSI AKSI ---

    // 4. Hapus Data (Ikon Tempat Sampah)
    const handleDeleteClick = (id: GridRowId) => () => {
        setHapusId(id);
        setShowPopUp(true);
    };

    const hapus = async () => {
        if (!hapusId) return;

        try {
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/pegawai/${hapusId}`, {
                method: 'DELETE',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                } 
            });
            const result = await response.json();

            if (response.ok && result.success) {
                // Hapus data dari tabel secara realtime
                setRows((prevRows) => prevRows.filter((row) => String(row.id) !== String(hapusId)));
                setNotif({ show: true, message: "Data pegawai berhasil dihapus", type: "success" });
                setTimeout(() => {
                    onRefresh();
                }, 2000);

            } else {
                setNotif({ show: true, message: getSafeErrorMessage(response.status), type: "error" });
            }
        } catch (error) {
            console.error("Terjadi kesalahan server:", error);
            setNotif({ show: true, message: "Gagal menghapus data. Periksa koneksi.", type: "error" });
        } finally {
            // Tutup popup dan bersihkan ID setelah selesai diproses
            setShowPopUp(false);
            setHapusId(null);
        }
    };

        
    const processRowUpdate = async (newRow: GridRowModel, oldRow: GridRowModel) => {
        const updatedRow = { ...newRow } as PegawaiData;
        if (JSON.stringify(newRow) === JSON.stringify(oldRow)) return oldRow;
        const { no_hp, email, masakerja } = updatedRow;

        try {
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/pegawai/${newRow.id}`, {
                method:"PUT",
                headers:{
                    "Content-Type" : "application/json",
                    "Authorization" : `Bearer ${token}`, 
                },
                body: JSON.stringify({ no_hp, email, masakerja }), 
            });
            const result = await response.json()
            if(!response.ok || !result.success){
                throw new Error(result.message || "Server Menolak")
            }
            setRows((prevRows) => prevRows.map((row) => (row.id === newRow.id ? updatedRow : row)));

            setNotif({ show: true, message: "Perubahan data berhasil disimpan!", type: "success" });
            
            return updatedRow;

        } catch (error) {
            console.error("Gagal update:", error);
            setNotif({ show: true, message: getSafeErrorMessage(), type: "error" });
            throw error; // Wajib di-throw agar MUI membatalkan ketikan di layar
        }
    };

    const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
        setRowModesModel(newRowModesModel);
    };

    const departemenOption = Array.from(
        new Set(
            initialData
                .map((item) => item.jabatan?.departemen?.nama_departemen)
                .filter(Boolean)
        )
    ) as string[];
    const jabatanOption = Array.from(
        new Set(
            initialData
                .map((item) => item.jabatan?.nama_jabatan)
                .filter(Boolean)
        )
    ) as string[];
  

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
        { field: 'no_hp', headerName: 'No. HP', width: 140, editable: true }, 
        { field: 'email', headerName: 'Email', minWidth: 180, editable: true },
        { 
            field: 'departemen', 
            headerName: 'Departemen', 
            flex: 1, 
            minWidth: 130, 
            editable: true, 
            valueOptions: departemenOption,
            type: 'singleSelect',
            valueGetter: (_value, row) => row?.jabatan?.departemen?.nama_departemen || "-",
            renderCell: (params) => {
                const namaDept = params.row.jabatan?.departemen?.nama_departemen;
                return namaDept ? <span>{namaDept}</span> : <span className="text-gray-400">-</span>;
            } 
        },
        { 
            field: 'jabatan', 
            headerName: 'Jabatan', 
            editable: true,
            flex: 1, 
            type: 'singleSelect',
            valueOptions: jabatanOption,
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
            editable: true, 
            type: 'singleSelect',
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
                        icon={<Pencil size={18} className="text-gray-600 hover:text-black" />}
                        label="Edit"
                        className="textPrimary"
                        onClick={() => navigate(`/dashboard/data-pegawai/edit/${id}`)}
                        color="inherit"
                    />,
                    <GridActionsCellItem
                        icon={<Trash2 size={18} className="text-gray-600 hover:text-red-600" />}
                        label="Delete"
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
                rowModesModel={rowModesModel}
                onRowModesModelChange={handleRowModesModelChange}
                processRowUpdate={processRowUpdate}
                onProcessRowUpdateError={(error) => console.error("Gagal update baris:", error)}
                initialState={{
                    pagination: {
                        paginationModel: { page: 0, pageSize: 10 },
                    },
                    columns: {
                        columnVisibilityModel: {
                            id: false,         // Sembunyikan ID
                            nik: false,        // Sembunyikan NIK (karena panjang banget)
                            pin_mesin: false,  // Sembunyikan PIN (cuma butuh pas mau sinkron mesin)
                        },
                    },
                }}
                pageSizeOptions={[10, 20]}
                disableRowSelectionOnClick
                sx={defaultDataGridSx}
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
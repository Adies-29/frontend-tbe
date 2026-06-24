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
import { Pencil, Trash2, Clock } from "lucide-react";
import type { JadwalShiftData } from '../../../types';
import { useAuthStore } from '../../../store/useAuthStore';

import { getSafeErrorMessage } from '../../../utils/errorHandler';
import { apiFetch } from "../../../utils/apiFetch";
import { defaultDataGridSx } from '../../../components/common/dataGridStyles';
import ConfirmPopUp from '../../../components/common/ConfirmPopUp';
import Notif from '../../../components/common/Notif';
import { useMutation } from "@tanstack/react-query";





interface TabelJadwalShiftProps {
    data : JadwalShiftData[];
    onRefresh: () => void; 
}

export default function TabelJadwalShift({data: initialData, onRefresh }: TabelJadwalShiftProps) {

    const [rows, setRows] = useState<JadwalShiftData[]>(initialData);
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
        setRows(initialData);
    }, [initialData]);

    const handleDeleteClick = (id: GridRowId) => async () => {
       setHapusId(id);
        setShowPopUp(true);
    };

        const deleteShiftMutation = useMutation({
        mutationFn: async (idToDelete: GridRowId) => {
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/shifts/${idToDelete}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(getSafeErrorMessage(response.status));
            }
            return result;
        },
        // data ini otomatis membaca id yang berhasil dihapus
        onSuccess: ( deletedId) => {
            setRows((prevRows) => prevRows.filter((row) => String(row.id) !== String(deletedId)));
            setNotif({ show: true, message: "Data jadwal shift berhasil dihapus", type: "success" });
            setTimeout(() => {
                onRefresh(); // Pakai onRefresh bawaan komponen saja!
            }, 2000);
        },
        onError: (error) => {
            setNotif({ show: true, message: error.message || "Gagal menghapus data. Periksa koneksi.", type: "error" });
        },
        onSettled: () => {
            setShowPopUp(false);
            setHapusId(null);
        }
    });

    const hapus = () => {
        if (hapusId) {
            deleteShiftMutation.mutate(hapusId);
        }
    };

        const editShiftMutation = useMutation({
        mutationFn: async (newRow: GridRowModel) => {
            const { kode_shift, jam_masuk, jam_pulang } = newRow as JadwalShiftData;
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/shifts/${newRow.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ kode_shift, jam_masuk, jam_pulang }),
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Server Error");
            }
            return newRow as JadwalShiftData;
        },
        onSuccess: (updatedRow) => {
            setRows((prevRows) => prevRows.map((row) => (row.id === updatedRow.id ? updatedRow : row)));
            onRefresh(); 
        },
        onError: (error) => {
            setNotif({ show: true, message: error.message || getSafeErrorMessage(), type: "error" });
        }
    });

    const processRowUpdate = async (newRow: GridRowModel, oldRow: GridRowModel) => {
        if (JSON.stringify(newRow) === JSON.stringify(oldRow)) return oldRow;
        
        try {
           
            const updatedRow = await editShiftMutation.mutateAsync(newRow);
            return updatedRow;
        } catch (error) {
            return Promise.reject(error); 
        }
    };

    const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
        setRowModesModel(newRowModesModel);
    };

    // --- DEFINISI KOLOM ---
    const columns: GridColDef[] = [
        { field: 'id', headerName: 'Id', width: 70 },
        { 
            field: 'kode_shift', 
            headerName: 'Kode Shift', 
            flex: 1,
            minWidth: 150,
            renderCell: (params) => <span className="font-bold text-gray-800">{params.value}</span> 
        },
        { 
            field: 'jam_kerja', 
            headerName: 'Jam Kerja', 
            width: 220,
            align:'center',
            headerAlign:'center',
            renderCell: (params) => (
                <div className="flex items-center justify-center w-full h-full">
                    <div className="flex items-center justify-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
                        <Clock size={14} />
                        {params.row.jam_masuk} - {params.row.jam_pulang}
                    </div>
                </div>
            )
        },
        {
            field: 'lintas_hari',
            headerName: 'Lintas Hari',
            width: 150,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                params.value ? 
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">Ya (Malam)</span> : 
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">Tidak</span>
            )
        },
        {
            field: 'denda',
            headerName: 'Aturan Denda Telat',
            flex: 1,
            minWidth: 200,
            renderCell: (params) => (
                params.row.is_potong_gaji_terlambat ? 
                <span className="text-red-600 text-sm font-medium">
                    Rp {params.row.denda_terlambat_per_menit} {params.row.istetap ? '/ Tetap' : '/ menit'}
                </span> :
                <span className="text-gray-400 text-sm italic">Tidak ada denda</span>
            )
        },
        {
            field: 'actions',
            type: 'actions', 
            headerName: 'Aksi',
            width: 120,
            cellClassName: 'actions',
            getActions: ({ id }) => {
    
                return [
                    <GridActionsCellItem
                        icon={<Pencil size={18} className="text-gray-600 hover:text-black" />}
                        label="Edit"
                        className="textPrimary"
                        onClick={() => navigate(`/dashboard/jadwal-shift/edit/${id}`)}
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
        

    return(
        <div className="w-full bg-white relative">
            <DataGrid
                showToolbar
                autoHeight
                rows={rows}
                columns={columns}
                editMode="row"
                rowModesModel={rowModesModel}
                onRowModesModelChange={handleRowModesModelChange}
                processRowUpdate={processRowUpdate}
                onProcessRowUpdateError={(error) => console.error("Gagal update baris:", error)}
                initialState={{
                    pagination: {
                        paginationModel: { page: 0, pageSize: 5 },
                    },
                    columns: {
                        columnVisibilityModel: {
                            id: false, 
                        },
                    },
                }}
                pageSizeOptions={[5, 10, 20]}
                disableRowSelectionOnClick
                sx={{
                    ...defaultDataGridSx,
                    borderRadius: "12px",
                    "& .MuiDataGrid-cell": {
                        borderBottom: "1px solid #F3F4F6",
                    },
                }}
            />
            <ConfirmPopUp
                isOpen={showPopUp}
                onClose={() => {
                    setShowPopUp(false);
                    setHapusId(null);
                }}
                onConfirm={hapus}
                title="Hapus Data Shift?"
                message="Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin menghapus data shift ini dari sistem?"
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

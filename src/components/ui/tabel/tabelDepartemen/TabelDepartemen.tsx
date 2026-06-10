import { useEffect, useState } from 'react';
import { 
    DataGrid, 
    type GridColDef, 
    type GridRowModesModel, 
    GridRowModes, 
    GridActionsCellItem, 
    type GridRowId, 
    type GridRowModel 
} from '@mui/x-data-grid';
import { Pencil, Trash2, Save, X} from 'lucide-react';
import type { DepartemenData } from '../../../../types';
import { useAuthStore } from '../../../../store/useAuthStore';
import ConfirmPopUp from '../../ConfirmPopUp';
import Notif from '../../Notif';
import { getSafeErrorMessage } from '../../../../utils/errorHandler';
import { apiFetch } from "../../../../utils/apiFetch";
import { defaultDataGridSx } from "../dataGridStyles";

// --- INTERFACES ---
interface DepartemenTableProps {
    data?: DepartemenData[];
    onRefresh: () => void; 
}

export default function DepartemenTable({ data: initialData = [], onRefresh }: DepartemenTableProps) {
    const [rows, setRows] = useState<DepartemenData[]>(initialData);
    const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
    const token = useAuthStore((state) => state.token)

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
    
    // --- FUNGSI-FUNGSI AKSI (MUI DataGrid) ---
    const handleEditClick = (id: GridRowId) => () => {
        setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
    };

    const handleSaveClick = (id: GridRowId) => () => {
        setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
    };

   const handleCancelClick = (id: GridRowId) => () => {
        setRowModesModel({
            ...rowModesModel,
            [id]: { mode: GridRowModes.View, ignoreModifications: true },
        });

    };

    const handleDeleteClick = (id: GridRowId) =>  async () => {
        setHapusId(id);
        setShowPopUp(true);
    };

    const hapus = async () =>{
        if (!hapusId) return;
        try {
            const response =await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/departemen/${hapusId}`, {
                method:"DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                } 
            });
            const result = await response.json();

            if (response.ok && result.success){
                setRows((prevRows) => prevRows.filter((row) => String(row.id) !== String(hapusId)));
                setNotif({ show: true, message: "Data berhasil dihapus!", type: "success" });
                setTimeout(() => {
                    onRefresh();
                }, 2000);
            }else{
                setNotif({ show: true, message: getSafeErrorMessage(response.status), type: "error" });
            }
        } catch (error) {
            console.error("Error delete :", error);
            setNotif({ show: true, message: "Gagal menghapus data. Periksa koneksi.", type: "error" });
        } finally{
            setShowPopUp(false);
            setHapusId(null);
        }

    }

    // Fungsi untuk PINDAH HALAMAN lihat karyawan

    const processRowUpdate = async (newRow: GridRowModel, oldRow: GridRowModel) => {
        const updatedRow = { ...newRow } as DepartemenData;
        if (oldRow.nama_departemen === newRow.nama_departemen){
            return oldRow;
        }

        try {
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/departemen/${newRow.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization" : `Bearer ${token}`
                },
                body: JSON.stringify({
                    nama_departemen: newRow.nama_departemen
                }),
            });

            const result = await response.json();

            if (response.ok && result.success){
                setRows(rows.map((row) =>
                (row.id === newRow.id ? updatedRow : row)));
                setNotif({ show: true, message: "Perubahan data berhasil diperbarui", type: "success" });
                return updatedRow;
            }else{
                setNotif({ show: true, message: getSafeErrorMessage(response.status), type: "error" });
                return oldRow;
            }
        } catch (error: any) {
            console.error("Error updating departemen:", error);
            setNotif({ show: true, message: getSafeErrorMessage(), type: "error" });
            return oldRow; 
        }    
    };

    const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
        setRowModesModel(newRowModesModel);
    };

  
    const columns: GridColDef[] = [

        { 
            field: 'nama_departemen', 
            headerName: 'Departemen', 
            flex: 1, 
            minWidth: 200, 
            editable: true,
            renderCell: (params) => {
                const nama = String(params.value || ''); 
                return (
                    <div className="flex items-center gap-3 h-full">
                        <span className="font-bold">{nama || '-'}</span> 
                    </div>
                );
            }
        },
        { 
            field: 'jumlah_jabatan', 
            headerName: 'Jumlah Jabatan', 
            width: 150, 
            align: 'center', 
            headerAlign: 'center',
            renderCell: (params) => <span className="font-bold">{params.value || 0}</span>
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Aksi',
            width: 140,
            cellClassName: 'actions',
            getActions: ({ id }) => {
                const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

                if (isInEditMode) {
                    return [
                        <GridActionsCellItem
                            icon={<Save size={18} className="text-green-600 hover:text-green-800" />}
                            label="Save"
                            onClick={handleSaveClick(id)}
                        />,
                        <GridActionsCellItem
                            icon={<X size={18} className="text-red-600 hover:text-red-800" />}
                            label="Cancel"
                            onClick={handleCancelClick(id)}
                            color="inherit"
                        />,
                    ];
                }

                return [
                    <GridActionsCellItem
                        icon={<Pencil size={18} className="text-gray-600 hover:text-black" />}
                        label="Edit"
                        onClick={handleEditClick(id)}
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
        <div className="w-full bg-white relative">
            <DataGrid
                autoHeight
                showToolbar
                rows={rows}
                columns={columns}
                editMode="row"
                rowModesModel={rowModesModel}
                onRowModesModelChange={handleRowModesModelChange}
                processRowUpdate={processRowUpdate}
                initialState={{
                    pagination: { paginationModel: { page: 0, pageSize: 10 } },
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
                title="Hapus Data Departemen?"
                message="Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin menghapus data departemen ini dari sistem?"
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
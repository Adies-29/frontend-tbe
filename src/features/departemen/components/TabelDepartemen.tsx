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
import type { DepartemenData } from '../../../types';
import { useAuthStore } from '../../../store/useAuthStore';

import { getSafeErrorMessage } from '../../../utils/errorHandler';
import { apiFetch } from "../../../utils/apiFetch";
import { defaultDataGridSx } from '../../../components/common/dataGridStyles';
import ConfirmPopUp from '../../../components/common/ConfirmPopUp';
import Notif from '../../../components/common/Notif';
import { useMutation, useQueryClient } from "@tanstack/react-query";


// --- INTERFACES ---
interface DepartemenTableProps {
    data?: DepartemenData[];
    onRefresh?: any;
}

export default function DepartemenTable({ data: initialData = [] }: DepartemenTableProps) {
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
    const queryClient = useQueryClient();



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

    const deleteDeptMutation = useMutation({
        mutationFn: async (idToDelete: GridRowId) => {
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/departemen/${idToDelete}`, {
                method: "DELETE",
                headers:{
                    "Content-Type" : "application/json",
                    "Authorization" : `Bearer ${token}`
                },

            });

            const result = await response.json();

            if(!response.ok || !result.success){
                throw new Error(result.message || "Gagal menghapus data departemen");

            }
            return idToDelete;
        },
        onSuccess: (deleteId) => {
            setRows((prevRows) => prevRows.filter((row) => String(row.id) !== String(deleteId)));
            setNotif({show: true, message: "Data departemen behasil dihapus", type: "success"});
            queryClient.invalidateQueries({queryKey: ["departemen"]});

        },
        onError: (error) => {
            console.error("Gagal menghapus departemen :", error);
            setNotif({show: true, message: error.message || "Terjadi kesalahan, Periksa Koneksi", type: "error"});
        },
        onSettled: () => {
            setShowPopUp(false);
            setHapusId(null);
        }

    });

    const hapus = () =>{
        if (hapusId) {
            deleteDeptMutation.mutate(hapusId)
        }
    }

    // Fungsi untuk PINDAH HALAMAN lihat karyawan

    const editDeptMuttion = useMutation({
        mutationFn: async (newRow: GridRowModel) =>{
            const response = await  apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/departemen/${newRow.id}`,{
                method: "PUT",
                headers: {
                    "Content-Type" : "application/json",
                    "Authorization" : `Bearer ${token}`
                },
                body: JSON.stringify({
                    nama_departemen: newRow.nama_departemen
                })

            });
            const result = await response.json();
            if(!response.ok || !result.success){
                throw new Error(result.message || "Gagal memperbarui departemen");
            }
            return result;
        },
        onSuccess: () => {
            setNotif({show: true, message: "Data departemen berhasil di perbarui", type: "success"});
            queryClient.invalidateQueries({queryKey: ["departemen"]});
        },
        onError: (error) => {
            console.error("Gagal memperbarui departemen : ",error);
            setNotif({show: true, message: error.message || "Terjadi kesalahan, Periksa Koneksi", type: "error"});
        }
    });

    const processRowUpdate = async (newRow: GridRowModel, oldRow: GridRowModel) => {
        if (oldRow.nama_departemen === newRow.nama_departemen){
            return oldRow;
        }

        try {
            await editDeptMuttion.mutateAsync(newRow);
            const updatedRow = {...newRow} as DepartemenData;
            setRows((prevRows) => prevRows.map((row) => (row.id === newRow.id ? updatedRow : row)));
            return updatedRow;
        } catch (error) {
            console.error("Error updating departemen:", error);
            setNotif({ show: true, message: getSafeErrorMessage(), type: "error" });
            return Promise.reject(error); 
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
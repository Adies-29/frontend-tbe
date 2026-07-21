import { useEffect, useState } from 'react';

import {
    DataGrid,
    type GridColDef,
    GridRowModes,
    GridActionsCellItem,
    type GridRowId,
    type GridRowModel
} from '@mui/x-data-grid';
import { Pencil, Trash2, Save, X } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import type { JabatanData, DepartemenOption } from '../../../types';
import { apiFetch } from "../../../utils/apiFetch";
import ConfirmPopUp from '../../../components/common/ConfirmPopUp';
import { defaultDataGridSx } from '../../../components/common/dataGridStyles';
import Notif from '../../../components/common/Notif';
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useNotif } from '../../../hooks/useNotif';


interface TabelJabatanProps {
    data: JabatanData[]; 
}


export default function TabelJabatan({ data: initialData }: TabelJabatanProps) {
    const [rows, setRows] = useState(initialData);
    const [rowModesModel, setRowModesModel] = useState<GridRowModel>({});
    const token = useAuthStore((state) => state.token);

    const [showPopUp, setShowPopUp] = useState(false);
    const [hapusId, setHapusId] = useState<GridRowId | null>(null);
    const { notif, showNotif, showErrorNotif, closeNotif } = useNotif();
    const queryClient = useQueryClient();

    

    useEffect(() => {
        const timer = setTimeout(() => {
            setRows(initialData);
        }, 0);
        return () => clearTimeout(timer);
    }, [initialData]);

    const { data: departemenOptions = [] } = useQuery({
        queryKey: ['masterDepartemen'],
        queryFn: async () => {
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/departemen`, {
                headers: { "Authorization": `Bearer ${token}` } 
            });
            const result = await response.json();
            
            if (!response.ok || !result.success) {
                throw new Error(result.message || "Gagal memuat daftar departemen");
            }
            
            // Format data langsung sesuai kebutuhan MUI DataGrid
            return result.data.map((dept: DepartemenOption) => ({
                value: dept.id,
                label: dept.nama_departemen
            }));
        }
    });



    // tombol Edit 
    const handleEditClick = (id: GridRowId) => () => {
        setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
    };

    //tombol Save
    const handleSaveClick = (id: GridRowId) => async () => {
        setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
    };

    // Saat tombol Cancel (Silang) diklik
    const handleCancelClick = (id: GridRowId) => () => {
        setRowModesModel({
            ...rowModesModel,
            [id]: { mode: GridRowModes.View, ignoreModifications: true },
        });
        const editedRow = rows.find((row) => row.id === id);
        if (editedRow?.isNew) {
            setRows(rows.filter((row) => row.id !== id));
        }
    };

    //tombol Delete 
    const handleDeleteClick = (id: GridRowId) => async () => {
        setHapusId(id);
        setShowPopUp(true);
    };

    const deleteJabatanMutation = useMutation({
        mutationFn: async (idToDelete: GridRowId) => {
            const response = await apiFetch (`${import.meta.env.VITE_API_BASE_URL}/api/v1/jabatan/${idToDelete}`, {
                method: 'DELETE',
                headers: {
                    "Content-Type" : "application/json",
                    "Authorization" : `Bearer ${token}`
                },
            });
            const result = await response.json();
            
            if (!response.ok || !result.success) {
                throw new Error(result.message || "Gagal menghapus jabatan")
            }
            return idToDelete;
        },
        onSuccess: (deleteId) => {
            setRows((prevRows) => prevRows.filter((row) => String(row.id) !== String(deleteId)));
            showNotif("Data jabatan berhasil dihapus", "success");
            queryClient.invalidateQueries({ queryKey: ['jabatan_pegawai']});
        },
        onError: (error) => {
            showErrorNotif(error);
        },
        onSettled: () => {
            setShowPopUp(false);
            setHapusId(null);
        }
    })


    const hapus =  () =>{
        if (hapusId) {
            deleteJabatanMutation.mutate(hapusId)
        }
    };

    const editJabatanMutation = useMutation({
        mutationFn: async (newRow: GridRowModel) =>{
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/jabatan/${newRow.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type" : "application/json",
                    "Authorization" : `Bearer ${token}`
                },
                body: JSON.stringify({
                    nama_jabatan: newRow.nama_jabatan,
                    departemen_id: Number(newRow.departemen_id)
                }),
            });
            const result = await response.json();
            if (!response.ok || !result.success){
                throw new Error(result.message || "Gagal memperbarui jabatan")
            }
            return newRow;
        },
        onSuccess: () => {
            showNotif("Data jabatan berhasil diperbarui!", "success");
            queryClient.invalidateQueries({ queryKey: ['jabatan_pegawai'] });

        },
        onError: (error) =>{
            showErrorNotif(error);
        }
    })

    // Fungsi penting yang dijalankan MUI setelah data selesai diedit di tabel
    const processRowUpdate = async (newRow: GridRowModel, oldRow: GridRowModel) => {
        
        if (oldRow.nama_jabatan === newRow.nama_jabatan && oldRow.departemen_id === newRow.departemen_id){
            return oldRow; 
        }

        try {
            await editJabatanMutation.mutateAsync(newRow);
            const updatedRow = { ...newRow } as JabatanData;
            const selectedDeptName = departemenOptions.find((opt: any) => opt.value === Number(newRow.departemen_id))?.label;

            if (selectedDeptName) {
                updatedRow.departemen = { nama_departemen: selectedDeptName};
            }
           setRows((prevRows) => 
                prevRows.map((row) => (String(row.id) === String(newRow.id) ? updatedRow : row))
            );
            return updatedRow;

        } catch (error: unknown) {
            console.error("Error updating jabatan:", error);
            showErrorNotif(error);
            return Promise.reject(error);
        } 
    };




    // --- 3. DEFINISI KOLOM ---
    const columns: GridColDef[] = [
        {
            field: 'nama_jabatan',
            headerName: 'Nama Jabatan',
            flex: 1,
            minWidth: 180,
            editable: true,
            renderCell: (params) => (
                <span className="text-gray-800 font-bold">{params.value}</span>
            )
        },
        {
            field: 'departemen_id',
            headerName: 'Departemen',
            flex: 1,
            minWidth: 150,
            editable: true,
            valueOptions: departemenOptions,
            renderCell: (params) => {
                let namaDept = params.row.departemen?.nama_departemen;
                if (!namaDept && params.value) {
                    const matchedDept = departemenOptions.find(
                        (opt: any) => String(opt.value) === String(params.value)
                    );
                    namaDept = matchedDept?.label;
                }
                return (
                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                        {namaDept || "--"}
                    </span>
                );
            }
        },
        {
            field: 'jumlah_pegawai',
            headerName: 'Jumlah Pegawai',
            flex: 1,
            minWidth: 150,
            align: 'center',
            headerAlign: 'center',
            editable: false,
            renderCell: (params) => (
                <span>{params.value || 0} Orang</span>
            )
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
        <div className='w-full bg-white relative'>
            <DataGrid
                autoHeight
                rows={rows}
                columns={columns}
                showToolbar

                // Pengaturan CRUD Inline Editing
                editMode="row"
                rowModesModel={rowModesModel}
                onRowModesModelChange={(newModel) => setRowModesModel(newModel)}
                processRowUpdate={processRowUpdate}

                onProcessRowUpdateError={(error) => {
                    console.error("Gagal saat update baris:", error);
                }}

                initialState={{
                    pagination: { paginationModel: { page: 0, pageSize: 10 } },
                }}
                pageSizeOptions={[10, 20]}
                disableRowSelectionOnClick
                sx={{
                    ...defaultDataGridSx,
                    border: 'none',
                    '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: '#f9fafb',
                        color: 'black',
                        fontWeight: 'bold',
                        borderBottom: '1px solid #e5e7eb',
                    },
                    '& .MuiDataGrid-cell': {
                        borderBottom: '1px solid #f3f4f6',
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
                title="Hapus Data Jabatan?"
                message="Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin menghapus data jabatan ini dari sistem?"
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
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
import { useAuthStore } from '../../../../store/useAuthStore';
import type { JabatanData } from '../../../../types';

interface TabelJabatanProps {
    data: JabatanData[];
}


export default function TabelJabatan({ data: initialData }: TabelJabatanProps) {
    const [departemenOptions, setDepartemenOptions] = useState<{value: number, label: string}[]>([]);
    const [rows, setRows] = useState(initialData);
    const [rowModesModel, setRowModesModel] = useState<GridRowModel>({});
    const token = useAuthStore((state) => state.token);

    useEffect(() => {
        setRows(initialData);
    }, [initialData]);

    useEffect(() => {
        const fetchDepartemen = async () => {
            try {
                const response = await fetch(`https://ppm-sooty.vercel.app/api/v1/departemen/`,{
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    } 
                });
                const result = await response.json();const options = result.data.map((dept: any) => ({
                    value: dept.id,
                    label: dept.nama_departemen
                }));
                setDepartemenOptions(options);
                
            } catch (error) {
                console.error("Gagal ambil opsi departemen:", error);
            }
        };
        fetchDepartemen();
    }, []);



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
        const isConfirm = window.confirm("Apakah Anda yakin ingin menghapus jabatan ini?");
        if (!isConfirm) return;

        try {
            const response = await fetch(`https://ppm-sooty.vercel.app/api/v1/jabatan/${id}`, {
                method: 'DELETE',
            });
            const result = await response.json();

            if (response.ok && result.success) {
                alert("Jabatan berhasil dihapus!");
                setRows((prevRows) => prevRows.filter((row) => String(row.id) !== String(id)))
            } else {
                alert(`Gagal hapus: ${result.message}`);
            }
        } catch (error) {
            alert("Gagal menghapus data.");
            alert("Terjadi kesalahan server.");
        }
    };

    // Fungsi penting yang dijalankan MUI setelah data selesai diedit di tabel
    const processRowUpdate = async (newRow: GridRowModel, oldRow: GridRowModel) => {
        const updatedRow = { ...newRow } as JabatanData;
        if (oldRow.nama_jabatan === newRow.nama_jabatan && oldRow.departemen_id === newRow.departemen_id){
            return oldRow; 
        }

        try {
            const response = await fetch (`https://ppm-sooty.vercel.app/api/v1/jabatan/${newRow.id}`, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify({
                    nama_jabatan: newRow.nama_jabatan,
                    departemen_id: Number(newRow.departemen_id) 
                }),
            });
            
            const result = await response.json();

            if (response.ok){
                // Update UI Lokal
                const selectedDeptName = departemenOptions.find(opt => opt.value === Number(newRow.departemen_id))?.label;
                if (selectedDeptName) {
                    updatedRow.departemen = { nama_departemen: selectedDeptName };
                }

                // Perbarui state 'rows'
                setRows((prevRows) => 
                    prevRows.map((row) => (String(row.id) === String(newRow.id) ? updatedRow : row))
                );
                return updatedRow; 
            } else {
                alert(`Jabatan gagal diperbarui: ${result.message}`);
                return oldRow;
            }
        } catch (error) {
            console.error("Error updating jabatan:", error);
            alert("Terjadi kesalahan saat menghubungi server.");
            return oldRow;
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
                <span className="font-medium text-gray-800">{params.value}</span>
            )
        },
        {
            field: 'departemen_id',
            headerName: 'Departemen',
            flex: 1,
            minWidth: 150,
            editable: true,
            type: 'singleSelect',
            valueOptions: departemenOptions,
            renderCell: (params) => {
                let namaDept = params.row.departemen?.nama_departemen;
                if (!namaDept && params.value) {
                    const matchedDept = departemenOptions.find(
                        (opt) => String(opt.value) === String(params.value)
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
    );
}
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    DataGrid, 
    type GridColDef, 
    type GridRowModesModel, 
    GridRowModes, 
    GridActionsCellItem, 
    type GridRowId, 
    type GridRowModel 
} from '@mui/x-data-grid';
import { Pencil, Trash2, Save, X, Eye,} from 'lucide-react';
import type { DepartemenData } from '../../../../types';

// --- INTERFACES ---
interface DepartemenTableProps {
    data?: DepartemenData[];
}

export default function DepartemenTable({ data: initialData = [] }: DepartemenTableProps) {
    const [rows, setRows] = useState<DepartemenData[]>(initialData);
    const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
    const navigate = useNavigate(); // <-- Inisialisasi fungsi navigasi

    useEffect(() => {
        setRows(initialData);
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
       const isConfirm = window.confirm("Yakin gak??")

        if (!isConfirm) return;

        try {
            const response =await fetch(`https://ppm-sooty.vercel.app/api/v1/departemen/${id}`, {
                method:"DELETE"
            });
            const result = await response.json();

            if (response.ok){
                alert("Departemen berhasil dihapus");
                setRows(rows.filter((row) => row.id !== id));
            }else{
                alert(`Gagal hapus: ${result.message}`);
            }
        } catch (error) {
            console.error("Error delete :", error);
            alert("Error server");
        }
    };

    // Fungsi untuk PINDAH HALAMAN lihat karyawan
    const handleViewEmployees = (id: GridRowId) => () => {
        // Mengarahkan user ke halaman detail berdasarkan ID departemen
        navigate(`/dashboard/departemen/${id}`); 
    };

    const processRowUpdate = async (newRow: GridRowModel, oldRow: GridRowModel) => {
        const updatedRow = { ...newRow } as DepartemenData;
        if (oldRow.nama_departemen === newRow.nama_departemen){
            return oldRow;
        }

        try {
            const response = await fetch (`https://ppm-sooty.vercel.app/api/v1/departemen/${newRow.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    nama_departemen: newRow.nama_departemen
                }),
            });

            const result = await response.json();

            if (response.ok){
                setRows(rows.map((row) =>
                (row.id === newRow.id ? updatedRow : row)));
                alert("Departemen berhasil diperbarui!");
                return updatedRow;
            }else{
                alert(`Departemen gagal diperbarui!: ${result.message}`);
                return oldRow;
            }
        } catch (error) {
            console.error("Error updating departemen:", error);
            alert("Terjadi kesalahan saat menghubungi server.");
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
                sx={{
                    border: '1px solid #e5e7eb',
                    '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: '#f3f4f6',
                        color: 'black',
                        fontWeight: 'bold',
                        borderBottom: '1px solid #9ca3af',
                    },
                }}
            />
            
            
        </div>
    );
}
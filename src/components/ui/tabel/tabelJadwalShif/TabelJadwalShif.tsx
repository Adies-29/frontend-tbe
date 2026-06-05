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
import type { JadwalShiftData } from '../../../../types';
import { useAuthStore } from '../../../../store/useAuthStore';




interface TabelJadwalShiftProps {
    data : JadwalShiftData[];
    onRefresh: () => void; 
}

export default function TabelJadwalShift({data: initialData, onRefresh }: TabelJadwalShiftProps) {

    const [rows, setRows] = useState<JadwalShiftData[]>(initialData);
    const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

    const token = useAuthStore((state) => state.token);
    const navigate = useNavigate();
    useEffect(() => {
        setRows(initialData);
    }, [initialData]);

    const handleDeleteClick = (id: GridRowId) => async () => {
        const isConfirm = window.confirm("Apakah anda yakin ingin menghpus data Jadwal & Shift ini ?")
        if (!isConfirm) return;

        try {
            const response = await fetch (`https://ppm-sooty.vercel.app/api/v1/shifts/${id}`, {
                method: "DELETE",
                headers: {"Authorization" : `Bearer ${token}` }
            });
            const result = await response.json()

            if(response.ok && result.success){
                alert("Jadwal & Shift berhasil dihapus")
                setRows((prevRows) => prevRows.filter((row) => String(row.id) !== String(id)))
                onRefresh();
            } else{
                alert(`Gagal hapus : ${result.message}`)
            }
        } catch (error) {
            alert("Gagal menghapus data.");
            console.error("Terjadi kesalahan server:", error);
        }
    };

    const processRowUpdate = async (newRow: GridRowModel, oldRow: GridRowModel) => {
        const updatedRow = {...newRow} as JadwalShiftData;
        if (JSON.stringify(newRow) === JSON.stringify(oldRow)) return oldRow;
        const { kode_shift, jam_masuk, jam_pulang } = updatedRow;

        try {
            const response = await fetch(`https://ppm-sooty.vercel.app/api/v1/shifts/${newRow.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type" : "application/json",
                    "Authorization" : `Bearer ${token}`
                },
                body: JSON.stringify({kode_shift, jam_masuk, jam_pulang}),
            });
            const result = await response.json()

            if(!response.ok && !result.success){
                throw new Error(result.message || "Server Error")
            }

            setRows((prevRows) => prevRows.map((row) => (row.id === newRow.id ? updatedRow : row)));
            return updatedRow;
        } catch (error : any) {
            console.error("Gagal update:", error);
            alert(`Gagal menyimpan perubahan: ${error.message}`);
            throw error;
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
            editable: true,
            renderCell: (params) => <span className="font-bold text-gray-800">{params.value}</span> 
        },
        { 
            field: 'jam_kerja', 
            headerName: 'Jam Kerja', 
            width: 220,
            renderCell: (params) => (
                <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
                    <Clock size={14} />
                    {params.row.jam_masuk} - {params.row.jam_pulang}
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
                <span className="text-red-600 text-sm font-medium">Rp {params.row.denda_terlambat_per_menit} / menit</span> :
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
        <div className="w-full bg-white">
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
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    "& .MuiDataGrid-columnHeaders": {
                        backgroundColor: "#f3f4f6",
                        color: "black",
                        fontWeight: "bold",
                        borderBottom: "1px solid #9ca3af",
                    },
                    "& .MuiDataGrid-cell": {
                        borderBottom: "1px solid #F3F4F6",
                    },
                }}
            />
        </div>
    );
}



import { useEffect, useState } from "react";
import { 
    DataGrid, 
    type GridColDef, 
    type GridRowModesModel, 
    GridRowModes, 
    GridActionsCellItem, 
    type GridRowId, 
    type GridRowModel,

} from "@mui/x-data-grid";
import { Pencil, Save,  X } from "lucide-react";
import type { AbsensiData } from "../../../types";



interface TabelAbsensiProps {
    data: AbsensiData[];
    onRefresh: () => void; 
    
}

export default function TabelDashboard({ data: initialData, onRefresh }: TabelAbsensiProps) {

    // State untuk menyimpan data baris dan mode edit dari MUI DataGrid
    const [rows, setRows] = useState<AbsensiData[]>(initialData);
    const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

    useEffect(() => {
        setRows(initialData);
    }, [initialData]);

    // --- FUNGSI-FUNGSI AKSI ---

    // 1. Mulai Edit (Ikon Pencil)
    const handleEditClick = (id: GridRowId) => () => {
        setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
    };

    // 2. Simpan Edit (Ikon Save)
    const handleSaveClick = (id: GridRowId) => () => {
        setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
    };

    // 3. Batal Edit (Ikon X)
    const handleCancelClick = (id: GridRowId) => () => {
        setRowModesModel({
            ...rowModesModel,
            [id]: { mode: GridRowModes.View, ignoreModifications: true },
        });
    };


    // --- FUNGSI UPDATE DATA KE STATE ---
    const processRowUpdate = async (newRow: GridRowModel) => {
        const updatedRow = { ...newRow } as AbsensiData;
        setRows(rows.map((row) => (row.id === newRow.id ? updatedRow : row)));
        
        console.log("Mencoba simpan data baru:", updatedRow); 
        
        // Nanti di sini tempat kamu naruh fungsi Fetch / Axios metode PUT untuk simpan ke backend
        // Setelah berhasil:
        // onRefresh(); // <--- Ini akan menyuruh Parent langsung narik data ulang (Layar kedip up-to-date!)

        return updatedRow;
    };
    const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
        setRowModesModel(newRowModesModel);
    };

    const columns: GridColDef[] = [
        { field: "id", headerName: "ID", width: 70, align: "center", headerAlign:"center" },
        { field: "nama", headerName: "Nama", flex: 1, minWidth: 150 },
        { field: "waktu_masuk", headerName: "Waktu Masuk", flex: 1, minWidth: 150, align: "center", headerAlign: "center",  },
        {
            field: 'status_masuk',
            headerName: 'Status',
            valueOptions: ["Tepat", "Void", "Terlambat",],
            type: 'singleSelect',
            editable: true,
            flex: 1, 
            minWidth: 120, 
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <span className={`px-3 py-0.5 rounded text-[13px] font-bold text-white ${
                    params.value === "Tepat" ? "bg-green-500" : "bg-red-600"
                }`}>
                    {params.value}
                </span>
            ),
            renderEditCell: (params) => {
                const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
                    params.api.setEditCellValue({ id: params.id, field: params.field, value: e.target.value });
                };
                return (
                    <div className="flex items-center justify-center w-full h-full px-2">
                        <select value={params.value || ""} onChange={handleChange} className="w-full px-2 py-1 text-sm border-2 border-blue-400 rounded outline-none bg-white">
                            <option value="Tepat">Tepat</option>
                            <option value="Terlambat">Terlambat</option>
                        </select>
                    </div>
                );
            }
            
        },
        { field: "waktu_pulang", headerName: "Waktu Pulang", flex: 1, minWidth: 130, align: "center", headerAlign: "center"},
        {
            field: "status_lembur",
            headerName: "Status Lembur",
            valueOptions: ["Lembur", "-",],
            editable: true,
            type: 'singleSelect',
            flex: 1, 
            minWidth: 130,
            align: "center",
            headerAlign: "center",
            renderCell: (params) => {
                if (!params.value) return null;
                return (
                    <span className="px-3 py-0.5 rounded text-[13px] font-bold text-white bg-purple-400">
                        {params.value}
                    </span>
                );
            },
            renderEditCell: (params) => {
                const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
                    params.api.setEditCellValue({ id: params.id, field: params.field, value: e.target.value });
                };
                return (
                    <div className="flex items-center justify-center w-full h-full px-2">
                        <select value={params.value || ""} onChange={handleChange} className="w-full px-2 py-1 text-sm border-2 border-blue-400 rounded outline-none bg-white">
                            <option value="">-</option>
                            <option value="Lembur">Lembur</option>
                        </select>
                    </div>
                );
            }
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
                ];
            },
        },
    ];

    return (
       <div className="w-full bg-white">
            <DataGrid
                showToolbar 
                editMode="row"
                rowModesModel={rowModesModel}
                onRowModesModelChange={handleRowModesModelChange}
                processRowUpdate={processRowUpdate}
                rows={rows}
                columns={columns}
                initialState={{
                    pagination: {
                        paginationModel: {page: 0, pageSize: 5},
                    },
                }}
                pageSizeOptions={[5, 10, 20]}
                disableRowSelectionOnClick
                sx={{
                    border: "1px solid #e5e7eb",
                    "& .MuiDataGrid-columnHeaders" : {
                        backgroundColor: "#f3f4f6",
                        color: "black",
                        fontWeight: "bold",
                        borderBottom: "1px solid #9ca3af",
                    },
                }}
            />
       </div>
    );
}
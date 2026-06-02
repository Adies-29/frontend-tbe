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
import dayjs from "dayjs";
import { useAuthStore } from "../../../store/useAuthStore";



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
        const token = useAuthStore((state) => (state.token));
        setRows(rows.map((row) => (row.id === newRow.id ? updatedRow : row)));
        
        try {
            
            const response = await fetch(`http://localhost:3000/api/v1/absensi/${updatedRow.id}`, {
                method: "PUT", 
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify({
                    status: updatedRow.status_masuk,       
                    lembur: updatedRow.status_lembur,       
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                alert("Gagal menyimpan perubahan ke server!");
                onRefresh(); 
                return newRow; 
            }
            console.log("Sukses update data!", result);
            onRefresh(); 

            return updatedRow;

        } catch (error) {
            console.error("Terjadi kesalahan jaringan:", error);
            alert("Terjadi kesalahan saat menghubungi server.");
            onRefresh(); 
            return newRow;
        }
    };
    const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
        setRowModesModel(newRowModesModel);
    };

    const handleProcessRowUpdateError = (error: Error) => {
        console.error("Gagal menyimpan data baris:", error);
        alert("Gagal mengupdate data! Silakan coba lagi.");
    };

    const formatWaktuAbsen = (time: any) => {
        if (!time || time === "-" || time === "null" || time === "00:00:00") {
            return <span className="text-gray-400 font-bold">-</span>;
        }
        if (typeof time === "string" && time.includes(":")) {
            return <span className="font-semibold text-gray-700">{time.substring(0, 5)}</span>;
        }
        const parsed = dayjs(time);
        if (parsed.isValid()) {
            return <span className="font-semibold text-gray-700">{parsed.format("HH:mm")}</span>;
        }
        return <span className="font-semibold text-gray-700">{time}</span>;
    };

    const columns: GridColDef[] = [
        { field: "id", headerName: "ID", width: 70, align: "center", headerAlign:"center" },
        { field: "nama", headerName: "Nama", flex: 1, minWidth: 150 },
        { 
            field: "waktu_masuk", 
            headerName: "Waktu Masuk",
            flex: 1, 
            minWidth: 150, 
            align: "center", 
            headerAlign: "center",
            renderCell: (params) => formatWaktuAbsen(params.value)
        },
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
        { 
            field: "waktu_pulang", 
            headerName: "Waktu Pulang", 
            flex: 1, 
            minWidth: 130, 
            align: "center", 
            headerAlign: "center",
            renderCell: (params) => formatWaktuAbsen(params.value)
        },
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
        
    ];

    return (
       <div className="w-full bg-white">
            <DataGrid
                showToolbar 
                onProcessRowUpdateError={handleProcessRowUpdateError}
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
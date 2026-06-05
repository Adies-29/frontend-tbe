import { useEffect, useState } from "react";
import { 
    DataGrid, 
    type GridColDef
} from "@mui/x-data-grid";
import type { AbsensiData } from "../../../types";
import dayjs from "dayjs";



interface TabelAbsensiProps {
    data: AbsensiData[];
    onRefresh: () => void; 
    
}

export default function TabelDashboard({ data: initialData }: TabelAbsensiProps) {

    // State untuk menyimpan data baris dan mode edit dari MUI DataGrid
    const [rows, setRows] = useState<AbsensiData[]>(initialData);

    useEffect(() => {
        const timer = setTimeout(() => {
            setRows(initialData);
        }, 0);
        return () => clearTimeout(timer);
    }, [initialData]);

    



    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            
        },
        
    ];

    return (
       <div className="w-full bg-white">
            <DataGrid
                showToolbar
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
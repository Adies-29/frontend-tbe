import { useEffect, useState } from "react";
import {
    DataGrid,
    type GridColDef,
    type GridRowModesModel,

} from "@mui/x-data-grid";
import type { AbsensiData } from "../../../types";
import dayjs from "dayjs";
import { useAuthStore } from "../../../store/useAuthStore";
import { Loader2 } from "lucide-react";




interface TabelAbsensiProps {
    data: AbsensiData[];
    onRefresh: () => void;

}

export default function TabelDashboard({ data: initialData, onRefresh }: TabelAbsensiProps) {

    // State untuk menyimpan data baris dan mode edit dari MUI DataGrid
    const [rows, setRows] = useState<AbsensiData[]>(initialData);
    const [rowModesModel] = useState<GridRowModesModel>({});
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const token = useAuthStore((state) => state.token);

    useEffect(() => {
        const timer = setTimeout(() => {
            setRows(initialData);
        }, 0);
        return () => clearTimeout(timer);
    }, [initialData]);

    const cekKerapihan = async (row: any, newStatus: boolean) =>{
        setUpdatingId(row.id);
        try {
            const hariIni = new Date().toISOString().split("T")[0];

            const payload = {
                pegawai_id: row.id,
                tanggal: hariIni,
                is_kerapian: newStatus
            };

            const response = await fetch("https://ppm-sooty.vercel.app/api/kerapian", {
                method: "PUT",
                headers: {
                    "Content-Type" : "application/json",
                    "Authorization" : `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            console.log("RESPONS BACKEND:", result);
            console.log("PAYLOAD YANG DIKIRIM:", payload);

            if(!response.ok || !result.success){
                throw new Error (result.message || "Gagal memperbarui status kerapihan");
            }
            setRows((prevRows) => 
                prevRows.map((r) => 
                    r.id === row.id ? { ...r, is_kerapian: newStatus } : r
                )
            );

            if (onRefresh){
                onRefresh();
            }
        } catch (error: any) {
            console.error("Gagal update kerapihan:", error);
            alert(`Gagal menyimpan: ${error.message}`);
        } finally{
            setUpdatingId(null);
        }

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
                <span className={`px-3 py-0.5 rounded text-[13px] font-bold text-white ${params.value === "Tepat" ? "bg-green-500" : "bg-red-600"
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
            field: "is_kerapian",
            headerName: "Cek Kerapihan",
            width: 180,
            sortable: false,
            renderCell: (params) => {
                let status = params.row.is_kerapian;
                const isUpdating = updatingId === params.row.id;
                if (params.row.waktu_masuk === "-") {
                    status = null;
                }

                // Jika baris ini sedang mengirim data ke API, tampilkan loading muter
                if (isUpdating) {
                    return (
                        <div className="flex items-center h-full gap-2 text-blue-500">
                            <Loader2 className="animate-spin" size={18} />
                            <span className="text-xs font-semibold">Menyimpan...</span>
                        </div>
                    );
                }
                return (
                    <label className="flex items-center gap-3 cursor-pointer h-full group">
                        <input 
                            type="checkbox" 
                            checked={status === true} 
                            onChange={(e) => cekKerapihan(params.row, e.target.checked)}
                            className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2 cursor-pointer transition-all disabled:opacity-50"
                            disabled={params.row.waktu_masuk === "-"}
                        />
                        
                        {status === true ? (
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold border border-green-200">
                                Rapi
                            </span>
                        ) : status === false ? (
                            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold border border-red-200">
                                Tidak rapi
                            </span>
                        ) : (
                            <span className="text-gray-400 text-xs font-medium italic">
                                Belum dinilai
                            </span>
                        )}
                    </label>
                );
            },
        },
        {
            field: "status_lembur",
            headerName: "Status Lembur",
            valueOptions: ["Lembur", "-",],
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
       
            <DataGrid
                showToolbar
                rowModesModel={rowModesModel}
                rows={rows}
                columns={columns}
                
                initialState={{
                    pagination: {
                        paginationModel: { page: 0, pageSize: 10 },
                    },
                }}
                pageSizeOptions={[10, 20]}
                disableRowSelectionOnClick
                sx={{
                    border: "1px solid #e5e7eb",
                    "& .MuiDataGrid-columnHeaders": {
                        backgroundColor: "#f3f4f6",
                        color: "black",
                        fontWeight: "bold",
                        borderBottom: "1px solid #9ca3af",
                    }, // PENUTUP HEADER DIPERBAIKI DI SINI
                    '& .MuiDataGrid-cell:focus': { outline: 'none' },
                    '& .MuiDataGrid-columnHeader:focus': { outline: 'none' },
                }}
            />
        
    );
}
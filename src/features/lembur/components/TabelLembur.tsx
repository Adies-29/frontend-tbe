import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { Loader2 } from "lucide-react";
import dayjs from "dayjs";

import type { LemburData } from "../../../types";
import { defaultDataGridSx } from "../../../components/common/dataGridStyles";

interface TabelLemburProps {
    data: LemburData[];
    isLoading: boolean;
}

export default function TabelLembur({ data, isLoading }: TabelLemburProps) {
    const columns: GridColDef[] = [
        {
            field: "pegawai_id",
            headerName: "Nama Pegawai",
            flex: 1,
            minWidth: 150,
            renderCell: (params) => {
                const nama = params.row.nama || params.row.pegawai?.nama || `Pegawai ID: ${params.row.pegawai_id}`;
                return (
                    <span className="text-sm font-semibold text-gray-800">
                        {nama}
                    </span>
                );
            }
        },
        {
            field: "tanggal",
            headerName: "Tanggal Lembur",
            flex: 1,
            minWidth: 130,
            align: "center",
            headerAlign: "center",
            renderCell: (params) => {
                const date = dayjs(params.value);
                return (
                    <span className="font-semibold text-gray-700">
                        {date.isValid() ? date.format("DD MMM YYYY") : params.value}
                    </span>
                );
            }
        },
        {
            field: "menit_lembur_diizinkan",
            headerName: "Lama Lembur",
            flex: 1,
            minWidth: 130,
            align: "center",
            headerAlign: "center",
            renderCell: (params) => {
                const jam = Math.floor(params.value / 60);
                const menit = params.value % 60;
                const text = jam > 0 ? `${jam} Jam ${menit > 0 ? `${menit} Mnt` : ""}` : `${menit} Mnt`;
                return (
                    <span className="bg-purple-100 text-purple-700 font-bold px-2 py-1 rounded text-xs">
                        {text}
                    </span>
                );
            }
        },
        {
            field: "alasan_lembur",
            headerName: "Alasan",
            flex: 1.5,
            minWidth: 200,
            renderCell: (params) => (
                <span className="text-gray-600 text-sm italic truncate">
                    {params.value || "-"}
                </span>
            )
        },
        {
            field: "disetujui_oleh",
            headerName: "Disetujui Oleh",
            flex: 1,
            minWidth: 130,
            align: "center",
            headerAlign: "center",
            renderCell: (params) => (
                <span className="font-semibold text-gray-700 text-sm">
                    {params.value || "-"}
                </span>
            )
        }
    ];

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Loader2 className="animate-spin mb-4 text-red-600" size={32} />
                <p>Memuat data lembur...</p>
            </div>
        );
    }

    return (
        <div className="w-full bg-white" style={{ width: "100%", minHeight: "400px" }}>
            <DataGrid
                rows={data}
                columns={columns}
                autoHeight
                disableRowSelectionOnClick
                initialState={{
                    pagination: {
                        paginationModel: { page: 0, pageSize: 10 },
                    },
                }}
                pageSizeOptions={[10, 20]}
                sx={defaultDataGridSx}
            />
        </div>
    );
}
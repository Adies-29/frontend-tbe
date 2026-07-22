import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { defaultDataGridSx } from '../../../components/common/dataGridStyles';
import { useQuery } from "@tanstack/react-query";
import { apiFetchJson } from "../../../utils/apiFetch";
import { AlertCircle } from "lucide-react";

export default function TabelRiwayatKasbon() {
    const riwayatQuery = useQuery({
        queryKey: ['riwayatKasbonList'],
        queryFn: async () => {
            const res = await apiFetchJson('/api/v1/kasbon/riwayat');
            return res.data || [];
        }
    });

    const columns: GridColDef[] = [
        { 
            field: 'tanggal_pembayaran', 
            headerName: 'Tanggal Pembayaran', 
            width: 180,
            renderCell: (params) => (
                <span className="text-gray-600">
                    {new Date(params.value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
            )
        },
        { 
            field: 'kasbon.pegawai.nama', 
            headerName: 'Nama Pegawai', 
            width: 300,
            valueGetter: (_params, row) => row.kasbon?.pegawai?.nama || '-',
            renderCell: (params) => (
                <span className="font-bold text-gray-800">{params.value}</span>
            )
        },
        { 
            field: 'nominal_bayar', 
            headerName: 'Nominal Bayar', 
            width: 200,
            renderCell: (params) => (
                <span className="font-semibold text-emerald-600">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(params.value)}
                </span>
            )
        },
        { 
            field: 'metode_pembayaran', 
            headerName: 'Metode', 
            width: 200,
            renderCell: (params) => (
                <span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-semibold">
                    {params.value || 'Sistem'}
                </span>
            )
        },
        { 
            field: 'keterangan', 
            headerName: 'Keterangan', 
            flex: 1,
            minWidth: 200,
            renderCell: (params) => (
                <span className="text-gray-500 text-sm truncate">{params.value || '-'}</span>
            )
        }
    ];

    if (riwayatQuery.isError) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-red-500 bg-red-50 rounded-xl border border-red-100">
                <AlertCircle size={40} className="mb-2" />
                <p className="font-semibold">Gagal memuat riwayat pembayaran.</p>
                <p className="text-sm">{riwayatQuery.error?.message}</p>
            </div>
        );
    }

    return (
        <div style={{ height: 500, width: '100%' }}>
            <DataGrid
                showToolbar
                rows={riwayatQuery.data || []}
                columns={columns}
                loading={riwayatQuery.isLoading}
                disableRowSelectionOnClick
                sx={defaultDataGridSx}
            />
        </div>
    );
}

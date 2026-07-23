import { useState, useMemo } from "react";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { defaultDataGridSx } from '../../../components/common/dataGridStyles';
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../../utils/apiFetch";
import { useAuthStore } from "../../../store/useAuthStore";
import { AlertCircle, Search } from "lucide-react";

export default function TabelRiwayatKasbon() {
    const token = useAuthStore((state) => state.token);

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStartDate, setFilterStartDate] = useState("");
    const [filterEndDate, setFilterEndDate] = useState("");

    const riwayatQuery = useQuery({
        queryKey: ['riwayatKasbonList'],
        queryFn: async () => {
            const res = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/kasbon/riwayat`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message || "Gagal load data riwayat kasbon");
            return result.data || [];
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

    const filteredRows = useMemo(() => {
        const rawData = riwayatQuery.data || [];
        return rawData.filter((item: any) => {
            const nama = item.kasbon?.pegawai?.nama || "";
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch = !q || nama.toLowerCase().includes(q);

            let matchesDate = true;
            if (item.tanggal_pembayaran) {
                const itemDate = item.tanggal_pembayaran.split("T")[0]; // YYYY-MM-DD
                if (filterStartDate && itemDate < filterStartDate) matchesDate = false;
                if (filterEndDate && itemDate > filterEndDate) matchesDate = false;
            }

            return matchesSearch && matchesDate;
        });
    }, [riwayatQuery.data, searchQuery, filterStartDate, filterEndDate]);

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
        <div className="w-full flex flex-col gap-4">
            
            {/* Control Bar: Search & Date Filter */}
            <div className="p-4 sm:p-5 border border-gray-200 bg-gray-50/70 rounded-xl flex flex-col gap-4">
                
                {/* Baris 1: Search */}
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[240px] max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Cari nama pegawai..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full border border-slate-300 rounded-xl pl-10 pr-9 py-2 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                            >
                                &times;
                            </button>
                        )}
                    </div>
                </div>

                {/* Baris 2: Date Filters */}
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-start pt-2 border-t border-gray-200/80">
                    <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
                        <span className="text-xs font-semibold text-slate-600">Tanggal Pembayaran:</span>
                        <input
                            type="date"
                            value={filterStartDate}
                            onChange={(e) => setFilterStartDate(e.target.value)}
                            className="border border-slate-300 rounded-xl px-3 py-1.5 bg-white text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-slate-500">s/d</span>
                        <input
                            type="date"
                            value={filterEndDate}
                            onChange={(e) => setFilterEndDate(e.target.value)}
                            className="border border-slate-300 rounded-xl px-3 py-1.5 bg-white text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs cursor-pointer"
                        />

                        {/* Reset Button */}
                        {(searchQuery || filterStartDate || filterEndDate) && (
                            <button
                                onClick={() => {
                                    setSearchQuery("");
                                    setFilterStartDate("");
                                    setFilterEndDate("");
                                }}
                                className="text-xs text-red-600 hover:text-red-700 font-bold px-2 py-1 transition-colors duration-150 cursor-pointer"
                            >
                                Reset Filter
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <DataGrid
                rows={filteredRows}
                columns={columns}
                loading={riwayatQuery.isLoading}
                autoHeight
                disableRowSelectionOnClick
                sx={{
                    ...defaultDataGridSx,
                    minHeight: 300,
                    width: '100%'
                }}
            />
        </div>
    );
}

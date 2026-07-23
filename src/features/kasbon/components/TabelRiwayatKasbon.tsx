import { useState, useMemo } from "react";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { defaultDataGridSx } from '../../../components/common/dataGridStyles';
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../../utils/apiFetch";
import { useAuthStore } from "../../../store/useAuthStore";
import { AlertCircle, Search } from "lucide-react";

export default function TabelRiwayatKasbon() {
    const token = useAuthStore((state) => state.token);

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

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Client-side filtering logic
    const filteredData = useMemo(() => {
        const rawData = riwayatQuery.data || [];
        return rawData.filter((item: any) => {
            // 1. Search Query (Nama Karyawan)
            const q = searchQuery.toLowerCase().trim();
            const employeeName = item.kasbon?.pegawai?.nama || "";
            const matchesSearch = !q || employeeName.toLowerCase().includes(q);

            // 2. Date Range Filter (tanggal_pembayaran)
            // By default, if date filters are empty, they are inactive (matchesDate = true)
            let matchesDate = true;
            if (item.tanggal_pembayaran) {
                const itemDate = new Date(item.tanggal_pembayaran).toISOString().split('T')[0];
                if (startDate && endDate) {
                    matchesDate = itemDate >= startDate && itemDate <= endDate;
                } else if (startDate) {
                    matchesDate = itemDate >= startDate;
                } else if (endDate) {
                    matchesDate = itemDate <= endDate;
                }
            }

            return matchesSearch && matchesDate;
        });
    }, [riwayatQuery.data, searchQuery, startDate, endDate]);

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
        <div className="w-full bg-white flex flex-col gap-4">
            
            {/* Control Bar: Search & Date Filters */}
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
                    <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500">Dari:</span>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="border border-slate-300 rounded-xl px-3 py-1.5 bg-white text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs cursor-pointer"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500">Sampai:</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="border border-slate-300 rounded-xl px-3 py-1.5 bg-white text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs cursor-pointer"
                            />
                        </div>

                        {/* Reset Button */}
                        {(searchQuery || startDate || endDate) && (
                            <button
                                onClick={() => {
                                    setSearchQuery("");
                                    setStartDate("");
                                    setEndDate("");
                                }}
                                className="text-xs text-red-600 hover:text-red-700 font-bold px-2 py-1 transition-colors duration-150 cursor-pointer"
                            >
                                Reset Filter
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ height: 500, width: '100%' }}>
                <DataGrid
                    rows={filteredData}
                    columns={columns}
                    loading={riwayatQuery.isLoading}
                    disableRowSelectionOnClick
                    sx={defaultDataGridSx}
                />
            </div>
        </div>
    );
}

import { useState, useMemo } from "react";
import { DataGrid, type GridColDef, GridActionsCellItem, type GridRowId } from "@mui/x-data-grid";
import { Trash2, Banknote, Search } from "lucide-react";
import { defaultDataGridSx } from '../../../components/common/dataGridStyles';
import ConfirmPopUp from '../../../components/common/ConfirmPopUp';
import Notif from '../../../components/common/Notif';

interface TabelKasbonProps {
    data: any[];
    isLoading?: boolean;
    onDelete: (id: number) => void;
    onStatusChange?: (id: number, newStatus: string) => void;
    onBayar?: (kasbon: any) => void;
}

export default function TabelKasbon({ data, isLoading = false, onDelete, onStatusChange, onBayar }: TabelKasbonProps) {
    const [showPopUp, setShowPopUp] = useState(false);
    const [hapusId, setHapusId] = useState<GridRowId | null>(null);
    const [notif, setNotif] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
        show: false,
        message: "",
        type: "success"
    });

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Client-side filtering logic
    const filteredData = useMemo(() => {
        return data.filter((item) => {
            // 1. Search Query (Nama Pegawai)
            const q = searchQuery.toLowerCase().trim();
            const employeeName = item.pegawai?.nama || "";
            const matchesSearch = !q || employeeName.toLowerCase().includes(q);

            // 2. Date Range Filter (tanggal_pengajuan)
            // By default, if date filters are empty, they are inactive (matchesDate = true)
            let matchesDate = true;
            if (item.tanggal_pengajuan) {
                const itemDate = new Date(item.tanggal_pengajuan).toISOString().split('T')[0];
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
    }, [data, searchQuery, startDate, endDate]);

    const handleDeleteClick = (id: GridRowId) => () => {
        setHapusId(id);
        setShowPopUp(true);
    };

    const confirmDelete = () => {
        if (hapusId) {
            onDelete(Number(hapusId));
            setNotif({ show: true, message: "Data kasbon berhasil dihapus", type: "success" });
        }
        setShowPopUp(false);
        setHapusId(null);
    };

    const columns: GridColDef[] = [
        { 
            field: 'tanggal_pengajuan', 
            headerName: 'Tanggal Penajuan', 
            width: 160,
            renderCell: (params) => (
                <span className="text-gray-600">
                    {new Date(params.value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
            )
        },
        { 
            field: 'pegawai.nama', 
            headerName: 'Nama Pegawai', 
            width: 180,
            valueGetter: (_params, row) => row.pegawai?.nama || '-',
            renderCell: (params) => (
                <span className="font-bold text-gray-800">{params.value}</span>
            )
        },
        { 
            field: 'nominal_pinjaman', 
            headerName: 'Nominal Pinjaman', 
            width: 160,
            renderCell: (params) => (
                <span className="font-semibold text-emerald-600">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(params.value)}
                </span>
            )
        },
        { 
            field: 'persentase_cicilan', 
            headerName: 'Tenor', 
            width: 100,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-bold">
                    {params.value}%
                </span>
            )
        },
        { 
            field: 'nominal_cicilan_per_gajian', 
            headerName: 'Cicilan / Minggu', 
            width: 160,
            renderCell: (params) => {
                return (
                    <span className="font-semibold text-red-600">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(params.value)}
                    </span>
                );
            }
        },
        { 
            field: 'sisa_pinjaman', 
            headerName: 'Sisa Pinjaman', 
            width: 160,
            renderCell: (params) => {
                const sisa = params.value || 0;
                if (sisa > 0) {
                    return (
                        <span className="font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-md text-xs border border-orange-100">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(sisa)}
                        </span>
                    );
                } else if (sisa === 0 && params.row.status === 'Lunas') {
                     return (
                        <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-xs border border-blue-100">
                            Rp 0 (Lunas)
                        </span>
                    );
                }
                return <span className="text-gray-400">-</span>;
            }
        },
        { 
            field: 'keterangan_pinjaman', 
            headerName: 'Keterangan', 
            flex: 1,
            minWidth: 200,
            renderCell: (params) => (
                <span className="text-gray-500 text-sm truncate">{params.value || '-'}</span>
            )
        },
        { 
            field: 'status', 
            headerName: 'Status', 
            width: 140,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => {
                const statusValue = params.value || 'Pending';
                
                // Fungsi untuk menentukan warna badge berdasarkan status
                const getBadgeColor = (status: string) => {
                    switch(status.toLowerCase()) {
                        case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
                        case 'disetujui': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
                        case 'ditolak': return 'bg-red-100 text-red-700 border-red-200';
                        case 'lunas': return 'bg-blue-100 text-blue-700 border-blue-200';
                        default: return 'bg-gray-100 text-gray-700 border-gray-200';
                    }
                };

                return (
                    <div className="flex items-center justify-center w-full h-full">
                        <select 
                            value={statusValue}
                            onChange={(e) => onStatusChange && onStatusChange(params.row.id, e.target.value)}
                            className={`px-3 py-1 text-xs font-bold rounded-full w-full outline-none cursor-pointer border ${getBadgeColor(statusValue)} text-center capitalize transition-colors`}
                            style={{ textAlignLast: 'center' }}
                        >
                            <option value="Pending" className="bg-white text-black text-left">Pending</option>
                            <option value="Disetujui" className="bg-white text-black text-left">Disetujui</option>
                            <option value="Ditolak" className="bg-white text-black text-left">Ditolak</option>
                            <option value="Lunas" className="bg-white text-black text-left">Lunas</option>
                        </select>
                    </div>
                );
            }
        },
        {
            field: 'actions',
            type: 'actions', 
            headerName: 'Aksi',
            width: 120,
            cellClassName: 'actions',
            getActions: (params) => {
                const actions = [];
                
                // Hanya munculkan tombol bayar jika status Disetujui
                if (params.row.status === 'Disetujui' && params.row.sisa_pinjaman > 0) {
                    actions.push(
                        <GridActionsCellItem
                            key="bayar"
                            icon={<Banknote size={20} className="text-emerald-600" />}
                            label="Bayar Kasbon"
                            onClick={() => onBayar && onBayar(params.row)}
                            className="min-w-[44px] min-h-[44px] p-2 hover:bg-emerald-50 rounded-full transition-colors"
                            color="inherit"
                        />
                    );
                }

                actions.push(
                    <GridActionsCellItem
                        key="delete"
                        icon={<Trash2 size={20} className="text-gray-600 hover:text-red-600" />}
                        label="Hapus"
                        onClick={handleDeleteClick(params.id)}
                        className="min-w-[44px] min-h-[44px] p-2 hover:bg-red-50 rounded-full transition-colors"
                        color="inherit"
                    />
                );

                return actions;
            }
        }
    ];

    // Urutkan data: yang Lunas taruh paling bawah
    const sortedData = [...filteredData].sort((a, b) => {
        if (a.status === 'Lunas' && b.status !== 'Lunas') return 1;
        if (a.status !== 'Lunas' && b.status === 'Lunas') return -1;
        
        // Opsional: Urutkan berdasarkan tanggal terbaru jika statusnya sama
        return new Date(b.tanggal_pengajuan).getTime() - new Date(a.tanggal_pengajuan).getTime();
    });

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
                    rows={sortedData}
                    columns={columns}
                    loading={isLoading}
                    disableRowSelectionOnClick
                    sx={defaultDataGridSx}
                />
            </div>

            <ConfirmPopUp
                isOpen={showPopUp}
                title="Hapus Data Kasbon"
                message="Apakah Anda yakin ingin menghapus data pinjaman ini? Data yang sudah dihapus tidak dapat dikembalikan."
                onConfirm={confirmDelete}
                onClose={() => setShowPopUp(false)}
            />

            <Notif
                show={notif.show}
                message={notif.message}
                type={notif.type}
                onClose={() => setNotif({ show: false, message: "", type: "success" })}
            />
        </div>
    );
}

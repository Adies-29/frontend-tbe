import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { Box } from '@mui/material';
import { Info } from 'lucide-react';

// Pindahkan fungsi formatRupiah ke sini agar komponen ini mandiri
const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
};

// Ubah nama interface dari PayrollData ke RekapGajiData
export interface RekapGajiData {
    id: number | string;
    nama: string;
    jabatan: string;
    gaji_dasar: number;
    total_bonus: number;
    total_potongan: number;
    gaji_bersih: number;
    status: string;
    periode_tanggal?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rincian_bonus?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rincian_potongan?: any;
}

interface TabelRekapGajiProps {
    data: RekapGajiData[];
    onPelunasan: (id: string) => void;
    onShowDetail?: (row: RekapGajiData, type: 'bonus' | 'potongan') => void;
}

// Ekstrak onPelunasan dan onShowDetail dari props di sini
export const TabelRekapGaji = ({ data, onPelunasan, onShowDetail }: TabelRekapGajiProps) => {

    // Definisi Kolom Tabel Rekap Gaji
    const columns: GridColDef[] = [
        { field: 'nama', headerName: 'Nama Pegawai', flex: 1, minWidth: 180, renderCell: (params) => <span className="font-semibold text-gray-800">{params.value}</span> },
        { field: 'jabatan', headerName: 'Jabatan', flex: 1, minWidth: 120 },
        { field: 'gaji_dasar', headerName: 'Gaji Dasar', flex: 1, minWidth: 140, renderCell: (params) => formatRupiah(params.value) },
        { 
            field: 'total_bonus', 
            headerName: 'Bonus & Tunjangan', 
            flex: 1, 
            minWidth: 170, 
            renderCell: (params) => (
                <div className="w-full flex items-center h-full py-1">
                    <button 
                        onClick={() => onShowDetail?.(params.row as RekapGajiData, 'bonus')}
                        className="w-full flex justify-between items-center gap-1 font-semibold text-green-700 hover:text-green-900 bg-green-50 hover:bg-green-100/90 px-3 py-1.5 rounded-lg transition-colors border border-green-200/80 shadow-2xs group cursor-pointer"
                        title="Klik untuk melihat rincian bonus"
                    >
                        <span>+{formatRupiah(params.value)}</span>
                        <Info size={14} className="text-green-500 group-hover:text-green-700 shrink-0" />
                    </button>
                </div>
            ) 
        },
        { 
            field: 'total_potongan', 
            headerName: 'Potongan (Denda)', 
            flex: 1, 
            minWidth: 170, 
            renderCell: (params) => (
                <div className="w-full flex items-center h-full py-1">
                    <button 
                        onClick={() => onShowDetail?.(params.row as RekapGajiData, 'potongan')}
                        className="w-full flex justify-between items-center gap-1 font-semibold text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100/90 px-3 py-1.5 rounded-lg transition-colors border border-red-200/80 shadow-2xs group cursor-pointer"
                        title="Klik untuk melihat rincian potongan"
                    >
                        <span>-{formatRupiah(params.value)}</span>
                        <Info size={14} className="text-red-500 group-hover:text-red-700 shrink-0" />
                    </button>
                </div>
            ) 
        },
        { field: 'gaji_bersih', headerName: 'Take Home Pay', flex: 1, minWidth: 160, renderCell: (params) => <span className="font-bold text-blue-700">{formatRupiah(params.value)}</span> },
        { 
            field: 'status', 
            headerName: 'Status / Aksi', 
            minWidth: 150, 
            sortable: false,
            renderCell: (params) => {
                const isLunas = params.value === 'Lunas';
                
                if (isLunas) {
                    return (
                        <div className="flex items-center h-full">
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">
                                Lunas
                            </span>
                        </div>
                    );
                }

                return (
                    <div className="flex items-center h-full">
                        <button 
                            onClick={() => onPelunasan(String(params.row.id))}
                            className="bg-amber-100 hover:bg-amber-200 text-amber-700 px-3 py-1 rounded text-xs font-bold transition-colors border border-amber-300 shadow-sm"
                        >
                            Tandai Lunas
                        </button>
                    </div>
                );
            } 
        },
    ];

    return (
        <Box sx={{
            height: 400,
            width: '100%',
            '& .MuiDataGrid-root': { border: 'none' },
            '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' },
            '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' } // Memastikan isi sel rata tengah vertikal
        }}>
            <DataGrid
                rows={data}
                columns={columns}
                initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                pageSizeOptions={[ 10, 25]}
                disableRowSelectionOnClick
            />
        </Box>
    );
};
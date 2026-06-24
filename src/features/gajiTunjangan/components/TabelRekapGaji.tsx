import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { Box } from '@mui/material';

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
}

interface TabelRekapGajiProps { 
    data: RekapGajiData[]; 
    onPelunasan: (id: string) => void; 
}

// Ekstrak onPelunasan dari props di sini
export const TabelRekapGaji = ({ data, onPelunasan }: TabelRekapGajiProps) => {
    
    // Definisi Kolom Tabel Rekap Gaji
    const columns: GridColDef[] = [
        { field: 'nama', headerName: 'Nama Pegawai', flex: 1, renderCell: (params) => <span className="font-semibold text-gray-800">{params.value}</span> },
        { field: 'jabatan', headerName: 'Jabatan', flex: 1 },
        { field: 'gaji_dasar', headerName: 'Gaji Dasar', width: 130, renderCell: (params) => formatRupiah(params.value) },
        { field: 'total_bonus', headerName: 'Bonus & Tunjangan', width: 150, renderCell: (params) => <span className="text-green-600">+{formatRupiah(params.value)}</span> },
        { field: 'total_potongan', headerName: 'Potongan (Denda)', width: 150, renderCell: (params) => <span className="text-red-600">-{formatRupiah(params.value)}</span> },
        { field: 'gaji_bersih', headerName: 'Take Home Pay', width: 150, renderCell: (params) => <span className="font-bold text-blue-700">{formatRupiah(params.value)}</span> },
        
        // ==========================================================
        // FITUR BARU: KOLOM STATUS DAN AKSI PELUNASAN
        // ==========================================================
        { 
            field: 'status', 
            headerName: 'Status / Aksi', 
            width: 140, 
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
                initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
                pageSizeOptions={[5, 10, 25]}
                disableRowSelectionOnClick
            />
        </Box>
    );
};
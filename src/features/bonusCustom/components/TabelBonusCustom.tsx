import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { Box } from '@mui/material';
import { Trash2 } from 'lucide-react';

const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
};

export interface BonusCustomData {
    id: string;
    nama_pegawai: string;
    tanggal_diberikan: string;
    keterangan: string;
    nominal: number;
}

interface TabelBonusCustomProps {
    data: BonusCustomData[];
    onDelete: (id: string) => void;
}

export const TabelBonusCustom = ({ data, onDelete }: TabelBonusCustomProps) => {
    
    const columns: GridColDef[] = [
        { field: 'tanggal_diberikan', headerName: 'Tanggal', width: 100, },
        { field: 'nama_pegawai', headerName: 'Nama Pegawai',width: 130, renderCell: (params) => <span className="font-semibold text-gray-800">{params.value}</span> },
        { field: 'keterangan', headerName: 'Keterangan Bonus', width:155 },
        { field: 'nominal', headerName: 'Nominal', width: 150, renderCell: (params) => <span className="font-bold text-green-600">+{formatRupiah(params.value)}</span> },
        { 
            field: 'aksi', 
            headerName: 'Aksi', 
            width: 100, 
            sortable: false,
            renderCell: (params) => (
                <button 
                    onClick={() => onDelete(String(params.row.id))}
                    className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors mt-2"
                    title="Hapus Bonus"
                >
                    <Trash2 size={16} />
                </button>
            ) 
        },
    ];

    return (
        <Box sx={{ 
            height: 400, 
            width: '100%', 
            '& .MuiDataGrid-root': { border: 'none' },
            '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' },
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
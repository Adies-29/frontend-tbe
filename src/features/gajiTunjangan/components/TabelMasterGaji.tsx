import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { Box } from '@mui/material';
import { Settings } from 'lucide-react';

// Export interface agar bisa dipakai sebagai tipe data di GajiTunjanganIndex
export interface MasterGajiData {
    id: number | string;
    nama_jabatan: string;
    departemen: string;
}

interface TabelMasterGajiProps {
    data: MasterGajiData[];
    onAturGaji: (id: number | string) => void;
}

export const TabelMasterGaji = ({ data, onAturGaji }: TabelMasterGajiProps) => {
    // Definisi Kolom Tabel Master Gaji
    const columns: GridColDef[] = [
        {
            field: 'nama_jabatan',
            headerName: 'Nama Jabatan',
            flex: 1,
            minWidth: 180,
            renderCell: (params) => <span className="font-semibold text-gray-800">{params.value}</span>
        },
        {
            field: 'departemen',
            headerName: 'Departemen',
            flex: 1,
            minWidth: 180,
            renderCell: (params) => {
                const namaDept = params.value;
                return (
                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                        {namaDept && namaDept !== "-" ? namaDept : "--"}
                    </span>
                );
            } 
        },
        {
            field: 'aksi',
            headerName: 'Aksi',
            minWidth: 150,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <button

                    onClick={() => {

                        onAturGaji(params.row.id);
                    }}

                    className="w-25 flex justify-center items-center gap-1  text-yellow-500 px-2 hover:text-yellow-800 cursor-pointer semibold "
                >
                    <Settings size={16} /> Atur Gaji
                </button>
            )
        }
    ];

    return (
        <Box sx={{
                width: '100%',
                '& .MuiDataGrid-root': { border: 'none' },
                '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }
            }}>
                <DataGrid
                    showToolbar
                    autoHeight
                    rows={data}
                    columns={columns}
                    initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                    pageSizeOptions={[10, 25]}
                    disableRowSelectionOnClick
                />
            </Box>
    );
};
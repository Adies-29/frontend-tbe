import { useState } from "react";
import { DataGrid, type GridColDef, GridActionsCellItem, type GridRowId } from "@mui/x-data-grid";
import { Trash2 } from "lucide-react";
import { defaultDataGridSx } from '../../../components/common/dataGridStyles';
import ConfirmPopUp from '../../../components/common/ConfirmPopUp';
import Notif from '../../../components/common/Notif';

interface TabelKasbonProps {
    data: any[];
    isLoading?: boolean;
    onDelete: (id: number) => void;
    onStatusChange?: (id: number, newStatus: string) => void;
}

export default function TabelKasbon({ data, isLoading = false, onDelete, onStatusChange }: TabelKasbonProps) {
    const [showPopUp, setShowPopUp] = useState(false);
    const [hapusId, setHapusId] = useState<GridRowId | null>(null);
    const [notif, setNotif] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
        show: false,
        message: "",
        type: "success"
    });

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
            width: 80,
            getActions: ({ id }) => {
                return [
                    <GridActionsCellItem
                        key="delete"
                        icon={<Trash2 size={18} className="text-red-500 hover:text-red-700" />}
                        label="Hapus"
                        onClick={handleDeleteClick(id)}
                        className="textPrimary"
                    />
                ];
            }
        }
    ];

    return (
        <div style={{ height: 500, width: '100%' }}>
            <DataGrid
                rows={data}
                columns={columns}
                loading={isLoading}
                disableRowSelectionOnClick
                sx={defaultDataGridSx}
            />

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

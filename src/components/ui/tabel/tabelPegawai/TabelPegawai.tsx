import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from "react";
import { 
    DataGrid, 
    type GridColDef, 
    type GridRowModesModel,  
    GridActionsCellItem, 
    type GridRowId, 
    type GridRowModel,

} from "@mui/x-data-grid";
import { Pencil, Trash2 } from "lucide-react";
import { useAuthStore } from '../../../../store/useAuthStore';
import type { PegawaiData } from '../../../../types';


interface TabelPegawaiProps {
    data: PegawaiData[];
    onRefresh: () => void; 
}



export default function TabelPegawai({ data: initialData, onRefresh  }: TabelPegawaiProps) {

    // State untuk menyimpan data baris dan mode edit dari MUI DataGrid
    const [rows, setRows] = useState<PegawaiData[]>(initialData);
    const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

    const token = useAuthStore((state) => state.token);
    const navigate = useNavigate();

    useEffect(() => {
        setRows(initialData);
    }, [initialData]);

    // --- FUNGSI-FUNGSI AKSI ---

    // 4. Hapus Data (Ikon Tempat Sampah)
    const handleDeleteClick = (id: GridRowId) => async () => {
        const isConfirm = window.confirm("Apakah Anda yakin ingin menghapus data pegawai ini?");
        if (!isConfirm) return;

        try {
            const response = await fetch(`https://ppm-sooty.vercel.app/api/v1/pegawai/${id}`, {
                method: 'DELETE',
                headers: { "Authorization" : `Bearer ${token}` }
            });
            const result = await response.json();

            if (response.ok && result.success) {
                alert("Pegawai berhasil dihapus!");
                setRows((prevRows) => prevRows.filter((row) => String(row.id) !== String(id)))
                onRefresh();
            } else {
                alert(`Gagal hapus: ${result.message}`);
            }
        } catch (error) {
            alert("Gagal menghapus data.");
            console.error("Terjadi kesalahan server:", error);
        }
    };

        
    const processRowUpdate = async (newRow: GridRowModel, oldRow: GridRowModel) => {
        const updatedRow = { ...newRow } as PegawaiData;
        if (JSON.stringify(newRow) === JSON.stringify(oldRow)) return oldRow;
        const { no_hp, email, masakerja } = updatedRow;

        try {
            const response = await fetch(`https://ppm-sooty.vercel.app/api/v1/pegawai/${newRow.id}`, {
                method:"PUT",
                headers:{
                    "Content-Type" : "application/json",
                    "Authorization" : `Bearer ${token}`, 
                },
                body: JSON.stringify({ no_hp, email, masakerja }), 
            });
            const result = await response.json()
            if(!response.ok && !result.success){
                throw new Error(result.message || "Server Menolak")
            }
            setRows((prevRows) => prevRows.map((row) => (row.id === newRow.id ? updatedRow : row)));
            return updatedRow;

        } catch (error: any) {
            console.error("Gagal update:", error);
            alert(`Gagal menyimpan perubahan: ${error.message}`);
            throw error; // Wajib di-throw agar MUI membatalkan ketikan di layar
        }
    };

    const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
        setRowModesModel(newRowModesModel);
    };

    const departemenOption = Array.from(
        new Set(
            initialData
                .map((item) => item.jabatan?.departemen?.nama_departemen)
                .filter(Boolean)
        )
    ) as string[];
    const jabatanOption = Array.from(
        new Set(
            initialData
                .map((item) => item.jabatan?.nama_jabatan)
                .filter(Boolean)
        )
    ) as string[];
  

    // --- DEFINISI KOLOM ---
    const columns: GridColDef[] = [
        { field: 'id', headerName: 'Id', width: 70 },
        { field: 'nik', headerName: 'NIK', width: 160 },
        {
            field: 'nama',
            headerName: 'Nama',
            flex: 1,
            minWidth: 150,
            renderCell: (params) => {
                return (
                    <button
                        // Arahkan ke halaman detail berdasarkan ID karyawan
                        onClick={() => navigate(`/dashboard/data-pegawai/${params.row.id}`)}
                        className="text-black hover:text-red-700 hover:underline font-semibold text-left transition-colors"
                    >
                        {params.value}
                    </button>
                );
            }
        },
        { field: 'no_hp', headerName: 'No. HP', width: 140, editable: true }, 
        { field: 'email', headerName: 'Email', minWidth: 180, editable: true },
        { 
            field: 'departemen', 
            headerName: 'Departemen', 
            flex: 1, 
            minWidth: 130, 
            editable: true, 
            valueOptions: departemenOption,
            type: 'singleSelect',
            valueGetter: (_value, row) => row?.jabatan?.departemen?.nama_departemen || "-",
            renderCell: (params) => {
                const namaDept = params.row.jabatan?.departemen?.nama_departemen;
                return namaDept ? <span>{namaDept}</span> : <span className="text-gray-400">-</span>;
            } 
        },
        { 
            field: 'jabatan', 
            headerName: 'Jabatan', 
            editable: true,
            flex: 1, 
            type: 'singleSelect',
            valueOptions: jabatanOption,
            minWidth: 150,
            valueGetter: (_value, row) => row.jabatan?.nama_jabatan || "-",
            renderCell: (params) => {
                return (
                    <span className="font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                        {params.row.jabatan?.nama_jabatan || "Belum ada jabatan"}
                    </span>
                );
            }
        },
        { 
            field: 'shift', 
            headerName: 'Shift', 
            width: 120, 
            align: 'center', 
            headerAlign: 'center', 
            editable: true, 
            type: 'singleSelect',
            renderCell: (params) => {
                const namaShift = params.row.shifts?.kode_shift;
                return namaShift ? <span>{namaShift}</span> : <span className="text-gray-400">-</span>;
            } 
        },
        { 
            field: 'tanggal_bergabung', 
            headerName: 'Tgl Bergabung', 
            width: 130,
            valueGetter: (_params, row) => {
                // Pastikan mengecek nama field yang baru juga
                if (!row.tanggal_bergabung) return "-";
                const date = new Date(row.tanggal_bergabung);
                return date.toLocaleDateString('id-ID');
            }
        },
        { field: 'masakerja', headerName: 'Masa Kerja', flex: 1, minWidth: 130, align: 'center', headerAlign: 'center' },
        {
            field: 'actions',
            type: 'actions', 
            headerName: 'Aksi',
            width: 100,
            cellClassName: 'actions',
            getActions: ({ id }) => {


                // Jika mode NORMAL, tampilkan Pencil dan Trash
                return [
                    <GridActionsCellItem
                        icon={<Pencil size={18} className="text-gray-600 hover:text-black" />}
                        label="Edit"
                        className="textPrimary"
                        onClick={() => navigate(`/dashboard/data-pegawai/edit/${id}`)}
                        color="inherit"
                    />,
                    <GridActionsCellItem
                        icon={<Trash2 size={18} className="text-gray-600 hover:text-red-600" />}
                        label="Delete"
                        onClick={handleDeleteClick(id)}
                        color="inherit"
                    />,
                ];
            },
        },
    ];

    return (
        <div className="w-full bg-white">
            <DataGrid
                showToolbar
                autoHeight
                rows={rows}
                columns={columns}
                rowModesModel={rowModesModel}
                onRowModesModelChange={handleRowModesModelChange}
                processRowUpdate={processRowUpdate}
                onProcessRowUpdateError={(error) => console.error("Gagal update baris:", error)}
                initialState={{
                    pagination: {
                        paginationModel: { page: 0, pageSize: 10 },
                    },
                    columns: {
                        columnVisibilityModel: {
                            id: false,         // Sembunyikan ID
                            nik: false,        // Sembunyikan NIK (karena panjang banget)
                            pin_mesin: false,  // Sembunyikan PIN (cuma butuh pas mau sinkron mesin)
                        },
                    },
                }}
                pageSizeOptions={[10, 20]}
                disableRowSelectionOnClick
                sx={{
                    border: "1px solid #e5e7eb",
                    "& .MuiDataGrid-columnHeaders": {
                        backgroundColor: "#f3f4f6",
                        color: "black",
                        fontWeight: "bold",
                        borderBottom: "1px solid #9ca3af",
                    },
                }}
            />
        </div>
    );
}
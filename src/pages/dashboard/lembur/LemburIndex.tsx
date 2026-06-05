import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { Loader2, PlusCircle, Coffee } from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";

export default function LemburIndex() {
    const [rows, setRows] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const token = useAuthStore((state) => state.token);

    // ==========================================
    // 1. FUNGSI TARIK DATA LEMBUR DARI BACKEND
    // ==========================================
    const fetchLemburData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Catatan: Pastikan endpoint URL ini sudah dibuat oleh Mas Afin
            const response = await fetch("https://ppm-sooty.vercel.app/api/lembur/spl", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Formatting data dari backend agar cocok dengan MUI DataGrid
                const formattedRows = result.data.map((item: any, index: number) => ({
                    id: item.id || index + 1,
                    nama_pegawai: item.pegawai?.nama || "Tanpa Nama", // Asumsi backend mengirim relasi nama pegawai
                    tanggal: item.tanggal,
                    durasi: `${item.menit_lembur_diizinkan} Menit`,
                    alasan: item.alasan_lembur || "-",
                    disetujui_oleh: item.disetujui_oleh || "-"
                }));

                setRows(formattedRows);
            }
        } catch (error) {
            console.error("Gagal menarik data lembur:", error);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    // Panggil fungsi tarik data saat komponen dimuat
    useEffect(() => {
        fetchLemburData();
    }, [fetchLemburData]);

    // ==========================================
    // 2. DEFINISI KOLOM TABEL (MUI DATAGRID)
    // ==========================================
    const columns: GridColDef[] = [
        { field: "nama_pegawai", headerName: "Nama Pegawai", flex: 1, minWidth: 150 },
        { field: "tanggal", headerName: "Tanggal Lembur", width: 150 },
        { 
            field: "durasi", 
            headerName: "Durasi (Menit)", 
            width: 150,
            renderCell: (params) => (
                <span className="bg-yellow-100 text-yellow-800 font-bold px-2 py-1 rounded text-xs">
                    {params.value}
                </span>
            )
        },
        { field: "alasan", headerName: "Alasan Lembur", flex: 1, minWidth: 200 },
        { field: "disetujui_oleh", headerName: "Disetujui Oleh", width: 150 },
    ];

    return (
        <div className="flex flex-col gap-6 w-full">
            {/* HEADER BAGIAN ATAS */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-red-100 p-2 rounded-lg text-red-600">
                        <Coffee size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Data Otorisasi Lembur</h1>
                        <p className="text-sm text-gray-500">Kelola riwayat dan surat perintah lembur karyawan</p>
                    </div>
                </div>

                {/* TOMBOL BUAT SPL BARU */}
                <Link 
                    to="/dashboard/lembur/create" 
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm"
                >
                    <PlusCircle size={20} />
                    Buat SPL Baru
                </Link>
            </div>

            {/* AREA TABEL */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm w-full min-h-[400px] p-4 md:p-6">
                {isLoading ? (
                    <div className="flex justify-center items-center py-20 text-blue-600 font-semibold gap-2">
                        <Loader2 className="animate-spin" size={24} /> Memuat data lembur...
                    </div>
                ) : (
                    <DataGrid
                        rows={rows}
                        columns={columns}
                        initialState={{
                            pagination: { paginationModel: { pageSize: 10 } },
                        }}
                        pageSizeOptions={[10, 25, 50]}
                        disableRowSelectionOnClick
                        autoHeight
                        sx={{
                            "& .MuiDataGrid-columnHeaders": { backgroundColor: "#f9fafb", fontWeight: "bold" },
                            "& .MuiDataGrid-cell": { display: "flex", alignItems: "center" },
                            border: 0,
                        }}
                    />
                )}
            </div>
        </div>
    );
}
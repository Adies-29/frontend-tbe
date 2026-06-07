import { useEffect, useState } from "react";
import {
    DataGrid,
    type GridColDef,
    type GridRowModesModel,

} from "@mui/x-data-grid";
import type { AbsensiData } from "../../../types";
import dayjs from "dayjs";
import { useAuthStore } from "../../../store/useAuthStore";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import ButtonNuklir from "../ButtonNuklir";
import { useMediaQuery, useTheme } from "@mui/material";




interface TabelAbsensiProps {
    data: AbsensiData[];
    onRefresh: () => void;

}

export default function TabelDashboard({ data: initialData, onRefresh }: TabelAbsensiProps) {

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm')); 

    // State untuk menyimpan data baris dan mode edit dari MUI DataGrid
    const [rows, setRows] = useState<AbsensiData[]>(initialData);
    const [rowModesModel] = useState<GridRowModesModel>({});
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const token = useAuthStore((state) => state.token);
    const navigate = useNavigate();
    const location = useLocation();

    const [isNuklirOpen, setIsNuklirOpen] = useState(false);
    const [targetNuklir, setTargetNuklir] = useState({ id: "", nama: "" });

    const isTvMode = location.pathname === '/tv';
    useEffect(() => {
        const timer = setTimeout(() => {
            setRows(initialData);
        }, 0);
        return () => clearTimeout(timer);
    }, [initialData]);

    const cekKerapihan = async (row: any, newStatus: boolean) => {
        setUpdatingId(row.id);
        try {
            const hariIni = new Date().toISOString().split("T")[0];

            const payload = {
                pegawai_id: row.id,
                tanggal: hariIni,
                is_kerapian: newStatus
            };

            const response = await fetch("https://ppm-sooty.vercel.app/api/kerapian", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            console.log("RESPONS BACKEND:", result);
            console.log("PAYLOAD YANG DIKIRIM:", payload);

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Gagal memperbarui status kerapihan");
            }
            setRows((prevRows) =>
                prevRows.map((r) =>
                    r.id === row.id ? { ...r, is_kerapian: newStatus } : r
                )
            );

            if (onRefresh) {
                onRefresh();
            }
        } catch (error: any) {
            console.error("Gagal update kerapihan:", error);
            alert(`Gagal menyimpan: ${error.message}`);
        } finally {
            setUpdatingId(null);
        }

    };

    const handleBukaPopUp = (id: string | number, nama: string) => {
        setTargetNuklir({ id: String(id), nama: nama });
        setIsNuklirOpen(true);
    };


    const formatWaktuAbsen = (time: any) => {
        if (!time || time === "-" || time === "null" || time === "00:00:00") {
            return <span className="text-gray-400 font-bold">-</span>;
        }
        if (typeof time === "string" && time.includes(":")) {
            return <span className="font-semibold text-gray-700">{time.substring(0, 5)}</span>;
        }
        const parsed = dayjs(time);
        if (parsed.isValid()) {
            return <span className="font-semibold text-gray-700">{parsed.format("HH:mm")}</span>;
        }
        return <span className="font-semibold text-gray-700">{time}</span>;
    };

    const columns: GridColDef[] = [
        {
            field: "nama",
            headerName: "Nama Pegawai",
            flex: 1,
            minWidth: 150,
            renderCell: (params) => {
                const namaLengkap = params.value || "Tanpa Nama";
                const isNuklir = params.row.status_masuk === 'void';
                return (

                    <div className="flex flex-col w-full h-full justify-center leading-tight">
                        <span className="text-sm font-semibold text-gray-800">
                            {namaLengkap}
                        </span>
                        {isNuklir && (
                            <span className="text-[10px] text-red-500 font-bold uppercase tracking-tighter">
                                Void: Absensi Dibatalkan
                            </span>
                        )}
                    </div>

                )
            }
        },
        {
            field: "waktu_masuk",
            headerName: "Waktu Masuk",
            flex: 1,
            minWidth: 150,
            align: "center",
            headerAlign: "center",
            renderCell: (params) => formatWaktuAbsen(params.value)
        },
        {
            field: 'status_masuk',
            headerName: 'Status',
            type: 'singleSelect',
            flex: 1,
            minWidth: 160,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => {
                const statusText = params.value || "Belum Hadir";
                const isNuklir = params.row.status_masuk === 'void';
                let colorClass = "bg-gray-200 text-gray-500 font-bold px-2 py-1 rounded text-xs";

                if (isNuklir || statusText === "Absensi di Batalkan") {
                    colorClass = "bg-red-600 text-white font-bold px-2 py-1 rounded text-xs";
                    return (
                        <span className={`w-36 inline-flex justify-center   ${colorClass}`}>
                            Absensi di Batalkan
                        </span>
                    );
                }

                if (statusText === "Tepat Waktu") {
                    colorClass = "bg-green-100 text-green-700";
                } else if (statusText === "Terlambat") {
                    colorClass = "bg-red-100 text-red-700";
                } else if (statusText === "Pulang Awal") {
                    colorClass = "bg-orange-100 text-orange-700";
                } else if (statusText === "Tidak Scan Pulang") {
                    colorClass = "bg-yellow-100 text-yellow-700";
                } else if (statusText === "Absensi di Batalkan") {
                    colorClass = "bg-slate-200 text-slate-700 line-through decoration-slate-400";
                }

                return (

                    <span className={`w-36 inline-flex justify-center items-center px-6 py-1 rounded text-sm font-bold ${colorClass}`}>
                        {statusText}
                    </span>
                );
            },


        },
        {
            field: "waktu_pulang",
            headerName: "Waktu Pulang",
            flex: 1,
            minWidth: 130,
            align: "center",
            headerAlign: "center",
            renderCell: (params) => formatWaktuAbsen(params.value)
        },
        {
            field: "is_kerapian",
            headerName: "Cek Kerapihan",
            width: 110,
            sortable: false,
            renderCell: (params) => {
                let status = params.row.is_kerapian;
                const isNuklir = params.row.status_masuk === "Absensi di Batalkan";  
                const isUpdating = updatingId === params.row.id;

                if (params.row.waktu_masuk === "-" || !params.row.waktu_masuk) {
                    return <span className="text-gray-400 text-xs italic">Belum Hadir</span>;
                }

                //  mengirim data ke API, tampilkan loading muter
                if (isUpdating) {
                    return (
                        <div className="flex items-center h-full gap-2 text-blue-500">
                            <Loader2 className="animate-spin" size={18} />
                            <span className="text-xs font-semibold">Menyimpan...</span>
                        </div>
                    );
                }
                if (isTvMode) {
                    return (
                        <div className="flex items-center justify-center h-full">
                            {status === true ? (
                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold border border-green-200">
                                    Rapi
                                </span>
                            ) : status === false ? (
                                <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold border border-red-200">
                                    Tidak rapi
                                </span>
                            ) : (
                                <span></span>
                            )}
                        </div>
                    );
                }

                return (
                    <label className="flex items-center gap-3 cursor-pointer h-full group">
                        <input
                            type="checkbox"
                            checked={status === true}
                            onChange={(e) => cekKerapihan(params.row, e.target.checked)}
                            className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2 cursor-pointer transition-all disabled:opacity-50"
                           disabled={params.row.waktu_masuk === "-" || isNuklir}
                        />

                        {status === true ? (
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold border border-green-200">
                                Rapi
                            </span>
                        ) : status === false ? (
                            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold border border-red-200">
                                Tidak rapi
                            </span>
                        ) : (
                            <span className="text-gray-400 text-xs font-medium italic">
                                Belum dinilai
                            </span>
                        )}
                    </label>
                );
            },
        },
        {
            field: "status_lembur",
            headerName: "Status Lembur",
            flex: 1,
            minWidth: 130,
            align: "center",
            headerAlign: "center",
            renderCell: (params) => {
                // Cek apakah statusnya kosong, null, atau strip "-"
                const tidakAdaLembur = !params.value || params.value === "-";
                const isNuklir = params.row.status_masuk === "Absensi di Batalkan";  

                if (isNuklir) {
                    return (
                        <span className="bg-gray-200 text-gray-500 font-bold px-2 py-1 rounded text-xs italic">
                            Tidak Berlaku
                        </span>
                    );
                }
                // Jika SEDANG lembur atau sudah ada statusnya, tampilkan teks/badge biasa
                if (!tidakAdaLembur) {
                    return (
                        <span className="bg-purple-600 text-white font-bold px-2 py-1 rounded text-xs">
                            {params.value}
                        </span>
                    );
                }
                if (isTvMode) {
                    return <span className="text-gray-400 font-bold">-</span>;
                }
                 if (params.row.waktu_masuk === "-" || !params.row.waktu_masuk) {
                    return <span className="text-gray-400 text-xs italic">Belum Hadir</span>;
                }

                // Jika TIDAK ADA lembur ("-"), tampilkan tombol + Lembur
                return (
                    <div className="flex justify-center w-full">
                        <button
                            onClick={() => navigate(`/dashboard/lembur/tambah-lembur?pegawai_id=${params.row.id}&nama=${params.row.nama}`)}
                            className=" w-25 flex justify-center items-center gap-1  text-purple-600 px-2 hover:text-black cursor-pointer semibold ">
                                
                            <PlusCircle size={14} />
                            Lembur
                            
                        </button>
                        

                    </div>

                );
            }
        },
        {
            field: "aksi_void",
            headerName: "Hapus Absensi",
            flex: 1,
            align: "center",
            headerAlign: "center",
            width: 100,
            renderCell: (params) => {
                // 1. CEK STATUS VOID: Kalau sudah di-void, matikan tombolnya!
               const isNuklir = params.row.status_masuk === "Absensi di Batalkan";  
                if (isNuklir) {
                    return (
                        <div className="flex justify-center items-center w-full h-full">
                            <span className="bg-red-600 text-white font-bold px-2 py-1 rounded text-xs">
                                Dibatalkan
                            </span>
                        </div>
                    );
                }

                // 2. CEK BELUM HADIR
                if (params.row.waktu_masuk === "-" || !params.row.waktu_masuk) {
                    return <span className="text-gray-400 text-xs italic">Belum Hadir</span>;
                }

                // 3. JIKA NORMAL: Tampilkan tombol hapus
                return (
                    <div className="flex justify-center items-center w-full h-full">
                        <button
                            onClick={() => handleBukaPopUp(params.row.id, params.row.nama)}
                            className="flex justify-center items-center gap-1 text-black hover:text-red-600 font-bold px-2 py-1 rounded text-xs cursor-pointer"
                        >
                            <Trash2 size={18} /> Hapus
                        </button>
                    </div>
                );
            }
        }

    ];

    return (
        <div className="w-full bg-white ">
            <DataGrid
                showToolbar
                rowModesModel={rowModesModel}
                rows={rows}
                columns={columns}
                autoHeight
                initialState={{
                    pagination: {
                        paginationModel: { page: 0, pageSize: 10 },
                    },
                }}
                pageSizeOptions={[10, 20]}
                getRowClassName={(params) =>
                    params.row.status === 'Absensi di Batalkan' ? 'bg-gray-50 text-gray-400 transition-all' : ''
                }
                columnVisibilityModel={{
                    // Kolom ini akan disembunyikan (!isMobile) saat di HP, tapi muncul di Laptop
                    waktu_masuk: !isMobile,
                    waktu_pulang: !isMobile,
                }}
                disableRowSelectionOnClick
                sx={{
                    border: "1px solid #e5e7eb",
                    "& .MuiDataGrid-columnHeaders": {
                        backgroundColor: "#f3f4f6",
                        color: "black",
                        fontWeight: "bold",
                        borderBottom: "1px solid #9ca3af",
                    },
                    width: '100%',
                    minWidth: 0,
                    '& .MuiDataGrid-virtualScroller': {
                        overflowX: 'auto',
                    },
                    '& .MuiDataGrid-cell:focus': { outline: 'none' },
                    '& .MuiDataGrid-columnHeader:focus': { outline: 'none' },
                    '& .bg-gray-500': {
                        backgroundColor: '#f9fafb !important',
                        '&:hover': { backgroundColor: '#f3f4f6 !important' }
                    },
                }}
            />
            <ButtonNuklir
                isOpen={isNuklirOpen}
                onClose={() => setIsNuklirOpen(false)}
                voidTarget={targetNuklir}
                token={token || ""}
                onSuccess={onRefresh} // Panggil fungsi refresh dari parent setelah sukses void

            />

        </div>
    );
}
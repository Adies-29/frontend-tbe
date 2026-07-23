import { useEffect, useState, useMemo } from "react";
import {
    DataGrid,
    type GridColDef,
    type GridRowModesModel,

} from "@mui/x-data-grid";
import type { AbsensiData } from "../../../types";
import dayjs from "dayjs";
import { useAuthStore } from "../../../store/useAuthStore";
import { Loader2, PlusCircle, Trash2, Search, Download } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { useMediaQuery, useTheme } from "@mui/material";
import { getSafeErrorMessage } from "../../../utils/errorHandler";
import { apiFetch } from "../../../utils/apiFetch";

import Notif from "../../../components/common/Notif";
import { defaultDataGridSx } from "../../../components/common/dataGridStyles";
import ButtonNuklir from "../../../components/common/ButtonNuklir";
import Button from "../../../components/common/Button";




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
    const [updatingId, setUpdatingId] = useState<string | number | null>(null);
    const [notif, setNotif] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
        show: false,
        message: "",
        type: "success"
    });
    const token = useAuthStore((state) => state.token);
    const navigate = useNavigate();
    const location = useLocation();

    const [isNuklirOpen, setIsNuklirOpen] = useState(false);
    const [targetNuklir, setTargetNuklir] = useState({ id: "", nama: "" });

    // States for Search and Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [filterShift, setFilterShift] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterJabatan, setFilterJabatan] = useState("");

    // Compute unique shifts and positions dynamically from initial data
    const uniqueShifts = useMemo(() => {
        const shifts = initialData
            .map((item) => item.info_shift)
            .filter((s): s is string => !!s && s !== "-");
        return Array.from(new Set(shifts));
    }, [initialData]);

    const uniqueJabatans = useMemo(() => {
        const jabs = initialData
            .map((item) => item.jabatan)
            .filter((j): j is string => !!j && j !== "-");
        return Array.from(new Set(jabs));
    }, [initialData]);

    // Client-side filtering logic
    const filteredRows = useMemo(() => {
        return rows.filter((item) => {
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch = !q || 
                (item.nama && item.nama.toLowerCase().includes(q)) || 
                (item.jabatan && item.jabatan.toLowerCase().includes(q));

            const matchesShift = !filterShift || item.info_shift === filterShift;

            let matchesStatus = true;
            if (filterStatus) {
                const itemStatus = (item.status_masuk || "").toLowerCase();
                const targetStatus = filterStatus.toLowerCase();
                
                if (targetStatus === "void") {
                    matchesStatus = itemStatus.includes("void") || itemStatus.includes("batalkan") || itemStatus.includes("batal");
                } else if (targetStatus === "tepat") {
                    matchesStatus = itemStatus.includes("tepat") || itemStatus.includes("ontime") || itemStatus.includes("intime");
                } else if (targetStatus === "terlambat") {
                    matchesStatus = itemStatus.includes("lambat") || itemStatus.includes("late");
                } else if (targetStatus === "belum hadir") {
                    matchesStatus = itemStatus.includes("belum");
                }
            }

            const matchesJabatan = !filterJabatan || item.jabatan === filterJabatan;

            return matchesSearch && matchesShift && matchesStatus && matchesJabatan;
        });
    }, [rows, searchQuery, filterShift, filterStatus, filterJabatan]);

    const isTvMode = location.pathname === '/tv';
    useEffect(() => {
        const timer = setTimeout(() => {
            setRows(initialData);
        }, 0);
        return () => clearTimeout(timer);
    }, [initialData]);

    const cekKerapihan = async (row: AbsensiData, newStatus: boolean) => {
        setUpdatingId(row.id);
        try {
            const hariIni = new Date().toISOString().split("T")[0];

            const payload = {
                pegawai_id: row.pegawai_id || row.id,
                tanggal: hariIni,
                is_kerapian: newStatus
            };

            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/kerapian`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

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
        } catch (error) {
            console.error("Gagal update kerapihan:", error);
            setNotif({ show: true, message: getSafeErrorMessage(), type: "error" });
        } finally {
            setUpdatingId(null);
        }

    };

    const handleBukaPopUp = (id: string | number, nama: string) => {
        setTargetNuklir({ id: String(id), nama: nama });
        setIsNuklirOpen(true);
    };


    const formatWaktuAbsen = (time: string | null | undefined) => {
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

                    <span className={`min-w-[120px] px-4 py-1.5 inline-flex justify-center items-center rounded-lg text-xs md:text-sm font-bold ${colorClass}`}>
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
                const status = params.row.is_kerapian;
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
                    <label 
                        className="flex items-center gap-2 md:gap-3 cursor-pointer h-full group p-1 md:p-0"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <input
                            type="checkbox"
                            checked={status === true}
                            onChange={(e) => cekKerapihan(params.row, e.target.checked)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-6 h-6 md:w-5 md:h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2 cursor-pointer transition-all disabled:opacity-50"
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
                    let displayText = params.value;
                    
                    // Coba parsing jika nilainya berupa angka menit (misal: "120" atau "120 Menit")
                    const match = String(params.value).match(/^(\d+)(?:\s*menit)?$/i);
                    if (match) {
                        const menitAngka = Number(match[1]);
                        const jam = Math.floor(menitAngka / 60);
                        const sisaMenit = menitAngka % 60;
                        displayText = jam > 0 ? `${jam} Jam ${sisaMenit > 0 ? `${sisaMenit} Mnt` : ""}` : `${sisaMenit} Mnt`;
                    }

                    return (
                        <span className="bg-purple-100 text-purple-700 font-bold px-2 py-1 rounded text-xs border border-purple-200">
                            {displayText}
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
                            className="w-25 flex justify-center items-center gap-1 text-purple-600 px-3 md:py-1 hover:text-black cursor-pointer font-semibold min-h-[44px] md:min-h-0 rounded-md active:bg-purple-50 active:scale-95 transition-transform">
                                
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
                            className="flex justify-center items-center gap-1 text-black hover:text-red-600 font-bold px-3 py-2 md:py-1 rounded-md text-xs cursor-pointer min-h-[44px] md:min-h-0 active:bg-red-50 active:scale-95 transition-transform"
                        >
                            <Trash2 size={18} /> Hapus
                        </button>
                    </div>
                );
            }
        }
    ];

    const handleExportCSV = () => {
        const headers = ["Nama Karyawan", "Waktu Masuk", "Status", "Waktu Pulang", "Kerapihan", "Status Lembur"];
        const csvRows = [headers.join(",")];

        filteredRows.forEach((row) => {
            let kerapihanText = "-";
            if (row.is_kerapian === true) kerapihanText = "Rapi";
            else if (row.is_kerapian === false) kerapihanText = "Tidak rapi";

            const values = [
                `"${row.nama || ''}"`,
                `"${row.waktu_masuk || '-'}"`,
                `"${row.status_masuk || 'Belum Hadir'}"`,
                `"${row.waktu_pulang || '-'}"`,
                `"${kerapihanText}"`,
                `"${row.status_lembur || '-'}"`
            ];
            csvRows.push(values.join(","));
        });

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Monitoring_Aktivitas_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="w-full bg-white flex flex-col gap-4">
            
            {/* Control Bar: Search, Filters & Export */}
            <div className="p-4 sm:p-5 border border-gray-200 bg-gray-50/70 rounded-xl flex flex-col gap-4">
                
                {/* Baris 1: Search & Export */}
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[240px] max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Cari nama / jabatan..."
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

                    {/* Export Button */}
                    <div className="w-full md:w-auto shrink-0">
                        <Button
                            variant="success"
                            label="Export Excel/CSV"
                            icon={<Download size={16} />}
                            onClick={handleExportCSV}
                            className="w-full md:w-auto active:scale-95 py-3 md:py-2 text-[15px] md:text-sm rounded-xl font-bold shadow-md cursor-pointer flex items-center justify-center gap-2"
                        />
                    </div>
                </div>

                {/* Baris 2: Filters */}
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-start pt-2 border-t border-gray-200/80">
                    <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
                        {/* Filter Shift */}
                        <select
                            value={filterShift}
                            onChange={(e) => setFilterShift(e.target.value)}
                            className="border border-slate-300 rounded-xl px-3 py-1.5 bg-white text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs cursor-pointer flex-1 md:flex-none md:w-48 truncate"
                        >
                            <option value="">Semua Shift</option>
                            {uniqueShifts.map((shift, idx) => (
                                <option key={idx} value={shift}>{shift}</option>
                            ))}
                        </select>

                        {/* Filter Status */}
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="border border-slate-300 rounded-xl px-3 py-1.5 bg-white text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs cursor-pointer flex-1 md:flex-none md:w-48 truncate"
                        >
                            <option value="">Semua Status</option>
                            <option value="tepat">Tepat Waktu</option>
                            <option value="terlambat">Terlambat</option>
                            <option value="belum hadir">Belum Hadir</option>
                            <option value="void">Void</option>
                        </select>

                        {/* Filter Jabatan */}
                        <select
                            value={filterJabatan}
                            onChange={(e) => setFilterJabatan(e.target.value)}
                            className="border border-slate-300 rounded-xl px-3 py-1.5 bg-white text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs cursor-pointer flex-1 md:flex-none md:w-48 truncate"
                        >
                            <option value="">Semua Jabatan</option>
                            {uniqueJabatans.map((jab, idx) => (
                                <option key={idx} value={jab}>{jab}</option>
                            ))}
                        </select>

                        {/* Reset Button */}
                        {(searchQuery || filterShift || filterStatus || filterJabatan) && (
                            <button
                                onClick={() => {
                                    setSearchQuery("");
                                    setFilterShift("");
                                    setFilterStatus("");
                                    setFilterJabatan("");
                                }}
                                className="text-xs text-red-600 hover:text-red-700 font-bold px-2 py-1 transition-colors duration-150 cursor-pointer"
                            >
                                Reset Filter
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <DataGrid
                rowModesModel={rowModesModel}
                rows={filteredRows}
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
                    waktu_masuk: !isMobile,
                    waktu_pulang: !isMobile,
                }}
                disableRowSelectionOnClick
                sx={{
                    ...defaultDataGridSx,
                    minWidth: 0,
                    '& .MuiDataGrid-virtualScroller': {
                        overflowX: 'auto',
                    },
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
                onSuccess={() => {
                    if (onRefresh) onRefresh();
                }}
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
import { DataGrid, GridActionsCellItem, type GridColDef, type GridRowId } from "@mui/x-data-grid";
import { Loader2, Pencil, Trash2, Search } from "lucide-react";
import dayjs from "dayjs";
import type { LemburData } from "../../../types";
import { defaultDataGridSx } from "../../../components/common/dataGridStyles";
import { useState, useMemo } from "react";
import { useAuthStore } from "../../../store/useAuthStore";
import { apiFetch } from "../../../utils/apiFetch";
import { getSafeErrorMessage } from "../../../utils/errorHandler";
import { useNavigate } from "react-router-dom";
import ConfirmPopUp from "../../../components/common/ConfirmPopUp";
import Notif from "../../../components/common/Notif";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotif } from "../../../hooks/useNotif";

interface TabelLemburProps {
    data: LemburData[];
    isLoading: boolean;
    onRefresh: () => void;
}

export default function TabelLembur({ data, isLoading, onRefresh }: TabelLemburProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    
    const [hapusId, setHapusId] = useState<GridRowId | null>(null);
    const [showPopUp, setShowPopUp] = useState(false);
    const { notif, showNotif, showErrorNotif, closeNotif } = useNotif();

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStartDate, setFilterStartDate] = useState("");
    const [filterEndDate, setFilterEndDate] = useState("");

    const handleDeleteClick = (id: GridRowId) => () => {
        setHapusId(id);
        setShowPopUp(true);
    };

    const deleteLemburMutation = useMutation({
        mutationFn: async (idToDelete: GridRowId) => {
            const result = await apiFetchJson(`/api/v1/lembur/${idToDelete}`, {
                method: 'DELETE',
                headers: {
                    "Content-Type": "application/json"
                }
            });
            return result;
        },
        onSuccess: () => {
            showNotif("Data lembur berhasil dihapus", "success");
            queryClient.invalidateQueries({ queryKey: ['lemburList'] });
            // onRefresh tetap dipertahankan untuk redundansi yang aman
            setTimeout(() => {
                onRefresh();
            }, 2000);
        },
        onError: (error) => {
            showErrorNotif(error);
        },
        onSettled: () => {
            setShowPopUp(false);
            setHapusId(null);
        }
    });

    const hapus = () => {
        if (hapusId) {
            deleteLemburMutation.mutate(hapusId);
        }
    };

    const columns: GridColDef[] = [
        {
            field: "pegawai_id",
            headerName: "Nama Pegawai",
            flex: 1,
            minWidth: 150,
            renderCell: (params) => {
                const nama = params.row.nama || params.row.pegawai?.nama || `Pegawai ID: ${params.row.pegawai_id}`;
                return (
                    <span className="text-sm font-semibold text-gray-800">
                        {nama}
                    </span>
                );
            }
        },
        {
            field: "tanggal",
            headerName: "Tanggal Lembur",
            flex: 1,
            minWidth: 130,
            align: "center",
            headerAlign: "center",
            renderCell: (params) => {
                const date = dayjs(params.value);
                return (
                    <span className="font-semibold text-gray-700">
                        {date.isValid() ? date.format("DD MMM YYYY") : params.value}
                    </span>
                );
            }
        },
        {
            field: "menit_lembur_diizinkan",
            headerName: "Lama Lembur",
            flex: 1,
            minWidth: 130,
            align: "center",
            headerAlign: "center",
            renderCell: (params) => {
                const jam = Math.floor(params.value / 60);
                const menit = params.value % 60;
                const text = jam > 0 ? `${jam} Jam ${menit > 0 ? `${menit} Mnt` : ""}` : `${menit} Mnt`;
                return (
                    <span className="bg-purple-100 text-purple-700 font-bold px-2 py-1 rounded text-xs">
                        {text}
                    </span>
                );
            }
        },
        {
            field: "nominal_upah_custom",
            headerName: "Upah Lembur",
            flex: 1,
            minWidth: 160,
            align: "center",
            headerAlign: "center",
            renderCell: (params) => {
                const isCustom = params.row.is_custom_upah;
                const customValue = params.row.nominal_upah_custom;
                const tipeHitung = params.row.tipe_hitung_lembur || 'per_jam';
                const isFlat = tipeHitung === 'flat';
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const upahLemburDefault = isFlat
                    ? ((params.row.pegawai as any)?.jabatan?.upah_lembur_flat || (params.row.pegawai as any)?.jabatan?.upah_lembur_per_jam)
                    : (params.row.pegawai as any)?.jabatan?.upah_lembur_per_jam;
                const suffix = isFlat ? " (Flat)" : "/jam";

                if (isCustom && customValue > 0) {
                    return (
                        <span className="bg-amber-100 text-amber-700 font-bold px-2 py-1 rounded text-xs">
                            Rp {Number(customValue).toLocaleString('id-ID')} {suffix}
                        </span>
                    );
                }

                if (upahLemburDefault) {
                    return (
                        <span className="bg-gray-100 text-gray-700 font-medium px-2 py-1 rounded text-xs">
                            Rp {Number(upahLemburDefault).toLocaleString('id-ID')} {suffix}
                        </span>
                    );
                }

                return (
                    <span className="bg-gray-100 text-gray-500 font-medium px-2 py-1 rounded text-xs">
                        {isFlat ? "Flat (Belum Diatur)" : "Belum Diatur"}
                    </span>
                );
            }
        },
        {
            field: "alasan_lembur",
            headerName: "Alasan",
            flex: 1.5,
            minWidth: 200,
            renderCell: (params) => (
                <span className="text-gray-600 text-sm italic truncate">
                    {params.value || "-"}
                </span>
            )
        },
        {
            field: "disetujui_oleh",
            headerName: "Disetujui Oleh",
            flex: 1,
            minWidth: 130,
            align: "center",
            headerAlign: "center",
            renderCell: (params) => (
                <span className="font-semibold text-gray-700 text-sm">
                    {params.value || "-"}
                </span>
            )
        },
        {
            field: 'actions',
            type: 'actions', 
            headerName: 'Aksi',
            width: 100,
            cellClassName: 'actions',
            getActions: ({ id, row }) => {
                return [
                    <GridActionsCellItem
                        key="edit"
                        icon={<Pencil size={18} className="text-gray-600 hover:text-black" />}
                        label="Edit"
                        className="textPrimary"
                        onClick={() => navigate(`edit/${id}?pegawai_id=${row.pegawai_id}&tanggal=${row.tanggal}&nama=${encodeURIComponent(row.nama || "")}`)}
                        color="inherit"
                    />,
                    <GridActionsCellItem
                        key="delete"
                        icon={<Trash2 size={18} className="text-gray-600 hover:text-red-600" />}
                        label="Delete"
                        onClick={handleDeleteClick(id)}
                        color="inherit"
                    />,
                ];
            },
        },
    ];

    const filteredData = useMemo(() => {
        return data.filter((item) => {
            const nama = item.nama || item.pegawai?.nama || "";
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch = !q || nama.toLowerCase().includes(q);

            let matchesDate = true;
            if (item.tanggal) {
                const itemDate = item.tanggal.split("T")[0]; // YYYY-MM-DD
                if (filterStartDate && itemDate < filterStartDate) matchesDate = false;
                if (filterEndDate && itemDate > filterEndDate) matchesDate = false;
            }

            return matchesSearch && matchesDate;
        });
    }, [data, searchQuery, filterStartDate, filterEndDate]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Loader2 className="animate-spin mb-4 text-red-600" size={32} />
                <p>Memuat data lembur...</p>
            </div>
        );
    }

    return (
        <div className="w-full bg-white relative flex flex-col gap-4">
            
            {/* Control Bar: Search & Date Filter */}
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
                    <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
                        <span className="text-xs font-semibold text-slate-600">Tanggal Lembur:</span>
                        <input
                            type="date"
                            value={filterStartDate}
                            onChange={(e) => setFilterStartDate(e.target.value)}
                            className="border border-slate-300 rounded-xl px-3 py-1.5 bg-white text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-slate-500">s/d</span>
                        <input
                            type="date"
                            value={filterEndDate}
                            onChange={(e) => setFilterEndDate(e.target.value)}
                            className="border border-slate-300 rounded-xl px-3 py-1.5 bg-white text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs cursor-pointer"
                        />

                        {/* Reset Button */}
                        {(searchQuery || filterStartDate || filterEndDate) && (
                            <button
                                onClick={() => {
                                    setSearchQuery("");
                                    setFilterStartDate("");
                                    setFilterEndDate("");
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
                rows={filteredData}
                columns={columns}
                autoHeight
                disableRowSelectionOnClick
                initialState={{
                    pagination: {
                        paginationModel: { page: 0, pageSize: 10 },
                    },
                }}
                pageSizeOptions={[10, 20]}
                sx={defaultDataGridSx}
            />
            <ConfirmPopUp
                isOpen={showPopUp}
                onClose={() => {
                    setShowPopUp(false);
                    setHapusId(null);
                }}
                onConfirm={hapus}
                title="Hapus Data Lembur?"
                message="Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin menghapus data ini?"
                confirmText="Ya, Hapus"
                variant="danger"
            />
            <Notif
                show={notif.show}
                message={notif.message}
                type={notif.type}
                onClose={closeNotif}
            />
        </div>
    );
}

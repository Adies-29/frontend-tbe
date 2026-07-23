import { useNavigate } from "react-router-dom";
import Button from "../../../components/common/Button";
import TabelDepartemen from "../../../features/departemen/components/TabelDepartemen";
import { useState } from "react";
import { Loader2, Layers, Plus } from "lucide-react";
import type { DepartemenData, DepartemenOption, JabatanOption } from "../../../types";
import { apiFetchJson } from "../../../utils/apiFetch";
import Notif from "../../../components/common/Notif";
import { useQuery } from "@tanstack/react-query";
import { useNotif } from "../../../hooks/useNotif";

export default function DepartemenIndex() {
    const navigate = useNavigate();
    const { notif, showErrorNotif, closeNotif } = useNotif();

    const fetchDepartemen = async (): Promise<DepartemenData[]> => {
        try {
            const [resultDept, resultJabatan] = await Promise.all([
                apiFetchJson('/api/v1/departemen'),
                apiFetchJson('/api/v1/jabatan')
            ]);

            const listDept: DepartemenOption[] = resultDept.data || [];
            const listJabatan: JabatanOption[] = resultJabatan.data || [];

            return listDept.map((dept: DepartemenOption) => {
                const jumlah = listJabatan.filter((jab: JabatanOption) => {
                    return String(jab.departemen_id) === String(dept.id);
                }).length;

                return {
                    id: dept.id,
                    nama_departemen: dept.nama_departemen,
                    jumlah_jabatan: jumlah
                };
            });
        } catch (error) {
            console.error("Error fetching data departemen & jabatan:", error);
            showErrorNotif(error);
            throw error;
        }
    };

    const {
        data: dataDepartemen = [],
        isLoading,
        isError,
        refetch
    } = useQuery ({
        queryKey: ['departemen'],
        queryFn: fetchDepartemen
    })
   
    const totalDepartemen = dataDepartemen.length;

    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
            {isError && (
                <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm border border-red-300">
                    Gagal memuat data departemen. Pastikan koneksi internet & backend berjalan lancar.
                </div>
            )}

            {/* HEADER */}
            <section data-tour="departemen-header" className="bg-white border border-gray-300 rounded-2xl p-4 md:p-6 shadow-sm w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <Layers size={28} className="text-teal-600" /> Data Departemen
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Kelola data divisi dan departemen operasional perusahaan.</p>
                    </div>
                    <div className="flex gap-3 items-center w-full md:w-auto">
                        <Button
                            variant="primary"
                            label="Tambah Departemen"
                            icon={<Plus size={16} />}
                            onClick={() => navigate("/dashboard/departemen/tambah-departemen")}
                            className="w-full md:w-auto active:scale-95 py-3 md:py-2 text-[15px] md:text-sm rounded-xl font-bold shadow-md cursor-pointer"
                            data-tour="btn-add-dept"
                        />
                    </div>
                </div>
            </section>

            {/* STATS */}
            <div data-tour="dept-stats" className="flex gap-4 w-full">
                <div className="bg-white border border-gray-300 rounded-xl p-4 w-full md:w-48 shadow-sm flex flex-col items-center justify-center">
                    <span className="text-gray-800 text-sm md:text-base font-medium">Total Departemen</span>
                    <span className="text-4xl font-bold mt-2 text-black">{totalDepartemen}</span>
                </div>
            </div>

            {/* TABLE SECTION */}
            <section className="bg-white border border-gray-300 rounded-2xl p-4 md:p-6 shadow-sm w-full">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <Loader2 className="animate-spin mb-4 text-red-600" size={32} />
                        <p>Memuat data dari database...</p>
                    </div>
                ) : (
                    <TabelDepartemen data={dataDepartemen} onRefresh={refetch} />
                )}
            </section>
            <Notif
                show={notif.show}
                message={notif.message}
                type={notif.type}
                onClose={closeNotif}
            />
        </div>
    );
}
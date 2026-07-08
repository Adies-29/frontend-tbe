import { useNavigate } from "react-router-dom";
import Button from "../../../components/common/Button";
import TabelDepartemen from "../../../features/departemen/components/TabelDepartemen";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { DepartemenData, DepartemenOption, JabatanOption } from "../../../types";
import { useAuthStore } from "../../../store/useAuthStore";
import { apiFetch } from "../../../utils/apiFetch";
import Notif from "../../../components/common/Notif";
import { useQuery } from "@tanstack/react-query";

export default function DepartemenIndex() {
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token)

    const [notif, setNotif] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
        show: false,
        message: "",
        type: "success"
    });

    const fetchDepartemen = async (): Promise<DepartemenData[]> => {
        try {
            const [resDept, resJabatan] = await Promise.all([
                apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/departemen`, { headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` } }),
                apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/jabatan`, { headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` } })
            ])

            const resultDept = await resDept.json();
            const resultJabatan = await resJabatan.json();

            if (!resJabatan.ok || !resDept.ok) {
                throw new Error("Gagal mengambil data dari server");
            }

            if (resDept.ok && resJabatan.ok) {

                const mappedData: DepartemenData[] = resultDept.data.map((dept: DepartemenOption) => {
                    const jumlah = resultJabatan.data.filter((jab: JabatanOption) => {
                        return String(jab.departemen_id) === String(dept.id);
                    }).length
                    return {
                        id: dept.id,
                        nama_departemen: dept.nama_departemen,
                        jumlah_jabatan: jumlah
                    };
                });
                return (mappedData);
            }
            return [];
        } catch (error) {
            console.error("Error fetching data departemen & jabatan:", error);
            setNotif({ show: true, message: "Gagal memuat data Departemen. Pastikan backend berjalan.", type: "error" });
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
        queryFn: fetchDepartemen,
        enabled: !!token
    })
   
    const totalDepartemen = dataDepartemen.length;

    return (
        <div className="flex flex-col gap-4 md:gap-6 w-full">

            {isError && (
                <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm border border-red-300">
                    Gagal memuat data departemen. Pastikan koneksi internet & backend berjalan lancar.
                </div>
            )}

            <div className="flex gap-4 w-full">
                <div className="bg-white border border-gray-300 rounded-xl p-4 w-full md:w-48 shadow-sm flex flex-col items-center justify-center">
                    <span className="text-gray-800 text-sm md:text-base font-medium">Total Departemen</span>
                    <span className="text-4xl font-bold mt-2 text-black">{totalDepartemen}</span>
                </div>
            </div>
           
            <section data-tour="departemen-header" className="bg-white border border-gray-300 rounded-2xl p-4 md:p-6 shadow-sm w-full">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-4">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                        Data Departemen
                    </h1>

                    <div className="flex flex-col gap-3 w-full md:w-auto">
                        <Button
                            variant="primary"
                            label="Tambah Departemen"
                            onClick={() => navigate("/dashboard/departemen/tambah-departemen")}
                            className="w-full md:w-auto"
                        />
                    </div>
                </div>

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
                onClose={() => setNotif({ show: false, message: "", type: "success" })}
            />
        </div>
    );
}
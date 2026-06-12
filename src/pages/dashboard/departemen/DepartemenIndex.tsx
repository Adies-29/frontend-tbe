import { useNavigate } from "react-router-dom";
import Button from "../../../components/ui/Button";
import TabelDepartemen from "../../../components/ui/tabel/tabelDepartemen/TabelDepartemen";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { DepartemenData, DepartemenOption, JabatanOption } from "../../../types";
import { useAuthStore } from "../../../store/useAuthStore";
import { apiFetch } from "../../../utils/apiFetch";
import Notif from "../../../components/ui/Notif";



export default function DepartemenIndex() {
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token)

    // 2. State untuk menyimpan data dari Database & status Loading
    const [dataDepartemen, setDataDepartemen] = useState<DepartemenData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [notif, setNotif] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
        show: false,
        message: "",
        type: "success"
    });

    const fetchDepartemen = async () => {
        setIsLoading(true);
        try {
            // Tembak API Backend
            const [resDept, resJabatan] = await Promise.all([
                apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/departemen`, { headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` } }),
                apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/jabatan`, { headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` } })
            ])

            const resultDept = await resDept.json();
            const resultJabatan = await resJabatan.json();

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
                setDataDepartemen(mappedData);
            }
        } catch (error) {
            console.error("Error fetching data departemen & jabatan:", error);
            setNotif({ show: true, message: "Gagal memuat data Departemen. Pastikan backend berjalan.", type: "error" });
        } finally {
            setIsLoading(false);
        }
    };
    // 5. Jalankan Fetch saat halaman dibuka
    useEffect(() => {
        const fetchData = async () => {
            await fetchDepartemen();
        };
        fetchData();
    }, []);

    const totalDepartemen = dataDepartemen.length;

    return (
        <div className="flex flex-col gap-6 w-full">

            {/* 1. BAGIAN STATISTIK (Meniru desain kotak di gambarmu) */}
            <div className="flex gap-4">
                <div className="bg-white border border-gray-300 rounded-xl p-4 w-48 shadow-sm flex flex-col items-center justify-center">
                    <span className="text-gray-800 text-sm md:text-base font-medium">Total Departemen</span>
                    <span className="text-4xl font-bold mt-2 text-black">{totalDepartemen}</span>
                </div>
            </div>

            {/* 2. BAGIAN TABEL DAN TOMBOL */}
            <section className="bg-white border border-gray-300 rounded-2xl p-4 shadow-sm w-full">

                {/* Header Tabel & Kumpulan Tombol */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-start mb-6 gap-4">
                    <h2 className="text-lg font-bold text-black border-l-4 border-red-600 pl-2 mt-1">
                        Data Departemen
                    </h2>

                    <div className="flex flex-col gap-3">
                        <Button
                            variant="primary"
                            label="Tambah Departemen"
                            onClick={() => navigate("/dashboard/departemen/tambah-departemen")}
                        />
                    </div>
                </div>

                {/* 3. PEMANGGILAN KOMPONEN TABEL */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <Loader2 className="animate-spin mb-4 text-red-600" size={32} />
                        <p>Memuat data dari database...</p>
                    </div>
                ) : (
                    <TabelDepartemen data={dataDepartemen} onRefresh={fetchDepartemen} />
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
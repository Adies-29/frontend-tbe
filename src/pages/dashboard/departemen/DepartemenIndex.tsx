import { useNavigate } from "react-router-dom";
import Button from "../../../components/ui/Button";
import TabelDepartemen from "../../../components/ui/tabel/tabelDepartemen/TabelDepartemen";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { DepartemenData } from "../../../types";



export default function DepartemenIndex() {
    const navigate = useNavigate();

    // 2. State untuk menyimpan data dari Database & status Loading
    const [dataDepartemen, setDataDepartemen] = useState<DepartemenData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchDepartemen = async () => {
        setIsLoading(true);
        try {
            // Tembak API Backend
            const response = await fetch("http://localhost:3000/api/v1/departemen", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    // "Authorization": `Bearer ${localStorage.getItem('token')}` // Gunakan ini nanti jika butuh login
                }
            });

            if (!response.ok) {
                throw new Error("Gagal memuat data dari server");
            }

            const result = await response.json();
            
            // 4. MAPPING DATA: Sesuaikan bentuk data backend ke bentuk dummy-mu sebelumnya
            const mappedData: DepartemenData[] = result.data.map((item: any) => ({
                id: item.id,
                nama_departemen: item.nama_departemen,
                jumlah_Jabatan: item.jumlah_jabatan || 0 
            }));

            setDataDepartemen(mappedData);

        } catch (error) {
            console.error("Error fetching jabatan:", error);
            alert("Gagal memuat data Departemen. Pastikan backend berjalan.");
        } finally {
            setIsLoading(false);
        }
    };
    // 5. Jalankan Fetch saat halaman dibuka
    useEffect(() => {
        fetchDepartemen();
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
                            variant="add"
                            label="Tambah Departemen    "
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
    <TabelDepartemen data={dataDepartemen} />
)}

            </section>
        </div>
    );
}
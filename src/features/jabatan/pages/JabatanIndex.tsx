import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Users, Loader2 } from "lucide-react"; 
import Button from "../../../components/common/Button";

import type { JabatanData, JabatanOption, PegawaiData } from "../../../types";
import { useAuthStore } from "../../../store/useAuthStore";
import { apiFetch } from "../../../utils/apiFetch";
import Notif from "../../../components/common/Notif";
import TabelJabatan from "../components/TabelJabatan";

export default function JabatanIndex() {
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token)
    // 2. State untuk menyimpan data dari Database & status Loading
    const [dataJabatan, setDataJabatan] = useState<JabatanData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [notif, setNotif] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
        show: false,
        message: "",
        type: "success"
    });

    // 3. Fungsi FETCH dari Backend (READ)
    const fetchJabatan = async () => {
        setIsLoading(true);
        try {
            // Tembak API Backend
            const [resJabatan, resPegawai] = await Promise.all([
                apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/jabatan`, { headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` } }),
                apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/pegawai`, { headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` } })
            ]);

            // ✅ Baca stream SATU KALI saja
            const resultJabatan = await resJabatan.json();
            const resultPegawai = await resPegawai.json();

            if (resJabatan.ok && resPegawai.ok) {
               
                const mappedData: JabatanData[] = resultJabatan.data.map((jab: JabatanOption) => {
                   
                    const jumlah = resultPegawai.data.filter(
                        (peg: PegawaiData) => peg.jabatan_id === jab.id
                    ).length;

                    return {
                        id: jab.id,
                        nama_jabatan: jab.nama_jabatan,
                        departemen: jab.departemen?.nama_departemen || "Tanpa Departemen",
                        departemen_id: jab.departemen_id,
                        jumlah_pegawai: jumlah 
                    };
                });
                
                // Simpan ke state
                setDataJabatan(mappedData);
            } else {
                // Opsional: Handle jika response dari backend tidak 'ok' (misal 401 atau 500)
                console.error("Gagal mengambil data:", resultJabatan, resultPegawai);
            }
        } catch (error) {
            console.error("Error fetching jabatan:", error);
            setNotif({ show: true, message: "Gagal memuat data jabatan. Pastikan backend berjalan.", type: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    // 5. Jalankan Fetch saat halaman dibuka
    useEffect(() => {
        const fetchData = async () => {
            await fetchJabatan();
        };
        fetchData();
    }, []);

   
    const totalJabatan = dataJabatan.length;
    const totalPegawai = dataJabatan.reduce((acc, curr) => acc + (curr.jumlah_pegawai || 0), 0);

    return (
        <div className="flex flex-col gap-6 w-full">

            <div className="flex flex-wrap gap-4">
                {/* Kotak 1: Total Jabatan */}
                <div className="bg-white border border-gray-300 rounded-xl p-4 min-w-48 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                        <Briefcase size={24} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium">Total Jabatan</p>
                        <p className="text-2xl font-bold text-black">{totalJabatan}</p>
                    </div>
                </div>

                {/* Kotak 2: Total Karyawan Menjabat */}
                <div className="bg-white border border-gray-300 rounded-xl p-4 min-w-48 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium">Pegawai Terisi</p>
                        <p className="text-2xl font-bold text-black">{totalPegawai}</p>
                    </div>
                </div>
            </div>

            {/* 2. BAGIAN TABEL DAN TOMBOL */}
            <section className="bg-white border border-gray-300 rounded-2xl p-4 shadow-sm w-full min-h-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-start mb-6 gap-4">
                    <h2 className="text-lg font-bold text-black border-l-4 border-red-600 pl-2 mt-1">
                        Data Jabatan
                    </h2>

                    <div className="flex flex-col gap-3">
                        <Button
                            label="Tambah Jabatan"
                            onClick={() => navigate("/dashboard/jabatan/tambah-jabatan")}
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
                    <TabelJabatan data={dataJabatan} onRefresh={fetchJabatan} />
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
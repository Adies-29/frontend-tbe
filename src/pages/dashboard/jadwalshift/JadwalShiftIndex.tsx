import { useNavigate } from "react-router-dom";
import Button from '../../../components/ui/Button';
import type { JadwalShiftData } from "../../../types";
import TabelJadwalShift from "../../../components/ui/tabel/tabelJadwalShif/TabelJadwalShif";
import { useEffect, useState } from "react";
import { useAuthStore } from "../../../store/useAuthStore";
import { Loader2, CalendarDays, Clock } from "lucide-react"; // Tambahan icon
import TabelMatrixJadwal from "../../../components/ui/tabel/tabelJadwalShif/TabelMatrixJadwal";

export default function JadwalShiftIndex() {
    const navigate = useNavigate();
    
    // STATE UNTUK TAB NAVIGASI ('jadwal' atau 'shift')
    const [activeTab, setActiveTab] = useState<'jadwal' | 'shift'>('jadwal');

    const [dataJadwalShift, setDataJadwalShift] = useState<JadwalShiftData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");

    // Fungsi FETCH dari Backend (Khusus Shift)
    const fetchJadwalShift = async () => {
        setIsLoading(true);
        setErrorMsg("");

        try {
            const token = useAuthStore.getState().token;
            const response = await fetch ("https://ppm-sooty.vercel.app/api/v1/shifts", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });
            if (!response.ok){
                if(response.status === 401 || response.status === 403){
                    throw new Error ("Sesi Anda telah habis. Silakan login kembali !")
                }
                throw new Error ("Gagal memuat data dari server")
            }

            const result = await response.json();
            if (result.success){
                setDataJadwalShift(result.data);
            }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error("Error fetching Jadwal & shift:", error);
            setErrorMsg(error.message || "Gagal memuat data pegawai.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            // Nanti Anda bisa membedakan fetch berdasarkan activeTab
            // Jika tab 'shift', panggil fetchJadwalShift()
            // Jika tab 'jadwal', panggil fetchJadwalKaryawan()
            if (activeTab === 'shift') {
                await fetchJadwalShift();
            }
        };
        setTimeout(fetchData, 0);
    }, [activeTab]); // Effect dipicu ulang jika tab berubah


    return (
        <div className="flex flex-col gap-6 w-full p-2">
            {/* HEADER */}
            <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Manajemen Jadwal & Shift</h1>
                    <p className="text-sm text-gray-500 mt-1">Kelola kalender kerja karyawan dan master aturan shift.</p>
                </div>
                {/* Tombol aksi dinamis berdasarkan Tab yang aktif */}
                <Button  
                    label={activeTab === 'jadwal' ? "Tukar Shift / Override" : "Tambah Master Shift"} 
                    onClick={() => {
                        if (activeTab === 'jadwal') navigate('/dashboard/jadwal-shift/tukar');
                        else navigate('/dashboard/jadwal-shift/tambah');
                    }} 
                />
            </div>

            {/* INFO BANNER */}
            {activeTab === 'shift' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3 shadow-sm transition-all duration-300">
                    <p className="text-sm text-yellow-700">
                        💡 <strong>Catatan:</strong> Perubahan aturan master shift dan nominal denda akan otomatis berlaku pada kalkulasi absensi di hari berikutnya.
                    </p>
                </div>
            )}

            {/* SISTEM TAB NAVIGASI UI */}
            <div className="flex border-b border-gray-300">
                <button
                    onClick={() => setActiveTab('jadwal')}
                    className={`flex items-center gap-2 py-3 px-6 font-semibold transition-all duration-200 ${
                        activeTab === 'jadwal'
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    <CalendarDays size={18} />
                    Jadwal Karyawan
                </button>
                <button
                    onClick={() => setActiveTab('shift')}
                    className={`flex items-center gap-2 py-3 px-6 font-semibold transition-all duration-200 ${
                        activeTab === 'shift'
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    <Clock size={18} />
                    Master Shift
                </button>
            </div>

            {/* RENDER KONTEN BERDASARKAN TAB AKTIF */}
            <div className="min-h-[400px]">
                
                {/* KONTEN 1: TAB JADWAL KARYAWAN */}
                {activeTab === 'jadwal' && (
                    <TabelMatrixJadwal />
                )}
                
                {/* KONTEN 2: TAB MASTER SHIFT (Tabel Lama Anda) */}
                {activeTab === 'shift' && (
                    <div className="animate-in fade-in duration-300">
                        {errorMsg ? (
                            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center font-medium shadow-sm">
                                {errorMsg}
                            </div>
                        ) : isLoading ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-white rounded-xl border border-gray-200 shadow-sm">
                                <Loader2 className="animate-spin mb-4 text-blue-600" size={32} />
                                <p>Memuat data Master Shift...</p>
                            </div>
                        ) : (
                            <TabelJadwalShift data={dataJadwalShift} onRefresh={fetchJadwalShift} />
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
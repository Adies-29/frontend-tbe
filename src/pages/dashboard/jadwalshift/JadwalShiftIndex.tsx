import { useNavigate } from "react-router-dom";
import Button from '../../../components/ui/Button';
import type { JadwalShiftData } from "../../../types";
import TabelJadwalShift from "../../../components/ui/tabel/tabelJadwalShif/TabelJadwalShif";
import { useEffect, useState } from "react";
import { useAuthStore } from "../../../store/useAuthStore";
import { Loader2 } from "lucide-react";

export default function JadwalShiftIndex() {
    const navigate = useNavigate();
    const [dataJadwalShift, setDataJadwalShift] = useState<JadwalShiftData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
    

   // Fungsi FETCH dari Backend ( Kunci Token)
       const fetchJadwalShift = async () => {
           setIsLoading(true);
           setErrorMsg("");
   
           try {
               // Ambil token dari memori browser
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
   
           } catch (error: any) {
               console.error("Error fetching Jadwal & shift:", error);
               setErrorMsg(error.message || "Gagal memuat data pegawai.");
           }finally{
               setIsLoading(false);
           }
       };
   
       useEffect(() => {
           fetchJadwalShift();
       }, []);
    

    

    return (
        <div className="flex flex-col gap-6 w-full p-2">
            {/* HEADER */}
            <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Jadwal & Shift Kerja</h1>
                    <p className="text-sm text-gray-500 mt-1">Kelola master data jam kerja, toleransi, dan denda.</p>
                </div>
                <Button  
                    label="Tambah Jadwal & Shift" 
                    onClick={() => navigate('/dashboard/jadwal-shift/tambah')} 
                />
            </div>

            {/* INFO BANNER */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3 shadow-sm">
                <p className="text-sm text-yellow-700">
                    💡 <strong>Catatan:</strong> Perubahan aturan shift dan nominal denda akan otomatis berlaku pada kalkulasi absensi di hari berikutnya.
                </p>
            </div>

            {/* PEMANGGILAN KOMPONEN TABEL */}
            {errorMsg ? (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center font-medium">
                        {errorMsg}
                    </div>
                ) : isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <Loader2 className="animate-spin mb-4 text-red-600" size={32} />
                        <p>Memuat data Jadwal & Shift...</p>
                    </div>
                ) : (
                    // Panggil komponen tabelnya
                    <TabelJadwalShift data={dataJadwalShift} onRefresh={fetchJadwalShift} />
                )} 
            
        </div>
    );
}
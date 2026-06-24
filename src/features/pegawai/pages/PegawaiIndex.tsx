import { useNavigate } from "react-router-dom";
import Button from "../../../components/common/Button";
import { useAuthStore } from "../../../store/useAuthStore";
import { Loader2 } from "lucide-react";
import TabelPegawai from "../../../features/pegawai/components/TabelPegawai";
import type { PegawaiData } from "../../../types";
import { getSafeErrorMessage } from "../../../utils/errorHandler";
import { apiFetch } from "../../../utils/apiFetch";

import { useQuery } from "@tanstack/react-query";

export default function PegawaiIndex() {
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token);

    // Fungsi FETCH dari Backend untuk React Query
    const fetchPegawai = async (): Promise<PegawaiData[]> => {
        const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/pegawai`, {
            method: "GET",
            headers: {
                "Content-Type" : "application/json",
                "Authorization" : `Bearer ${token}`
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
            return result.data;
        }
        throw new Error ("Format data tidak valid");
    };

    // Menggunakan useQuery dari React Query
    const { 
        data: dataPegawai = [], 
        isLoading, 
        error,
    } = useQuery({
        queryKey: ["pegawai"],
        queryFn: fetchPegawai,
        // Optional: refetchOnWindowFocus: false jika tidak ingin refresh otomatis saat pindah tab Chrome
    });

    // Ambil pesan error jika ada
    const errorMsg = error ? (error instanceof Error ? error.message : getSafeErrorMessage()) : "";

    const totalPegawai = dataPegawai.length;

    return (
        <div className="flex flex-col gap-4 md:gap-6 w-full">
            
            {/* 1. BAGIAN STATISTIK (Meniru desain kotak di gambarmu) */}
            <div className="flex flex-col md:flex-row gap-4 w-full">
                <div className="bg-white border border-gray-300 rounded-xl p-4 w-full md:w-48 shadow-sm flex flex-col items-center justify-center">
                    <span className="text-gray-800 text-sm md:text-base font-medium">Total Pegawai</span>
                    <span className="text-4xl font-bold mt-2 text-black">{totalPegawai}</span>
                </div>
            </div>

            {/* 2. BAGIAN TABEL DAN TOMBOL */}
            <section className="bg-white border border-gray-300 rounded-2xl p-3 md:p-5 shadow-sm w-full">
                
                {/* Header Tabel & Kumpulan Tombol */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-4">
                    <h2 className="text-lg font-bold text-black border-l-4 border-red-600 pl-2 mt-1">
                        Data Pegawai Aktif
                    </h2>
                    
                    <div className="flex flex-col gap-3 w-full md:w-auto">
                        <Button 
                            label="Tambah Pegawai" 
                            onClick={() => navigate("/dashboard/data-pegawai/tambah-pegawai")} 
                        />
                    </div>
                </div>
                
                {/* 3. PEMANGGILAN KOMPONEN TABEL */}
        
                <div className="w-full">
                    {errorMsg ? (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center font-medium text-sm md:text-base">
                            {errorMsg}
                        </div>
                    ) : isLoading ? (
                        <div className="flex flex-col items-center justify-center h-48 md:h-64 text-gray-400">
                            <Loader2 className="animate-spin mb-4 text-red-600" size={32} />
                            <p className="text-sm md:text-base">Memuat data pegawai...</p>
                        </div>
                    ) : (
                        // Panggil komponen tabelnya
                        <TabelPegawai data={dataPegawai} />
                    )} 
                </div>
            </section>
        </div>
    );
}


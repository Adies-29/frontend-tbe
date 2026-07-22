import { useNavigate } from "react-router-dom";
import Button from "../../../components/common/Button";
import { useAuthStore } from "../../../store/useAuthStore";
import { Loader2, Users, Plus } from "lucide-react";
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
        <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
            {/* HEADER */}
            <section data-tour="pegawai-header" className="bg-white border border-gray-300 rounded-2xl p-4 md:p-6 shadow-sm w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <Users size={28} className="text-blue-600" /> Data Pegawai Aktif
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Kelola data profil, jabatan, dan informasi kontrak kerja seluruh pegawai.</p>
                    </div>
                    <div className="w-full md:w-auto">
                        <Button 
                            label="Tambah Pegawai" 
                            icon={<Plus size={16} />}
                            onClick={() => navigate("/dashboard/data-pegawai/tambah-pegawai")} 
                            className="w-full md:w-auto font-bold text-xs shadow-md"
                            data-tour="btn-add-pegawai"
                        />
                    </div>
                </div>
            </section>

            {/* 1. BAGIAN STATISTIK */}
            <div data-tour="pegawai-stats" className="flex gap-4 w-full">
                <div className="bg-white border border-gray-300 rounded-xl p-4 w-full md:w-48 shadow-sm flex flex-col items-center justify-center">
                    <span className="text-gray-800 text-sm md:text-base font-medium">Total Pegawai</span>
                    <span className="text-4xl font-bold mt-2 text-black">{totalPegawai}</span>
                </div>
            </div>

            {/* 2. BAGIAN TABEL */}
            <section className="bg-white border border-gray-300 rounded-2xl p-4 md:p-6 shadow-sm w-full">
                <div data-tour="pegawai-table" className="w-full">
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


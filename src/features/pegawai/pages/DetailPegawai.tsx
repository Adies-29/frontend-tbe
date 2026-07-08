import {
    ArrowLeft,
    User,
    Phone,
    Mail,
    Briefcase,
    Building,
    Calendar,
    Hash,
    Clock,
} from "lucide-react";

import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../../../store/useAuthStore";
import type { PegawaiData } from "../../../types";
import Button from "../../../components/common/Button";
import { apiFetch } from "../../../utils/apiFetch";
import { useQuery } from "@tanstack/react-query";



export default function DetailPegawai() {
    const navigate = useNavigate();
    const { id } = useParams();
    const token = useAuthStore((state) => state.token);

    const { data: pegawai, isLoading, error } = useQuery({
        queryKey: ['pegawaiDetail', id],
        queryFn: async () => {
            if (!id) throw new Error("ID Pegawai tidak valid");
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/pegawai/${id}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Gagal mengambil data pegawai dari server");
            }
            return result.data as PegawaiData; 
        },
        enabled: !!id 
    });
    const errorMsg = error ? error.message : "";

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                Memuat data pegawai...
            </div>
        );
    }

    if (errorMsg) {
        return (
            <div className="flex justify-center items-center h-screen text-red-500">
                {errorMsg}
            </div>
        );
    }

    if (!pegawai) {
        return (
            <div className="flex justify-center items-center h-screen">
                Data pegawai tidak ditemukan
            </div>
        );
    }

    return (
        <div className="p-3 md:p-6 w-full">
            <div data-tour="detail-pegawai" className="bg-white rounded-xl shadow-md p-4 md:p-8 border border-gray-100">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                        Detail Pegawai
                    </h2>
                    <Button
                        variant="back"
                        icon={<ArrowLeft size={20} />}
                        onClick={() => navigate(-1)}
                        label="Kembali"
                    />
                </div>

                {/* Content */}
                <div className="max-w-5xl mx-auto px-6 mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Profile */}
                    <div className="col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
                        <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center mb-4 overflow-hidden border-4 border-white shadow-lg">
                            <User size={50} className="text-gray-400" />
                        </div>

                        <h2 className="text-xl font-bold text-gray-800 text-center uppercase">
                            {pegawai.nama}
                        </h2>

                        <p className="text-red-600 font-medium mt-1 text-sm bg-red-50 px-3 py-1 rounded-full text-center">
                            {pegawai.jabatan?.nama_jabatan ||
                                "Belum Ada Jabatan"}
                        </p>

                        <div className="w-full mt-6 space-y-4 border-t border-gray-100 pt-6">
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <Building size={16} />
                                <span className="font-medium">
                                    Departemen:
                                </span>
                                <span className="ml-auto">
                                    {pegawai.jabatan?.departemen
                                        ?.nama_departemen || "-"}
                                </span>
                            </div>

                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <Clock size={16} />
                                <span className="font-medium">
                                    Shift Default:
                                </span>
                                <span className="ml-auto font-bold">
                                    {pegawai.shifts?.kode_shift || "-"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Detail */}
                    <div className="col-span-1 md:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3 mb-5 flex items-center gap-2">
                                <User
                                    size={18}
                                    className="text-red-600"
                                />
                                Informasi Pegawai
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-6">
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">
                                        ID Internal
                                    </p>
                                    <p className="font-semibold">
                                        {pegawai.id}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-400 mb-1">
                                        NIK
                                    </p>
                                    <p className="font-semibold">
                                        {pegawai.nik || "-"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                                        <Phone size={12} />
                                        No. WhatsApp
                                    </p>
                                    <p className="font-semibold">
                                        {pegawai.no_hp || "-"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                                        <Mail size={12} />
                                        Email
                                    </p>
                                    <p className="font-semibold">
                                        {pegawai.email || "-"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                                        <Calendar size={12} />
                                        Tanggal Bergabung
                                    </p>
                                    <p className="font-semibold">
                                        {pegawai.tanggal_bergabung || "-"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                                        <Briefcase size={12} />
                                        Jabatan
                                    </p>
                                    <p className="font-semibold">
                                        {pegawai.jabatan?.nama_jabatan ||
                                            "-"}
                                    </p>
                                </div>

                                <div className="sm:col-span-2 border-t border-gray-50 pt-4">
                                    <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                                        <Hash size={12} />
                                        PIN Mesin Absen
                                    </p>
                                    <p className="font-mono font-bold bg-gray-100 px-2 py-1 rounded w-max">
                                        {pegawai.pin_mesin || "-"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Absensi */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4">
                                Riwayat Absensi
                            </h3>

                            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl h-32 flex flex-col items-center justify-center text-center p-6">
                                <p className="text-gray-600 font-semibold text-sm">
                                    Modul Absensi Sedang Disiapkan
                                </p>
                                <p className="text-gray-400 text-xs mt-1">
                                    Data kehadiran akan segera hadir di sini.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
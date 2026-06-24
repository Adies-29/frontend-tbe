import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, AlertCircle, Banknote } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import Button from '../../../components/common/Button';
import { Input } from '../../../components/common/InputText';
import { useAuthStore } from '../../../store/useAuthStore';
import { useState } from 'react';
import Notif from '../../../components/common/Notif';
import { apiFetch } from "../../../utils/apiFetch";
import { formatMinutesToText } from "../../../utils/formatMinutes";

import { useMutation, useQueryClient } from "@tanstack/react-query";


// 1. SCHEMA ZOD - Disesuaikan dengan penamaan presisi dari Database
const schema = z.object({
    kode_shift: z.string().min(1, "Kode shift wajib diisi"),
    jam_masuk: z.string().min(1, "Jam masuk wajib diisi"),
    jam_pulang: z.string().min(1, "Jam pulang wajib diisi"),
    batas_toleransi_menit: z.coerce.number().min(0).default(0),
    batas_maksimal_lembur_menit: z.coerce.number().min(0).default(0),
    lintas_hari: z.boolean().default(false),

    // Logika Terlambat & Scan Masuk
    is_potong_gaji_terlambat: z.boolean().default(false),
    denda_terlambat_per_menit: z.coerce.number().min(0).default(0),
    is_batas_scan: z.boolean().default(false),
    batas_akhir_scan_masuk_menit: z.coerce.number().min(0).default(0),

    // Logika Pulang Awal & Scan Pulang
    is_potong_gaji_pulang_awal: z.boolean().default(false),
    toleransi_pulang_awal_menit: z.coerce.number().min(0).default(0),
    denda_pulang_awal_per_menit: z.coerce.number().min(0).default(0),
    batas_akhir_scan_pulang_menit: z.coerce.number().min(0).default(0),

    // FITUR BARU: Tipe Denda Global
    tipe_denda: z.enum(["per_menit", "tetap"]).default("tetap"),
});

type FormData = z.infer<typeof schema>;

export default function AddShift() {
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token);
    const [notif, setNotif] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
        show: false,
        message: "",
        type: "success"
    });

    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors }
    } = useForm<FormData>({
        resolver: zodResolver(schema) as any ,
        defaultValues: {
            lintas_hari: false,
            batas_toleransi_menit: 0,
            batas_maksimal_lembur_menit: 0,
            is_batas_scan: false,
            batas_akhir_scan_masuk_menit: 0,
            batas_akhir_scan_pulang_menit: 0,
            is_potong_gaji_terlambat: false,
            denda_terlambat_per_menit: 0,
            is_potong_gaji_pulang_awal: false,
            toleransi_pulang_awal_menit: 0,
            denda_pulang_awal_per_menit: 0,
            tipe_denda: "tetap",
        }
    });

    const addShiftMutation = useMutation({
        mutationFn: async (finallyPayload: any) => {
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/shifts`, {
                method: "POST",
                headers: {
                    "Content-Type" : "application/json",
                    "Authorization" : `Bearer ${token}`
                },
                body: JSON.stringify(finallyPayload)
            });

            const result = await response.json();

            if(!response.ok || !result.success) {
                throw new Error(result.message || "Gagal menyimpan data shift");
            }
            return result;
        },
        onSuccess: () => {
            setNotif({ show: true, message: "Shift berhasil disimpan!", type: "success"});
            queryClient.invalidateQueries({ queryKey: [] })
            setTimeout(() => {
                navigate("/dashboard/jadwal-shift", {state: {activeTab: 'shift'}});
            }, 2000);
        },
        onError: (error: any) => {
            setNotif({ show: true, message: error.message || "Gagal menyimpan data shift", type: "error" });
        }
    })


    const onSubmit = async (data: FormData) => {

        const { tipe_denda, ...restData } = data;

        // Buat object payload baru yang Type-Safe untuk Backend
        const finalPayload = {
            ...restData,
            istetap: tipe_denda === "tetap",
            batas_akhir_scan_masuk_menit: restData.is_batas_scan ? restData.batas_akhir_scan_masuk_menit : 0,
            batas_akhir_scan_pulang_menit: restData.is_batas_scan ? restData.batas_akhir_scan_pulang_menit : 0,
        };
        addShiftMutation.mutate(finalPayload)

    };

    return (
        <div className="flex flex-col gap-6 w-full p-2 max-w-5xl mx-auto">

            <div className="bg-white rounded-xl shadow-md p-4 md:p-8 border border-gray-100">

                {/* HEADER */}
                <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Tambah Konfigurasi Shift</h1>
                        <p className="text-sm text-gray-500">Atur jadwal, toleransi, dan denda keterlambatan.</p>
                    </div>
                    <Button variant="back" disabled={addShiftMutation.isPending} icon={<ArrowLeft size={18} />} onClick={() => navigate("/dashboard/jadwal-shift", { state: { activeTab: 'shift' }})} label="Kembali" />
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* GRUP 1: WAKTU UTAMA */}
                    <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-5">
                        <div className="flex items-center gap-3 text-blue-600 font-bold border-b border-gray-100 pb-3">
                            <Clock size={20} /> <h2>Informasi Waktu & Utama</h2>
                        </div>
                        <Input
                            label="Kode Shift"
                            nama="kode_shift"
                            placeholder="Contoh: SHIFT_PAGI"
                            register={register}
                            error={errors.kode_shift?.message}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Jam Masuk"
                                nama="jam_masuk"
                                type="time"
                                register={register}
                                error={errors.jam_masuk?.message} />
                            <Input
                                label="Jam Pulang"
                                nama="jam_pulang"
                                type="time"
                                register={register}
                                error={errors.jam_pulang?.message} />
                        </div>
                        <label htmlFor="lintas_hari" className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-red-50 transition-colors cursor-pointer select-none">
                            <span className="text-sm font-medium text-gray-700">Aktifkan Lintas Hari (Shift Malam)</span>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    id="lintas_hari"
                                    {...register("lintas_hari")}
                                    className="sr-only peer" />
                                <div className="w-10 h-[22px] bg-gray-300 rounded-full peer-checked:bg-red-500 transition-colors"></div>
                                <div className="absolute top-[3px] left-[3px] w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-[18px] transition-transform"></div>
                            </div>
                        </label>
                    </section>

                    {/* GRUP 2: TOLERANSI & SCAN */}
                    <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-5">
                        <div className="flex items-center gap-3 text-orange-600 font-bold border-b border-gray-100 pb-3">
                            <AlertCircle size={20} /> <h2>Toleransi & Batas Scan</h2>
                        </div>
                        <Input
                            label="Batas Maksimal Lembur (Menit)"
                            nama="batas_maksimal_lembur_menit"
                            type="number"
                            placeholder="0"
                            register={register}
                            error={errors.batas_maksimal_lembur_menit?.message}
                            helperText={watch("batas_maksimal_lembur_menit") > 0 ? (
                                <span className="text-xs text-blue-600 font-medium italic"> {formatMinutesToText(watch("batas_maksimal_lembur_menit"))}</span>
                            ) : null}
                        />
                        <label htmlFor="is_batas_scan" className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-orange-50 transition-colors border border-gray-100 cursor-pointer select-none">
                            <span className="text-sm font-medium text-gray-700">Batasi Waktu Scan Masuk & Pulang</span>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    id="is_batas_scan"
                                    {...register("is_batas_scan")}
                                    className="sr-only peer" />
                                <div className="w-10 h-[22px] bg-gray-300 rounded-full peer-checked:bg-orange-500 transition-colors"></div>
                                <div className="absolute top-[3px] left-[3px] w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-[18px] transition-transform"></div>
                            </div>
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Batas Scan Masuk (Menit)"
                                nama="batas_akhir_scan_masuk_menit"
                                type="number"
                                placeholder="120"
                                register={register}
                                disabled={!watch("is_batas_scan")}
                                helperText={watch("is_batas_scan") && watch("batas_akhir_scan_masuk_menit") > 0 ? (
                                    <span className="text-xs text-blue-600 font-medium italic"> {formatMinutesToText(watch("batas_akhir_scan_masuk_menit"))}</span>
                                ) : (!watch("is_batas_scan") ? <span className="text-xs text-gray-500 italic">Unlimited / Tidak dibatasi</span> : null)}
                            />
                            <Input
                                label="Batas Scan Pulang (Menit)"
                                nama="batas_akhir_scan_pulang_menit"
                                type="number"
                                placeholder="120"
                                register={register}
                                disabled={!watch("is_batas_scan")}
                                helperText={watch("is_batas_scan") && watch("batas_akhir_scan_pulang_menit") > 0 ? (
                                    <span className="text-xs text-blue-600 font-medium italic"> {formatMinutesToText(watch("batas_akhir_scan_pulang_menit"))}</span>
                                ) : (!watch("is_batas_scan") ? <span className="text-xs text-gray-500 italic">Unlimited / Tidak dibatasi</span> : null)}
                            />
                        </div>
                    </section>

                    {/* GRUP 2.5: PENGATURAN TIPE DENDA (GLOBAL) */}
                    <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-5 md:col-span-2">
                        <div className="flex items-center gap-3 text-emerald-600 font-bold border-b border-gray-100 pb-3">
                            <Banknote size={20} /> <h2>Sistem Perhitungan Denda (Global)</h2>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-6">
                            <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-emerald-50 transition-colors flex-1">
                                <input
                                    type="radio"
                                    value="per_menit"
                                    {...register("tipe_denda")}
                                    className="w-5 h-5 cursor-pointer accent-emerald-600" />
                                <div className="flex flex-col">
                                    <span className="font-semibold text-gray-800">Denda Per Menit</span>
                                    <span className="text-xs text-gray-500">Nominal dikalikan durasi keterlambatan</span>
                                </div>
                            </label>
                            
                            <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-emerald-50 transition-colors flex-1">
                                <input
                                    type="radio"
                                    value="tetap"
                                    {...register("tipe_denda")}
                                    className="w-5 h-5 cursor-pointer accent-emerald-600" />
                                <div className="flex flex-col">
                                    <span className="font-semibold text-gray-800">Nominal Tetap (Flat)</span>
                                    <span className="text-xs text-gray-500">Nominal dipotong sekali per kejadian</span>
                                </div>
                            </label>
                        </div>
                    </section>

                    {/* GRUP 3: DENDA TERLAMBAT */}
                    <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-5">
                        <div className="flex items-center gap-3 text-red-600 font-bold pb-3">
                            <Banknote size={20} /> <h2>Aturan Denda Terlambat</h2>
                        </div>
                        <label htmlFor="is_potong_gaji_terlambat" className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-red-50 transition-colors cursor-pointer select-none">
                            <span className="text-sm font-medium text-gray-700">Potong Gaji Jika Terlambat</span>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    id="is_potong_gaji_terlambat"
                                    {...register("is_potong_gaji_terlambat")}
                                    className="sr-only peer" />
                                <div className="w-10 h-[22px] bg-gray-300 rounded-full peer-checked:bg-red-500 transition-colors"></div>
                                <div className="absolute top-[3px] left-[3px] w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-[18px] transition-transform"></div>
                            </div>
                        </label>


                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                            <Input
                                label="Batas Toleransi (Menit)"
                                nama="batas_toleransi_menit"
                                type="number"
                                placeholder="0"
                                register={register}
                                error={errors.batas_toleransi_menit?.message}
                                helperText={watch("batas_toleransi_menit") > 0 ? (
                                    <span className="text-xs text-blue-600 font-medium italic"> {formatMinutesToText(watch("batas_toleransi_menit"))}</span>
                                ) : null}
                            />

                            <Input
                                label={watch("tipe_denda") === "tetap" ? "Denda Terlambat (Rp/Tetap)" : "Denda Terlambat (Rp/Menit)"}
                                nama="denda_terlambat_per_menit"
                                type="number"
                                placeholder="Masukkan nominal"
                                register={register}
                                error={errors.denda_terlambat_per_menit?.message}
                                disabled={!watch("is_potong_gaji_terlambat")}

                            />

                        </div>

                    </section>

                    {/* GRUP 4: DENDA PULANG AWAL */}
                    <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-5">
                        <div className="flex items-center gap-3 text-purple-600 font-bold border-b border-gray-100 pb-3">
                            <Banknote size={20} /> <h2>Aturan Pulang Awal</h2>
                        </div>
                        <label htmlFor="is_potong_gaji_pulang_awal" className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-red-50 transition-colors cursor-pointer select-none">
                            <span className="text-sm font-medium text-gray-700">Potong Gaji Jika Pulang Awal</span>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    id="is_potong_gaji_pulang_awal"
                                    {...register("is_potong_gaji_pulang_awal")}
                                    className="sr-only peer" />
                                <div className="w-10 h-[22px] bg-gray-300 rounded-full peer-checked:bg-purple-500 transition-colors"></div>
                                <div className="absolute top-[3px] left-[3px] w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-[18px] transition-transform"></div>
                            </div>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                label="Toleransi (Menit)"
                                nama="toleransi_pulang_awal_menit"
                                type="number"
                                placeholder="0"
                                register={register}
                                error={errors.toleransi_pulang_awal_menit?.message}
                                helperText={watch("toleransi_pulang_awal_menit") > 0 ? (
                                    <span className="text-xs text-blue-600 font-medium italic"> {formatMinutesToText(watch("toleransi_pulang_awal_menit"))}</span>
                                ) : null}
                            />
                            <Input
                                label={watch("tipe_denda") === "tetap" ? "Denda Pulang Awal (Rp/Tetap)" : "Denda Per Menit (Rp)"}
                                nama="denda_pulang_awal_per_menit"
                                type="number"
                                placeholder="Masukkan nominal"
                                register={register}
                                error={errors.denda_pulang_awal_per_menit?.message}
                                disabled={!watch("is_potong_gaji_pulang_awal")}
                            />
                        </div>

                    </section>

                    <div className="md:col-span-2 flex justify-end gap-4 mt-4 p-4 rounded-xl ">
                        <Button
                            variant="success"
                            type="submit"
                            label={addShiftMutation.isPending ? "Menyimpan Data Shift..." : "Simpan Konfigurasi Shift"}
                            disabled={addShiftMutation.isPending}
                           
                        />
                        <Button
                            type="button"
                            variant="danger"
                            label="Batal"
                            onClick={() => navigate("/dashboard/jadwal-shift", { state: { activeTab: 'shift' }})}
                        />
                    </div>
                </form>
            </div>
            <Notif
                show={notif.show}
                message={notif.message}
                type={notif.type}
                onClose={() => setNotif({ show: false, message: "", type: "success" })}
            />
        </div>
    );
}
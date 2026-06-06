import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, AlertCircle, Banknote } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import Button from '../../../components/ui/Button';
import { Input } from '../../../components/ui/InputText';
import { useAuthStore } from '../../../store/useAuthStore';
import { useState } from 'react';

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
    batas_akhir_scan_masuk_menit: z.coerce.number().min(0).default(0), // Ditambahkan _menit

    // Logika Pulang Awal & Scan Pulang
    is_potong_gaji_pulang_awal: z.boolean().default(false),
    toleransi_pulang_awal_menit: z.coerce.number().min(0).default(0), // Ditambahkan _menit
    denda_pulang_awal_per_menit: z.coerce.number().min(0).default(0),
    batas_akhir_scan_pulang_menit: z.coerce.number().min(0).default(0), // Ditambahkan _menit
});

type FormData = z.infer<typeof schema>;

export default function AddShift() {
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token);
    const [isSaving, setIsSaving] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors }
    } = useForm<FormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(schema) as any,
        defaultValues: {
            lintas_hari: false,
            batas_toleransi_menit: 0,
            batas_maksimal_lembur_menit: 120,
            batas_akhir_scan_masuk_menit: 120,
            batas_akhir_scan_pulang_menit: 120,
            is_potong_gaji_terlambat: false,
            denda_terlambat_per_menit: 0,
            is_potong_gaji_pulang_awal: false,
            toleransi_pulang_awal_menit: 0,
            denda_pulang_awal_per_menit: 0,
        }
    });


    const onSubmit = async (data: FormData) => {
        setIsSaving(true);
        try {
            const response = await fetch(`https://ppm-sooty.vercel.app/api/v1/shifts`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                alert(`Sukses! Jadwal Shift baru telah disimpan.`);
                navigate("/dashboard/jadwal-shift");
            } else {
                alert(result.message || "Gagal menambahkan shift.");
            }

        } catch (error) {
            console.error("Error:", error);
            alert("Terjadi kesalahan saat menghubungi server.");
        } finally {
            setIsSaving(false)
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full p-2 max-w-5xl mx-auto">
            {/* HEADER */}
            <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Tambah Konfigurasi Shift</h1>
                    <p className="text-sm text-gray-500">Atur jadwal, toleransi, dan denda keterlambatan.</p>
                </div>
                <Button variant="back" disabled={isSaving} icon={<ArrowLeft size={18} />} onClick={() => navigate(-1)} label="Kembali" />
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
                    <div className="grid grid-cols-2 gap-4">
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
                    <div className="flex items-center gap-3 mb-2 p-3 rounded-xl hover:bg-red-50 transition-colors">
                        <input
                            type="checkbox"
                            id="lintas_hari"
                            {...register("lintas_hari")}
                            className="w-5 h-5 cursor-pointer" />
                        <label htmlFor="lintas_hari" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Aktifkan Lintas Hari (Shift Malam)
                        </label>
                    </div>
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
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Batas Scan Masuk (Menit)"
                            nama="batas_akhir_scan_masuk_menit"
                            type="number"
                            placeholder="120"
                            register={register} />
                        <Input
                            label="Batas Scan Pulang (Menit)"
                            nama="batas_akhir_scan_pulang_menit"
                            type="number"
                            placeholder="120"
                            register={register} />
                    </div>
                </section>

                {/* GRUP 3: DENDA TERLAMBAT */}
                <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-5">
                    <div className="flex items-center gap-3 text-red-600 font-bold pb-3">
                        <Banknote size={20} /> <h2>Aturan Denda Terlambat</h2>
                    </div>
                    <div className="flex items-center gap-3 mb-2 p-3 rounded-xl hover:bg-red-50 transition-colors">
                        <input
                            type="checkbox"
                            id="is_potong_gaji_terlambat"
                            {...register("is_potong_gaji_terlambat")}
                            className="w-5 h-5 cursor-pointer" />
                        <label htmlFor="is_potong_gaji_terlambat" className="text-sm font-medium text-gray-700 cursor-pointer">Potong Gaji Jika Terlambat</label>
                    </div>


                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        
                        <Input
                            label="Batas Toleransi (Menit)"
                            nama="batas_toleransi_menit"
                            type="number"
                            placeholder="0"
                            register={register}
                            error={errors.batas_toleransi_menit?.message}
                        />
                        
                        <Input
                            label="Denda Terlambat (Rp/Menit)"
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
                    <div className="flex items-center gap-3 mb-2 p-3 rounded-xl hover:bg-red-50 transition-colors">
                        <input
                            type="checkbox"
                            id="is_potong_gaji_pulang_awal"
                            {...register("is_potong_gaji_pulang_awal")}
                            className="w-5 h-5 cursor-pointer" />
                        <label htmlFor="is_potong_gaji_pulang_awal" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Potong Gaji Jika Pulang Awal
                        </label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Toleransi (Menit)"
                            nama="toleransi_pulang_awal_menit"
                            type="number"
                            placeholder="0"
                            register={register}
                            error={errors.toleransi_pulang_awal_menit?.message}
                            
                        />
                        <Input
                            label="Denda Per Menit (Rp)"
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
                        label="Simpan Konfigurasi Shift"
                        disabled={isSaving}
                    />
                    <Button
                        type="button"
                        variant="secondary"
                        label="Batal"
                        onClick={() => navigate(-1)}
                    />
                </div>
            </form>
        </div>
    );
}
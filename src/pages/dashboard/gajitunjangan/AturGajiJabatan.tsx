import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, Banknote, Loader2 } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { z } from 'zod';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../../../components/ui/InputText'; 
import { useAuthStore } from '../../../store/useAuthStore';

// Skema validasi Zod (Nama kunci ini WAJIB sama dengan prop 'nama' di Input)
const schema = z.object({
    upah_per_kehadiran: z.coerce.number().min(0, "Tidak boleh minus"),
    upah_lembur_per_jam: z.coerce.number().min(0, "Tidak boleh minus"),
    bonus_disiplin_harian: z.coerce.number().min(0, "Tidak boleh minus"),
    bonus_kerapian_harian: z.coerce.number().min(0, "Tidak boleh minus"),
    bonus_minggu_6_hari: z.coerce.number().min(0, "Tidak boleh minus"),
    bonus_minggu_5_hari: z.coerce.number().min(0, "Tidak boleh minus"),
    bonus_minggu_harian: z.coerce.number().min(0, "Tidak boleh minus"),
    bonus_lembur_tahunan: z.coerce.number().min(0, "Tidak boleh minus"),
});

type FormData = z.infer<typeof schema>;

export default function AturGajiJabatan() {
    const { id } = useParams();
    const navigate = useNavigate();
    const token = useAuthStore((state) => (state.token));
    
    const [isSaving, setIsSaving] = useState(false);
    const [isFetchingData, setIsFetchingData] = useState(true);
    const [jabatanInfo, setJabatanInfo] = useState({ nama_jabatan: "Memuat...", departemen: "..." });

    const {
        register,
        handleSubmit,
        reset, 
        formState: { errors }
    } = useForm<FormData>({
        resolver: zodResolver(schema) as any, 
        defaultValues: {
            upah_per_kehadiran: 0,
            upah_lembur_per_jam: 0,
            bonus_disiplin_harian: 0,
            bonus_kerapian_harian: 0,
            bonus_minggu_6_hari: 0,
            bonus_minggu_5_hari: 0,
            bonus_minggu_harian: 0,
            bonus_lembur_tahunan: 0,
        }
    });

    useEffect(() => {
        const loadGajiJabatan = async () => {
            try {
                setIsFetchingData(true);

                const response = await fetch(`https://ppm-sooty.vercel.app/api/v1/jabatan/${id}`, {
                    method: "GET",
                    headers: {
                        "Content-Type" : "application/json",
                        "Authorization" : `Bearer ${token}`
                    }
                });

                const result = await response.json();
                
                if (response.ok && result.success) {
                    const gaji = result.data;
                    setJabatanInfo({
                        nama_jabatan: gaji.nama_jabatan || "Nama Jabatan",
                        departemen: gaji.departemen?.nama_departemen || "Umum"
                    });
                    
                    reset({
                        upah_per_kehadiran: gaji.upah_per_kehadiran || 0,
                        upah_lembur_per_jam: gaji.upah_lembur_per_jam || 0,
                        bonus_disiplin_harian: gaji.bonus_disiplin_harian || 0, 
                        bonus_kerapian_harian: gaji.bonus_kerapian_harian || 0,
                        bonus_minggu_6_hari: gaji.bonus_minggu_6_hari || 0,
                        bonus_minggu_5_hari: gaji.bonus_minggu_5_hari || 0,
                        bonus_minggu_harian: gaji.bonus_minggu_harian || 0,
                        bonus_lembur_tahunan: gaji.bonus_lembur_tahunan || 0,
                    });
                } else {
                    alert("Gagal memuat data konfigurasi Gaji Jabatan.");
                    navigate(-1);
                }
            } catch (error) {
                console.error("Error fetching Gaji Jabatan details:", error);
                alert("Terjadi kesalahan koneksi saat mengambil data server.");
            } finally {
                setIsFetchingData(false);
            }
        };
        
        if (id) loadGajiJabatan();
    }, [id, token, reset, navigate]);

    const onSubmit = async (data: FormData) => {   
        setIsSaving(true);
        try {
            const response = await fetch(`https://ppm-sooty.vercel.app/api/v1/jabatan/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type" : "application/json",
                    "Authorization" : `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok && result.success){
                alert(`Sukses! Perubahan konfigurasi Gaji Jabatan berhasil diperbarui.`);
                navigate('/dashboard/gaji-tunjangan', { state: { tab: 'master' } });
            } else {
                alert("Gagal menyimpan ke database. Coba lagi.");
            }
        } catch (error) {
            console.error("Error Submit:", error);
            alert("Terjadi kesalahan jaringan.");
        } finally {
            setIsSaving(false);
        }   
    };

    const handleResetGaji = () => {
        const confirmReset = window.confirm("Yakin ingin mereset angka ke 0? (Anda tetap harus klik Simpan untuk mengunci di database)");
        if (confirmReset) {
            reset({
                upah_per_kehadiran: 0,
                upah_lembur_per_jam: 0,
                bonus_disiplin_harian: 0,
                bonus_kerapian_harian: 0,
                bonus_minggu_6_hari: 0,
                bonus_minggu_5_hari: 0,
                bonus_minggu_harian: 0,
                bonus_lembur_tahunan: 0,
            });
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full relative min-h-125">
            {isFetchingData && (
                <div className="absolute inset-0 z-50 bg-white/60 flex items-center justify-center rounded-xl backdrop-blur-sm">
                    <Loader2 className="animate-spin text-blue-600" size={40} />
                </div>
            )}
            
            {/* HEADER HALAMAN */}
            <div className="bg-white border border-gray-300 rounded-xl p-5 shadow-sm flex justify-between items-center">
                <div>
                    <h2 className="text-xl text-gray-500 font-semibold mb-1">Pengaturan Gaji & Tunjangan</h2>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-extrabold text-gray-900">
                            {jabatanInfo.nama_jabatan}
                        </h1>
                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold border border-gray-200">
                            Dept: {jabatanInfo.departemen}
                        </span>
                    </div>
                </div>
                <Button
                    variant="back"
                    icon={<ArrowLeft size={18} />}
                    onClick={() => navigate(-1)}
                    label="Kembali"
                />
            </div>

            {/* FORM INPUT GAJI */}
            <div className="bg-white border border-gray-300 rounded-xl shadow-sm">
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 p-1">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 pb-0">
                    {/* GRUP 1: UPAH UTAMA */}
                    <section className="bg-gray-50 p-6 rounded-xl border border-gray-200 flex flex-col gap-4">
                        <div className="flex items-center gap-2 mb-2 text-green-700 font-bold border-b border-gray-300 pb-2">
                            <Banknote size={20} /> <h2>Upah Dasar & Lembur</h2>
                        </div>
                        
                        <Input 
                            label="Upah Kehadiran (Rp/Hari)" 
                            nama="upah_per_kehadiran" // PERBAIKAN: Harus match dengan Zod
                            type="number" 
                            placeholder="Masukkan upah kehadiran"
                            register={register} 
                            error={errors.upah_per_kehadiran?.message} 
                        />
                        <Input 
                            label="Upah Lembur (Rp/Jam)" 
                            nama="upah_lembur_per_jam" // PERBAIKAN
                            type="number" 
                            placeholder="Masukkan upah lembur"
                            register={register} 
                            error={errors.upah_lembur_per_jam?.message} 
                        />
                         <Input 
                            label="Bonus Lembur Tahunan (Rp)" 
                            nama="bonus_lembur_tahunan" // PERBAIKAN
                            type="number" 
                            placeholder="Masukkan bonus tahunan"
                            register={register} 
                            error={errors.bonus_lembur_tahunan?.message} 
                        />
                    </section>

                    {/* GRUP 2: BONUS & REWARD */}
                    <section className="bg-gray-50 p-6 rounded-xl border border-gray-200 flex flex-col gap-4">
                        <div className="flex items-center gap-2 mb-2 text-yellow-600 font-bold border-b border-gray-300 pb-2">
                            <Award size={20} /> <h2>Bonus Performa</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input 
                                label="Disiplin Harian (Rp)" 
                                nama="bonus_disiplin_harian" // PERBAIKAN
                                type="number" 
                                placeholder="Rp"
                                register={register}
                                error={errors.bonus_disiplin_harian?.message} 
                            />
                            <Input 
                                label="Kerapian Harian (Rp)" 
                                nama="bonus_kerapian_harian" // PERBAIKAN
                                type="number" 
                                placeholder="Rp"
                                register={register} 
                                error={errors.bonus_kerapian_harian?.message}
                            />
                        </div>
                        
                        {/* PERBAIKAN: Diubah jadi 3 kolom agar rapi */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input 
                                label="Bonus Full (6 Hari)" 
                                nama="bonus_minggu_6_hari" // PERBAIKAN
                                type="number" 
                                placeholder="Rp"
                                register={register} 
                                error={errors.bonus_minggu_6_hari?.message}
                            />
                            <Input 
                                label="Bonus Full (5 Hari)" 
                                nama="bonus_minggu_5_hari" // PERBAIKAN
                                type="number" 
                                placeholder="Rp"
                                register={register} 
                                error={errors.bonus_minggu_5_hari?.message}
                            />
                            <Input 
                                label="Bonus Harian" 
                                nama="bonus_minggu_harian" // PERBAIKAN
                                type="number" 
                                placeholder="Rp"
                                register={register} 
                                error={errors.bonus_minggu_harian?.message}
                            />
                        </div>
                    </section>
                </div>

                {/* TOMBOL AKSI */}
                <div className="flex justify-between items-center bg-gray-50 p-5 rounded-b-xl border-t border-gray-200 mt-2">
                    <button 
                        type="button" 
                        onClick={handleResetGaji} 
                        className="text-red-600 font-semibold text-sm hover:underline"
                    >
                        Reset ke 0
                    </button>
                    <div className="flex gap-3">
                        <Button 
                            variant="success"
                            type="submit" 
                            disabled={isSaving}
                            label={isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
                            icon={isSaving ? <Loader2 className="animate-spin" size={16} /> : undefined} 
                            />
                        <Button type="button" variant="secondary" label="Batal" 
                            onClick={() => navigate('/dashboard/gaji-tunjangan', { state: { tab: 'master' } })} />
                    </div>
                </div>
            </form>
            </div>
        </div>
    );
}
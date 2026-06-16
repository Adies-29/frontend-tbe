import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, Banknote, Loader2 } from 'lucide-react';
import Button from '../../../components/common/Button';
import { z } from 'zod';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../../../components/common/InputText';
import { useAuthStore } from '../../../store/useAuthStore';
import ConfirmPopUp from '../../../components/common/ConfirmPopUp';
import Notif from '../../../components/common/Notif';
import { apiFetch } from "../../../utils/apiFetch";

// 1. UPDATE SCHEMA: Tambahkan tipe_penggajian dan gaji_pokok_bulanan
const schema = z.object({
    tipe_penggajian: z.enum(["Harian", "Bulanan"]),
    gaji_pokok_bulanan: z.coerce.number().min(0, "Tidak boleh minus"),
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

    const [showResetPopup, setShowResetPopup] = useState(false);
    const [notif, setNotif] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
        show: false,
        message: "",
        type: "success"
    });

    const {
        register,
        handleSubmit,
        reset,
        watch, // Tarik fungsi watch untuk memantau perubahan input secara realtime
        formState: { errors }
    } = useForm<FormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(schema) as any,
        defaultValues: {
            tipe_penggajian: "Bulanan", // Default value
            gaji_pokok_bulanan: 0,
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

    // Pantau dropdown tipe penggajian untuk mengubah UI
    const tipePenggajianAktif = watch("tipe_penggajian");

    useEffect(() => {
        const loadGajiJabatan = async () => {
            try {
                setIsFetchingData(true);

                const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/jabatan/${id}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
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
                        tipe_penggajian: gaji.tipe_penggajian || "Bulanan", // Ambil dari database
                        gaji_pokok_bulanan: gaji.gaji_pokok_bulanan || 0,
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
                    setNotif({ show: true, message: "Gagal memuat data konfigurasi Gaji Jabatan.", type: "error" });
                    setTimeout(() => navigate(-1), 1500);
                }
            } catch (error) {
                console.error("Error fetching Gaji Jabatan details:", error);
                setNotif({ show: true, message: "Terjadi kesalahan koneksi saat mengambil data server.", type: "error" });
            } finally {
                setIsFetchingData(false);
            }
        };

        if (id) loadGajiJabatan();
    }, [id, token, reset, navigate]);

    const onSubmit = async (data: FormData) => {
        setIsSaving(true);
        try {
            // 2. LOGIKA OTOMATISASI SEBELUM KIRIM KE BACKEND
            const payloadKiriman = { ...data };

            if (payloadKiriman.tipe_penggajian === "Bulanan") {
                // Jika bulanan, otomatis hitung upah_per_kehadiran (dibagi 30)
                // Gunakan Math.round agar angkanya bulat tidak ada koma (desimal)
                payloadKiriman.upah_per_kehadiran = Math.round(payloadKiriman.gaji_pokok_bulanan / 30);
            } else {
                // Jika harian, pastikan gaji pokok bulanan di-reset ke 0 agar data tetap bersih
                payloadKiriman.gaji_pokok_bulanan = 0;
            }

            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/jabatan/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payloadKiriman) // Kirim payload yang sudah dimodifikasi
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setNotif({ show: true, message: "Pengaturan gaji berhasil disimpan!", type: "success" });
                setTimeout(() => {
                    navigate('/dashboard/gaji-tunjangan', { state: { tab: 'master' } });
                }, 2000);
            } else{
                setNotif({ show: true, message: "Gagal menyimpan ke database. Coba lagi.", type: "error" });
            }
        } catch (error) {
           console.error("Error Submit:", error);
            setNotif({ show: true, message: "Terjadi kesalahan jaringan.", type: "error" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetGaji = () => {
        reset({
            // tipe_penggajian dibiarkan tidak di-reset agar tidak bingung
            gaji_pokok_bulanan: 0,
            upah_per_kehadiran: 0,
            upah_lembur_per_jam: 0,
            bonus_disiplin_harian: 0,
            bonus_kerapian_harian: 0,
            bonus_minggu_6_hari: 0,
            bonus_minggu_5_hari: 0,
            bonus_minggu_harian: 0,
            bonus_lembur_tahunan: 0,
        });
        setShowResetPopup(false);
        setNotif({ show: true, message: "Angka di-reset. Jangan lupa klik Simpan!", type: "success" });
    };

    return (
        <div className="flex flex-col gap-6 w-full relative min-h-125">
            {isFetchingData && (
                <div className="absolute inset-0 z-50 bg-white/60 flex items-center justify-center rounded-xl backdrop-blur-sm">
                    <Loader2 className="animate-spin text-blue-600" size={40} />
                </div>
            )}

            {/* HEADER HALAMAN */}
            <div className="bg-white border border-gray-300 rounded-xl p-4 md:p-5 shadow-sm flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h2 className="text-sm md:text-xl text-gray-500 font-semibold mb-1">Pengaturan Gaji & Tunjangan</h2>
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg md:text-2xl font-bold text-gray-900 break-word">
                            {jabatanInfo.nama_jabatan}
                        </h1>
                        <span className=" w-fit bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold border border-gray-200">
                            Dept: {jabatanInfo.departemen}
                        </span>
                    </div>
                </div>
                <div className='w-full md:w-auto flex justify-end'>
                    <Button
                        variant="back"
                        icon={<ArrowLeft size={18} />}
                        onClick={() => navigate(-1)}
                        label="Kembali"
                    />
                </div>
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

                            {/* 3. DROPDOWN TIPE PENGGAJIAN */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-gray-700">Tipe Penggajian</label>
                                <select
                                    {...register("tipe_penggajian")}
                                    className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 shadow-sm text-sm bg-white"
                                >
                                    <option value="Bulanan">Gaji Bulanan</option>
                                    <option value="Harian">Gaji Harian</option>
                                </select>
                            </div>

                            {/* 4. RENDER KONDISIONAL INPUT BERDASARKAN TIPE */}
                            {tipePenggajianAktif === "Bulanan" ? (
                                <Input
                                    label="Gaji Pokok Bulanan (Rp)"
                                    nama="gaji_pokok_bulanan"
                                    type="number"
                                    placeholder="Misal: 5000000"
                                    register={register}
                                    error={errors.gaji_pokok_bulanan?.message}
                                />
                            ) : (
                                <Input
                                    label="Upah Kehadiran (Rp/Hari)"
                                    nama="upah_per_kehadiran"
                                    type="number"
                                    placeholder="Misal: 150000"
                                    register={register}
                                    error={errors.upah_per_kehadiran?.message}
                                />
                            )}

                            <Input
                                label="Upah Lembur (Rp/Jam)"
                                nama="upah_lembur_per_jam"
                                type="number"
                                placeholder="Masukkan upah lembur"
                                register={register}
                                error={errors.upah_lembur_per_jam?.message}
                            />
                            <Input
                                label="Bonus Lembur Tahunan (Rp)"
                                nama="bonus_lembur_tahunan"
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
                                    nama="bonus_disiplin_harian"
                                    type="number"
                                    placeholder="Rp"
                                    register={register}
                                    error={errors.bonus_disiplin_harian?.message}
                                />
                                <Input
                                    label="Kerapian Harian (Rp)"
                                    nama="bonus_kerapian_harian"
                                    type="number"
                                    placeholder="Rp"
                                    register={register}
                                    error={errors.bonus_kerapian_harian?.message}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <Input
                                    label="Bonus Full (5 Hari)"
                                    nama="bonus_minggu_5_hari"
                                    type="number"
                                    placeholder="Rp"
                                    register={register}
                                    error={errors.bonus_minggu_5_hari?.message}
                                />
                                <Input
                                    label="Bonus Full (6 Hari)"
                                    nama="bonus_minggu_6_hari"
                                    type="number"
                                    placeholder="Rp"
                                    register={register}
                                    error={errors.bonus_minggu_6_hari?.message}
                                />
                                <Input
                                    label="Bonus Harian"
                                    nama="bonus_minggu_harian"
                                    type="number"
                                    placeholder="Rp"
                                    register={register}
                                    error={errors.bonus_minggu_harian?.message}
                                />
                            </div>
                        </section>
                    </div>

                    {/* TOMBOL AKSI */}
                    <div className="flex flex-col md:flex-row gap-4 md:justify-between md:items-center bg-gray-50 p-4 md:p-5 rounded-b-xl border-t border-gray-200 mt-2">
                        <button
                            type="button"
                            onClick={() => setShowResetPopup(true)}
                            className="text-red-600 font-semibold text-sm hover:underline"
                        >
                            Reset ke 0
                        </button>
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto ">
                            <Button
                                variant='success'
                                type="submit"
                                disabled={isSaving}
                                label={isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
                                icon={isSaving ? <Loader2 className="animate-spin" size={16} /> : undefined}
                            />
                            <Button
                                type="button"
                                variant="danger"
                                label="Batal"
                                onClick={() => navigate('/dashboard/gaji-tunjangan', { state: { tab: 'master' } })} />
                        </div>
                    </div>
                </form>
            </div>

            <ConfirmPopUp 
                isOpen={showResetPopup}
                onClose={() => setShowResetPopup(false)}
                onConfirm={handleResetGaji}
                title="Reset Semua ke 0?"
                message={
                    <>
                        Semua angka upah dan bonus akan dihapus menjadi 0. Anda tetap harus klik <b className="text-gray-700">Simpan Pengaturan</b> agar tersimpan di sistem.
                    </>
                }
                confirmText="Ya, Reset"
                variant="danger"
            />
            <Notif 
                show={notif.show} 
                message={notif.message} 
                type={notif.type} 
                onClose={() => setNotif({ show: false, message: "", type: "success" })} 
            />

        </div>
    );
}
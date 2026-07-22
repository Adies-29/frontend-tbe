import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, AlertCircle, Banknote, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '../../../components/common/Button';
import { Input } from '../../../components/common/InputText';
import Notif from '../../../components/common/Notif';
import { apiFetchJson } from "../../../utils/apiFetch";
import { formatMinutesToText } from "../../../utils/formatMinutes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNotif } from '../../../hooks/useNotif';

// 1. SCHEMA ZOD 
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

export default function EditShift() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { notif, showNotif, showErrorNotif, closeNotif } = useNotif();

    const queryClient = useQueryClient();

    const { register,
        handleSubmit,
        watch,
        reset,
        formState: { errors }
    } = useForm<FormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(schema) as any,
    });

    const shiftQuery = useQuery({
        queryKey: ['masterShift', id],
        queryFn: async () => {
            const result = await apiFetchJson(`/api/v1/shifts/${id}`);
            return result.data;
        },
        enabled: !!id
    });

    useEffect(() => {
        if (shiftQuery.data) {
            const shift = shiftQuery.data;
            reset({
                kode_shift: shift.kode_shift,
                jam_masuk: shift.jam_masuk,
                jam_pulang: shift.jam_pulang,
                lintas_hari: shift.lintas_hari,
                batas_toleransi_menit: shift.batas_toleransi_menit,
                batas_maksimal_lembur_menit: shift.batas_maksimal_lembur_menit,
                is_batas_scan: shift.batas_akhir_scan_masuk_menit > 0 || shift.batas_akhir_scan_pulang_menit > 0,
                batas_akhir_scan_masuk_menit: shift.batas_akhir_scan_masuk_menit,
                is_potong_gaji_terlambat: shift.is_potong_gaji_terlambat,
                denda_terlambat_per_menit: shift.denda_terlambat_per_menit,
                is_potong_gaji_pulang_awal: shift.is_potong_gaji_pulang_awal,
                toleransi_pulang_awal_menit: shift.toleransi_pulang_awal_menit,
                denda_pulang_awal_per_menit: shift.denda_pulang_awal_per_menit,
                batas_akhir_scan_pulang_menit: shift.batas_akhir_scan_pulang_menit,
                tipe_denda: shift.istetap !== undefined ? (shift.istetap ? "tetap" : "per_menit") : "tetap",
            });
        }
    }, [shiftQuery.data, reset]);

    const editShiftMutation = useMutation({
        mutationFn: async (finalPayload: any) => {
            const result = await apiFetchJson(`/api/v1/shifts/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(finalPayload)
            });
            return result;
        },
        onSuccess: () => {
            showNotif("Perubahan konfigurasi Jadwal & Shift berhasil diperbarui", "success");
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
            queryClient.invalidateQueries({ queryKey: ['masterShift', id] });
            setTimeout(() => {
                navigate("/dashboard/jadwal-shift", { state: { activeTab: 'shift' } });
            }, 1500);
        },
        onError: (error: any) => {
            showErrorNotif(error);
        }
    });

    const onSubmit = (data: FormData) => {
        const { tipe_denda, ...restData } = data;
        const finalPayload = {
            ...restData,
            istetap: tipe_denda === "tetap",
            batas_akhir_scan_masuk_menit: restData.is_batas_scan ? restData.batas_akhir_scan_masuk_menit : 0,
            batas_akhir_scan_pulang_menit: restData.is_batas_scan ? restData.batas_akhir_scan_pulang_menit : 0,
        };
        editShiftMutation.mutate(finalPayload);
    };


    if (shiftQuery.isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500 w-full">
                <Loader2 className="animate-spin mb-4" size={40} />
                <p className="font-medium">Sinkronisasi data shift dari server...</p>
            </div>
        );
    }


    return (
        <div className="flex flex-col gap-6 w-full p-2 max-w-5xl mx-auto bg-amber-50">

            <div className="bg-white rounded-xl shadow-md p-4 md:p-8 border border-gray-100">

                {/* HEADER */}
                <div data-tour="add-shift-header" className="flex justify-between items-center bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Edit Konfigurasi Shift</h1>
                        <p className="text-sm text-gray-500">Atur jadwal, toleransi, dan denda keterlambatan.</p>
                    </div>
                    <Button variant="back" disabled={editShiftMutation.isPending} icon={<ArrowLeft size={18} />} onClick={() => navigate("/dashboard/jadwal-shift", { state: { activeTab: 'shift' }})} label="Kembali" />
                </div>

                <form onSubmit={handleSubmit(onSubmit, (err) => console.log("==== VALIDATION ERROR ====", err))} className="grid grid-cols-1 md:grid-cols-2 gap-6">

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
                                    <span className="text-xs text-gray-500">Nominal dipotong sekali per Tetap</span>
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

                    <div className="md:col-span-2 flex justify-end gap-4 mt-4 p-4 rounded-xl border border-gray-200">
                        <Button
                            variant="success"
                            type="submit"
                            label={editShiftMutation.isPending ? "Menyimpan Data..." : "Simpan Konfigurasi Shift"}
                            disabled={editShiftMutation.isPending}
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
                onClose={closeNotif}
            />
        </div>
    );
}
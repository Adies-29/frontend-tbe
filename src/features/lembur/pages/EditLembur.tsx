import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Banknote } from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";
import Button from "../../../components/common/Button";
import Notif from "../../../components/common/Notif";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiFetch } from "../../../utils/apiFetch";
import { formatMinutesToText } from "../../../utils/formatMinutes";
import { Input } from "../../../components/common/InputText";

const lemburSchema = z.object({
    pegawai_id: z.string().min(1, "ID Pegawai wajib diisi")
        .regex(/^\d+$/, "ID Pegawai harus berupa angka"),
    tanggal: z.string().min(1, "Tanggal wajib diisi")
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid"),
    menit_lembur_diizinkan: z.coerce.number()
        .min(1, "Minimal 1 menit")
        .max(720, "Maksimal 12 jam (720 menit)"), // Batas wajar
    alasan_lembur: z.string().max(500, "Alasan maksimal 500 karakter").optional(),
});

type FormData = z.infer<typeof lemburSchema>;

export default function EditLembur() {
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();
    const token = useAuthStore((state) => state.token);
    const userToken = useAuthStore((state) => state.user);
    const queryClient = useQueryClient();

    const idPegwai = searchParams.get("pegawai_id") || "";
    const namaPegawai = searchParams.get("nama") || "";

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors }
    } = useForm<FormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(lemburSchema) as any,
        defaultValues: {
            pegawai_id: idPegwai,
            tanggal: searchParams.get("tanggal") || "",
            alasan_lembur: ""
        }
    });

    const valMenit = watch("menit_lembur_diizinkan");

    // State untuk fitur atur upah lembur
    const [aturUpahLembur, setAturUpahLembur] = useState(false);
    const [tipeHitungLembur, setTipeHitungLembur] = useState<'per_jam' | 'flat'>('per_jam');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedPegawai, setSelectedPegawai] = useState<any>(null);
    const [customUpahValue, setCustomUpahValue] = useState<string>("");
    const [customUpahError, setCustomUpahError] = useState("");

    const [notif, setNotif] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
        show: false,
        message: "",
        type: "success"
    });

    const tgl = searchParams.get("tanggal");

    const lemburQuery = useQuery({
        queryKey: ['lemburDetail', idPegwai, tgl],
        queryFn: async () => {
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/lembur/?pegawai_id=${idPegwai}&tanggal=${tgl}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await response.json();
            if (!response.ok || !result.success || !result.data || result.data.length === 0) {
                throw new Error("Data tidak ditemukan");
            }
            return result.data[0];
        },
        enabled: !!idPegwai && !!tgl
    });

    // Fetch data pegawai untuk mendapatkan info jabatan
    const pegawaiQuery = useQuery({
        queryKey: ['pegawaiList'],
        queryFn: async () => {
            const res = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/pegawai`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await res.json();
            return result.data || [];
        }
    });

    // Set data awal saat lemburQuery selesai
    useEffect(() => {
        if (lemburQuery.data) {
            const lembur = lemburQuery.data;
            reset({
                pegawai_id: String(lembur.pegawai_id),
                tanggal: lembur.tanggal,
                menit_lembur_diizinkan: lembur.menit_lembur_diizinkan,
                alasan_lembur: lembur.alasan_lembur || ""
            });

            if (lembur.tipe_hitung_lembur) {
                setTipeHitungLembur(lembur.tipe_hitung_lembur);
            }

            // Pre-populate toggle jika ada custom upah
            if (lembur.is_custom_upah && lembur.nominal_upah_custom) {
                setAturUpahLembur(true);
                setCustomUpahValue(String(lembur.nominal_upah_custom));
            } else {
                setAturUpahLembur(false);
                setCustomUpahValue("");
            }
        }
    }, [lemburQuery.data, reset]);

    // Set selectedPegawai dari data pegawai
    useEffect(() => {
        if (idPegwai && pegawaiQuery.data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const found = (pegawaiQuery.data as any[]).find((p: any) => String(p.id) === String(idPegwai));
            if (found) setSelectedPegawai(found);
        }
    }, [idPegwai, pegawaiQuery.data]);

    const editLemburMutation = useMutation({
       
        mutationFn: async (payload: any) => {
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/lembur/spl`, {
                method: "POST", 
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error("Gagal menyimpan ke database.");
            return result;
        },
        onSuccess: () => {
            setNotif({ show: true, message: `Sukses! Data lembur berhasil diperbarui.`, type: "success" });
            queryClient.invalidateQueries({ queryKey: ['lemburList'] });
            queryClient.invalidateQueries({ queryKey: ['lemburDetail', idPegwai, tgl] });
            setTimeout(() => {
                navigate("/dashboard/lembur");
            }, 2000);
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
            setNotif({ show: true, message: error.message || "Terjadi kesalahan jaringan.", type: "error" });
        }
    });

    const onSubmit = (data: FormData) => {
        // Validasi custom upah jika toggle dicentang
        if (aturUpahLembur) {
            const numVal = Number(customUpahValue);
            if (!customUpahValue || isNaN(numVal) || numVal <= 0) {
                setCustomUpahError("Nominal upah wajib diisi (minimal Rp 1)");
                return;
            }
            setCustomUpahError("");
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: any = {
            ...data,
            disetujui_oleh: userToken || "",
            tipe_hitung_lembur: tipeHitungLembur
        };

        payload.is_custom_upah = aturUpahLembur;
        if (aturUpahLembur && customUpahValue) {
            payload.nominal_upah_custom = Number(customUpahValue);
        } else {
            payload.nominal_upah_custom = 0;
        }

        editLemburMutation.mutate(payload);
    };
    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl border border-gray-200 shadow-sm">

            <div className="flex justify-between items-center mt-4" >
                <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    Edit Perintah Lembur
                </h1>

                <Button variant="back" icon={<ArrowLeft size={18} />} onClick={() => navigate(-1)} label="Kembali" />

            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

                <Input
                    label="ID Pegawai *"
                    nama="pegawai_id"
                    register={register}
                    readOnly={true}
                    error={errors.pegawai_id?.message}
                    helperText={
                        namaPegawai && (
                            <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                                Mengedit SPL untuk: <strong>{namaPegawai}</strong>
                            </p>
                        )
                    }
                />

                <Input
                    label="Tanggal Lembur *"
                    nama="tanggal"
                    type="date"
                    register={register}
                    error={errors.tanggal?.message}
                />

                <Input
                    label="Lama Lembur (Menit) *"
                    nama="menit_lembur_diizinkan"
                    type="number"
                    register={register}
                    placeholder="Contoh: 120"
                    error={errors.menit_lembur_diizinkan?.message}
                    helperText={
                        valMenit > 0 && !errors.menit_lembur_diizinkan && (
                            <p className="text-xs text-blue-600 font-medium italic">
                                {formatMinutesToText(valMenit)}
                            </p>
                        )
                    }
                />

                {/* === METODE PERHITUNGAN LEMBUR === */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Sistem Perhitungan Lembur <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setTipeHitungLembur('per_jam')}
                            className={`p-3 rounded-lg border text-sm font-medium transition-all flex flex-col items-center gap-1 ${
                                tipeHitungLembur === 'per_jam'
                                    ? 'border-red-500 bg-red-50 text-red-700 shadow-sm font-semibold'
                                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <span>Per Jam</span>
                            <span className="text-xs font-normal opacity-80">(Proporsional per jam)</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setTipeHitungLembur('flat')}
                            className={`p-3 rounded-lg border text-sm font-medium transition-all flex flex-col items-center gap-1 ${
                                tipeHitungLembur === 'flat'
                                    ? 'border-red-500 bg-red-50 text-red-700 shadow-sm font-semibold'
                                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <span>Flat / Borongan</span>
                            <span className="text-xs font-normal opacity-80">(Nominal tetap)</span>
                        </button>
                    </div>
                </div>

                {/* === TOGGLE ATUR UPAH LEMBUR === */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                    <label htmlFor="atur_upah_lembur_edit" className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-red-50 transition-colors cursor-pointer select-none">
                        <span className="text-sm font-semibold text-gray-700">Atur Upah Lembur Custom</span>
                        <div className="relative">
                            <input
                                type="checkbox"
                                id="atur_upah_lembur_edit"
                                checked={aturUpahLembur}
                                onChange={(e) => {
                                    setAturUpahLembur(e.target.checked);
                                    if (!e.target.checked) {
                                        setCustomUpahValue("");
                                        setCustomUpahError("");
                                    }
                                }}
                                className="sr-only peer" />
                            <div className="w-12 h-7 bg-gray-300 rounded-full peer-checked:bg-red-500 transition-colors duration-200"></div>
                            <div className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md peer-checked:translate-x-5 transition-transform duration-200"></div>
                        </div>
                    </label>

                    {!aturUpahLembur ? (
                        <div className="ml-8 mt-1">
                            {((tipeHitungLembur === 'flat' && (selectedPegawai?.jabatan?.upah_lembur_flat || selectedPegawai?.jabatan?.upah_lembur_per_jam)) ||
                              (tipeHitungLembur === 'per_jam' && selectedPegawai?.jabatan?.upah_lembur_per_jam)) ? (
                                <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2 flex items-center gap-2">
                                    <Banknote size={14} />
                                    Upah lembur sesuai jabatan:{" "}
                                    <strong>
                                        Rp {Number(
                                            tipeHitungLembur === 'flat' 
                                                ? (selectedPegawai.jabatan.upah_lembur_flat || selectedPegawai.jabatan.upah_lembur_per_jam)
                                                : selectedPegawai.jabatan.upah_lembur_per_jam
                                        ).toLocaleString('id-ID')}
                                        {tipeHitungLembur === 'per_jam' ? '/jam' : ' (Flat)'}
                                    </strong>
                                </p>
                            ) : (
                                <p className="text-xs text-gray-500 italic ml-1">
                                    Data upah lembur jabatan belum diatur
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="ml-8 mt-2">
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                {tipeHitungLembur === 'flat' ? 'Nominal Upah Flat (Rp)' : 'Nominal Upah/Jam (Rp)'} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={customUpahValue}
                                onChange={(e) => {
                                    setCustomUpahValue(e.target.value);
                                    if (customUpahError) setCustomUpahError("");
                                }}
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-200 focus:outline-none"
                                placeholder={tipeHitungLembur === 'flat' ? "Contoh: 50000" : "Contoh: 15000"}
                            />
                            {customUpahError && <p className="text-xs text-red-500 mt-1">{customUpahError}</p>}
                            {customUpahValue && Number(customUpahValue) > 0 && (
                                <p className="text-xs text-blue-600 mt-1 font-medium italic">
                                    Rp {Number(customUpahValue).toLocaleString('id-ID')}
                                    {tipeHitungLembur === 'per_jam' ? '/jam' : ' (Flat)'}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Alasan Lembur <span className="text-gray-400 font-normal text-xs">(Opsional)</span></label>
                    <textarea
                        {...register("alasan_lembur")}
                        className="w-full p-2.5 border border-gray-300 rounded-lg h-24 focus:ring-2 focus:ring-red-200 focus:outline-none resize-none"
                        placeholder="Tuliskan alasan lembur di sini jika ada..."
                    />
                    {errors.alasan_lembur && <p className="text-xs text-red-500 mt-1">{errors.alasan_lembur.message}</p>}
                </div>
                
<div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 mt-8 pt-6 border-t border-gray-100">
                    <Button
                        variant="success"
                        type="submit"
                        disabled={editLemburMutation.isPending}
                        label={editLemburMutation.isPending ? "Menyimpan..." : "Simpan"}
                    />
                    <Button
                        variant="danger"
                        type="button"
                        label="Batal"
                        onClick={() => navigate(-1)}
                        className="w-full sm:w-auto"
                    />
                </div>

            </form>
            <Notif
                show={notif.show}
                message={notif.message}
                type={notif.type}
                onClose={() => setNotif({ show: false, message: "", type: "success" })}
            />
        </div>
    );
}

import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Autocomplete, TextField } from "@mui/material";
import { ArrowLeft, Clock } from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";
import Button from "../../../components/common/Button";
import Notif from "../../../components/common/Notif";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiFetch } from "../../../utils/apiFetch";
import { formatMinutesToText } from "../../../utils/formatMinutes";

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

export default function AddLembur() {
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
        watch,
        setValue,
        formState: { errors }
    } = useForm<FormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(lemburSchema) as any,
        defaultValues: {
            pegawai_id: idPegwai,
            tanggal: "",
            alasan_lembur: ""
        }
    });

    const valMenit = watch("menit_lembur_diizinkan");

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

    const [notif, setNotif] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
        show: false,
        message: "",
        type: "success"
    });

    const addLemburMutation = useMutation({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            setNotif({ show: true, message: `Sukses! Perintah lembur telah disimpan`, type: "success" });
            queryClient.invalidateQueries({ queryKey: ['lemburList'] });
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
        const payload = {
            ...data,
            disetujui_oleh: userToken || ""
        };
        addLemburMutation.mutate(payload);
    };
    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
            <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-gray-600 hover:text-red-600 font-medium">
                <ArrowLeft size={18} /> Kembali
            </button>

            <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Clock className="text-red-600" /> Buat Perintah Lembur Baru
            </h1>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Pilih Pegawai <span className="text-red-500">*</span></label>
                    <Autocomplete
                        options={pegawaiQuery.data || []}
                        getOptionLabel={(option: any) => `${option.nama} (ID: ${option.id})`}
                        disabled={!!idPegwai || pegawaiQuery.isLoading}
                        value={(pegawaiQuery.data || []).find((p: any) => String(p.id) === String(watch("pegawai_id"))) || null}
                        onChange={(_, newValue) => {
                            setValue("pegawai_id", newValue ? String(newValue.id) : "", { shouldValidate: true });
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder={pegawaiQuery.isLoading ? "Memuat pegawai..." : "Cari nama atau ID pegawai..."}
                                error={!!errors.pegawai_id}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        padding: '4px',
                                        borderRadius: '0.5rem',
                                        backgroundColor: !!idPegwai ? '#f3f4f6' : 'white',
                                    }
                                }}
                            />
                        )}
                        noOptionsText="Pegawai tidak ditemukan"
                    />
                    {errors.pegawai_id && <p className="text-xs text-red-500 mt-1">{errors.pegawai_id.message}</p>}
                    {namaPegawai && (
                        <p className="text-xs text-green-600 mt-1.5 font-medium flex items-center gap-1">
                            Membuat SPL untuk: <strong>{namaPegawai}</strong>
                        </p>
                    )}
                </div>


                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Lembur <span className="text-red-500">*</span></label>
                    <input
                        type="date"
                        {...register("tanggal")}
                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-200 focus:outline-none"
                    />
                    {errors.tanggal && <p className="text-xs text-red-500 mt-1">{errors.tanggal.message}</p>}
                </div>


                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Lama Lembur (Menit) <span className="text-red-500">*</span></label>
                    <input
                        type="number"
                        min="1"
                        {...register("menit_lembur_diizinkan")}
                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-200 focus:outline-none"
                        placeholder="Contoh: 120"
                    />
                    {valMenit > 0 && !errors.menit_lembur_diizinkan && (
                        <p className="text-xs text-blue-600 mt-1 font-medium italic">
                            {formatMinutesToText(valMenit)}
                        </p>
                    )}
                    {errors.menit_lembur_diizinkan && <p className="text-xs text-red-500 mt-1">{errors.menit_lembur_diizinkan.message}</p>}
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

                <Button
                    variant="success"
                    type="submit"
                    disabled={addLemburMutation.isPending}
                    label={addLemburMutation.isPending ? "Menyimpan..." : "Simpan"}
                />

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

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
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
    const [isLoading, setIsLoading] = useState(false);

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

    const [notif, setNotif] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
        show: false,
        message: "",
        type: "success"
    });

    useEffect(() => {
        const fetchLemburData = async () => {
            const tgl = searchParams.get("tanggal");
            if (idPegwai && tgl) {
                try {
                    const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/lembur/?pegawai_id=${idPegwai}&tanggal=${tgl}`, {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        }
                    });
                    const result = await response.json();
                    if (response.ok && result.success && result.data && result.data.length > 0) {
                        const lembur = result.data[0];
                        // reset form with fetched data
                        reset({
                            pegawai_id: String(lembur.pegawai_id),
                            tanggal: lembur.tanggal,
                            menit_lembur_diizinkan: lembur.menit_lembur_diizinkan,
                            alasan_lembur: lembur.alasan_lembur || ""
                        });
                    }
                } catch (error) {
                    console.error("Gagal memuat data lembur:", error);
                }
            }
        };

        fetchLemburData();
    }, [idPegwai, searchParams, token, reset]);

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);

        try {
            const payload = {
                ...data,
                disetujui_oleh: userToken || ""
            };

            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/lembur/spl`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setNotif({ show: true, message: `Sukses! Data lembur berhasil diperbarui.`, type: "success" });
                setTimeout(() => {
                    navigate("/dashboard");
                }, 2000);
            } else {
                setNotif({ show: true, message: "Gagal menyimpan ke database. Coba lagi.", type: "error" });
            }
        } catch (error) {
            console.error("Error Submit:", error);
            setNotif({ show: true, message: "Terjadi kesalahan jaringan.", type: "error" });
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl border border-gray-200 shadow-sm">

            <div className="flex justify-between items-center mt-4" >
                <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Clock className="text-red-600" /> Edit Perintah Lembur
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
                    readOnly={true}
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
                    disabled={isLoading}
                    label={isLoading ? "Menyimpan..." : "Simpan"}
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

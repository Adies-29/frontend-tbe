import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Autocomplete, TextField } from "@mui/material";
import { ArrowLeft, Banknote } from "lucide-react";
import Button from "../../../components/common/Button";
import Notif from "../../../components/common/Notif";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiFetchJson } from "../../../utils/apiFetch";
import { formatRupiah } from "../../../utils/formatCurrency";
import { formatMinutesToText } from "../../../utils/formatMinutes";
import { useAuthStore } from "../../../store/useAuthStore";
import { useNotif } from '../../../hooks/useNotif';

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
    const userToken = useAuthStore((state) => state.user);
    const queryClient = useQueryClient();

    const idPegawai = searchParams.get("pegawai_id") || "";
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
            pegawai_id: idPegawai,
            tanggal: "",
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

    const pegawaiQuery = useQuery({
        queryKey: ['pegawai'],
        queryFn: async () => {
            const res = await apiFetchJson('/api/v1/pegawai');
            return res.data || [];
        }
    });

    // Set selectedPegawai saat data pegawai dimuat dan idPegawai sudah ada dari URL
    useEffect(() => {
        if (idPegawai && pegawaiQuery.data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const found = (pegawaiQuery.data as any[]).find((p: any) => String(p.id) === String(idPegawai));
            if (found) setSelectedPegawai(found);
        }
    }, [idPegawai, pegawaiQuery.data]);

    const { notif, showNotif, closeNotif } = useNotif();

    const addLemburMutation = useMutation({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mutationFn: async (payload: any) => {
            const result = await apiFetchJson('/api/v1/lembur/spl', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });
            return result;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onSuccess: (data: any) => {
            showNotif(`Sukses! Perintah lembur telah disimpan. ${data.data.tanggal}`, "success");
            queryClient.invalidateQueries({ queryKey: ['lemburList'] });
            setTimeout(() => {
                navigate("/dashboard/lembur");
            }, 2000);
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
            showNotif( error.message || "Terjadi kesalahan jaringan.", "error" );
        }
    });

    const onSubmit = (data: FormData) => {
        // Validasi custom upah jika checkbox dicentang
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

        addLemburMutation.mutate(payload);
    };
    return (
        <div data-tour="add-lembur-form" className="max-w-2xl mx-auto p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-6 mt-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                    Buat Perintah Lembur Baru
                </h1>

                <div className="shrink-0 flex items-center justify-end">
                    <Button variant="back" icon={<ArrowLeft size={18} />} onClick={() => navigate(-1)} label="Kembali" className="hidden sm:flex" />
                    <button 
                        onClick={() => navigate(-1)}
                        type="button"
                        className="sm:hidden p-2 text-gray-500 hover:text-black hover:bg-gray-200 rounded-full focus:ring-gray-300 transition-colors flex items-center justify-center"
                        title="Kembali"
                    >
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Pilih Pegawai <span className="text-red-500">*</span></label>
                    <Autocomplete
                        options={pegawaiQuery.data || []}
                        getOptionLabel={(option: any) => `${option.nama} (ID: ${option.id})`}
                        disabled={!!idPegawai || pegawaiQuery.isLoading}
                        value={(pegawaiQuery.data || []).find((p: any) => String(p.id) === String(watch("pegawai_id"))) || null}
                        onChange={(_, newValue) => {
                            setValue("pegawai_id", newValue ? String(newValue.id) : "", { shouldValidate: true });
                            setSelectedPegawai(newValue);
                            setAturUpahLembur(false);
                            setCustomUpahValue("");
                            setCustomUpahError("");
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
                                        backgroundColor: !!idPegawai ? '#f3f4f6' : 'white',
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
                    <label htmlFor="atur_upah_lembur" className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-red-50 transition-colors cursor-pointer select-none">
                        <span className="text-sm font-semibold text-gray-700">Atur Upah Lembur Custom</span>
                        <div className="relative">
                            <input
                                type="checkbox"
                                id="atur_upah_lembur"
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
                                        {formatRupiah(
                                            tipeHitungLembur === 'flat' 
                                                ? (selectedPegawai.jabatan.upah_lembur_flat || selectedPegawai.jabatan.upah_lembur_per_jam)
                                                : selectedPegawai.jabatan.upah_lembur_per_jam
                                        )}
                                        {tipeHitungLembur === 'per_jam' ? '/jam' : ' (Flat)'}
                                    </strong>
                                </p>
                            ) : (
                                <p className="text-xs text-gray-500 italic ml-1">
                                    {selectedPegawai ? "Data upah lembur jabatan belum diatur" : "Pilih pegawai terlebih dahulu"}
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
                                <p className="text-xs text-emerald-600 mt-1 font-medium italic">
                                    {formatRupiah(customUpahValue)}
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
                        disabled={addLemburMutation.isPending}
                        label={addLemburMutation.isPending ? "Menyimpan..." : "Simpan"}
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
                onClose={closeNotif}
            />
        </div>
    );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wallet, FileText, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Button from "../../../components/common/Button";
import Notif from "../../../components/common/Notif";
import { useAuthStore } from "../../../store/useAuthStore";
import { apiFetch } from "../../../utils/apiFetch";
import { getSafeErrorMessage } from "../../../utils/errorHandler";
import { Input } from "../../../components/common/InputText";
import { InputSelect, type SelectOption } from "../../../components/common/InputSelect";
import { TextArea } from "../../../components/common/TextArea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Schema validasi sesuai dengan kebutuhan backend
const kasbonSchema = z.object({
    pegawai_id: z.string().min(1, "Pegawai wajib dipilih"),
    tanggal_pengajuan: z.string().min(1, "Tanggal wajib diisi"),
    nominal_pinjaman: z.string().min(1, "Nominal wajib diisi"),
    persentase_cicilan: z.coerce.number().min(10, "Minimal 10%").max(100, "Maksimal 100%"),
    keterangan_pinjaman: z.string().min(1, "Keterangan wajib diisi")
});

type KasbonFormData = z.infer<typeof kasbonSchema>;

export default function AddKasbon() {
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token);
    const queryClient = useQueryClient();

    const [notif, setNotif] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
        show: false, message: "", type: "success"
    });

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors }
    } = useForm<KasbonFormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(kasbonSchema) as any,
        defaultValues: {
            tanggal_pengajuan: new Date().toISOString().split('T')[0],
            persentase_cicilan: 10,
            nominal_pinjaman: ""
        }
    });

    // Ambil nilai untuk preview
    const nominalRaw = watch("nominal_pinjaman");
    const tenorNum = watch("persentase_cicilan");

    const nominalNum = parseInt(nominalRaw.replace(/[^0-9]/g, '')) || 0;
    const cicilan = (nominalNum * tenorNum) / 100;

    // Load data pegawai menggunakan useQuery
    const pegawaiQuery = useQuery({
        queryKey: ['pegawaiList'],
        queryFn: async () => {
            const res = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/pegawai`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await res.json();
            if (!res.ok) throw new Error("Gagal load pegawai");
            return result.data || [];
        }
    });

    // Mutasi untuk menyimpan kasbon baru
    const addKasbonMutation = useMutation({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mutationFn: async (payload: any) => {
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/kasbon`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || getSafeErrorMessage(response.status));
            return result;
        },
        onSuccess: () => {
            setNotif({ show: true, message: "Kasbon berhasil diajukan!", type: "success" });
            // Hapus cache kasbonList agar KasbonIndex langsung mereload data baru
            queryClient.invalidateQueries({ queryKey: ['kasbonList'] });
            setTimeout(() => navigate('/dashboard/kasbon'), 1500);
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
            setNotif({ show: true, message: error.message || "Gagal menghubungi server", type: "error" });
        }
    });

    const onSubmit = (data: KasbonFormData) => {
        const cleanNominal = parseInt(data.nominal_pinjaman.replace(/[^0-9]/g, '')) || 0;
        if (cleanNominal <= 0) {
            setNotif({ show: true, message: "Nominal pinjaman tidak valid", type: "error" });
            return;
        }

        const payload = {
            pegawai_id: parseInt(data.pegawai_id),
            tanggal_pengajuan: data.tanggal_pengajuan,
            nominal_pinjaman: cleanNominal,
            persentase_cicilan: data.persentase_cicilan,
            keterangan_pinjaman: data.keterangan_pinjaman
        };

        addKasbonMutation.mutate(payload);
    };

    // Format input uang
    const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        if (value) {
            const formatted = new Intl.NumberFormat('id-ID').format(parseInt(value));
            setValue("nominal_pinjaman", formatted, { shouldValidate: true });
        } else {
            setValue("nominal_pinjaman", "", { shouldValidate: true });
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pegawaiOptions: SelectOption[] = (pegawaiQuery.data || []).map((p: any) => ({
        value: p.id,
        label: p.nama
    }));

    return (
        <div className="flex flex-col gap-6 w-full p-2 max-w-4xl mx-auto">
            <Notif show={notif.show} message={notif.message} type={notif.type} onClose={() => setNotif(prev => ({ ...prev, show: false }))} />

            <div className="bg-white rounded-xl shadow-md p-4 md:p-8 border border-gray-100">
                <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Wallet size={24} className="text-emerald-600" /> Tambah Kasbon Pegawai
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Formulir pengajuan pinjaman/kasbon baru.</p>
                    </div>
                    <Button variant="back" icon={<ArrowLeft size={18} />} onClick={() => navigate(-1)} label="Kembali" />
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-5">
                            <div className="flex items-center gap-3 text-blue-600 font-bold border-b border-gray-100 pb-3">
                                <User size={20} /> <h2>Peminjam & Tanggal</h2>
                            </div>
                            <InputSelect
                                label={pegawaiQuery.isLoading ? "Loading Pegawai..." : "Pilih Pegawai"}
                                nama="pegawai_id"
                                register={register}
                                error={errors.pegawai_id?.message}
                                options={pegawaiOptions}
                            />
                            <Input
                                label="Tanggal Pengajuan"
                                nama="tanggal_pengajuan"
                                type="date"
                                register={register}
                                error={errors.tanggal_pengajuan?.message}
                            />
                        </section>

                        <section className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 shadow-sm flex flex-col gap-5">
                            <div className="flex items-center gap-3 text-emerald-700 font-bold border-b border-emerald-200 pb-3">
                                <Wallet size={20} /> <h2>Detail Pinjaman</h2>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-gray-700">Nominal Pinjaman (Rp)</label>
                                <input
                                    type="text"
                                    placeholder="Contoh: 1.000.000"
                                    {...register("nominal_pinjaman")}
                                    onChange={handleNominalChange}
                                    className={`border rounded-lg px-3 py-2.5 text-sm focus:border-emerald-500 shadow-sm outline-none ${errors.nominal_pinjaman ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.nominal_pinjaman && <span className="text-xs text-red-500">{errors.nominal_pinjaman.message}</span>}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-semibold text-gray-700">Potongan Tenor (%)</label>
                                    <span className="text-sm font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded">{tenorNum}% per minggu</span>
                                </div>
                                <input
                                    type="range"
                                    min="10"
                                    max="100"
                                    step="5"
                                    {...register("persentase_cicilan")}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 mt-2"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                                    <span>Min 10%</span>
                                    <span>100% (Langsung Lunas)</span>
                                </div>
                                {errors.persentase_cicilan && <span className="text-xs text-red-500">{errors.persentase_cicilan.message}</span>}
                            </div>

                            <div className="mt-2 bg-white border-2 border-emerald-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-100 rounded-bl-full -mr-8 -mt-8"></div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Preview Cicilan</p>
                                <p className="text-2xl font-black text-emerald-700">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(cicilan)}
                                    <span className="text-sm font-medium text-gray-500 ml-1">/ minggu</span>
                                </p>
                            </div>
                        </section>

                        <section className="md:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-3 text-gray-600 font-bold mb-4">
                                <FileText size={20} /> <h2>Keterangan</h2>
                            </div>
                            <TextArea
                                label="Alasan pengajuan kasbon"
                                nama="keterangan_pinjaman"
                                register={register}
                                error={errors.keterangan_pinjaman?.message}
                                placeholder="Tuliskan keperluan pinjaman di sini..."
                            />
                        </section>
                    </div>

                    <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-100">
                        <Button variant="success" label={addKasbonMutation.isPending ? "Menyimpan..." : "Simpan Kasbon Baru"} type="submit" disabled={addKasbonMutation.isPending} />
                        <Button variant="danger" label="Batal" type="button" onClick={() => navigate(-1)} disabled={addKasbonMutation.isPending} />
                    </div>
                </form>
            </div>
        </div>
    );
}

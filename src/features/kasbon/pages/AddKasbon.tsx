import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wallet, FileText, User, AlertTriangle, Sliders, Zap, CalendarCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Button from "../../../components/common/Button";
import Notif from "../../../components/common/Notif";
import { apiFetchJson } from "../../../utils/apiFetch";
import { Input } from "../../../components/common/InputText";
import { TextArea } from "../../../components/common/TextArea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Autocomplete, TextField } from "@mui/material";
import { formatNumberInput, parseCurrencyToNumber, formatRupiah } from "../../../utils/formatCurrency";
import { useNotif } from "../../../hooks/useNotif";

// Schema validasi sesuai dengan kebutuhan backend
const kasbonSchema = z.object({
    pegawai_id: z.string().min(1, "Pegawai wajib dipilih"),
    tanggal_pengajuan: z.string().min(1, "Tanggal wajib diisi"),
    nominal_pinjaman: z.string().min(1, "Nominal wajib diisi"),
    persentase_cicilan: z.coerce.number().min(10, "Minimal 10%").max(100, "Maksimal 100%"),
    keterangan_pinjaman: z.string().min(1, "Keterangan wajib diisi"),
    is_custom_kehadiran: z.boolean().optional(),
    min_hari_hadir_mingguan: z.coerce.number().min(0).max(7).optional()
});

type KasbonFormData = z.infer<typeof kasbonSchema>;

export default function AddKasbon() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { notif, showNotif, showErrorNotif, closeNotif } = useNotif();

    const [isCustomHari, setIsCustomHari] = useState(false);
    const [customSyaratType, setCustomSyaratType] = useState<'tanpa_minimal' | 'hari_tertentu'>('tanpa_minimal');
    const [customHariVal, setCustomHariVal] = useState<number>(5);

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
            pegawai_id: "",
            tanggal_pengajuan: new Date().toISOString().split("T")[0],
            nominal_pinjaman: "",
            persentase_cicilan: 20,
            keterangan_pinjaman: "",
            is_custom_kehadiran: false,
            min_hari_hadir_mingguan: 0
        }
    });


    const selectedPegawaiId = watch("pegawai_id");
    const nominalRaw = watch("nominal_pinjaman");
    const tenorNum = watch("persentase_cicilan");

    const nominalNum = parseCurrencyToNumber(nominalRaw);
    const cicilan = (nominalNum * tenorNum) / 100;
    const estimasiMinggu = tenorNum > 0 ? Math.ceil(100 / tenorNum) : 0;

    // Load data pegawai menggunakan useQuery
    const pegawaiQuery = useQuery({
        queryKey: ['pegawai'],
        queryFn: async () => {
            const res = await apiFetchJson('/api/v1/pegawai');
            return res.data || [];
        }
    });

    // Load data kasbon aktif untuk proteksi double-loan
    const existingKasbonQuery = useQuery({
        queryKey: ['kasbonList'],
        queryFn: async () => {
            const res = await apiFetchJson('/api/v1/kasbon');
            return res.data || [];
        }
    });

    // Load data pengaturan kasbon global
    const pengaturanQuery = useQuery({
        queryKey: ['pengaturanKasbon'],
        queryFn: async () => {
            const res = await apiFetchJson('/api/v1/kasbon/pengaturan');
            return res.data || {};
        }
    });

    const globalMinHari = Number(pengaturanQuery.data?.kasbon_min_hari_kerja_mingguan);

    // Cek apakah pegawai yang dipilih memiliki kasbon aktif

    const activeLoanOfSelectedPegawai = useMemo(() => {
        if (!selectedPegawaiId || !existingKasbonQuery.data) return null;
        return (existingKasbonQuery.data || []).find((k: any) =>
            String(k.pegawai_id) === String(selectedPegawaiId) &&
            k.status === 'Disetujui' &&
            (k.sisa_pinjaman || 0) > 0
        );
    }, [selectedPegawaiId, existingKasbonQuery.data]);

    // Mutasi untuk menyimpan kasbon baru
    const addKasbonMutation = useMutation({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mutationFn: async (payload: any) => {
            const result = await apiFetchJson('/api/v1/kasbon', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });
            return result;
        },
        onSuccess: () => {
            showNotif("Kasbon berhasil diajukan!", "success");
            queryClient.invalidateQueries({ queryKey: ['kasbonList'] });
            setTimeout(() => navigate('/dashboard/kasbon'), 1500);
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
            showErrorNotif(error);
        }
    });

    const onSubmit = (data: KasbonFormData) => {
        const cleanNominal = parseCurrencyToNumber(data.nominal_pinjaman);
        if (cleanNominal <= 0) {
            showNotif("Nominal pinjaman tidak valid", "error");
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: any = {
            pegawai_id: parseInt(data.pegawai_id),
            tanggal_pengajuan: data.tanggal_pengajuan,
            nominal_pinjaman: cleanNominal,
            persentase_cicilan: data.persentase_cicilan,
            keterangan_pinjaman: data.keterangan_pinjaman
        };

        if (isCustomHari) {
            payload.min_hari_hadir_mingguan = customSyaratType === 'tanpa_minimal' ? 0 : customHariVal;
        }

        addKasbonMutation.mutate(payload);
    };


    // Format input uang
    const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatNumberInput(e.target.value);
        setValue("nominal_pinjaman", formatted, { shouldValidate: true });
    };

    return (
        <div className="flex flex-col gap-6 w-full p-2 max-w-4xl mx-auto">
            <Notif show={notif.show} message={notif.message} type={notif.type} onClose={closeNotif} />

            <div data-tour="add-kasbon-form" className="bg-white rounded-2xl shadow-md p-4 md:p-8 border border-gray-100">
                <div className="flex justify-between items-center mb-6 mt-2">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                            Tambah Kasbon Pegawai
                        </h1>
                        <p className="text-xs text-gray-500 mt-1">Formulir pengajuan pinjaman karyawan baru dengan kalkulasi cicilan otomatis.</p>
                    </div>
                    <div className="shrink-0 flex items-center justify-end">
                        <Button variant="back" icon={<ArrowLeft size={18} />} onClick={() => navigate(-1)} label="Kembali" className="hidden sm:flex" />
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* SEKSI 1: PEMINJAM & TANGGAL */}
                        <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col gap-5">
                            <div className="flex items-center gap-3 text-blue-600 font-bold border-b border-gray-100 pb-3">
                                <User size={20} /> <h2>Peminjam & Tanggal</h2>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-gray-700">Pilih Pegawai <span className="text-red-500">*</span></label>
                                <Autocomplete
                                    options={pegawaiQuery.data || []}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    getOptionLabel={(option: any) => `${option.nama} (${option.jabatan?.nama_jabatan || '-'})`}
                                    disabled={pegawaiQuery.isLoading}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    value={(pegawaiQuery.data || []).find((p: any) => String(p.id) === String(watch("pegawai_id"))) || null}
                                    onChange={(_, newValue) => {
                                        setValue("pegawai_id", newValue ? String(newValue.id) : "", { shouldValidate: true });
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            placeholder={pegawaiQuery.isLoading ? "Memuat pegawai..." : "Cari nama pegawai..."}
                                            error={!!errors.pegawai_id}
                                            helperText={errors.pegawai_id?.message}
                                            size="small"
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: '10px',
                                                    backgroundColor: '#f9fafb',
                                                }
                                            }}
                                        />
                                    )}
                                />
                            </div>

                            {/* PERINGATAN KASBON AKTIF SEBELUMNYA */}
                            {activeLoanOfSelectedPegawai && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
                                    <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold">Perhatian: Pegawai Masih Memiliki Kasbon Aktif</p>
                                        <p className="text-amber-700 mt-0.5">
                                            Sisa utang berjalan: <b>{formatRupiah(activeLoanOfSelectedPegawai.sisa_pinjaman)}</b>. Pastikan manajemen telah menyetujui pinjaman tambahan ini.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <Input
                                label="Tanggal Pengajuan"
                                nama="tanggal_pengajuan"
                                type="date"
                                register={register}
                                error={errors.tanggal_pengajuan?.message}
                            />
                        </section>

                        {/* SEKSI 2: DETAIL PINJAMAN */}
                        <section className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 shadow-sm flex flex-col gap-5">
                            <div className="flex items-center gap-3 text-emerald-700 font-bold border-b border-emerald-200 pb-3">
                                <Wallet size={20} /> <h2>Detail Pinjaman & Tenor</h2>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-gray-700">Nominal Pinjaman (Rp) <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    placeholder="Contoh: 1.000.000"
                                    {...register("nominal_pinjaman")}
                                    onChange={handleNominalChange}
                                    className={`border rounded-xl px-3.5 py-2.5 text-sm bg-white focus:border-emerald-500 shadow-xs outline-none ${errors.nominal_pinjaman ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.nominal_pinjaman && <span className="text-xs text-red-500">{errors.nominal_pinjaman.message}</span>}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-semibold text-gray-700">Potongan Tenor (%)</label>
                                    <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                                        {tenorNum}% per minggu
                                    </span>
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
                                    <span>Max 100%</span>
                                </div>
                                {errors.persentase_cicilan && <span className="text-xs text-red-500">{errors.persentase_cicilan.message}</span>}
                            </div>

                            <div className="mt-2 bg-white border-2 border-emerald-200 rounded-xl p-4 shadow-sm relative overflow-hidden flex items-center justify-between">

                                <div>
                                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Preview Cicilan</p>
                                    <p className="text-xl md:text-2xl font-black text-emerald-700">
                                        {formatRupiah(cicilan)}
                                        <span className="text-xs font-medium text-gray-500 ml-1">/ minggu</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-semibold text-gray-400 block">Lunas Dalam</span>
                                    <span className="text-sm font-bold text-gray-700">{estimasiMinggu} Minggu</span>
                                </div>
                            </div>
                        </section>

                        {/* SEKSI 3: ATURAN KHUSUS KEHADIRAN (OPSIONAL) */}
                        <section className="md:col-span-2 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                                    <Sliders size={18} className="text-emerald-600" />
                                    <h3>Syarat Kehadiran Mingguan untuk Pemotongan Kasbon</h3>
                                </div>

                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-slate-600 font-medium cursor-pointer flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={isCustomHari}
                                            onChange={(e) => setIsCustomHari(e.target.checked)}
                                            className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                                        />
                                        <span className="font-semibold text-slate-700">Gunakan Syarat Custom Khusus Kasbon Ini</span>
                                    </label>
                                </div>
                            </div>

                            {isCustomHari ? (
                                <div className="bg-white p-4 rounded-xl border border-slate-200 mt-2 space-y-4">
                                    <p className="text-xs font-bold text-gray-800">Pilih Tipe Syarat Pemotongan Custom:</p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {/* OPSI 1: TANPA MINIMAL ABSENSI */}
                                        <div
                                            onClick={() => setCustomSyaratType('tanpa_minimal')}
                                            className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${customSyaratType === 'tanpa_minimal'
                                                    ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-600'
                                                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Zap size={16} className={customSyaratType === 'tanpa_minimal' ? 'text-emerald-600 fill-emerald-600' : 'text-slate-400'} />
                                                    <span className="text-xs font-extrabold text-slate-800">Tanpa Minimal Absensi</span>
                                                </div>
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${customSyaratType === 'tanpa_minimal' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                                                    }`}>
                                                    Otomatis
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 leading-relaxed">
                                                Kasbon akan <strong>selalu otomatis dipotong</strong> di setiap periode penggajian tanpa syarat minimal hari masuk kerja.
                                            </p>
                                        </div>

                                        {/* OPSI 2: MINIMAL HARI HADIR TERTENTU */}
                                        <div
                                            onClick={() => setCustomSyaratType('hari_tertentu')}
                                            className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${customSyaratType === 'hari_tertentu'
                                                    ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-600'
                                                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <CalendarCheck size={16} className={customSyaratType === 'hari_tertentu' ? 'text-emerald-600' : 'text-slate-400'} />
                                                    <span className="text-xs font-extrabold text-slate-800">Minimal Hari Hadir</span>
                                                </div>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${customSyaratType === 'hari_tertentu' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-200 text-slate-600'
                                                    }`}>
                                                    {customHariVal} Hari
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 leading-relaxed">
                                                Kasbon hanya dipotong jika kehadiran pegawai dalam seminggu mencapai target minimal hari.
                                            </p>
                                        </div>
                                    </div>

                                    {/* PEMILIH HARI JIKA MEMILIH HARI TERTENTU */}
                                    {customSyaratType === 'hari_tertentu' && (
                                        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg">
                                            <div>
                                                <span className="text-xs font-bold text-slate-700 block">Tentukan Jumlah Hari Minimal:</span>
                                                <span className="text-[10.5px] text-slate-500">Pilih antara 1 sampai 7 hari kerja per minggu</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {[1, 2, 3, 4, 5, 6, 7].map((h) => (
                                                    <button
                                                        key={h}
                                                        type="button"
                                                        onClick={() => setCustomHariVal(h)}
                                                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border cursor-pointer ${customHariVal === h
                                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs scale-105'
                                                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                                            }`}
                                                    >
                                                        {h}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500 italic">
                                    Mengikuti kebijakan global perusahaan (Standar: Minimal {globalMinHari} hari kerja dalam seminggu).
                                </p>
                            )}

                        </section>


                        {/* SEKSI 4: KETERANGAN */}
                        <section className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
                            <div className="flex items-center gap-3 text-gray-600 font-bold mb-4">
                                <FileText size={20} /> <h2>Keterangan & Alasan Peminjaman</h2>
                            </div>
                            <TextArea
                                label="Alasan pengajuan kasbon"
                                nama="keterangan_pinjaman"
                                register={register}
                                error={errors.keterangan_pinjaman?.message}
                                placeholder="Tuliskan keperluan pinjaman di sini (misal: Biaya pendidikan, darurat kesehatan, renovasi rumah)..."
                            />
                        </section>
                    </div>

                    {/* TOMBOL AKSI SUBMIT */}
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 mt-8 pt-6 border-t border-gray-100">
                        <div className="w-full sm:w-auto">
                            <Button
                                variant="danger"
                                label="Batal"
                                type="button"
                                onClick={() => navigate(-1)}
                                disabled={addKasbonMutation.isPending}
                                className="w-full sm:w-auto"
                            />
                        </div>
                        <div className="w-full sm:w-auto">
                            <Button
                                variant="success"
                                label={addKasbonMutation.isPending ? "Menyimpan..." : "Simpan Pengajuan Kasbon"}
                                type="submit"
                                disabled={addKasbonMutation.isPending}
                                className="w-full sm:w-auto font-bold shadow-md cursor-pointer"
                            />
                        </div>
                    </div>
                </form>
            </div >
        </div >
    );
}


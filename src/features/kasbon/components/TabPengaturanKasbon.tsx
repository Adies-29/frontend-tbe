import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetchJson } from "../../../utils/apiFetch";

import {
    CalendarCheck,
    Sliders,
    ShieldCheck,
    Save,
    Loader2,
    CheckCircle2,
    Info,
    HelpCircle
} from "lucide-react";
import Button from "../../../components/common/Button";

interface TabPengaturanKasbonProps {
    onShowNotif: (msg: string, type: "success" | "error") => void;
}

export default function TabPengaturanKasbon({ onShowNotif }: TabPengaturanKasbonProps) {
    const queryClient = useQueryClient();

    // Form State
    const [minHari, setMinHari] = useState<number>(5);
    const [modeKurang, setModeKurang] = useState<"skip" | "prorata">("skip");
    const [maxPersenTHP, setMaxPersenTHP] = useState<number>(50);
    const [statusAturan, setStatusAturan] = useState<"aktif" | "nonaktif">("aktif");

    // Fetch Config dari API Backend
    const configQuery = useQuery({
        queryKey: ["pengaturanKasbon"],
        queryFn: async () => {
            const res = await apiFetchJson("/api/v1/kasbon/pengaturan");
            return res.data || {};
        }
    });

    useEffect(() => {
        if (configQuery.data) {
            const d = configQuery.data;
            if (d.kasbon_min_hari_kerja_mingguan !== undefined) {
                setMinHari(Number(d.kasbon_min_hari_kerja_mingguan) || 5);
            }
            if (d.kasbon_mode_kehadiran_kurang) {
                setModeKurang(d.kasbon_mode_kehadiran_kurang === "prorata" ? "prorata" : "skip");
            }
            if (d.kasbon_max_potongan_thp_persen !== undefined) {
                setMaxPersenTHP(Number(d.kasbon_max_potongan_thp_persen) || 50);
            }
            if (d.kasbon_status_aturan_kehadiran) {
                setStatusAturan(d.kasbon_status_aturan_kehadiran === "nonaktif" ? "nonaktif" : "aktif");
            }
        }
    }, [configQuery.data]);

    // Mutation untuk menyimpan konfigurasi
    const saveMutation = useMutation({
        mutationFn: async (payload: {
            kasbon_min_hari_kerja_mingguan: number;
            kasbon_mode_kehadiran_kurang: string;
            kasbon_max_potongan_thp_persen: number;
            kasbon_status_aturan_kehadiran: string;
        }) => {
            const res = await apiFetchJson("/api/v1/kasbon/pengaturan", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            return res;
        },
        onSuccess: () => {
            onShowNotif("Pengaturan aturan kasbon berhasil disimpan!", "success");
            queryClient.invalidateQueries({ queryKey: ["pengaturanKasbon"] });
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (err: any) => {
            onShowNotif(err?.message || "Gagal menyimpan pengaturan", "error");
        }
    });

    const handleSave = () => {
        saveMutation.mutate({
            kasbon_min_hari_kerja_mingguan: minHari,
            kasbon_mode_kehadiran_kurang: modeKurang,
            kasbon_max_potongan_thp_persen: maxPersenTHP,
            kasbon_status_aturan_kehadiran: statusAturan
        });
    };

    const handleToggleStatus = (newStatus: "aktif" | "nonaktif") => {
        setStatusAturan(newStatus);
        saveMutation.mutate({
            kasbon_min_hari_kerja_mingguan: minHari,
            kasbon_mode_kehadiran_kurang: modeKurang,
            kasbon_max_potongan_thp_persen: maxPersenTHP,
            kasbon_status_aturan_kehadiran: newStatus
        });
    };

    if (configQuery.isLoading) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="animate-spin text-emerald-600" size={36} />
                <p className="text-sm font-medium text-gray-500">Memuat konfigurasi aturan kasbon...</p>
            </div>
        );
    }

    const isAktif = statusAturan === "aktif";

    return (
        <div className="flex flex-col gap-6 w-full">

            {/* MAIN SETTINGS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* LEFT COL: FORM PENGATURAN (7 COLS) */}
                <div className="lg:col-span-7 flex flex-col gap-6">

                    {/* CARD 1: SYARAT HARI KERJA */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-xs flex flex-col gap-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                                    <CalendarCheck size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 text-base">Syarat Minimal Kehadiran Kerja</h3>
                                    <p className="text-xs text-gray-500">Jumlah hari berangkat minimal per minggu untuk memotong cicilan</p>
                                </div>
                            </div>
                            <span className="text-base font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                                {minHari} Hari / Minggu
                            </span>
                        </div>

                        {/* Interactive Stepper */}
                        <div className="flex flex-col gap-2">
                            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => setMinHari(num)}
                                        className={`py-2.5 rounded-xl text-sm font-bold transition-all border ${minHari === num
                                            ? "bg-emerald-600 text-white border-emerald-600 shadow-md scale-105"
                                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                                            }`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                            <div className="flex justify-between text-xs text-gray-400 px-1 pt-1">
                                <span>1 Hari</span>

                                <span>7 Hari</span>
                            </div>
                        </div>

                        <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-xs text-gray-700">
                            <p className="flex items-center gap-1.5">
                                <Info size={14} className="text-emerald-600 shrink-0" />
                                Pegawai yang hadir <b>minimal {minHari} hari</b> dalam periode penggajian mingguan akan dipotong cicilan kasbonnya secara normal.
                            </p>
                        </div>
                    </div>

                    {/* CARD 2: MODE SAAT KEHADIRAN KURANG */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-xs flex flex-col gap-4">
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                                <Sliders size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 text-base">Aksi Saat Kehadiran Kurang (&lt; {minHari} Hari)</h3>
                                <p className="text-xs text-gray-500">Tentukan tindakan sistem jika kehadiran pegawai di bawah syarat</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* OPSI 1: TUNDA (SKIP) */}
                            <div
                                onClick={() => setModeKurang("skip")}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-3 ${modeKurang === "skip"
                                    ? "border-emerald-500 bg-emerald-50/40 shadow-xs"
                                    : "border-gray-200 bg-white hover:border-gray-300"
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${modeKurang === "skip" ? "border-emerald-600 bg-emerald-600" : "border-gray-400"
                                            }`}>
                                            {modeKurang === "skip" && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                        </div>
                                        <span className="font-bold text-sm text-gray-800">Tunda Penuh (Skip)</span>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                                        Rekomendasi
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    Cicilan <b>tidak dipotong sama sekali (0%)</b> pada minggu tersebut. Utang ditunda ke minggu depan agar THP pegawai tidak minus.
                                </p>
                            </div>

                            {/* OPSI 2: PRORATA */}
                            <div
                                onClick={() => setModeKurang("prorata")}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-3 ${modeKurang === "prorata"
                                    ? "border-emerald-500 bg-emerald-50/40 shadow-xs"
                                    : "border-gray-200 bg-white hover:border-gray-300"
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${modeKurang === "prorata" ? "border-emerald-600 bg-emerald-600" : "border-gray-400"
                                            }`}>
                                            {modeKurang === "prorata" && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                        </div>
                                        <span className="font-bold text-sm text-gray-800">Prorata Proporsional</span>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    Cicilan dipotong sebagian sesuai proporsi hari hadir (misal masuk 3 dari {minHari} hari = potong 60% dari cicilan mingguan).
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* CARD 3: BATAS MAKSIMAL POTONGAN THP */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-xs flex flex-col gap-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 text-base">Batas Maksimal Potongan Gaji (Safety Cap)</h3>
                                    <p className="text-xs text-gray-500">Mencegah pemotongan kasbon berlebih dari total penghasilan kotor</p>
                                </div>
                            </div>
                            <span className="text-base font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
                                Max {maxPersenTHP}% THP
                            </span>
                        </div>

                        <div className="flex flex-col gap-2">
                            <input
                                type="range"
                                min={10}
                                max={80}
                                step={5}
                                value={maxPersenTHP}
                                onChange={(e) => setMaxPersenTHP(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                            />
                            <div className="flex justify-between text-xs text-gray-500 px-1">
                                <span>10% (Sangat Ketat)</span>
                                <span>80% (Longgar)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COL: STATUS ATURAN, TIPS & TOMBOL SIMPAN (5 COLS) */}
                <div className="lg:col-span-5 flex flex-col gap-6">

                    {/* STATUS ATURAN TOGGLE CARD */}
                    <div className="bg-white border border-gray-200 p-5 shadow-xs rounded-2xl flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-sm font-bold text-gray-900 block">Status Kebijakan Kasbon</span>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {isAktif ? "Aturan kehadiran aktif dan diterapkan saat penggajian." : "Aturan dinonaktifkan (kasbon dipotong normal)."}
                                </p>
                            </div>

                            {/* Interactive iOS Toggle Switch */}
                            <button
                                type="button"
                                role="switch"
                                aria-checked={isAktif}
                                onClick={() => handleToggleStatus(isAktif ? "nonaktif" : "aktif")}
                                disabled={saveMutation.isPending}
                                className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${isAktif ? "bg-emerald-600" : "bg-gray-300"
                                    }`}
                            >
                                <span
                                    aria-hidden="true"
                                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${isAktif ? "translate-x-6" : "translate-x-0"
                                        }`}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                            <span className="text-gray-500">Status Saat Ini:</span>
                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${isAktif ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                                }`}>
                                {isAktif ? "● Aktif" : "○ Nonaktif"}
                            </span>
                        </div>
                    </div>

                    {/* TIPS & BEST PRACTICE CARD */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-gray-800 font-bold text-sm">
                            <HelpCircle size={16} className="text-emerald-600" />
                            <h4>Panduan Kebijakan Ideal</h4>
                        </div>
                        <ul className="text-xs text-gray-600 flex flex-col gap-2 leading-relaxed">
                            <li className="flex items-start gap-2">
                                <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                                <span><b>Aturan Hari Kerja:</b> Memastikan karyawan yang sedang sakit atau izin memiliki sisa upah yang cukup untuk biaya hidup minggu tersebut.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                                <span><b>Opsi Hold / Penangguhan:</b> HRD dapat menangguhkan pemotongan kasbon tertentu secara manual via tombol Aksi di tabel kasbon.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                                <span><b>Transparansi Slip:</b> Pegawai yang cicilannya ditunda akan melihat catatan resmi di slip gaji tanpa bunga tambahan.</span>
                            </li>
                        </ul>
                    </div>

                    {/* TOMBOL SIMPAN */}
                    <div className="flex justify-end pt-2">
                        <Button
                            variant="success"
                            label={saveMutation.isPending ? "Menyimpan Pengaturan..." : "Simpan Perubahan Aturan"}
                            icon={saveMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            onClick={handleSave}
                            disabled={saveMutation.isPending}
                            className="px-6 py-3 text-sm font-bold rounded-xl shadow-md cursor-pointer"
                        />
                    </div>

                </div>
            </div>
        </div>
    );
}

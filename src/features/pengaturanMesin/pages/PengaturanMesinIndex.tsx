import { useState, useEffect } from 'react';
import { Clock, Save, RefreshCw, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import Button from '../../../components/common/Button';
import Notif from '../../../components/common/Notif';
import { apiFetchJson } from '../../../utils/apiFetch';

export default function PengaturanMesinIndex() {
    const [offsetMenit, setOffsetMenit] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [notif, setNotif] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success',
    });

    // Simulasi jam
    const sampleTimeStr = '08:00:00';
    const calculateSimulatedTime = (baseTime: string, offset: number) => {
        const [h, m, s] = baseTime.split(':').map(Number);
        const dt = new Date(2026, 0, 1, h, m, s);
        dt.setMinutes(dt.getMinutes() + (isNaN(offset) ? 0 : offset));
        const hh = String(dt.getHours()).padStart(2, '0');
        const mm = String(dt.getMinutes()).padStart(2, '0');
        const ss = String(dt.getSeconds()).padStart(2, '0');
        return `${hh}:${mm}:${ss}`;
    };

    const fetchPengaturan = async () => {
        setIsLoading(true);
        try {
            const res = await apiFetchJson('/api/pengaturan/mesin');
            if (res && res.success && res.data) {
                setOffsetMenit(res.data.offset_waktu_mesin_menit ?? 0);
            }
        } catch (error: any) {
            setNotif({
                show: true,
                message: error.message || 'Gagal memuat pengaturan mesin.',
                type: 'error',
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPengaturan();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await apiFetchJson('/api/pengaturan/mesin', {
                method: 'PUT',
                body: JSON.stringify({ offset_waktu_mesin_menit: Number(offsetMenit) }),
            });

            if (res && res.success) {
                setNotif({
                    show: true,
                    message: res.message || 'Pengaturan offset waktu mesin berhasil disimpan!',
                    type: 'success',
                });
            } else {
                throw new Error(res?.message || 'Gagal menyimpan pengaturan.');
            }
        } catch (error: any) {
            setNotif({
                show: true,
                message: error.message || 'Terjadi kesalahan saat menyimpan pengaturan.',
                type: 'error',
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
            <Notif
                show={notif.show}
                message={notif.message}
                type={notif.type}
                onClose={() => setNotif((prev) => ({ ...prev, show: false }))}
            />

            {/* HEADER SECTION */}
            <section className="bg-white border border-gray-300 rounded-2xl p-4 md:p-6 shadow-sm w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                            Pengaturan Waktu Mesin Absensi
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Koreksi ketidaksesuaian jam pada mesin absensi fingerprint/ADMS dengan menambah atau mengurangi menit.
                        </p>
                    </div>
                    <div className="flex gap-3 items-center w-full md:w-auto">
                        <Button
                            label="Muat Ulang"
                            variant="secondary"
                            icon={<RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />}
                            onClick={fetchPengaturan}
                            disabled={isLoading || isSaving}
                            className="active:scale-95 py-2.5 px-4 text-sm rounded-xl font-semibold cursor-pointer"
                        />
                    </div>
                </div>
            </section>

            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
                {/* SETTING INPUT FORM */}
                <section className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-4 md:p-6 shadow-sm flex flex-col justify-between gap-6">
                    <div>
                        <h2 className="text-base md:text-lg font-bold text-gray-800 border-b border-gray-100 pb-3 mb-5 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-red-50 text-[#C90003] flex items-center justify-center font-semibold shrink-0">
                                <Clock size={18} />
                            </div>
                            Konfigurasi Offset Menit
                        </h2>

                        <div className="flex flex-col gap-5">
                            <div>
                                <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-2">
                                    Offset Penyesuaian Waktu (Menit):
                                </label>
                                
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        value={offsetMenit}
                                        onChange={(e) => setOffsetMenit(parseInt(e.target.value, 10) || 0)}
                                        className="w-full md:w-52 text-xl font-bold text-center px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-[#C90003] text-slate-800 transition-all shadow-2xs"
                                        placeholder="0"
                                    />
                                    <span className="text-sm font-semibold text-slate-600">Menit</span>
                                </div>
                            </div>

                            {/* PRESET BUTTONS */}
                            <div>
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                                    Pilihan Cepat (Preset):
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {[-10, -5, -3, 0, 3, 5, 10].map((preset) => (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => setOffsetMenit(preset)}
                                            className={`px-3.5 py-1.5 text-xs md:text-sm font-semibold rounded-xl border transition-all duration-150 cursor-pointer shadow-2xs ${
                                                offsetMenit === preset
                                                    ? 'bg-[#C90003] text-white border-[#C90003] shadow-xs'
                                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                                            }`}
                                        >
                                            {preset > 0 ? `+${preset}` : preset} Menit
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* EXPLANATION BOX */}
                            <div className="mt-2 p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col gap-2 text-xs md:text-sm text-slate-700">
                                <div className="flex items-center gap-2 font-bold text-slate-800">
                                    <AlertCircle size={16} className="text-[#C90003]" />
                                    Panduan Nilai Offset:
                                </div>
                                <ul className="list-disc list-inside space-y-1.5 text-slate-600 pl-1">
                                    <li>
                                        <strong className="text-slate-800">Nilai Positif (+N)</strong>: Jika jam di mesin <u>terlalu lambat</u> dari waktu sebenarnya (misal di mesin 07:55, jam asli 08:00 &rarr; isi <strong className="text-[#C90003]">+5</strong>).
                                    </li>
                                    <li>
                                        <strong className="text-slate-800">Nilai Negatif (-N)</strong>: Jika jam di mesin <u>terlalu cepat</u> dari waktu sebenarnya (misal di mesin 08:05, jam asli 08:00 &rarr; isi <strong className="text-[#C90003]">-5</strong>).
                                    </li>
                                    <li>
                                        <strong className="text-slate-800">Nilai 0</strong>: Tanpa penyesuaian (menggunakan jam persis seperti yang dikirim oleh mesin).
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                        <Button
                            label={isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                            variant="danger"
                            icon={<Save size={18} />}
                            onClick={handleSave}
                            disabled={isLoading || isSaving}
                            className="w-full md:w-auto py-3 px-6 text-sm rounded-xl font-bold shadow-md cursor-pointer active:scale-95"
                        />
                    </div>
                </section>

                {/* LIVE SIMULATION CARD */}
                <section className="bg-white border border-gray-200 rounded-2xl p-4 md:p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                            <h3 className="text-base font-bold flex items-center gap-2 text-slate-800">
                                <CheckCircle2 size={18} className="text-[#C90003]" />
                                Simulasi Real-Time
                            </h3>
                            <span className="text-xs bg-red-50 text-[#C90003] font-semibold px-2.5 py-0.5 rounded-full border border-red-200 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#C90003] animate-pulse"></span>
                                Live Preview
                            </span>
                        </div>

                        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                            Berikut perbandingan jam yang dikirim mesin dengan jam yang akan tersimpan dalam sistem:
                        </p>

                        <div className="space-y-3">
                            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                                <span className="text-xs text-slate-500 font-medium block mb-1">
                                    Waktu Mentah dari Mesin:
                                </span>
                                <span className="text-xl font-mono font-bold text-slate-800">
                                    {sampleTimeStr}
                                </span>
                            </div>

                            <div className="flex justify-center text-slate-400 py-0.5">
                                <ArrowRight size={20} className="rotate-90 md:rotate-0" />
                            </div>

                            <div className="bg-red-50/60 p-3.5 rounded-xl border border-red-200/80">
                                <span className="text-xs text-red-700 font-semibold block mb-1">
                                    Waktu Tersimpan di Sistem:
                                </span>
                                <span className="text-2xl font-mono font-extrabold text-[#C90003]">
                                    {calculateSimulatedTime(sampleTimeStr, offsetMenit)}
                                </span>
                                <span className="text-[11px] text-red-600 font-medium block mt-1">
                                    (Offset Applied: {offsetMenit > 0 ? `+${offsetMenit}` : offsetMenit} menit)
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
                        ⚡ Waktu mentah asli dari mesin tetap tersimpan di database sebagai bukti audit trail.
                    </div>
                </section>
            </div>
        </div>
    );
}

import { useState } from "react";
import { Trash2, AlertTriangle, X, Loader2 } from "lucide-react";
import { apiFetchJson } from "../../utils/apiFetch";
import Notif from "./Notif";
import { useNotif } from "../../hooks/useNotif";

interface NuklirModalProps {
    isOpen: boolean;
    onClose: () => void;
    voidTarget: { id: string | number; nama: string };
    token?: string;
    onSuccess: () => void;
}

export default function ButtonNuklir({ isOpen, onClose, voidTarget, onSuccess }: NuklirModalProps) {
    const [alasanVoid, setAlasanVoid] = useState("");
    const [isVoiding, setIsVoiding] = useState(false);
    const { notif, showNotif, showErrorNotif, closeNotif } = useNotif();

    // Kalau modal sedang ditutup, jangan render apa-apa
    if (!isOpen) return null;

    const eksekusiVoid = async () => {
        if (!alasanVoid.trim()) {
            showNotif("Alasan wajib diisi!", "error");
            return;
        }

        setIsVoiding(true);
        const hariIni = new Date().toISOString().split('T')[0];

        try {
            await apiFetchJson('/api/absen/void', {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    pegawai_id: voidTarget.id,
                    tanggal: hariIni,
                    alasan_void: alasanVoid
                })
            });

            showNotif(`SUKSES: Absensi ${voidTarget.nama} telah dihanguskan.`, "success");
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1500);
        } catch (error) {
            console.error("Error trigger void:", error);
            showErrorNotif(error);
        } finally {
            setIsVoiding(false);
        }
    };

return (
    <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-red-200">

            {/* Header */}
            <div className="bg-red-600 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-bold text-lg tracking-wide">
                    <AlertTriangle size={24} className="text-yellow-300" />
                    PERINGATAN NUKLIR!
                </div>
                <button
                    onClick={onClose}
                    className="text-white hover:bg-red-700 p-1 rounded-full transition-colors"
                    disabled={isVoiding}
                >
                    <X size={20} />
                </button>
            </div>

            {/* Body */}
            <div className="p-6">
                <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                    Anda akan membatalkan (VOID) absensi milik <strong className="text-red-600 text-base">{voidTarget.nama}</strong> untuk hari ini. Tindakan ini akan <strong>menghanguskan seluruh upah dan bonus</strong> harian miliknya menjadi 0.
                </p>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-800">
                        Alasan Pembatalan (Wajib):
                    </label>
                    <textarea
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none resize-none h-24 bg-red-50/30"
                        placeholder="Contoh: Pulang tanpa izin..."
                        value={alasanVoid}
                        onChange={(e) => setAlasanVoid(e.target.value)}
                        disabled={isVoiding}
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                <button
                    className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    onClick={onClose}
                    disabled={isVoiding}
                >
                    Batal
                </button>
                <button
                    className="flex items-center gap-2 bg-red-600 text-white px-5 py-2 text-sm font-bold rounded-lg hover:bg-red-700 transition-colors shadow-md disabled:bg-red-400 disabled:cursor-not-allowed"
                    onClick={eksekusiVoid}
                    disabled={isVoiding}
                >
                    {isVoiding ? (
                        <><Loader2 size={16} className="animate-spin" /> Memproses...</>
                    ) : (
                        <><Trash2 size={16} /> Ya, Hapus Sekarang!</>
                    )}
                </button>
            </div>
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
import { useState, useEffect } from "react";
import { X, Wallet, AlertCircle } from "lucide-react";
import Button from "../../../components/common/Button";
import { formatNumberInput, parseCurrencyToNumber, formatRupiah } from "../../../utils/formatCurrency";

interface ModalBayarKasbonProps {
    isOpen: boolean;
    onClose: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    kasbon: any | null;
    onSubmit: (nominal: number, keterangan: string, metode: string) => void;
    isPending: boolean;
}

export default function ModalBayarKasbon({ isOpen, onClose, kasbon, onSubmit, isPending }: ModalBayarKasbonProps) {
    const [nominal, setNominal] = useState<string>("");
    const [keterangan, setKeterangan] = useState<string>("");
    const [metode, setMetode] = useState<string>("Tunai");
    const [error, setError] = useState<string>("");

    useEffect(() => {
        if (isOpen) {
            setNominal("");
            setKeterangan("");
            setMetode("Tunai");
            setError("");
        }
    }, [isOpen]);

    if (!isOpen || !kasbon) return null;

    const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatNumberInput(e.target.value);
        setNominal(formatted);
        if (formatted) setError("");
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const cleanNominal = parseCurrencyToNumber(nominal);
        const sisaPinjaman = kasbon.sisa_pinjaman || 0;

        if (cleanNominal <= 0) {
            setError("Nominal pembayaran harus lebih dari Rp 0");
            return;
        }

        if (cleanNominal > sisaPinjaman) {
            setError(`Nominal tidak boleh melebihi sisa pinjaman (${formatRupiah(sisaPinjaman)})`);
            return;
        }

        onSubmit(cleanNominal, keterangan, metode);
    };

    const sisaPinjaman = kasbon.sisa_pinjaman || 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl transform transition-all">
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3 text-emerald-600">
                        <Wallet size={24} />
                        <h2 className="text-xl font-bold text-gray-800">Bayar Kasbon</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        disabled={isPending}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
                    {/* Info Pegawai & Pinjaman */}
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-500">Pegawai</span>
                                <span className="text-sm font-bold text-gray-800">{kasbon.pegawai?.nama || kasbon.nama_pegawai || "-"}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-500">Sisa Pinjaman</span>
                                <span className="text-sm font-bold text-emerald-700">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(sisaPinjaman)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Input Nominal */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-gray-700">
                            Nominal Pembayaran (Rp) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={nominal}
                            onChange={handleNominalChange}
                            placeholder="Contoh: 100.000"
                            className={`border rounded-xl px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm outline-none transition-all ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                            disabled={isPending}
                        />
                        {error && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                <AlertCircle size={12} /> {error}
                            </p>
                        )}
                        <div className="flex gap-2 mt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setNominal(new Intl.NumberFormat('id-ID').format(sisaPinjaman));
                                    setError("");
                                }}
                                className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-200 transition-colors"
                            >
                                Bayar Lunas
                            </button>
                        </div>
                    </div>

                    {/* Input Metode */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-gray-700">Metode Pembayaran</label>
                        <select
                            value={metode}
                            onChange={(e) => setMetode(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm outline-none transition-all bg-white"
                            disabled={isPending}
                        >
                            <option value="Tunai">Tunai</option>
                            <option value="Transfer">Transfer</option>
                            <option value="Potong Gaji">Potong Gaji</option>
                        </select>
                    </div>

                    {/* Input Keterangan */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-gray-700">Keterangan <span className="text-gray-400 font-normal text-xs">(Opsional)</span></label>
                        <textarea
                            value={keterangan}
                            onChange={(e) => setKeterangan(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-xl h-24 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm outline-none resize-none transition-all"
                            placeholder="Contoh: Pembayaran tunai diluar gajian..."
                            disabled={isPending}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 mt-4">
                        <Button
                            type="button"
                            variant="danger"
                            label="Batal"
                            onClick={onClose}
                            disabled={isPending}
                        />
                        <Button
                            type="submit"
                            variant="success"
                            label={isPending ? "Memproses..." : "Konfirmasi Pembayaran"}
                            disabled={isPending}
                        />
                    </div>
                </form>
            </div>
        </div>
    );
}

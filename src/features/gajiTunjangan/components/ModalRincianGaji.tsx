import { X, TrendingUp, TrendingDown, Gift, AlertCircle, CreditCard } from "lucide-react";
import Button from "../../../components/common/Button";
import { formatRupiah } from "../../../utils/formatCurrency";

export interface ModalRincianGajiProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'bonus' | 'potongan';
    pegawaiNama: string;
    jabatan: string;
    periodeTanggal?: string;
    totalNominal: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rincianData: any;
}

export default function ModalRincianGaji({
    isOpen,
    onClose,
    type,
    pegawaiNama,
    jabatan,
    periodeTanggal,
    totalNominal,
    rincianData
}: ModalRincianGajiProps) {
    if (!isOpen) return null;

    const isBonus = type === 'bonus';
    const data = rincianData || {};

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* HEADER */}
                <div className={`p-4 border-b flex justify-between items-center ${isBonus ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg ${isBonus ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {isBonus ? <TrendingUp size={22} /> : <TrendingDown size={22} />}
                        </div>
                        <div>
                            <h3 className={`font-bold text-base ${isBonus ? 'text-green-900' : 'text-red-900'}`}>
                                {isBonus ? 'Rincian Bonus & Tunjangan' : 'Rincian Potongan & Denda'}
                            </h3>
                            <p className="text-xs text-gray-500 font-medium">
                                {pegawaiNama} • <span className="text-gray-700">{jabatan}</span>
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200/60 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* BODY */}
                <div className="p-5 overflow-y-auto space-y-4 text-sm">
                    {periodeTanggal && (
                        <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs text-gray-600 flex justify-between items-center">
                            <span className="font-semibold text-gray-700">Periode Tanggal:</span>
                            <span>{periodeTanggal}</span>
                        </div>
                    )}

                    {/* RINCIAN CONTENT */}
                    {isBonus ? (
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                                <Gift size={14} className="text-green-600" /> Itemized Bonus
                            </h4>
                            
                            <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
                                <div className="p-3 flex justify-between items-center hover:bg-gray-50/80">
                                    <span className="text-gray-700">Bonus Kedisiplinan (Absensi)</span>
                                    <span className="font-semibold text-green-700">+{formatRupiah(data.bonus_kedisiplinan_harian)}</span>
                                </div>
                                <div className="p-3 flex justify-between items-center hover:bg-gray-50/80">
                                    <span className="text-gray-700">Bonus Kerapian</span>
                                    <span className="font-semibold text-green-700">+{formatRupiah(data.bonus_kerapian_harian)}</span>
                                </div>
                                <div className="p-3 flex justify-between items-center hover:bg-gray-50/80">
                                    <span className="text-gray-700">Uang Lembur (Akumulasi)</span>
                                    <span className="font-semibold text-green-700">+{formatRupiah(data.uang_lembur_akumulasi)}</span>
                                </div>
                                <div className="p-3 flex justify-between items-center hover:bg-gray-50/80">
                                    <span className="text-gray-700">Bonus Mingguan Full</span>
                                    <span className="font-semibold text-green-700">+{formatRupiah(data.bonus_kehadiran_mingguan)}</span>
                                </div>
                            </div>

                            {/* DETAIL BONUS CUSTOM JIKA ADA */}
                            {Array.isArray(data.detail_bonus_custom) && data.detail_bonus_custom.length > 0 && (
                                <div className="mt-3">
                                    <h5 className="text-xs font-bold text-gray-600 mb-2">Bonus Custom Tambahan:</h5>
                                    <div className="border border-green-200 bg-green-50/50 rounded-lg p-2.5 space-y-2">
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        {data.detail_bonus_custom.map((bc: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center text-xs">
                                                <span className="text-gray-700 font-medium">{bc.keterangan || 'Bonus Custom'}</span>
                                                <span className="font-bold text-green-700">+{formatRupiah(bc.nominal)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                                <AlertCircle size={14} className="text-red-600" /> Itemized Potongan
                            </h4>

                            <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
                                <div className="p-3 flex justify-between items-center hover:bg-gray-50/80">
                                    <span className="text-gray-700">Denda Sistem Absensi (Terlambat/Pulang Cepat)</span>
                                    <span className="font-semibold text-red-600">-{formatRupiah(data.denda_sistem_absensi)}</span>
                                </div>
                                <div className="p-3 flex justify-between items-center hover:bg-gray-50/80">
                                    <span className="text-gray-700">Denda Alpha / Void</span>
                                    <span className="font-semibold text-red-600">-{formatRupiah(data.denda_alpha_void)}</span>
                                </div>
                                <div className="p-3 flex justify-between items-center hover:bg-gray-50/80">
                                    <span className="text-gray-700">Potongan Kasbon</span>
                                    <span className="font-semibold text-red-600">-{formatRupiah(data.potongan_kasbon)}</span>
                                </div>
                            </div>

                            {/* DETAIL KASBON JIKA ADA */}
                            {Array.isArray(data.detail_kasbon) && data.detail_kasbon.length > 0 && (
                                <div className="mt-3">
                                    <h5 className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1">
                                        <CreditCard size={14} className="text-amber-600" /> Rincian Potongan Cicilan Kasbon:
                                    </h5>
                                    <div className="border border-amber-200 bg-amber-50/40 rounded-lg divide-y divide-amber-100">
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        {data.detail_kasbon.map((kb: any, idx: number) => (
                                            <div key={idx} className="p-2.5 text-xs space-y-1">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium text-gray-800">{kb.keterangan || 'Pinjaman Kasbon'}</span>
                                                    <span className="font-bold text-red-600">-{formatRupiah(kb.nominal_potongan)}</span>
                                                </div>
                                                <div className="text-[11px] text-gray-500 flex justify-between">
                                                    <span>Sisa pinjaman terkini:</span>
                                                    <span className="font-medium text-gray-700">{formatRupiah(kb.sisa_pinjaman_terkini)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* DETAIL POTONGAN CUSTOM JIKA ADA */}
                            {Array.isArray(data.detail_potongan_custom) && data.detail_potongan_custom.length > 0 && (
                                <div className="mt-3">
                                    <h5 className="text-xs font-bold text-gray-600 mb-2">Potongan Custom Tambahan:</h5>
                                    <div className="border border-red-200 bg-red-50/50 rounded-lg p-2.5 space-y-2">
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        {data.detail_potongan_custom.map((pc: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center text-xs">
                                                <span className="text-gray-700 font-medium">{pc.keterangan || 'Potongan Custom'}</span>
                                                <span className="font-bold text-red-600">-{formatRupiah(pc.nominal)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TOTAL BANNER */}
                    <div className={`p-4 rounded-xl flex justify-between items-center border ${isBonus ? 'bg-green-100/60 border-green-300 text-green-900' : 'bg-red-100/60 border-red-300 text-red-900'}`}>
                        <span className="font-bold text-sm">Total {isBonus ? 'Bonus & Tunjangan' : 'Potongan Denda'}</span>
                        <span className="font-black text-lg">
                            {isBonus ? '+' : '-'}{formatRupiah(totalNominal)}
                        </span>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="p-4 border-t bg-gray-50 flex justify-end">
                    <Button 
                        label="Tutup" 
                        variant="secondary" 
                        onClick={onClose} 
                    />
                </div>
            </div>
        </div>
    );
}

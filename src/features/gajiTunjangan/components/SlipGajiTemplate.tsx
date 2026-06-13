import dayjs from 'dayjs';
import 'dayjs/locale/id';
import type { RekapGajiData } from './TabelRekapGaji';


// ============================================================
// Helper: Format angka ke format Rupiah
// ============================================================
const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(angka);
};

// ============================================================
// Props
// ============================================================
interface SlipGajiTemplateProps {
    /** Array data rekap gaji yang akan dicetak */
    data: RekapGajiData[];
    /** Nilai filter periode (format YYYY-MM) untuk label bulan di kop slip */
    filterValue: string;
}

// ============================================================
// Komponen SlipGajiTemplate
// Hanya terlihat saat print (hidden di layar biasa).
// ============================================================
export default function SlipGajiTemplate({ data, filterValue }: SlipGajiTemplateProps) {
    return (
        <div className="hidden print:block w-full text-black font-sans printable-area">
            {/* Style khusus print */}
            <style>{`
                @media print {
                    @page { 
                        size: A4 portrait; 
                        margin: 4mm 4mm; 
                    }
                    /* TRICK: Sembunyikan TOTAL seluruh elemen halaman web */
                    body * {
                        visibility: hidden;
                    }
                    /* Kembalikan visibilitas khusus untuk area slip gaji ini saja */
                    .printable-area, .printable-area * {
                        visibility: visible;
                    }
                    /* Posisikan slip di pojok paling atas kertas */
                    .printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    body { 
                        -webkit-print-color-adjust: exact; 
                        background: white; 
                    }
                }
            `}</style>

            {/* Grid 3 Kolom Kesamping */}
            <div className="grid grid-cols-3 gap-1.5">
                {data.map((karyawan) => (
                    <div
                        key={karyawan.id}
                        className="border border-dashed border-gray-400 p-2 bg-white print:break-inside-avoid flex flex-col justify-between"
                        style={{ height: '35mm', width: '100%', boxSizing: 'border-box' }}
                    >
                        {/* Kop Slip Mini */}
                        <div className="flex justify-between items-center border-b border-gray-800 pb-0.5 mb-1">
                            <div>
                                <h4 className="text-[8.5px] font-extrabold uppercase tracking-tight text-gray-900">SLIP GAJI</h4>
                                <p className="text-[6.5px] text-gray-500 font-medium leading-none">
                                    {dayjs(filterValue || undefined).locale('id').format('MMMM YYYY')}
                                </p>
                            </div>
                            <div className="text-right leading-none">
                                <h5 className="text-[7.5px] font-black text-gray-900">PT. TIGA BERLIAN (T-Be)</h5>
                                <p className="text-[5.5px] text-gray-400 italic">Rahasia</p>
                            </div>
                        </div>

                        {/* Identitas Karyawan Mini */}
                        <div className="grid grid-cols-2 gap-x-1 text-[7.5px] leading-tight mb-1">
                            <div className="flex gap-0.5 truncate">
                                <span className="text-gray-500 shrink-0">Nama:</span>
                                <span className="font-bold text-gray-900 truncate">{karyawan.nama}</span>
                            </div>
                            <div className="flex gap-0.5 truncate">
                                <span className="text-gray-500 shrink-0">Jabt:</span>
                                <span className="font-bold text-gray-900 truncate">{karyawan.jabatan}</span>
                            </div>
                        </div>

                        {/* Rincian Finansial Ultra Padat */}
                        <div className="grid grid-cols-2 gap-x-2 text-[7px] leading-tight bg-gray-50 p-1 rounded border border-gray-100">
                            <div>
                                <div className="flex justify-between font-bold text-gray-700 border-b border-gray-200 text-[6.5px] mb-0.5">
                                    <span>PENERIMAAN</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Gaji Pokok</span>
                                    <span className="font-medium text-gray-900">{formatRupiah(karyawan.gaji_dasar)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Tunj &amp; Bon</span>
                                    <span className="font-medium text-green-700">+{formatRupiah(karyawan.total_bonus)}</span>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between font-bold text-gray-700 border-b border-gray-200 text-[6.5px] mb-0.5">
                                    <span>POTONGAN</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Pot/Denda</span>
                                    <span className="font-medium text-red-700">-{formatRupiah(karyawan.total_potongan)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer: Take Home Pay */}
                        <div className="mt-0.1 pt-0.5 border-t border-gray-300 flex justify-between items-end leading-none">
                            <div>
                                <span className="text-[6px] uppercase text-gray-400 font-bold block">Take Home Pay</span>
                                <span className="text-[9.5px] font-black text-blue-900">{formatRupiah(karyawan.gaji_bersih)}</span>
                            </div>
                            <div className="text-center text-[6.5px] w-14 border-b border-gray-400 text-gray-700 font-medium">
                                Penerima
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

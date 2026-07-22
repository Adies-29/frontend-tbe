import type { DetailHarian, RekapGajiLengkap } from './ModalPreviewSlipGaji';

interface SlipGajiTemplateProps {
    data: RekapGajiLengkap[] | any[];
    filterValue: string;
}

const formatAngka = (angka?: number | null) => {
    if (!angka) return "0";
    return new Intl.NumberFormat('id-ID').format(Math.round(angka));
};

const chunkArray = <T,>(arr: T[], size: number): T[][] => {
    const chunked: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        chunked.push(arr.slice(i, i + size));
    }
    return chunked;
};

export default function SlipGajiTemplate({ data, filterValue }: SlipGajiTemplateProps) {
    const dataLunas = data?.filter(
        (pegawai) => pegawai.status === 'Lunas' || pegawai.status?.toLowerCase() === 'lunas'
    ) || [];

    if (!dataLunas || dataLunas.length === 0) return null;

    // Pecah data lunas menjadi kelompok berisi 4 slip per halaman A4 Landscape
    const chunks = chunkArray(dataLunas, 4);

    return (
        // Gunakan absolute dan z-index tinggi agar menimpa seluruh aplikasi saat print
        <div className="hidden print:block bg-white text-black font-sans absolute top-0 left-0 w-full z-99999 m-0 p-0">

            {/* =====================================================================
                CSS SAKTI UNTUK CETAK 4 SLIP PER HALAMAN A4 LANDSCAPE (2x2 GRID)
                ===================================================================== */}
            <style type="text/css" media="print">
                {`
                    @page { 
                        size: A4 landscape; 
                        margin: 4mm 6mm; 
                    }
                    * { 
                        -webkit-print-color-adjust: exact !important; 
                        color-adjust: exact !important; 
                    }
                    
                    /* PAKSA SEMUA CONTAINER INDUK UNTUK MEMBUKA OVERFLOW-NYA */
                    html, body, #root, main, .overflow-hidden, .overflow-y-auto, .h-screen {
                        height: auto !important;
                        min-height: auto !important;
                        overflow: visible !important;
                        position: static !important;
                    }

                    .print-page {
                        display: grid !important;
                        grid-template-columns: repeat(2, 1fr) !important;
                        grid-template-rows: repeat(2, 1fr) !important;
                        gap: 3mm 5mm !important;
                        width: 285mm !important;
                        height: 200mm !important;
                        page-break-after: always !important;
                        break-after: page !important;
                        box-sizing: border-box !important;
                        padding: 1mm 0 !important;
                    }

                    .slip-container { 
                        border: 1px dashed #64748b !important; 
                        padding: 2.5mm 3.5mm !important;
                        height: 97mm !important;
                        max-height: 97mm !important;
                        box-sizing: border-box !important;
                        display: flex !important;
                        flex-direction: column !important;
                        justify-content: space-between !important;
                        overflow: hidden !important;
                        background-color: #ffffff !important;
                    }
                `}
            </style>

            {chunks.map((chunk, chunkIdx) => (
                <div key={chunkIdx} className="print-page">
                    {chunk.map((pegawai) => {
                        const isTarget = pegawai.tipe_penggajian === 'Target';
                        const rb = pegawai.rincian_bonus || {};
                        const rt = pegawai.informasi_tabungan || {};

                        // Menarik array detail kasbon & potongan custom dari JSON
                        const detailKasbon = pegawai.rincian_potongan?.detail_kasbon || [];
                        const detailPotonganCustom = pegawai.rincian_potongan?.detail_potongan_custom || [];
                        const isLunas = pegawai.status === 'Lunas';

                        return (
                            <div key={pegawai.id} className="slip-container">
                                
                                <div>
                                    {/* 1. HEADER */}
                                    <div className="flex justify-between items-start mb-1.5">
                                        <table className="text-left font-bold text-[7.5px] leading-tight">
                                            <tbody>
                                                <tr><td className="w-12 pb-0.5 text-gray-500">Nama</td><td className="pb-0.5 text-gray-900">: {pegawai.nama}</td></tr>
                                                <tr><td className="pb-0.5 text-gray-500">Bidang</td><td className="pb-0.5 text-gray-800">: {pegawai.jabatan}</td></tr>
                                                <tr><td className="pb-0.5 text-gray-500">Shift</td><td className="pb-0.5 text-gray-800">: {pegawai.shift || '-'}</td></tr>
                                                <tr><td className="pb-0.5 text-gray-500">Rincian</td><td className="pb-0.5 text-gray-800">: Upah Mingguan ({pegawai.tipe_penggajian})</td></tr>
                                                <tr><td className="pb-0.5 text-gray-500">Tanggal</td><td className="pb-0.5 text-gray-850">: {pegawai.periode_tanggal || filterValue}</td></tr>
                                            </tbody>
                                        </table>
                                        <div className="text-right">
                                            <h1 className="font-extrabold text-[8.5px] text-gray-900 leading-none">Perusahaan Krupuk Mie</h1>
                                            <h2 className="font-black text-[10px] text-emerald-800 tracking-wider leading-tight">" Tiga Berlian Official "</h2>
                                            <p className="leading-tight text-[6px] text-gray-500 font-medium mt-0.5">
                                                Jl. Raya Belakang Yonif 407 &middot; Ds. Harjosari Lor RT 28 RW 06<br />
                                                Kec. Adiwerna Kab. Tegal &middot; Telp. 095743404555
                                            </p>
                                        </div>
                                    </div>

                                    {/* 2. TABEL UTAMA */}
                                    <table className="w-full border-collapse border border-black text-center text-[7.5px] mb-1.5 leading-tight">
                                        <thead className="border-b border-black bg-gray-100 font-bold">
                                            <tr>
                                                <th className="border-r border-black py-0.5 w-5">No</th>
                                                <th className="border-r border-black py-0.5 w-16">Hari</th>
                                                {isTarget ? (
                                                    <>
                                                        <th className="border-r border-black py-0.5">Pekerjaan</th>
                                                        <th className="border-r border-black py-0.5 w-12">Harga</th>
                                                        <th className="border-r border-black py-0.5 w-10">Capaian</th>
                                                    </>
                                                ) : (
                                                    <th className="border-r border-black py-0.5">Gaji Kehadiran</th>
                                                )}
                                                <th className="border-r border-black py-0.5 w-10">T.Absen</th>
                                                <th className="border-r border-black py-0.5 w-10">T.Rapih</th>
                                                <th className="border-r border-black py-0.5 w-10">Lembur</th>
                                                <th className="py-0.5 w-16 text-right px-1.5">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pegawai.detail_harian && pegawai.detail_harian.length > 0 ? (
                                                pegawai.detail_harian.map((hari: DetailHarian, idx: number) => (
                                                    <tr key={idx} className="border-b border-black">
                                                        <td className="border-r border-black py-0.5">{idx + 1}</td>
                                                        <td className="border-r border-black py-0.5 text-left px-1">{hari.hari_tanggal || '-'}</td>

                                                        {isTarget ? (
                                                            <>
                                                                <td className="border-r border-black py-0.5 text-left px-1 uppercase truncate max-w-[80px]">{hari.nama_target || '-'}</td>
                                                                <td className="border-r border-black py-0.5 text-right px-1">{formatAngka(hari.harga_satuan)}</td>
                                                                <td className="border-r border-black py-0.5 font-bold">{formatAngka(hari.capaian)}</td>
                                                            </>
                                                        ) : (
                                                            <td className="border-r border-black py-0.5 text-right px-1">{formatAngka(hari.gaji_kehadiran)}</td>
                                                        )}

                                                        <td className="border-r border-black py-0.5 text-right px-1">{formatAngka(hari.t_absensi)}</td>
                                                        <td className="border-r border-black py-0.5 text-right px-1">{formatAngka(hari.t_kerapian)}</td>
                                                        <td className="border-r border-black py-0.5 text-right px-1">{formatAngka(hari.lembur)}</td>
                                                        <td className="py-0.5 font-bold text-right px-1.5">{formatAngka(hari.total_harian)}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr><td colSpan={isTarget ? 9 : 7} className="py-2 text-gray-500 italic">Data absen tidak tersedia</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* 3. FOOTER */}
                                <div className="flex justify-between items-start text-[7.5px] leading-tight">

                                    {/* Kiri: Info Tabungan & Hutang */}
                                    <table className="border border-black text-left w-[47%]">
                                        <tbody>
                                            <tr><td colSpan={2} className="py-0.5 px-1.5 border-b border-black bg-gray-100 font-bold text-center text-[7.5px]">KASBON & TABUNGAN</td></tr>

                                            {isLunas && detailKasbon.map((bon: any, i: number) => (
                                                <tr key={'sisa-' + i} className="border-b border-black">
                                                    <td className="py-0.5 px-1.5 border-r border-black text-red-700 font-semibold leading-tight">
                                                        Sisa Bon ({bon.keterangan}):
                                                    </td>
                                                    <td className="py-0.5 px-1.5 text-right font-bold text-red-700">
                                                        {formatAngka(bon.sisa_pinjaman_terkini)}
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="border-b border-black">
                                                <td className="py-0.5 px-1.5 border-r border-black">Tabungan Lembur :</td>
                                                <td className="py-0.5 px-1.5 text-right">{formatAngka(rt.tabungan_lembur_tahunan_terkumpul)}</td>
                                            </tr>
                                            <tr>
                                                <td className="py-0.5 px-1.5 border-r border-black">Tabungan Loyalitas :</td>
                                                <td className="py-0.5 px-1.5 text-right">{formatAngka(rt.tabungan_loyalitas_akumulasi)}</td>
                                            </tr>
                                        </tbody>
                                    </table>

                                    {/* Kanan: Rincian Akumulasi Gaji */}
                                    <table className="text-right w-[50%] border border-black">
                                        <tbody>
                                            <tr className="border-b border-black bg-gray-50 font-bold">
                                                <td className="py-0.5 pr-1.5 border-r border-black">Jumlah Gaji Pokok</td>
                                                <td className="py-0.5 px-1.5 w-18">{formatAngka(pegawai.gaji_dasar)}</td>
                                            </tr>
                                            {rb.bonus_kehadiran_mingguan > 0 && (
                                                <tr>
                                                    <td className="py-0.2 pr-1.5 border-r border-black">Bonus Mingguan Full</td>
                                                    <td className="py-0.2 px-1.5">+{formatAngka(rb.bonus_kehadiran_mingguan)}</td>
                                                </tr>
                                            )}
                                            {rb.uang_lembur_akumulasi > 0 && (
                                                <tr>
                                                    <td className="py-0.2 pr-1.5 border-r border-black">Total Lembur</td>
                                                    <td className="py-0.2 px-1.5">+{formatAngka(rb.uang_lembur_akumulasi)}</td>
                                                </tr>
                                            )}
                                            {rb.bonus_kedisiplinan_harian > 0 && (
                                                <tr>
                                                    <td className="py-0.2 pr-1.5 border-r border-black">Total T. Absensi</td>
                                                    <td className="py-0.2 px-1.5">+{formatAngka(rb.bonus_kedisiplinan_harian)}</td>
                                                </tr>
                                            )}
                                            {rb.bonus_kerapian_harian > 0 && (
                                                <tr>
                                                    <td className="py-0.2 pr-1.5 border-r border-black">Total T. Kerapian</td>
                                                    <td className="py-0.2 px-1.5">+{formatAngka(rb.bonus_kerapian_harian)}</td>
                                                </tr>
                                            )}

                                            {rb.detail_bonus_custom && rb.detail_bonus_custom.length > 0 && (
                                                <>
                                                    <tr><td colSpan={2} className="py-0.2 pr-1.5 border-r border-black font-semibold text-blue-800 text-left bg-gray-50 pl-1">Pendapatan Lain:</td></tr>
                                                    {rb.detail_bonus_custom.map((b_custom: any, i: number) => (
                                                        <tr key={'bonus-' + i}>
                                                            <td className="py-0.2 pr-1.5 italic pl-2 text-left">- {b_custom.keterangan}</td>
                                                            <td className="py-0.2 px-1.5">+{formatAngka(b_custom.nominal)}</td>
                                                        </tr>
                                                    ))}
                                                </>
                                            )}

                                            {pegawai.denda_sistem > 0 && (
                                                <tr>
                                                    <td className="py-0.2 pr-1.5 border-r border-black text-red-600">Denda / Telat / Alpha</td>
                                                    <td className="py-0.2 px-1.5 text-red-600">-{formatAngka(pegawai.denda_sistem)}</td>
                                                </tr>
                                            )}

                                            {isLunas && detailKasbon.map((bon: any, i: number) => (
                                                <tr key={'potongan-' + i}>
                                                    <td className="py-0.2 pr-1.5 border-r border-black text-red-600">Pot. Bon ({bon.keterangan})</td>
                                                    <td className="py-0.2 px-1.5 text-red-600">-{formatAngka(bon.nominal_potongan)}</td>
                                                </tr>
                                            ))}

                                            {detailPotonganCustom.map((pot: any, i: number) => (
                                                <tr key={'potongan-custom-' + i}>
                                                    <td className="py-0.2 pr-1.5 border-r border-black text-red-600">Pot. Custom ({pot.keterangan})</td>
                                                    <td className="py-0.2 px-1.5 text-red-600">-{formatAngka(pot.nominal)}</td>
                                                </tr>
                                            ))}

                                            <tr className="bg-gray-200 font-extrabold text-[8px]">
                                                <td className="py-0.5 pr-1.5 border-r border-black uppercase">UPAH BERSIH</td>
                                                <td className="py-0.5 px-1.5 text-gray-900">{formatAngka(pegawai.total_upah)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}
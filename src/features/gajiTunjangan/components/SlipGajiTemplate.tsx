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

const getBonusCustomForHari = (hari: any, pegawai: any, idx: number) => {
    if (Number(hari.bonus_custom) > 0) {
        return Number(hari.bonus_custom);
    }

    const bonusList = pegawai.rincian_bonus?.detail_bonus_custom;
    if (!Array.isArray(bonusList) || bonusList.length === 0) return 0;

    const detailHarian = pegawai.detail_harian || [];
    const hDate = (hari.hari_tanggal || '').toLowerCase();
    const hTanggal = (hari.tanggal || '').toLowerCase();

    const firstIdx = detailHarian.findIndex((h: any) => {
        const dateStr = (h.hari_tanggal || '').toLowerCase();
        const tglStr = (h.tanggal || '').toLowerCase();
        return (dateStr && hDate && dateStr === hDate) || (tglStr && hTanggal && tglStr === hTanggal);
    });

    if (firstIdx !== -1 && idx !== firstIdx) {
        return 0;
    }

    const matched = bonusList.filter((b: any) => {
        const bTanggal = (b.tanggal || '').toLowerCase();
        const bHari = (b.hari_tanggal || '').toLowerCase();
        if (hTanggal && bTanggal && hTanggal === bTanggal) return true;
        if (hDate && bHari && hDate === bHari) return true;
        if (hDate && bTanggal && bTanggal.includes(hDate)) return true;
        return false;
    });

    if (matched.length > 0) {
        return matched.reduce((sum: number, b: any) => sum + (Number(b.nominal) || 0), 0);
    }

    return 0;
};

const getPotonganCustomForHari = (hari: any, pegawai: any, idx: number) => {
    if (Number(hari.potongan_custom) > 0) {
        return Number(hari.potongan_custom);
    }

    const potonganList = pegawai.rincian_potongan?.detail_potongan_custom;
    if (!Array.isArray(potonganList) || potonganList.length === 0) return 0;

    const detailHarian = pegawai.detail_harian || [];
    const hDate = (hari.hari_tanggal || '').toLowerCase();
    const hTanggal = (hari.tanggal || '').toLowerCase();

    const firstIdx = detailHarian.findIndex((h: any) => {
        const dateStr = (h.hari_tanggal || '').toLowerCase();
        const tglStr = (h.tanggal || '').toLowerCase();
        return (dateStr && hDate && dateStr === hDate) || (tglStr && hTanggal && tglStr === hTanggal);
    });

    if (firstIdx !== -1 && idx !== firstIdx) {
        return 0;
    }

    const matched = potonganList.filter((p: any) => {
        const pTanggal = (p.tanggal || '').toLowerCase();
        const pHari = (p.hari_tanggal || '').toLowerCase();
        if (hTanggal && pTanggal && hTanggal === pTanggal) return true;
        if (hDate && pHari && hDate === pHari) return true;
        if (hDate && pTanggal && pTanggal.includes(hDate)) return true;
        return false;
    });

    if (matched.length > 0) {
        return matched.reduce((sum: number, p: any) => sum + (Number(p.nominal) || 0), 0);
    }

    return 0;
};

export default function SlipGajiTemplate({ data, filterValue }: SlipGajiTemplateProps) {
    const dataLunas = data?.filter(
        (pegawai) => pegawai.status === 'Lunas' || pegawai.status?.toLowerCase() === 'lunas'
    ) || [];

    if (!dataLunas || dataLunas.length === 0) return null;

    // Pisahkan data lunas menjadi:
    // 1. Data Standar (<= 8 baris, dicetak 4 slip per lembar A4 Landscape, 2x2)
    // 2. Data Long (Target / > 8 baris, dicetak 2 slip per lembar A4 Landscape, tinggi penuh 198mm)
    const isLongSlipRecord = (p: any) => {
        return (p.detail_harian && p.detail_harian.length > 8) || (p.tipe_penggajian === 'Target' && p.detail_harian && p.detail_harian.length > 7);
    };

    const dataStandard = dataLunas.filter(p => !isLongSlipRecord(p));
    const dataLong = dataLunas.filter(p => isLongSlipRecord(p));

    const standardChunks = chunkArray(dataStandard, 4);
    const longChunks = chunkArray(dataLong, 2);

    const renderSlipContent = (pegawai: any, isLong: boolean) => {
        const isTarget = pegawai.tipe_penggajian === 'Target';
        const rb = pegawai.rincian_bonus || {};
        const rt = pegawai.informasi_tabungan || {};

        // Menarik array detail kasbon & potongan custom dari JSON
        const detailKasbon = pegawai.rincian_potongan?.detail_kasbon || [];
        const detailPotonganCustom = pegawai.rincian_potongan?.detail_potongan_custom || [];
        const isLunas = pegawai.status === 'Lunas' || pegawai.status?.toLowerCase() === 'lunas';

        return (
            <div key={pegawai.id} className={isLong ? "slip-container-long" : "slip-container-standard"}>
                
                <div>
                    {/* 1. HEADER */}
                    <div className="flex justify-between items-start mb-0.5">
                        <table className="text-left font-bold text-[9px] leading-tight">
                            <tbody>
                                <tr><td className="w-12 pb-0.1 text-gray-500 font-medium">Nama</td><td className="pb-0.1 text-gray-900 font-extrabold">: {pegawai.nama}</td></tr>
                                <tr><td className="pb-0.1 text-gray-500 font-medium">Bidang</td><td className="pb-0.1 text-gray-800 font-bold">: {pegawai.jabatan}</td></tr>
                                <tr><td className="pb-0.1 text-gray-500 font-medium">Shift</td><td className="pb-0.1 text-gray-800 font-bold">: {pegawai.shift || '-'}</td></tr>
                                <tr><td className="pb-0.1 text-gray-500 font-medium">Rincian</td><td className="pb-0.1 text-gray-800 font-bold">: Upah Mingguan ({pegawai.tipe_penggajian})</td></tr>
                                <tr><td className="pb-0.1 text-gray-500 font-medium">Tanggal</td><td className="pb-0.1 text-gray-850 font-bold">: {pegawai.periode_tanggal || filterValue}</td></tr>
                            </tbody>
                        </table>
                        <div className="text-right leading-none">
                            <h1 className="font-extrabold text-[9px] text-gray-900 uppercase leading-none">Perusahaan Krupuk Mie</h1>
                            <h2 className="font-black text-[10.5px] text-emerald-800 tracking-wider leading-tight mt-0.5">" Tiga Berlian Official "</h2>
                            <p className="leading-tight text-[7px] text-gray-500 font-medium mt-0.5">
                                Jl. Raya Belakang Yonif 407 &middot; Ds. Harjosari Lor RT 28 RW 06<br />
                                Kec. Adiwerna Kab. Tegal &middot; Telp. 095743404555
                            </p>
                        </div>
                    </div>

                    {/* 2. TABEL UTAMA */}
                    <table className="w-full border-collapse border border-black text-center text-[9px] mb-0.5 leading-tight">
                        <thead className="border-b border-black bg-gray-100 font-bold">
                            <tr>
                                <th className="border-r border-black py-0.2 w-4">No</th>
                                <th className="border-r border-black py-0.2 w-14">Hari</th>
                                {isTarget ? (
                                    <>
                                        <th className="border-r border-black py-0.2">Pekerjaan</th>
                                        <th className="border-r border-black py-0.2 w-11">Harga</th>
                                        <th className="border-r border-black py-0.2 w-9">Capaian</th>
                                    </>
                                ) : (
                                    <th className="border-r border-black py-0.2">Gaji Kehadiran</th>
                                )}
                                <th className="border-r border-black py-0.2 w-9">T.Absen</th>
                                <th className="border-r border-black py-0.2 w-9">T.Rapih</th>
                                <th className="border-r border-black py-0.2 w-9">Lembur</th>
                                <th className="py-0.2 w-16 text-right px-1">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pegawai.detail_harian && pegawai.detail_harian.length > 0 ? (
                                pegawai.detail_harian.map((hari: DetailHarian, idx: number) => {
                                    const bCustom = getBonusCustomForHari(hari, pegawai, idx);
                                    const pCustom = getPotonganCustomForHari(hari, pegawai, idx);
                                    const upahPokok = isTarget 
                                        ? (Number(hari.harga_satuan) || 0) * (Number(hari.capaian) || 0)
                                        : (Number(hari.gaji_kehadiran) || 0);
                                    const totalHarianKalkulasi = upahPokok
                                        + (Number(hari.t_absensi) || 0)
                                        + (Number(hari.t_kerapian) || 0)
                                        + (Number(hari.lembur) || 0)
                                        + bCustom
                                        - pCustom;

                                    return (
                                        <tr key={idx} className="border-b border-black">
                                            <td className="border-r border-black py-0.2 font-medium">{idx + 1}</td>
                                            <td className="border-r border-black py-0.2 text-left px-1 font-semibold">{hari.hari_tanggal || '-'}</td>

                                            {isTarget ? (
                                                <>
                                                    <td className="border-r border-black py-0.2 text-left px-1 uppercase truncate max-w-20">{hari.nama_target || '-'}</td>
                                                    <td className="border-r border-black py-0.2 text-right px-1 font-semibold">{formatAngka(hari.harga_satuan)}</td>
                                                    <td className="border-r border-black py-0.2 font-bold">{formatAngka(hari.capaian)}</td>
                                                </>
                                            ) : (
                                                <td className="border-r border-black py-0.2 text-right px-1 font-semibold">{formatAngka(hari.gaji_kehadiran)}</td>
                                            )}

                                            <td className="border-r border-black py-0.2 text-right px-1 font-semibold">{formatAngka(hari.t_absensi)}</td>
                                            <td className="border-r border-black py-0.2 text-right px-1 font-semibold">{formatAngka(hari.t_kerapian)}</td>
                                            <td className="border-r border-black py-0.2 text-right px-1 font-semibold">{formatAngka(hari.lembur)}</td>
                                            <td className="py-0.2 font-bold text-right px-1 text-[9px]">{formatAngka(totalHarianKalkulasi)}</td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan={isTarget ? 9 : 7} className="py-1 text-gray-500 italic">Data absen tidak tersedia</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 3. FOOTER */}
                <div className="flex justify-between items-start text-[9px] leading-tight">

                    {/* Kiri: Info Tabungan & Hutang */}
                    <table className="border border-black text-left w-[47%]">
                        <tbody>
                            <tr><td colSpan={2} className="py-0.2 px-1 border-b border-black bg-gray-100 font-bold text-center text-[9px]">KASBON & TABUNGAN</td></tr>

                            {isLunas && detailKasbon.map((bon: any, i: number) => (
                                <tr key={'sisa-' + i} className="border-b border-black">
                                    <td className="py-0.2 px-1 border-r border-black text-red-700 font-semibold leading-tight">
                                        Sisa Bon ({bon.keterangan}):
                                    </td>
                                    <td className="py-0.2 px-1 text-right font-bold text-red-700">
                                        {formatAngka(bon.sisa_pinjaman_terkini)}
                                    </td>
                                </tr>
                            ))}
                            <tr className="border-b border-black">
                                <td className="py-0.2 px-1 border-r border-black">Tabungan Lembur :</td>
                                <td className="py-0.2 px-1 text-right font-bold">{formatAngka(rt.tabungan_lembur_tahunan_terkumpul)}</td>
                            </tr>
                            <tr>
                                <td className="py-0.2 px-1 border-r border-black">Tabungan Loyalitas :</td>
                                <td className="py-0.2 px-1 text-right font-bold">{formatAngka(rt.tabungan_loyalitas_akumulasi)}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Kanan: Rincian Akumulasi Gaji */}
                    <table className="text-right w-[51%] border border-black">
                        <tbody>
                            <tr className="border-b border-black bg-gray-50 font-bold">
                                <td className="py-0.2 pr-1 border-r border-black">Jumlah Gaji Pokok</td>
                                <td className="py-0.2 px-1 w-18 font-bold">{formatAngka(pegawai.gaji_dasar)}</td>
                            </tr>
                            {rb.bonus_kehadiran_mingguan > 0 && (
                                <tr>
                                    <td className="py-0.2 pr-1 border-r border-black">Bonus Mingguan Full</td>
                                    <td className="py-0.2 px-1 font-semibold">+{formatAngka(rb.bonus_kehadiran_mingguan)}</td>
                                </tr>
                            )}
                            {rb.uang_lembur_akumulasi > 0 && (
                                <tr>
                                    <td className="py-0.2 pr-1 border-r border-black">Total Lembur</td>
                                    <td className="py-0.2 px-1 font-semibold">+{formatAngka(rb.uang_lembur_akumulasi)}</td>
                                </tr>
                            )}
                            {rb.bonus_kedisiplinan_harian > 0 && (
                                <tr>
                                    <td className="py-0.2 pr-1 border-r border-black">Total T. Absensi</td>
                                    <td className="py-0.2 px-1 font-semibold">+{formatAngka(rb.bonus_kedisiplinan_harian)}</td>
                                </tr>
                            )}
                            {rb.bonus_kerapian_harian > 0 && (
                                <tr>
                                    <td className="py-0.2 pr-1 border-r border-black">Total T. Kerapian</td>
                                    <td className="py-0.2 px-1 font-semibold">+{formatAngka(rb.bonus_kerapian_harian)}</td>
                                </tr>
                            )}

                            {rb.detail_bonus_custom && rb.detail_bonus_custom.length > 0 && (
                                <>
                                    <tr><td colSpan={2} className="py-0.2 pr-1 border-r border-black font-semibold text-blue-800 text-left bg-gray-50 pl-1">Pendapatan Lain:</td></tr>
                                    {rb.detail_bonus_custom.map((b_custom: any, i: number) => (
                                        <tr key={'bonus-' + i}>
                                            <td className="py-0.2 pr-1 italic pl-2 text-left">- {b_custom.keterangan}</td>
                                            <td className="py-0.2 px-1 font-semibold">+{formatAngka(b_custom.nominal)}</td>
                                        </tr>
                                    ))}
                                </>
                            )}

                            {pegawai.denda_sistem > 0 && (
                                <tr>
                                    <td className="py-0.2 pr-1 border-r border-black text-red-600">Denda / Telat / Alpha</td>
                                    <td className="py-0.2 px-1 text-red-600 font-semibold">-{formatAngka(pegawai.denda_sistem)}</td>
                                </tr>
                            )}

                            {isLunas && detailKasbon.map((bon: any, i: number) => (
                                <tr key={'potongan-' + i}>
                                    <td className="py-0.2 pr-1 border-r border-black text-red-600">Pot. Bon ({bon.keterangan})</td>
                                    <td className="py-0.2 px-1 text-red-600 font-semibold">-{formatAngka(bon.nominal_potongan)}</td>
                                </tr>
                            ))}

                            {detailPotonganCustom.map((pot: any, i: number) => (
                                <tr key={'potongan-custom-' + i}>
                                    <td className="py-0.2 pr-1 border-r border-black text-red-600">Pot. Custom ({pot.keterangan})</td>
                                    <td className="py-0.2 px-1 text-red-600 font-semibold">-{formatAngka(pot.nominal)}</td>
                                </tr>
                            ))}

                            <tr className="bg-gray-200 font-black text-[9.5px]">
                                <td className="py-0.5 pr-1 border-r border-black uppercase">UPAH BERSIH</td>
                                <td className="py-0.5 px-1 text-gray-900 font-black text-[10px]">{formatAngka(pegawai.total_upah)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>
        );
    };

    return (
        // Gunakan absolute dan z-index tinggi agar menimpa seluruh aplikasi saat print
        <div className="hidden print:block bg-white text-black font-sans absolute top-0 left-0 w-full z-99999 m-0 p-0">

            {/* =====================================================================
                CSS UNTUK CETAK SLIP DENGAN ADAPTIVE HYBRID LAYOUT (A4 LANDSCAPE)
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

                    .print-page-standard {
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

                    .slip-container-standard { 
                        border: 1px dashed #64748b !important; 
                        padding: 2.5mm 3.5mm !important;
                        height: 97mm !important;
                        max-height: 97mm !important;
                        box-sizing: border-box !important;
                        display: flex !important;
                        flex-direction: column !important;
                        justify-content: flex-start !important;
                        gap: 1.5mm !important;
                        overflow: hidden !important;
                        background-color: #ffffff !important;
                    }

                    .print-page-long {
                        display: grid !important;
                        grid-template-columns: repeat(2, 1fr) !important;
                        grid-template-rows: 1fr !important;
                        gap: 3mm 5mm !important;
                        width: 285mm !important;
                        height: 200mm !important;
                        page-break-after: always !important;
                        break-after: page !important;
                        box-sizing: border-box !important;
                        padding: 1mm 0 !important;
                    }

                    .slip-container-long { 
                        border: 1px dashed #64748b !important; 
                        padding: 3mm 4mm !important;
                        height: 198mm !important;
                        max-height: 198mm !important;
                        box-sizing: border-box !important;
                        display: flex !important;
                        flex-direction: column !important;
                        justify-content: space-between !important;
                        gap: 1.5mm !important;
                        overflow: hidden !important;
                        background-color: #ffffff !important;
                    }
                `}
            </style>

            {/* 1. KELOMPOK STANDAR (4 SLIP PER LEMBAR) */}
            {standardChunks.map((chunk, chunkIdx) => (
                <div key={'std-page-' + chunkIdx} className="print-page-standard">
                    {chunk.map((pegawai) => renderSlipContent(pegawai, false))}
                </div>
            ))}

            {/* 2. KELOMPOK TARGET / PANJANG (2 SLIP PER LEMBAR - TINGGI PENUH) */}
            {longChunks.map((chunk, chunkIdx) => (
                <div key={'lng-page-' + chunkIdx} className="print-page-long">
                    {chunk.map((pegawai) => renderSlipContent(pegawai, true))}
                </div>
            ))}
        </div>
    );
}
import React from 'react';

export interface DetailHarian {
    hari_tanggal: string; 
    gaji_kehadiran?: number;
    t_absensi?: number;
    t_kerapian?: number;
    sortir?: number;
    lembur?: number;
    bonus?: number;
    nama_target?: string;
    capaian?: number;
    harga_satuan?: number;
    total_harian: number;
}

export interface RekapGajiLengkap {
    id: string;
    nama: string;
    jabatan: string;
    shift?: string;
    tipe_penggajian: 'Harian' | 'Target' | 'Bulanan';
    periode_tanggal?: string; 
    detail_harian?: DetailHarian[]; 
    status: string; // <-- Menangkap status 'Pending' atau 'Lunas'
    
    // JSON Data
    rincian_bonus: any;
    rincian_potongan: any;
    informasi_tabungan: any;
    
    // Summary
    gaji_dasar: number;
    total_kotor: number; 
    potongan_bon: number;
    denda_sistem: number;
    total_upah: number; 
    sisa_hutang: number;
}

interface SlipGajiTemplateProps {
    data: RekapGajiLengkap[] | any[]; 
    filterValue: string;
}

const formatAngka = (angka: number) => {
    if (!angka) return "0";
    return new Intl.NumberFormat('id-ID').format(Math.round(angka));
};

export default function SlipGajiTemplate({ data, filterValue }: SlipGajiTemplateProps) {
    if (!data || data.length === 0) return null;

    return (
        // Gunakan absolute dan z-index tinggi agar menimpa seluruh aplikasi saat print
        <div className="hidden print:block bg-white text-black font-sans absolute top-0 left-0 w-full z-[99999] m-0 p-0">
            
            {/* =====================================================================
                CSS SAKTI UNTUK MENGATASI BUG CETAK 1 HALAMAN (OVERRIDE PARENT)
                ===================================================================== */}
            <style type="text/css" media="print">
                {`
                    @page { size: A4 portrait; margin: 10mm; }
                    * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                    
                    /* PAKSA SEMUA CONTAINER INDUK UNTUK MEMBUKA OVERFLOW-NYA */
                    html, body, #root, main, .overflow-hidden, .overflow-y-auto, .h-screen {
                        height: auto !important;
                        min-height: auto !important;
                        overflow: visible !important;
                        position: static !important;
                    }

                    .slip-container { break-inside: avoid; page-break-inside: avoid; margin-bottom: 15mm; }
                    .page-break { page-break-after: always; }
                `}
            </style>

            {data.map((pegawai, index) => {
                const isTarget = pegawai.tipe_penggajian === 'Target';
                const rb = pegawai.rincian_bonus || {};
                const rt = pegawai.informasi_tabungan || {};
                
                // Menarik array detail kasbon dari JSON
                const detailKasbon = pegawai.rincian_potongan?.detail_kasbon || [];
                // Cek apakah gaji ini sudah lunas
                const isLunas = pegawai.status === 'Lunas';

                return (
                    <div key={pegawai.id} className={`slip-container w-full max-w-[18cm] mx-auto text-[10px] ${(index + 1) % 2 === 0 ? 'page-break' : ''}`}>
                        
                        {/* 1. HEADER */}
                        <div className="flex justify-between items-start mb-2">
                            <table className="text-left font-semibold text-[11px]">
                                <tbody>
                                    <tr><td className="w-20 pb-0.5">Nama</td><td className="pb-0.5">: {pegawai.nama}</td></tr>
                                    <tr><td className="pb-0.5">Bidang Kerja</td><td className="pb-0.5">: {pegawai.jabatan}</td></tr>
                                    <tr><td className="pb-0.5">Shift</td><td className="pb-0.5">: {pegawai.shift || '-'}</td></tr>
                                    <tr><td className="pb-0.5">Rincian</td><td className="pb-0.5">: Upah Mingguan</td></tr>
                                    <tr><td className="pb-0.5">Tanggal</td><td className="pb-0.5">: {pegawai.periode_tanggal || filterValue}</td></tr>
                                </tbody>
                            </table>
                            <div className="text-center">
                                <h1 className="font-bold text-sm">Perusahaan Krupuk Mie</h1>
                                <h2 className="font-black text-base tracking-wider">" KAS MUDA MUDI "</h2>
                                <p className="mt-1 leading-tight text-[10px]">
                                    Jl. Raya Belakang Yonif 407<br />
                                    Ds. Harjosari Lor RT 28 RW 06<br />
                                    Kec. Adiwerna Kab. Tegal<br />
                                    Telp. 095743404555
                                </p>
                            </div>
                        </div>

                        {/* 2. TABEL UTAMA */}
                        <table className="w-full border-collapse border border-black text-center mb-2">
                            <thead className="border-b border-black bg-gray-100">
                                <tr>
                                    <th className="border-r border-black py-1 w-6">No</th>
                                    <th className="border-r border-black py-1 w-16">Hari</th>
                                    {isTarget ? (
                                        <>
                                            <th className="border-r border-black py-1">PEKERJAAN</th>
                                            <th className="border-r border-black py-1">HARGA</th>
                                            <th className="border-r border-black py-1">CPAIAN</th>
                                        </>
                                    ) : (
                                        <th className="border-r border-black py-1">Gaji</th>
                                    )}
                                    <th className="border-r border-black py-1 w-12">T.Absen</th>
                                    <th className="border-r border-black py-1 w-12">T.Kerapian</th>
                                    <th className="border-r border-black py-1 w-12">Lembur</th>
                                    <th className="py-1 w-20">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pegawai.detail_harian && pegawai.detail_harian.length > 0 ? (
                                    pegawai.detail_harian.map((hari: DetailHarian, idx: number) => (
                                        <tr key={idx} className="border-b border-black">
                                            <td className="border-r border-black py-1">{idx + 1}</td>
                                            <td className="border-r border-black py-1 text-left px-1">{hari.hari_tanggal || '-'}</td>
                                            
                                            {isTarget ? (
                                                <>
                                                    <td className="border-r border-black py-1 uppercase truncate max-w-[100px] px-1">{hari.nama_target || '-'}</td>
                                                    <td className="border-r border-black py-1">{formatAngka(hari.harga_satuan)}</td>
                                                    <td className="border-r border-black py-1 font-bold">{formatAngka(hari.capaian)}</td>
                                                </>
                                            ) : (
                                                <td className="border-r border-black py-1">{formatAngka(hari.gaji_kehadiran)}</td>
                                            )}
                                            
                                            <td className="border-r border-black py-1">{formatAngka(hari.t_absensi)}</td>
                                            <td className="border-r border-black py-1">{formatAngka(hari.t_kerapian)}</td>
                                            <td className="border-r border-black py-1">{formatAngka(hari.lembur)}</td>
                                            <td className="py-1 font-bold text-right px-2">{formatAngka(hari.total_harian)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={isTarget ? 9 : 7} className="py-3 text-gray-500 italic">Data absen belum digenerate</td></tr>
                                )}
                            </tbody>
                        </table>

                        {/* 3. FOOTER */}
                        <div className="flex justify-between items-start text-[11px]">
                            
                            {/* Kiri: Info Tabungan & Hutang */}
                            <table className="border border-black text-left w-60">
                                <tbody>
                                    <tr><td colSpan={2} className="py-1 px-2 border-b border-black bg-gray-100 font-bold text-center">INFORMASI KASBON & TABUNGAN</td></tr>
                                    
                                    {/* TAMPILKAN SISA KASBON DINAMIS HANYA JIKA LUNAS & ADA DATANYA */}
                                    {isLunas && detailKasbon.map((bon: any, i: number) => (
                                        <tr key={'sisa-'+i} className="border-b border-black">
                                            <td className="py-1 px-2 border-r border-black font-semibold text-red-700 leading-tight">
                                                Sisa Bon ({bon.keterangan}):
                                            </td>
                                            <td className="py-1 px-2 text-right font-bold text-red-700 align-middle">
                                                {formatAngka(bon.sisa_pinjaman_terkini)}
                                            </td>
                                        </tr>
                                    ))}

                                    {/* <tr className="border-b border-black">
                                        <td className="py-1 px-2 border-r border-black">Tabungan Mingguan :</td>
                                        <td className="py-1 px-2 text-right align-middle">{formatAngka(rt.tabungan_mingguan_terkumpul)}</td>
                                    </tr> */}
                                    <tr className="border-b border-black">
                                        <td className="py-1 px-2 border-r border-black">Tabungan Lembur :</td>
                                        <td className="py-1 px-2 text-right align-middle">{formatAngka(rt.tabungan_lembur_tahunan_terkumpul)}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-1 px-2 border-r border-black">Tabungan Loyalitas :</td>
                                        <td className="py-1 px-2 text-right align-middle">{formatAngka(rt.tabungan_loyalitas_akumulasi)}</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Kanan: Rincian Akumulasi Gaji */}
                            <table className="text-right w-64 border border-black">
                                <tbody>
                                    <tr className="border-b border-black bg-gray-50">
                                        <td className="py-1 pr-2 font-semibold border-r border-black">Jumlah Gaji Pokok</td>
                                        <td className="py-1 px-2 font-semibold w-24 align-middle">{formatAngka(pegawai.gaji_dasar)}</td>
                                    </tr>
                                    {rb.bonus_kehadiran_mingguan > 0 && (
                                        <tr>
                                            <td className="py-0.5 pr-2 border-r border-black">Bonus Mingguan Full</td>
                                            <td className="py-0.5 px-2 align-middle">{formatAngka(rb.bonus_kehadiran_mingguan)}</td>
                                        </tr>
                                    )}
                                    {rb.uang_lembur_akumulasi > 0 && (
                                        <tr>
                                            <td className="py-0.5 pr-2 border-r border-black">Total Lembur</td>
                                            <td className="py-0.5 px-2 align-middle">{formatAngka(rb.uang_lembur_akumulasi)}</td>
                                        </tr>
                                    )}
                                    {rb.bonus_kedisiplinan_harian > 0 && (
                                        <tr>
                                            <td className="py-0.5 pr-2 border-r border-black">Total T. Absensi</td>
                                            <td className="py-0.5 px-2 align-middle">{formatAngka(rb.bonus_kedisiplinan_harian)}</td>
                                        </tr>
                                    )}
                                    {rb.bonus_kerapian_harian > 0 && (
                                        <tr>
                                            <td className="py-0.5 pr-2 border-r border-black">Total T. Kerapian</td>
                                            <td className="py-0.5 px-2 align-middle">{formatAngka(rb.bonus_kerapian_harian)}</td>
                                        </tr>
                                    )}
                                    
                                    {/* Pembatas Kotor & Potongan */}
                                    <tr><td colSpan={2} className="border-b border-black"></td></tr>
                                    
                                    {/* --- [SUNTIKAN KODE UI BONUS CUSTOM] --- */}
                                    {rb.detail_bonus_custom && rb.detail_bonus_custom.length > 0 && (
                                        <>
                                            <tr><td colSpan={2} className="py-0.5 pr-2 border-r border-black font-semibold text-blue-800 text-left bg-gray-50 pl-1">Pendapatan Lain:</td></tr>
                                            {rb.detail_bonus_custom.map((b_custom: any, i: number) => (
                                                <tr key={'bonus-'+i}>
                                                    <td className="py-0.5 pr-2 italic pl-2 text-left    ">- {b_custom.keterangan}</td>
                                                    <td className="py-0.5 px-2 align-middle">{formatAngka(b_custom.nominal)}</td>
                                                </tr>
                                            ))}
                                        </>
                                    )}
                                    {/* --------------------------------------- */}
                                    
                                    {/* Pembatas Kotor & Potongan */}
                                    <tr><td colSpan={2} className="border-b border-black"></td></tr>

                                    {pegawai.denda_sistem > 0 && (
                                        <tr>
                                            <td className="py-0.5 pr-2 border-r border-black text-red-600">Denda / Telat / Alpha</td>
                                            <td className="py-0.5 px-2 text-red-600 align-middle">-{formatAngka(pegawai.denda_sistem)}</td>
                                        </tr>
                                    )}
                                    
                                    {/* TAMPILKAN POTONGAN BON DINAMIS HANYA JIKA LUNAS & ADA DATANYA */}
                                    {isLunas && detailKasbon.map((bon: any, i: number) => (
                                        <tr key={'potongan-'+i} className="border-b border-black">
                                            <td className="py-0.5 pr-2 border-r border-black text-red-600 leading-tight">
                                                Pot. Bon ({bon.keterangan})
                                            </td>
                                            <td className="py-0.5 px-2 text-red-600 align-middle">
                                                -{formatAngka(bon.nominal_potongan)}
                                            </td>
                                        </tr>
                                    ))}

                                    {/* FINAL TOTAL */}
                                    <tr>
                                        <td className="py-1.5 pr-2 font-black border-r border-black uppercase text-[12px] bg-gray-200">TOTAL UPAH BERSIH</td>
                                        <td className="py-1.5 font-black px-2 bg-gray-200 text-[12px] align-middle">{formatAngka(pegawai.total_upah)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Garis Pemotong Kertas */}
                        <div className="mt-10 mb-2 border-t border-dashed border-gray-400 w-full relative">
                             <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-white px-2 text-[8px] text-gray-400 italic">✂️ Gunting di sini ✂️</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
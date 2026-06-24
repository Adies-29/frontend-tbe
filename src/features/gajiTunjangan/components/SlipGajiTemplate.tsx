

// =========================================================================
// INTERFACE DATA SESUAI FORMAT FOTO FISIK
// =========================================================================
export interface DetailHarian {
    hari_tanggal: string; // cth: "Senin" / "05 Mei"
    // Harian
    gaji_kehadiran?: number;
    t_absensi?: number;
    t_kerapian?: number;
    sortir?: number;
    lembur?: number;
    bonus?: number;
    
    // Target
    nama_target?: string;
    capaian?: number;
    harga_satuan?: number;
    
    total_harian: number;
}

export interface RekapGajiLengkap {
    id: string;
    nama: string;
    jabatan: string; // Bidang Kerja
    shift?: string;
    tipe_penggajian: 'Harian' | 'Target' | 'Bulanan';
    periode_tanggal?: string; 
    
    detail_harian?: DetailHarian[]; 
    
    // Informasi Keuangan Bawah
    total_kotor: number; // Jumlah sebelum potongan
    potongan_bon: number; // Potongan Bon
    bayar_kerupuk?: number; // Bayar Kerupuk / Tabungan
    total_upah: number; // Total Take Home Pay
    
    // Informasi Samping Kiri Bawah
    hutang_awal?: number;
    sisa_hutang?: number;
    bon_kerupuk_info?: number;
}

interface SlipGajiTemplateProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: RekapGajiLengkap[] | any[]; 
    filterValue: string;
}

const formatAngka = (angka: number) => {
    if (!angka) return "0";
    return new Intl.NumberFormat('id-ID').format(angka);
};

export default function SlipGajiTemplate({ data, filterValue }: SlipGajiTemplateProps) {
    if (!data || data.length === 0) return null;

    return (
        // Wrapper disembunyikan di layar, hanya muncul saat diprint
        <div className="hidden print:block w-full bg-white text-black font-sans absolute top-0 left-0 z-[99999]">
            <style type="text/css" media="print">
                {`
                    /* Pengaturan kertas A4 Portrait, kita akan susun 2 slip per halaman (atas-bawah) */
                    @page { size: A4 portrait; margin: 10mm; }
                    * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                    /* Menghindari slip terpotong di tengah kertas */
                    .slip-container { break-inside: avoid; page-break-inside: avoid; margin-bottom: 20mm; }
                `}
            </style>

            {data.map((pegawai) => {
                const isTarget = pegawai.tipe_penggajian === 'Target';

                return (
                    <div key={pegawai.id} className="slip-container w-full max-w-[18cm] mx-auto text-[11px]">
                        
                        {/* ======================================================= */}
                        {/* 1. HEADER (Kiri: Pegawai | Kanan: Perusahaan) */}
                        {/* ======================================================= */}
                        <div className="flex justify-between items-start mb-2">
                            {/* Kiri: Info Pegawai */}
                            <table className="text-left font-semibold">
                                <tbody>
                                    <tr><td className="w-20 pb-0.5">Nama</td><td className="pb-0.5">: {pegawai.nama}</td></tr>
                                    <tr><td className="pb-0.5">Bidang Kerja</td><td className="pb-0.5">: {pegawai.jabatan}</td></tr>
                                    <tr><td className="pb-0.5">Shift</td><td className="pb-0.5">: {pegawai.shift || '-'}</td></tr>
                                    <tr><td className="pb-0.5">Rincian</td><td className="pb-0.5">: Upah Mingguan</td></tr>
                                    <tr><td className="pb-0.5">Tanggal</td><td className="pb-0.5">: {pegawai.periode_tanggal || filterValue}</td></tr>
                                </tbody>
                            </table>

                            {/* Kanan: Info Perusahaan */}
                            <div className="text-center">
                                <h1 className="font-bold text-sm">Perusahaan Krupuk Mie</h1>
                                <h2 className="font-black text-base">" KAS MUDA MUDI "</h2>
                                <p className="mt-1 leading-tight">
                                    Jl. Raya Belakang Yonif 407<br />
                                    Ds. Harjosari Lor RT 28 RW 06<br />
                                    Kec. Adiwerna Kab. Tegal<br />
                                    Telp. 095743404555
                                </p>
                            </div>
                        </div>

                        {/* ======================================================= */}
                        {/* 2. TABEL UTAMA (Harian vs Target) */}
                        {/* ======================================================= */}
                        <table className="w-full border-collapse border border-black text-center mb-2">
                            <thead className="border-b border-black bg-gray-100">
                                {!isTarget ? (
                                    // Header Tipe HARIAN
                                    <tr>
                                        <th className="border-r border-black py-1 w-8">No.</th>
                                        <th className="border-r border-black py-1 w-20">Hari</th>
                                        <th className="border-r border-black py-1">Gaji</th>
                                        <th className="border-r border-black py-1">T. Absensi</th>
                                        <th className="border-r border-black py-1">T. Kerapian</th>
                                        <th className="border-r border-black py-1">Sortir</th>
                                        <th className="border-r border-black py-1">Lembur</th>
                                        <th className="border-r border-black py-1">Bonus</th>
                                        <th className="py-1 w-24">Total</th>
                                    </tr>
                                ) : (
                                    // Header Tipe TARGET (PACKING / DLL)
                                    <tr>
                                        <th className="border-r border-black py-1 w-8">No.</th>
                                        <th className="border-r border-black py-1 w-20">Hari</th>
                                        <th className="border-r border-black py-1">PEKERJAAN</th>
                                        <th className="border-r border-black py-1">HARGA</th>
                                        <th className="border-r border-black py-1">CAPAIAN</th>
                                        <th className="py-1 w-24">Total</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody>
                                {pegawai.detail_harian && pegawai.detail_harian.length > 0 ? (
                                    pegawai.detail_harian.map((hari, idx) => (
                                        <tr key={idx} className="border-b border-black">
                                            <td className="border-r border-black py-1">{idx + 1}</td>
                                            <td className="border-r border-black py-1 text-left px-2">{hari.hari_tanggal}</td>
                                            
                                            {!isTarget ? (
                                                // Baris Tipe HARIAN
                                                <>
                                                    <td className="border-r border-black py-1">{formatAngka(hari.gaji_kehadiran || 0)}</td>
                                                    <td className="border-r border-black py-1">{formatAngka(hari.t_absensi || 0)}</td>
                                                    <td className="border-r border-black py-1">{formatAngka(hari.t_kerapian || 0)}</td>
                                                    <td className="border-r border-black py-1">{formatAngka(hari.sortir || 0)}</td>
                                                    <td className="border-r border-black py-1">{formatAngka(hari.lembur || 0)}</td>
                                                    <td className="border-r border-black py-1">{formatAngka(hari.bonus || 0)}</td>
                                                </>
                                            ) : (
                                                // Baris Tipe TARGET
                                                <>
                                                    <td className="border-r border-black py-1 uppercase">{hari.nama_target || '-'}</td>
                                                    <td className="border-r border-black py-1">{formatAngka(hari.harga_satuan || 0)}</td>
                                                    <td className="border-r border-black py-1">{formatAngka(hari.capaian || 0)}</td>
                                                </>
                                            )}
                                            <td className="py-1 font-semibold text-right px-2">{formatAngka(hari.total_harian)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    // Kosong jika belum ada data harian
                                    <tr><td colSpan={isTarget ? 6 : 9} className="py-4 text-gray-500 italic">Data harian belum tersedia</td></tr>
                                )}
                            </tbody>
                        </table>

                        {/* ======================================================= */}
                        {/* 3. FOOTER (Kiri: Hutang | Kanan: Total Upah) */}
                        {/* ======================================================= */}
                        <div className="flex justify-between items-start">
                            
                            {/* Kiri: Kotak Hutang */}
                            <table className="border border-black text-left w-56">
                                <tbody>
                                    <tr className="border-b border-black">
                                        <td className="py-1 px-2 border-r border-black w-24">Hutang :</td>
                                        <td className="py-1 px-2 text-right">{formatAngka(pegawai.hutang_awal || 0)}</td>
                                    </tr>
                                    <tr className="border-b border-black">
                                        <td className="py-1 px-2 border-r border-black">Sisa Hutang :</td>
                                        <td className="py-1 px-2 text-right">{formatAngka(pegawai.sisa_hutang || 0)}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-1 px-2 border-r border-black">Bon Kerupuk :</td>
                                        <td className="py-1 px-2 text-right">{formatAngka(pegawai.bon_kerupuk_info || 0)}</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Kanan: Kotak Total */}
                            <table className="text-right w-64">
                                <tbody>
                                    <tr>
                                        <td className="py-1 pr-4 font-semibold">Jumlah</td>
                                        <td className="py-1 font-semibold border border-black px-2">{formatAngka(pegawai.total_kotor)}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-1 pr-4">Potongan Bon</td>
                                        <td className="py-1 border border-black px-2">{formatAngka(pegawai.potongan_bon)}</td>
                                    </tr>
                                    {pegawai.bayar_kerupuk !== undefined && (
                                        <tr>
                                            <td className="py-1 pr-4">Bayar Kerupuk</td>
                                            <td className="py-1 border border-black px-2">{formatAngka(pegawai.bayar_kerupuk)}</td>
                                        </tr>
                                    )}
                                    <tr>
                                        <td className="py-1 pr-4 font-bold">Total Upah</td>
                                        <td className="py-1 font-bold border border-black px-2 bg-gray-100">{formatAngka(pegawai.total_upah)}</td>
                                    </tr>
                                </tbody>
                            </table>

                        </div>
                        {/* --- Garis Pemisah Antar Slip (Jika dicetak atas-bawah) --- */}
                        <div className="mt-8 mb-4 border-t-2 border-dashed border-gray-400 w-full"></div>
                    </div>
                );
            })}
        </div>
    );
}
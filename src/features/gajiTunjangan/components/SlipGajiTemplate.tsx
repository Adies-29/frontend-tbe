import { SlipGajiCard, chunkArray, type RekapGajiLengkap } from './ModalPreviewSlipGaji';

interface SlipGajiTemplateProps {
    data: RekapGajiLengkap[] | any[];
    filterValue: string;
}

export default function SlipGajiTemplate({ data, filterValue }: SlipGajiTemplateProps) {
    const dataLunas = data?.filter(
        (pegawai) => pegawai.status === 'Lunas' || pegawai.status?.toLowerCase() === 'lunas'
    ) || [];

    if (!dataLunas || dataLunas.length === 0) return null;

    const isLongSlipRecord = (p: any) => {
        return (p.detail_harian && p.detail_harian.length > 8) || (p.tipe_penggajian === 'Target' && p.detail_harian && p.detail_harian.length > 7);
    };

    const dataStandard = dataLunas.filter(p => !isLongSlipRecord(p));
    const dataLong = dataLunas.filter(p => isLongSlipRecord(p));

    const standardChunks = chunkArray(dataStandard, 4);
    const longChunks = chunkArray(dataLong, 2);

    return (
        <div className="hidden print:block bg-white text-black font-sans absolute top-0 left-0 w-full z-99999 m-0 p-0">
            <style type="text/css" media="print">
                {`
                    @page { 
                        size: A4 landscape; 
                        margin: 4mm 6mm; 
                    }
                    * { 
                        -webkit-print-color-adjust: exact !important; 
                        color-adjust: exact !important; 
                        print-color-adjust: exact !important;
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
                `}
            </style>

            {/* 1. KELOMPOK STANDAR (4 SLIP PER LEMBAR) */}
            {standardChunks.map((chunk, chunkIdx) => (
                <div key={'std-page-' + chunkIdx} className="print-page-standard">
                    {chunk.map((pegawai) => (
                        <SlipGajiCard
                            key={pegawai.id}
                            pegawai={pegawai}
                            filterValue={filterValue}
                            isLong={false}
                        />
                    ))}
                </div>
            ))}

            {/* 2. KELOMPOK TARGET / PANJANG (2 SLIP PER LEMBAR - TINGGI PENUH) */}
            {longChunks.map((chunk, chunkIdx) => (
                <div key={'lng-page-' + chunkIdx} className="print-page-long">
                    {chunk.map((pegawai) => (
                        <SlipGajiCard
                            key={pegawai.id}
                            pegawai={pegawai}
                            filterValue={filterValue}
                            isLong={true}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}
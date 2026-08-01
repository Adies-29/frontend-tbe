import { useState, useMemo, useRef, useCallback } from 'react';
import { X, Search, Printer, FileText, Image as ImageIcon, CheckSquare, Square, ChevronLeft, ChevronRight, Loader2, UserCheck } from 'lucide-react';
import { toPng, toCanvas } from 'html-to-image';
import jsPDF from 'jspdf';
import Button from '../../../components/common/Button';

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
    status: string;
    rincian_bonus: any;
    rincian_potongan: any;
    informasi_tabungan: any;
    gaji_dasar: number;
    total_kotor: number;
    potongan_bon: number;
    denda_sistem: number;
    total_upah: number;
    sisa_hutang: number;
}

interface ModalPreviewSlipGajiProps {
    isOpen: boolean;
    onClose: () => void;
    data: RekapGajiLengkap[] | any[];
    filterValue: string;
    periode?: string;
}

const formatAngka = (angka?: number | null) => {
    if (!angka) return "0";
    return new Intl.NumberFormat('id-ID').format(Math.round(angka));
};

const formatRupiah = (angka?: number | null) => {
    if (!angka) return "Rp0";
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
};

export default function ModalPreviewSlipGaji({
    isOpen,
    onClose,
    data = [],
    filterValue
}: ModalPreviewSlipGajiProps) {
    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'Semua' | 'Lunas' | 'Pending'>('Semua');
    const [tipeFilter, setTipeFilter] = useState<'Semua' | 'Harian' | 'Target' | 'Bulanan'>('Semua');

    // Selected Employee IDs for printing/export
    const [selectedIds, setSelectedIds] = useState<string[]>(() => {
        return data.map(item => String(item.id));
    });

    // Pagination/Active Preview Index
    const [previewIndex, setPreviewIndex] = useState(0);

    // Export Loading States
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [isExportingPng, setIsExportingPng] = useState(false);

    // DOM Reference for PDF/PNG Generation
    const previewContainerRef = useRef<HTMLDivElement>(null);

    // Filtered data based on search, status, and type
    const filteredEmployees = useMemo(() => {
        return data.filter(item => {
            const matchSearch = item.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.jabatan?.toLowerCase().includes(searchQuery.toLowerCase());
            const itemStatus = item.status?.toLowerCase() === 'lunas' ? 'Lunas' : 'Pending';
            const matchStatus = statusFilter === 'Semua' || itemStatus === statusFilter;
            const matchTipe = tipeFilter === 'Semua' || item.tipe_penggajian === tipeFilter;

            return matchSearch && matchStatus && matchTipe;
        });
    }, [data, searchQuery, statusFilter, tipeFilter]);

    // Selected employee items
    const selectedEmployees = useMemo(() => {
        return data.filter(item => selectedIds.includes(String(item.id)));
    }, [data, selectedIds]);

    const isAllSelected = useMemo(() => {
        if (filteredEmployees.length === 0) return false;
        return filteredEmployees.every(item => selectedIds.includes(String(item.id)));
    }, [filteredEmployees, selectedIds]);

    const toggleSelectAll = useCallback(() => {
        const filteredIds = filteredEmployees.map(item => String(item.id));
        if (isAllSelected) {
            setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
        } else {
            setSelectedIds(prev => {
                const next = [...prev];
                filteredIds.forEach(id => {
                    if (!next.includes(id)) next.push(id);
                });
                return next;
            });
        }
    }, [isAllSelected, filteredEmployees]);

    const toggleSelectEmployee = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    if (!isOpen) return null;

    // Helper matching bonus custom to specific day without duplicating on multi-target rows
    const getBonusCustomForHari = (hari: DetailHarian, pegawai: RekapGajiLengkap, idx: number) => {
        if (Number((hari as any).bonus_custom) > 0) {
            return Number((hari as any).bonus_custom);
        }

        const bonusList = pegawai.rincian_bonus?.detail_bonus_custom;
        if (!Array.isArray(bonusList) || bonusList.length === 0) return 0;

        const detailHarian = pegawai.detail_harian || [];
        const hDate = (hari.hari_tanggal || '').toLowerCase();
        const hTanggal = ((hari as any).tanggal || '').toLowerCase();

        const firstIdx = detailHarian.findIndex((h: DetailHarian) => {
            const dateStr = (h.hari_tanggal || '').toLowerCase();
            const tglStr = ((h as any).tanggal || '').toLowerCase();
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

    // Helper matching potongan custom to specific day without duplicating on multi-target rows
    const getPotonganCustomForHari = (hari: DetailHarian, pegawai: RekapGajiLengkap, idx: number) => {
        if (Number((hari as any).potongan_custom) > 0) {
            return Number((hari as any).potongan_custom);
        }

        const potonganList = pegawai.rincian_potongan?.detail_potongan_custom;
        if (!Array.isArray(potonganList) || potonganList.length === 0) return 0;

        const detailHarian = pegawai.detail_harian || [];
        const hDate = (hari.hari_tanggal || '').toLowerCase();
        const hTanggal = ((hari as any).tanggal || '').toLowerCase();

        const firstIdx = detailHarian.findIndex((h: DetailHarian) => {
            const dateStr = (h.hari_tanggal || '').toLowerCase();
            const tglStr = ((h as any).tanggal || '').toLowerCase();
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

    const getGroupedBonusCustom = (pegawai: RekapGajiLengkap) => {
        const list = pegawai.rincian_bonus?.detail_bonus_custom;
        if (!Array.isArray(list) || list.length === 0) return [];

        const groups: { [key: string]: number } = {};
        for (const item of list) {
            const ket = (item.keterangan || 'Bonus Custom').trim();
            groups[ket] = (groups[ket] || 0) + (Number(item.nominal) || 0);
        }
        return Object.entries(groups).map(([keterangan, total]) => ({ keterangan, total }));
    };

    const getGroupedPotonganCustom = (pegawai: RekapGajiLengkap) => {
        const list = pegawai.rincian_potongan?.detail_potongan_custom;
        if (!Array.isArray(list) || list.length === 0) return [];

        const groups: { [key: string]: number } = {};
        for (const item of list) {
            const ket = (item.keterangan || 'Potongan Custom').trim();
            groups[ket] = (groups[ket] || 0) + (Number(item.nominal) || 0);
        }
        return Object.entries(groups).map(([keterangan, total]) => ({ keterangan, total }));
    };

    // Helper to chunk array
    const chunkArray = <T,>(arr: T[], size: number): T[][] => {
        const chunked: T[][] = [];
        for (let i = 0; i < arr.length; i += size) {
            chunked.push(arr.slice(i, i + size));
        }
        return chunked;
    };

    // Handle PDF Export using html-to-image (toCanvas) & jsPDF for ALL selected employees (4 slips per A4 Landscape page in a 2x2 grid)
    const handleExportPdf = async () => {
        if (selectedEmployees.length === 0) return;
        setIsExportingPdf(true);
        try {
            const pdf = new jsPDF('l', 'mm', 'a4');
            const chunks = chunkArray(selectedEmployees, 4);

            for (let c = 0; c < chunks.length; c++) {
                if (c > 0) pdf.addPage();
                const chunk = chunks[c];

                for (let i = 0; i < chunk.length; i++) {
                    const emp = chunk[i];
                    const cardElem = document.getElementById(`offscreen-pdf-card-${emp.id}`);
                    if (!cardElem) continue;

                    const canvas = await toCanvas(cardElem, {
                        backgroundColor: '#ffffff',
                        pixelRatio: 2,
                        cacheBust: true
                    });

                    const imgData = canvas.toDataURL('image/jpeg', 0.95);
                    
                    const col = i % 2;
                    const row = Math.floor(i / 2);
                    
                    const imgX = col === 0 ? 6 : 150;
                    const imgY = row === 0 ? 6 : 106;
                    const renderW = 141;
                    const renderH = 98;

                    pdf.addImage(imgData, 'JPEG', imgX, imgY, renderW, renderH);
                }
            }

            pdf.save(`Slip_Gaji_Massal_${filterValue || 'Periode'}.pdf`);
        } catch (error) {
            console.error("Gagal mengekspor PDF:", error);
        } finally {
            setIsExportingPdf(false);
        }
    };

    // Handle PNG Export using html-to-image (toPng)
    const handleExportPng = async () => {
        if (selectedEmployees.length === 0) return;
        setIsExportingPng(true);
        try {
            const currentPegawai = selectedEmployees[previewIndex] || selectedEmployees[0];
            const cardId = `offscreen-pdf-card-${currentPegawai.id}`;
            const cardElem = document.getElementById(cardId) || previewContainerRef.current;
            if (!cardElem) return;

            const dataUrl = await toPng(cardElem, {
                backgroundColor: '#ffffff',
                pixelRatio: 2,
                cacheBust: true
            });

            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `Slip_Gaji_${currentPegawai.nama || 'Pegawai'}_${filterValue || 'Periode'}.png`;
            link.click();
        } catch (error) {
            console.error("Gagal mengekspor PNG:", error);
        } finally {
            setIsExportingPng(false);
        }
    };

    // Direct Browser Print (Formatted)
    const handleDirectPrint = () => {
        window.print();
    };

    const currentPreviewPegawai = selectedEmployees[previewIndex] || selectedEmployees[0];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[92vh] max-h-212.5 overflow-hidden border border-gray-200 flex flex-col my-auto">

                {/* MODAL HEADER */}
                <div className="bg-white text-slate-800 border-b border-gray-200 px-5 py-4 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div>
                            <h3 className="font-extrabold text-slate-800 text-lg leading-tight">Preview & Cetak Slip Gaji</h3>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                Pilih pegawai, pratinjau tampilan slip gaji, dan ekspor ke PDF, PNG, atau Print.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Tutup Modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* MODAL BODY (2 COLUMNS: LEFT FILTER/CONTROLS, RIGHT LIVE PREVIEW) */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-0">

                    {/* LEFT PANEL: FILTERS & EMPLOYEE SELECTOR (4 COLUMNS) */}
                    <div className="lg:col-span-4 bg-slate-50 border-r border-slate-200 p-4 flex flex-col gap-3.5 h-full overflow-hidden min-h-0">

                        {/* SEARCH INPUT */}
                        <div className="relative shrink-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                            <input
                                type="text"
                                placeholder="Cari nama / jabatan pegawai..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white font-medium shadow-2xs"
                            />
                        </div>

                        {/* FILTER DROPDOWNS */}
                        <div className="grid grid-cols-2 gap-2 shrink-0">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status Gaji</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as 'Semua' | 'Lunas' | 'Pending')}
                                    className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="Semua">Semua Status</option>
                                    <option value="Lunas">Lunas</option>
                                    <option value="Pending">Belum Lunas</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipe Gaji</label>
                                <select
                                    value={tipeFilter}
                                    onChange={(e) => setTipeFilter(e.target.value as 'Semua' | 'Harian' | 'Target' | 'Bulanan')}
                                    className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="Semua">Semua Tipe</option>
                                    <option value="Target">Target</option>
                                    <option value="Harian">Harian</option>
                                    <option value="Bulanan">Bulanan</option>
                                </select>
                            </div>
                        </div>

                        {/* EMPLOYEE LIST HEADER & SELECT ALL BUTTON */}
                        <div className="flex justify-between items-center border-b border-slate-200 pb-2 shrink-0 pt-1">
                            <div className="flex items-center gap-1.5">
                                <UserCheck size={14} className="text-emerald-600" />
                                <span className="text-xs font-bold text-slate-700">Daftar Pegawai</span>
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                                    {selectedIds.length} / {data.length}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={toggleSelectAll}
                                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                                {isAllSelected ? <CheckSquare size={13} /> : <Square size={13} />}
                                {isAllSelected ? 'Batal Semua' : 'Pilih Semua'}
                            </button>
                        </div>

                        {/* EMPLOYEE CHECKLIST AREA */}
                        <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl p-2 divide-y divide-slate-100 bg-white min-h-0 shadow-2xs">
                            {filteredEmployees.length > 0 ? (
                                filteredEmployees.map((pegawai) => {
                                    const pId = String(pegawai.id);
                                    const isChecked = selectedIds.includes(pId);
                                    const isLunas = pegawai.status?.toLowerCase() === 'lunas';

                                    return (
                                        <label
                                            key={pId}
                                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${isChecked ? 'bg-emerald-50/80 border border-emerald-200/60' : 'hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => toggleSelectEmployee(pId)}
                                                    className="w-4 h-4 text-emerald-600 rounded-xs focus:ring-emerald-500 border-slate-300 cursor-pointer"
                                                />
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-xs font-bold text-slate-800 truncate">{pegawai.nama}</span>
                                                    <span className="text-[10px] text-slate-500 truncate">{pegawai.jabatan}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end shrink-0 pl-2">
                                                <span className="text-xs font-extrabold text-slate-800">{formatRupiah(pegawai.total_upah)}</span>
                                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${isLunas
                                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                                    : 'bg-amber-100 text-amber-800 border-amber-200'
                                                    }`}>
                                                    {isLunas ? 'Lunas' : 'Pending'}
                                                </span>
                                            </div>
                                        </label>
                                    );
                                })
                            ) : (
                                <div className="p-8 text-center text-xs text-slate-400 italic">
                                    Pegawai tidak ditemukan dengan filter ini.
                                </div>
                            )}
                        </div>

                        {/* ACTION BUTTONS: EXPORT OPTIONS */}
                        <div className="flex flex-col gap-2 shrink-0 pt-2 border-t border-slate-200">
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    label={isExportingPdf ? "Memproses..." : "Simpan PDF"}
                                    variant="secondary"
                                    icon={isExportingPdf ? <Loader2 className="animate-spin" size={14} /> : <FileText size={14} className="text-rose-600" />}
                                    onClick={handleExportPdf}
                                    disabled={isExportingPdf || selectedEmployees.length === 0}
                                    className="w-full text-xs font-bold py-2 border-slate-300"
                                />

                                <Button
                                    label={isExportingPng ? "Memproses..." : "Unduh PNG"}
                                    variant="secondary"
                                    icon={isExportingPng ? <Loader2 className="animate-spin" size={14} /> : <ImageIcon size={14} className="text-blue-600" />}
                                    onClick={handleExportPng}
                                    disabled={isExportingPng || selectedEmployees.length === 0}
                                    className="w-full text-xs font-bold py-2 border-slate-300"
                                />
                            </div>

                            <Button
                                label={`Cetak (${selectedEmployees.length} Slip)`}
                                variant="success"
                                icon={<Printer size={16} />}
                                onClick={handleDirectPrint}
                                disabled={selectedEmployees.length === 0}
                                className="w-full text-xs font-extrabold py-2.5 shadow-sm"
                            />
                        </div>

                    </div>

                    {/* RIGHT PANEL: LIVE A4 SLIP GAJI PREVIEW (8 COLUMNS) */}
                    <div className="lg:col-span-8 bg-slate-200/70 p-4 sm:p-6 flex flex-col h-full overflow-hidden min-h-0">

                        {/* PREVIEW TOOLBAR / PAGINATION */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex justify-between items-center shrink-0 mb-4">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-extrabold text-slate-800">Pratinjau Lembar Slip Gaji</span>
                                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                    Periode: {filterValue || '-'}
                                </span>
                            </div>

                            {selectedEmployees.length > 1 && (
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPreviewIndex(prev => Math.max(0, prev - 1))}
                                        disabled={previewIndex === 0}
                                        className="p-1 border border-slate-300 rounded-lg bg-white disabled:opacity-40 hover:bg-slate-50 transition-colors cursor-pointer"
                                        title="Slip Sebelumnya"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>

                                    <span className="text-xs font-bold text-slate-700">
                                        {previewIndex + 1} dari {selectedEmployees.length}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => setPreviewIndex(prev => Math.min(selectedEmployees.length - 1, prev + 1))}
                                        disabled={previewIndex >= selectedEmployees.length - 1}
                                        className="p-1 border border-slate-300 rounded-lg bg-white disabled:opacity-40 hover:bg-slate-50 transition-colors cursor-pointer"
                                        title="Slip Berikutnya"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* LIVE PREVIEW CANVAS AREA */}
                        <div className="flex-1 overflow-y-auto flex justify-center p-2 scrollbar-thin">
                            {selectedEmployees.length > 0 && currentPreviewPegawai ? (
                                <div
                                    ref={previewContainerRef}
                                    id={`export-pdf-card-${currentPreviewPegawai.id}`}
                                    className="bg-white border border-slate-300 shadow-xl p-4 sm:p-5 w-full max-w-[21cm] text-[10px] font-sans text-slate-900 rounded-lg space-y-3"
                                >
                                    {/* HEADER SLIP GAJI */}
                                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-2">
                                        <table className="text-left font-semibold text-[10px]">
                                            <tbody>
                                                <tr><td className="w-20 pb-0.5 text-slate-600">Nama Pegawai</td><td className="pb-0.5 font-extrabold text-slate-900">: {currentPreviewPegawai.nama}</td></tr>
                                                <tr><td className="pb-0.5 text-slate-600">Jabatan / Shift</td><td className="pb-0.5 font-bold text-slate-800">: {currentPreviewPegawai.jabatan} {currentPreviewPegawai.shift ? `(${currentPreviewPegawai.shift})` : ''}</td></tr>
                                                <tr><td className="pb-0.5 text-slate-600">Tipe Penggajian</td><td className="pb-0.5 font-bold text-slate-800">: {currentPreviewPegawai.tipe_penggajian}</td></tr>
                                                <tr><td className="pb-0.5 text-slate-600">Periode Tanggal</td><td className="pb-0.5 font-bold text-slate-800">: {currentPreviewPegawai.periode_tanggal || filterValue}</td></tr>
                                            </tbody>
                                        </table>

                                        <div className="text-right">
                                            <h1 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">Perusahaan Krupuk Mie</h1>
                                            <h2 className="font-black text-base text-emerald-700 tracking-widest">" Tiga Berlian Official "</h2>
                                            <p className="mt-0.5 leading-tight text-[9px] text-slate-500 font-medium">
                                                Jl. Raya Belakang Yonif 407 &middot; Ds. Harjosari Lor RT 28 RW 06<br />
                                                Kec. Adiwerna Kab. Tegal &middot; Telp. 095743404555
                                            </p>
                                        </div>
                                    </div>

                                    {/* 1. RINCIAN PRESENSI & UPAH HARIAN (DENGAN 2 KOLOM BARU BONUS & POTONGAN CUSTOM) */}
                                    <div>
                                        <h4 className="font-extrabold text-[10px] text-slate-800 uppercase mb-1 border-b border-slate-300 pb-0.5">
                                            1. Rincian Absensi & Upah Harian
                                        </h4>
                                        <table className="w-full border-collapse border border-slate-900 text-center text-[9px]">
                                            <thead className="border-b border-slate-900 bg-slate-100 font-bold">
                                                <tr>
                                                    <th className="border-r border-slate-900 py-1 w-6">No</th>
                                                    <th className="border-r border-slate-900 py-1 w-20">Hari / Tgl</th>
                                                    {currentPreviewPegawai.tipe_penggajian === 'Target' ? (
                                                        <>
                                                            <th className="border-r border-slate-900 py-1">Pekerjaan Target</th>
                                                            <th className="border-r border-slate-900 py-1 w-14">Harga</th>
                                                            <th className="border-r border-slate-900 py-1 w-12">Capaian</th>
                                                        </>
                                                    ) : (
                                                        <th className="border-r border-slate-900 py-1 w-16">Upah Pokok</th>
                                                    )}
                                                    <th className="border-r border-slate-900 py-1 w-14">T. Disiplin</th>
                                                    <th className="border-r border-slate-900 py-1 w-14">T. Kerapian</th>
                                                    <th className="border-r border-slate-900 py-1 w-14">U. Lembur</th>
                                                    <th className="border-r border-slate-900 py-1 w-16 bg-emerald-50/70 text-emerald-900">Bonus Custom</th>
                                                    <th className="border-r border-slate-900 py-1 w-16 bg-rose-50/70 text-rose-900">Pot. Custom</th>
                                                    <th className="py-1 w-20 text-right px-1.5">Total Harian</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentPreviewPegawai.detail_harian && currentPreviewPegawai.detail_harian.length > 0 ? (
                                                    currentPreviewPegawai.detail_harian.map((hari: DetailHarian, idx: number) => {
                                                        const bCustom = getBonusCustomForHari(hari, currentPreviewPegawai, idx);
                                                        const pCustom = getPotonganCustomForHari(hari, currentPreviewPegawai, idx);

                                                        return (
                                                            <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                                                                <td className="border-r border-slate-900 py-0.5 font-medium text-slate-500">{idx + 1}</td>
                                                                <td className="border-r border-slate-900 py-0.5 text-left px-1.5 font-semibold">{hari.hari_tanggal || '-'}</td>
                                                                {currentPreviewPegawai.tipe_penggajian === 'Target' ? (
                                                                    <>
                                                                        <td className="border-r border-slate-900 py-0.5 text-left px-1.5 italic truncate max-w-30">{hari.nama_target || '-'}</td>
                                                                        <td className="border-r border-slate-900 py-0.5 text-right px-1.5">{formatAngka(hari.harga_satuan)}</td>
                                                                        <td className="border-r border-slate-900 py-0.5 font-bold">{formatAngka(hari.capaian)}</td>
                                                                    </>
                                                                ) : (
                                                                    <td className="border-r border-slate-900 py-0.5 text-right px-1.5">{formatAngka(hari.gaji_kehadiran)}</td>
                                                                )}
                                                                <td className="border-r border-slate-900 py-0.5 text-right px-1.5">{formatAngka(hari.t_absensi)}</td>
                                                                <td className="border-r border-slate-900 py-0.5 text-right px-1.5">{formatAngka(hari.t_kerapian)}</td>
                                                                <td className="border-r border-slate-900 py-0.5 text-right px-1.5">{formatAngka(hari.lembur)}</td>
                                                                <td className="border-r border-slate-900 py-0.5 text-right px-1.5 font-bold text-emerald-700 bg-emerald-50/30">
                                                                    {bCustom > 0 ? `+${formatAngka(bCustom)}` : '-'}
                                                                </td>
                                                                <td className="border-r border-slate-900 py-0.5 text-right px-1.5 font-bold text-rose-600 bg-rose-50/30">
                                                                    {pCustom > 0 ? `-${formatAngka(pCustom)}` : '-'}
                                                                </td>
                                                                <td className="py-0.5 font-extrabold text-right px-1.5 text-slate-900">
                                                                    {formatAngka(
                                                                        (currentPreviewPegawai.tipe_penggajian === 'Target'
                                                                            ? (Number(hari.harga_satuan) || 0) * (Number(hari.capaian) || 0)
                                                                            : (Number(hari.gaji_kehadiran) || 0))
                                                                        + (Number(hari.t_absensi) || 0)
                                                                        + (Number(hari.t_kerapian) || 0)
                                                                        + (Number(hari.lembur) || 0)
                                                                        + bCustom
                                                                        - pCustom
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                ) : (
                                                    <tr><td colSpan={currentPreviewPegawai.tipe_penggajian === 'Target' ? 11 : 9} className="py-3 text-slate-400 italic">Data absensi harian tidak tersedia</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* 2 & 3. RINCIAN AKUMULASI PENDAPATAN & POTONGAN */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* TABUNGAN & KASBON INFO */}
                                        <div className="border border-slate-900 p-2 rounded-md bg-slate-50/50">
                                            <h5 className="font-bold text-[10px] text-slate-800 uppercase mb-1 border-b border-slate-300 pb-0.5">
                                                2. Informasi Kasbon & Tabungan
                                            </h5>
                                            <table className="w-full text-[9px]">
                                                <tbody className="divide-y divide-slate-200">
                                                    {currentPreviewPegawai.rincian_potongan?.detail_kasbon?.map((bon: any, i: number) => (
                                                        <tr key={i}>
                                                            <td className="py-0.5 text-slate-600 font-medium">Sisa Kasbon ({bon.keterangan}):</td>
                                                            <td className="py-0.5 text-right font-bold text-rose-600">{formatRupiah(bon.sisa_pinjaman_terkini)}</td>
                                                        </tr>
                                                    ))}
                                                    <tr>
                                                        <td className="py-0.5 text-slate-600 font-medium">Tabungan Lembur Tahunan:</td>
                                                        <td className="py-0.5 text-right font-bold text-slate-800">{formatRupiah(currentPreviewPegawai.informasi_tabungan?.tabungan_lembur_tahunan_terkumpul)}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="py-0.5 text-slate-600 font-medium">Tabungan Loyalitas:</td>
                                                        <td className="py-0.5 text-right font-bold text-slate-800">{formatRupiah(currentPreviewPegawai.informasi_tabungan?.tabungan_loyalitas_akumulasi)}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* KOMPONEN PENDAPATAN & POTONGAN (HANYA MENAMPILKAN TOTAL HARIAN GAJI) */}
                                        <div className="border border-slate-900 p-2 rounded-md bg-slate-50/50">
                                            <h5 className="font-bold text-[10px] text-slate-800 uppercase mb-1 border-b border-slate-300 pb-0.5">
                                                3. Rincian Komponen Gaji
                                            </h5>
                                            <table className="w-full text-[9px]">
                                                <tbody className="divide-y divide-slate-200">
                                                    <tr>
                                                        <td className="py-0.5 text-slate-600 font-medium">Jumlah Upah Dasar:</td>
                                                        <td className="py-0.5 text-right font-bold text-slate-800">{formatRupiah(currentPreviewPegawai.gaji_dasar)}</td>
                                                    </tr>
                                                    {currentPreviewPegawai.rincian_bonus?.bonus_kehadiran_mingguan > 0 && (
                                                        <tr>
                                                            <td className="py-0.5 text-slate-600 font-medium">Bonus Mingguan Full:</td>
                                                            <td className="py-0.5 text-right font-bold text-emerald-600">+{formatRupiah(currentPreviewPegawai.rincian_bonus?.bonus_kehadiran_mingguan)}</td>
                                                        </tr>
                                                    )}
                                                    {currentPreviewPegawai.rincian_bonus?.uang_lembur_akumulasi > 0 && (
                                                        <tr>
                                                            <td className="py-0.5 text-slate-600 font-medium">Total Lembur:</td>
                                                            <td className="py-0.5 text-right font-bold text-emerald-600">+{formatRupiah(currentPreviewPegawai.rincian_bonus?.uang_lembur_akumulasi)}</td>
                                                        </tr>
                                                    )}
                                                    {getGroupedBonusCustom(currentPreviewPegawai).map((bGroup, i) => (
                                                        <tr key={'bg-' + i}>
                                                            <td className="py-0.5 text-emerald-700 font-semibold italic">Bonus ({bGroup.keterangan}):</td>
                                                            <td className="py-0.5 text-right font-extrabold text-emerald-600">+{formatRupiah(bGroup.total)}</td>
                                                        </tr>
                                                    ))}

                                                    {/* POTONGAN */}
                                                    {currentPreviewPegawai.denda_sistem > 0 && (
                                                        <tr>
                                                            <td className="py-0.5 text-rose-600 font-medium">Denda / Telat / Alpha:</td>
                                                            <td className="py-0.5 text-right font-bold text-rose-600">-{formatRupiah(currentPreviewPegawai.denda_sistem)}</td>
                                                        </tr>
                                                    )}
                                                    {currentPreviewPegawai.rincian_potongan?.detail_kasbon?.map((bon: any, i: number) => (
                                                        <tr key={'bon-' + i}>
                                                            <td className="py-0.5 text-rose-600 font-medium">Pot. Kasbon ({bon.keterangan}):</td>
                                                            <td className="py-0.5 text-right font-bold text-rose-600">-{formatRupiah(bon.nominal_potongan)}</td>
                                                        </tr>
                                                    ))}
                                                    {getGroupedPotonganCustom(currentPreviewPegawai).map((pGroup, i) => (
                                                        <tr key={'pg-' + i}>
                                                            <td className="py-0.5 text-rose-700 font-semibold italic">Pot. Custom ({pGroup.keterangan}):</td>
                                                            <td className="py-0.5 text-right font-extrabold text-rose-600">-{formatRupiah(pGroup.total)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* 4. TOTAL UPAH BERSIH (TAKE-HOME PAY BANNER) */}
                                    <div className=" text-black p-2.5 rounded-lg flex justify-between items-center shadow-xs">
                                        <div>
                                            <span className="text-[9px] uppercase font-bold block tracking-wider">TOTAL UPAH BERSIH (TAKE-HOME PAY)</span>
                                            <span className="text-[10px] font-semibold">Status: <strong className={currentPreviewPegawai.status?.toLowerCase() === 'lunas' ? 'text-emerald-700' : 'text-amber-400'}>{currentPreviewPegawai.status}</strong></span>
                                        </div>
                                        <div className="text-base font-black text-emerald-500">
                                            {formatRupiah(currentPreviewPegawai.total_upah)}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                                    <FileText size={40} className="text-slate-300" />
                                    <p className="font-semibold text-sm">Tidak Ada Slip Gaji Dipilih</p>
                                    <p className="text-xs text-slate-400 max-w-xs text-center">
                                        Silakan centang satu atau beberapa pegawai pada panel di sebelah kiri untuk melihat pratinjau slip gaji.
                                    </p>
                                </div>
                            )}
                        </div>

                    </div>

                </div>

                {/* HIDDEN OFFSCREEN CARDS FOR MULTI-PAGE PDF & PNG EXPORT */}
                <div style={{ position: 'absolute', top: '-99999px', left: '-99999px', opacity: 0, pointerEvents: 'none' }}>
                    {selectedEmployees.map((pegawai) => (
                        <div
                            key={pegawai.id}
                            id={`offscreen-pdf-card-${pegawai.id}`}
                            className="bg-white p-3.5 w-[140mm] h-[97mm] text-[9.5px] font-sans text-slate-900 flex flex-col justify-start gap-1.5 overflow-hidden border border-dashed border-slate-300"
                        >
                            {/* HEADER SLIP GAJI */}
                            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-1">
                                <table className="text-left font-bold text-[9px] leading-tight">
                                    <tbody>
                                        <tr><td className="w-14 pb-0.1 text-slate-500 font-medium">Nama Pegawai</td><td className="pb-0.1 font-extrabold text-slate-900">: {pegawai.nama}</td></tr>
                                        <tr><td className="pb-0.1 text-slate-500 font-medium">Jabatan / Shift</td><td className="pb-0.1 font-bold text-slate-800">: {pegawai.jabatan} {pegawai.shift ? `(${pegawai.shift})` : ''}</td></tr>
                                        <tr><td className="pb-0.1 text-slate-500 font-medium">Tipe Penggajian</td><td className="pb-0.1 font-bold text-slate-800">: {pegawai.tipe_penggajian}</td></tr>
                                        <tr><td className="pb-0.1 text-slate-500 font-medium">Periode Tanggal</td><td className="pb-0.1 font-bold text-slate-800">: {pegawai.periode_tanggal || filterValue}</td></tr>
                                    </tbody>
                                </table>

                                <div className="text-right leading-none">
                                    <h1 className="font-extrabold text-[9px] text-slate-900 uppercase leading-none">Perusahaan Krupuk Mie</h1>
                                    <h2 className="font-black text-[10.5px] text-emerald-800 tracking-wider leading-tight mt-0.5">" Tiga Berlian Official "</h2>
                                    <p className="mt-0.5 leading-tight text-[7px] text-slate-500 font-medium">
                                        Jl. Raya Belakang Yonif 407 &middot; Ds. Harjosari Lor RT 28 RW 06<br />
                                        Kec. Adiwerna Kab. Tegal &middot; Telp. 095743404555
                                    </p>
                                </div>
                            </div>

                            {/* 1. RINCIAN ABSENSI & UPAH HARIAN */}
                            <div>
                                <h4 className="font-extrabold text-[9px] text-slate-800 uppercase mb-0.5 border-b border-slate-350 pb-0.2">
                                    1. Rincian Absensi & Upah Harian
                                </h4>
                                <table className="w-full border-collapse border border-slate-900 text-center text-[9.5px] leading-tight">
                                    <thead className="border-b border-slate-900 bg-slate-100 font-bold">
                                        <tr>
                                            <th className="border-r border-slate-900 py-0.5 w-5">No</th>
                                            <th className="border-r border-slate-900 py-0.5 w-16">Hari / Tgl</th>
                                            {pegawai.tipe_penggajian === 'Target' ? (
                                                <>
                                                    <th className="border-r border-slate-900 py-0.5">Pekerjaan Target</th>
                                                    <th className="border-r border-slate-900 py-0.5 w-12">Harga</th>
                                                    <th className="border-r border-slate-900 py-0.5 w-10">Capaian</th>
                                                </>
                                            ) : (
                                                <th className="border-r border-slate-900 py-0.5 w-14">Upah Pokok</th>
                                            )}
                                            <th className="border-r border-slate-900 py-0.5 w-10">T. Disiplin</th>
                                            <th className="border-r border-slate-900 py-0.5 w-10">T. Kerapian</th>
                                            <th className="border-r border-slate-900 py-0.5 w-10">U. Lembur</th>
                                            <th className="border-r border-slate-900 py-0.5 w-14 bg-emerald-50/70 text-emerald-900">Bonus Custom</th>
                                            <th className="border-r border-slate-900 py-0.5 w-14 bg-rose-50/70 text-rose-900">Pot. Custom</th>
                                            <th className="py-0.5 w-16 text-right px-1.5">Total Harian</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pegawai.detail_harian && pegawai.detail_harian.length > 0 ? (
                                            pegawai.detail_harian.map((hari: DetailHarian, idx: number) => {
                                                const bCustom = getBonusCustomForHari(hari, pegawai, idx);
                                                const pCustom = getPotonganCustomForHari(hari, pegawai, idx);

                                                return (
                                                    <tr key={idx} className="border-b border-slate-200">
                                                        <td className="border-r border-slate-900 py-0.2 font-medium text-slate-500">{idx + 1}</td>
                                                        <td className="border-r border-slate-900 py-0.2 text-left px-1 font-semibold">{hari.hari_tanggal || '-'}</td>
                                                        {pegawai.tipe_penggajian === 'Target' ? (
                                                            <>
                                                                <td className="border-r border-slate-900 py-0.2 text-left px-1 italic truncate max-w-20">{hari.nama_target || '-'}</td>
                                                                <td className="border-r border-slate-900 py-0.2 text-right px-1 font-semibold">{formatAngka(hari.harga_satuan)}</td>
                                                                <td className="border-r border-slate-900 py-0.2 font-bold">{formatAngka(hari.capaian)}</td>
                                                            </>
                                                        ) : (
                                                            <td className="border-r border-slate-900 py-0.2 text-right px-1 font-semibold">{formatAngka(hari.gaji_kehadiran)}</td>
                                                        )}
                                                        <td className="border-r border-slate-900 py-0.2 text-right px-1 font-semibold">{formatAngka(hari.t_absensi)}</td>
                                                        <td className="border-r border-slate-900 py-0.2 text-right px-1 font-semibold">{formatAngka(hari.t_kerapian)}</td>
                                                        <td className="border-r border-slate-900 py-0.2 text-right px-1 font-semibold">{formatAngka(hari.lembur)}</td>
                                                        <td className="border-r border-slate-900 py-0.2 text-right px-1 font-bold text-emerald-700 bg-emerald-50/30">
                                                            {bCustom > 0 ? `+${formatAngka(bCustom)}` : '-'}
                                                        </td>
                                                        <td className="border-r border-slate-900 py-0.2 text-right px-1 font-bold text-rose-600 bg-rose-50/30">
                                                            {pCustom > 0 ? `-${formatAngka(pCustom)}` : '-'}
                                                        </td>
                                                        <td className="py-0.2 font-extrabold text-right px-1.5 text-slate-900">
                                                            {formatAngka(
                                                                (pegawai.tipe_penggajian === 'Target'
                                                                    ? (Number(hari.harga_satuan) || 0) * (Number(hari.capaian) || 0)
                                                                    : (Number(hari.gaji_kehadiran) || 0))
                                                                + (Number(hari.t_absensi) || 0)
                                                                + (Number(hari.t_kerapian) || 0)
                                                                + (Number(hari.lembur) || 0)
                                                                + bCustom
                                                                - pCustom
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr><td colSpan={pegawai.tipe_penggajian === 'Target' ? 11 : 9} className="py-2 text-slate-400 italic">Data absensi harian tidak tersedia</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* 2 & 3. RINCIAN AKUMULASI PENDAPATAN & POTONGAN */}
                            <div className="grid grid-cols-2 gap-3 leading-tight">
                                <div className="border border-slate-900 p-1.5 rounded-md bg-slate-50/50">
                                    <h5 className="font-bold text-[9px] text-slate-800 uppercase mb-0.5 border-b border-slate-300 pb-0.2">
                                        2. Informasi Kasbon & Tabungan
                                    </h5>
                                    <table className="w-full text-[9.5px]">
                                        <tbody className="divide-y divide-slate-200">
                                            {pegawai.rincian_potongan?.detail_kasbon?.map((bon: any, i: number) => (
                                                <tr key={i}>
                                                    <td className="py-0.2 text-slate-650 font-medium">Sisa Kasbon ({bon.keterangan}):</td>
                                                    <td className="py-0.2 text-right font-bold text-rose-600">{formatRupiah(bon.sisa_pinjaman_terkini)}</td>
                                                </tr>
                                            ))}
                                            <tr>
                                                <td className="py-0.2 text-slate-650 font-medium">Tabungan Lembur Tahunan:</td>
                                                <td className="py-0.2 text-right font-bold text-slate-800">{formatRupiah(pegawai.informasi_tabungan?.tabungan_lembur_tahunan_terkumpul)}</td>
                                            </tr>
                                            <tr>
                                                <td className="py-0.2 text-slate-650 font-medium">Tabungan Loyalitas:</td>
                                                <td className="py-0.2 text-right font-bold text-slate-800">{formatRupiah(pegawai.informasi_tabungan?.tabungan_loyalitas_akumulasi)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div className="border border-slate-900 p-1.5 rounded-md bg-slate-50/50">
                                    <h5 className="font-bold text-[9px] text-slate-800 uppercase mb-0.5 border-b border-slate-300 pb-0.2">
                                        3. Rincian Komponen Gaji
                                    </h5>
                                    <table className="w-full text-[9.5px]">
                                        <tbody className="divide-y divide-slate-200">
                                            <tr>
                                                <td className="py-0.2 text-slate-650 font-medium">Jumlah Gaji Pokok:</td>
                                                <td className="py-0.2 text-right font-bold text-slate-800">{formatRupiah(pegawai.gaji_dasar)}</td>
                                            </tr>
                                            {pegawai.rincian_bonus?.bonus_kehadiran_mingguan > 0 && (
                                                <tr>
                                                    <td className="py-0.2 text-slate-650 font-medium">Bonus Mingguan Full:</td>
                                                    <td className="py-0.2 text-right font-bold text-emerald-600">+{formatRupiah(pegawai.rincian_bonus?.bonus_kehadiran_mingguan)}</td>
                                                </tr>
                                            )}
                                            {pegawai.rincian_bonus?.uang_lembur_akumulasi > 0 && (
                                                <tr>
                                                    <td className="py-0.2 text-slate-650 font-medium">Total Lembur:</td>
                                                    <td className="py-0.2 text-right font-bold text-emerald-600">+{formatRupiah(pegawai.rincian_bonus?.uang_lembur_akumulasi)}</td>
                                                </tr>
                                            )}
                                            {getGroupedBonusCustom(pegawai).map((bGroup, i) => (
                                                <tr key={'bg-' + i}>
                                                    <td className="py-0.2 text-emerald-700 font-semibold italic">Bonus ({bGroup.keterangan}):</td>
                                                    <td className="py-0.2 text-right font-extrabold text-emerald-600">+{formatRupiah(bGroup.total)}</td>
                                                </tr>
                                            ))}

                                            {pegawai.denda_sistem > 0 && (
                                                <tr>
                                                    <td className="py-0.2 text-rose-650 font-medium">Denda / Telat / Alpha:</td>
                                                    <td className="py-0.2 text-right font-bold text-rose-600">-{formatRupiah(pegawai.denda_sistem)}</td>
                                                </tr>
                                            )}
                                            {pegawai.rincian_potongan?.detail_kasbon?.map((bon: any, i: number) => (
                                                <tr key={'bon-' + i}>
                                                    <td className="py-0.2 text-rose-650 font-medium">Pot. Kasbon ({bon.keterangan}):</td>
                                                    <td className="py-0.2 text-right font-bold text-rose-600">-{formatRupiah(bon.nominal_potongan)}</td>
                                                </tr>
                                            ))}
                                            {getGroupedPotonganCustom(pegawai).map((pGroup, i) => (
                                                <tr key={'pg-' + i}>
                                                    <td className="py-0.2 text-rose-750 font-semibold italic">Pot. Custom ({pGroup.keterangan}):</td>
                                                    <td className="py-0.2 text-right font-extrabold text-rose-600">-{formatRupiah(pGroup.total)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* 4. TOTAL UPAH BERSIH */}
                            <div className="bg-slate-900 text-white p-1.5 rounded-lg flex justify-between items-center shadow-xs shrink-0">
                                <div>
                                    <span className="text-[8px] uppercase font-bold text-slate-400 block tracking-wider leading-none">TOTAL UPAH BERSIH</span>
                                    <span className="text-[8px] text-slate-300 font-semibold mt-0.5 leading-none">Status: <strong className={pegawai.status?.toLowerCase() === 'lunas' ? 'text-emerald-400' : 'text-amber-400'}>{pegawai.status}</strong></span>
                                </div>
                                <div className="text-[12.5px] font-black text-emerald-400 leading-none">
                                    {formatRupiah(pegawai.total_upah)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}

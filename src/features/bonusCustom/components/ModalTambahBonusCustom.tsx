import React, { useState, useMemo, useEffect } from 'react';
import { X, PlusCircle, Search, Gift, Calendar } from 'lucide-react';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/InputText';
import CustomDateRangePickerModal from '../../jadwalShift/components/CustomDateRangePickerModal';

interface ModalTambahBonusCustomProps {
    isOpen: boolean;
    onClose: () => void;
    listPegawai: any[];
    isCreating: boolean;
    onSubmit: (
        data: {
            pegawai_ids: string[];
            tanggal_diberikan?: string;
            tanggals?: string[];
            keterangan: string;
            nominal: number;
        },
        callbacks: { onSuccess: () => void }
    ) => void;
}

const MONTH_SHORT_NAMES_ID = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return dateStr;
    return `${d} ${MONTH_SHORT_NAMES_ID[m - 1]} ${y}`;
};

const getDaysCount = (start: string, end: string) => {
    if (!start || !end) return 1;
    const d1 = new Date(start + 'T00:00:00Z');
    const d2 = new Date(end + 'T00:00:00Z');
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

const generateDatesInRange = (start: string, end: string): string[] => {
    if (!start || !end) return start ? [start] : [];
    const result: string[] = [];
    const current = new Date(start + 'T00:00:00Z');
    const stop = new Date(end + 'T00:00:00Z');
    while (current <= stop) {
        result.push(current.toISOString().split('T')[0]);
        current.setUTCDate(current.getUTCDate() + 1);
    }
    return result;
};

export default function ModalTambahBonusCustom({
    isOpen,
    onClose,
    listPegawai,
    isCreating,
    onSubmit
}: ModalTambahBonusCustomProps) {
    // Form State
    const [selectedPegawaiIds, setSelectedPegawaiIds] = useState<string[]>([]);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [keterangan, setKeterangan] = useState<string>('');
    const [nominal, setNominal] = useState<string>('');

    // Modal Date Picker State
    const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);

    // Form Search & Filter States
    const [formFilterDept, setFormFilterDept] = useState<string>('');
    const [formFilterJabatan, setFormFilterJabatan] = useState<string>('');
    const [formSearchQuery, setFormSearchQuery] = useState<string>('');

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            const todayStr = new Date().toLocaleDateString('en-CA');
            setSelectedPegawaiIds([]);
            setStartDate(todayStr);
            setEndDate(todayStr);
            setKeterangan('');
            setNominal('');
            setFormFilterDept('');
            setFormFilterJabatan('');
            setFormSearchQuery('');
            setIsDatePickerOpen(false);
        }
    }, [isOpen]);

    // Derived states for Form Checklist
    const formUniqueDepts = useMemo(() => {
        const depts: string[] = listPegawai
            .map((p: any) => p.jabatan?.departemen?.nama_departemen)
            .filter((dept: string | undefined): dept is string => !!dept);
        return Array.from(new Set(depts));
    }, [listPegawai]);

    const formUniqueJabs = useMemo(() => {
        const jabs: string[] = listPegawai
            .filter((p: any) => !formFilterDept || p.jabatan?.departemen?.nama_departemen === formFilterDept)
            .map((p: any) => p.jabatan?.nama_jabatan)
            .filter((jab: string | undefined): jab is string => !!jab);
        return Array.from(new Set(jabs));
    }, [listPegawai, formFilterDept]);

    const formFilteredPegawai = useMemo(() => {
        return listPegawai.filter((p: any) => {
            const matchSearch = p.nama.toLowerCase().includes(formSearchQuery.toLowerCase());
            const matchDept = !formFilterDept || p.jabatan?.departemen?.nama_departemen === formFilterDept;
            const matchJab = !formFilterJabatan || p.jabatan?.nama_jabatan === formFilterJabatan;
            return matchSearch && matchDept && matchJab;
        });
    }, [listPegawai, formSearchQuery, formFilterDept, formFilterJabatan]);

    const isAllFilteredSelected = useMemo(() => {
        return formFilteredPegawai.length > 0 && formFilteredPegawai.every((p: any) => selectedPegawaiIds.includes(String(p.id)));
    }, [formFilteredPegawai, selectedPegawaiIds]);

    const handleToggleSelectAllFiltered = () => {
        const filteredIds = formFilteredPegawai.map((p: any) => String(p.id));
        if (isAllFilteredSelected) {
            setSelectedPegawaiIds(prev => prev.filter(id => !filteredIds.includes(id)));
        } else {
            setSelectedPegawaiIds(prev => {
                const next = [...prev];
                filteredIds.forEach((id: string) => {
                    if (!next.includes(id)) next.push(id);
                });
                return next;
            });
        }
    };

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedPegawaiIds.length === 0 || !startDate || !endDate || !keterangan || !nominal) return;

        const allDates = generateDatesInRange(startDate, endDate);

        onSubmit(
            {
                pegawai_ids: selectedPegawaiIds,
                tanggals: allDates,
                tanggal_diberikan: startDate,
                keterangan: keterangan,
                nominal: Number(nominal)
            },
            {
                onSuccess: () => {
                    onClose();
                }
            }
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl lg:max-w-5xl h-[82vh] max-h-[700px] min-h-[560px] overflow-hidden border border-gray-200 animate-in zoom-in-95 my-auto flex flex-col">

                {/* MODAL HEADER */}
                <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-yellow-100 text-yellow-700 rounded-xl">
                            <Gift size={20} />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-gray-800 text-lg">Buat Bonus Baru</h3>
                            <p className="text-xs text-gray-500 font-semibold mt-0.5">
                                Tambahkan bonus/reward custom ke satu atau beberapa pegawai sekaligus
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                        title="Tutup Modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* FORM BODY GRID (2 COLUMNS) */}
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-5 flex-1 min-h-0 overflow-hidden">

                        {/* LEFT COLUMN: PENGATURAN BONUS */}
                        <div className="md:col-span-5 flex flex-col gap-4 bg-gray-50/70 p-4 rounded-xl border border-gray-200 h-full overflow-y-auto">
                            <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wide border-b border-gray-200 pb-2">
                                1. Pengaturan Bonus
                            </h4>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Rentang Tanggal Diberikan
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setIsDatePickerOpen(true)}
                                    className="w-full flex items-center justify-between border border-gray-300 hover:border-blue-500 rounded-xl px-3 py-2.5 bg-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-2 text-gray-800 truncate">
                                        <Calendar size={16} className="text-blue-600 shrink-0" />
                                        <span className="truncate">
                                            {startDate && endDate
                                                ? startDate === endDate
                                                    ? formatDateIndo(startDate)
                                                    : `${formatDateIndo(startDate)} - ${formatDateIndo(endDate)}`
                                                : 'Pilih Rentang Tanggal'}
                                        </span>
                                    </div>
                                    {startDate && endDate && (
                                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 shrink-0 ml-1">
                                            {getDaysCount(startDate, endDate)} Hari
                                        </span>
                                    )}
                                </button>
                            </div>

                            <Input
                                label="Keterangan / Nama Bonus"
                                type="text"
                                placeholder="Cth: Reward Teladan, Ganti Bensin"
                                value={keterangan}
                                onChange={(e) => setKeterangan(e.target.value)}
                                required
                            />

                            <Input
                                label="Nominal Bonus (Rp)"
                                type="number"
                                placeholder="Cth: 50000"
                                value={nominal}
                                onChange={(e) => setNominal(e.target.value)}
                                min="1"
                                required
                                helperText={
                                    nominal && Number(nominal) > 0 ? (
                                        <span className="text-xs font-extrabold text-emerald-600 animate-in fade-in duration-200">
                                            Preview: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(nominal))}
                                        </span>
                                    ) : undefined
                                }
                            />

                            <p className="text-[11px] text-gray-400 font-medium mt-auto border-t border-gray-200 pt-3">
                                * Penentu bonus masuk ke periode rekapitulasi gaji pegawai pada rentang tanggal yang dipilih.
                            </p>
                        </div>

                        {/* RIGHT COLUMN: PILIH KARYAWAN PENERIMA */}
                        <div className="md:col-span-7 flex flex-col gap-3 h-full min-h-0 bg-gray-50/70 p-4 rounded-xl border border-gray-200">
                            <div className="flex items-center justify-between pb-1 border-b border-gray-200 shrink-0">
                                <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wide">
                                    2. Pilih Pegawai Penerima
                                </h4>
                                <span className="text-xs font-extrabold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-md border border-green-200">
                                    Terpilih: {selectedPegawaiIds.length} Pegawai
                                </span>
                            </div>

                            {/* FILTERS & SEARCH */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 shrink-0">
                                <select
                                    value={formFilterDept}
                                    onChange={(e) => {
                                        setFormFilterDept(e.target.value);
                                        setFormFilterJabatan('');
                                    }}
                                    className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none text-xs shadow-2xs font-medium"
                                >
                                    <option value="">Semua Departemen</option>
                                    {formUniqueDepts.map((dept, idx) => (
                                        <option key={idx} value={dept}>{dept}</option>
                                    ))}
                                </select>

                                <select
                                    value={formFilterJabatan}
                                    onChange={(e) => setFormFilterJabatan(e.target.value)}
                                    disabled={!formFilterDept}
                                    className={`w-full border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none text-xs shadow-2xs font-medium ${!formFilterDept ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'}`}
                                >
                                    <option value="">Semua Jabatan</option>
                                    {formUniqueJabs.map((jab, idx) => (
                                        <option key={idx} value={jab}>{jab}</option>
                                    ))}
                                </select>

                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                    <input
                                        type="text"
                                        placeholder="Cari Pegawai..."
                                        value={formSearchQuery}
                                        onChange={(e) => setFormSearchQuery(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg pl-8 pr-2.5 py-1.5 focus:outline-none text-xs bg-white shadow-2xs"
                                    />
                                </div>
                            </div>

                            {/* CHECKLIST BOX */}
                            <div className="border border-gray-300 rounded-xl p-2 bg-white flex flex-col gap-1 w-full flex-1 overflow-y-auto custom-scrollbar shadow-2xs min-h-0">
                                {formFilteredPegawai.map((p: any) => {
                                    const isChecked = selectedPegawaiIds.includes(String(p.id));
                                    return (
                                        <label key={p.id} className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer hover:bg-blue-50/60 p-2 rounded-lg transition-colors border border-transparent hover:border-blue-100 select-none">
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedPegawaiIds(prev => [...prev, String(p.id)]);
                                                    } else {
                                                        setSelectedPegawaiIds(prev => prev.filter(id => id !== String(p.id)));
                                                    }
                                                }}
                                                className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                                            />
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-800">{p.nama}</span>
                                                <span className="text-[10px] text-gray-400 mt-0.5 font-medium">
                                                    {p.jabatan?.departemen?.nama_departemen || "-"} &middot; {p.jabatan?.nama_jabatan || "Pegawai"}
                                                </span>
                                            </div>
                                        </label>
                                    );
                                })}
                                {formFilteredPegawai.length === 0 && (
                                    <span className="text-xs text-gray-400 italic text-center my-auto py-8">Pegawai tidak ditemukan.</span>
                                )}
                            </div>

                            {/* QUICK SELECT BUTTON */}
                            <div className="flex flex-wrap gap-2 justify-between items-center w-full shrink-0 pt-1">
                                <Button
                                    type="button"
                                    onClick={handleToggleSelectAllFiltered}
                                    disabled={formFilteredPegawai.length === 0}
                                    label={isAllFilteredSelected ? "Batal Pilih Terfilter" : "Pilih Semua Terfilter"}
                                    variant={isAllFilteredSelected ? "danger" : "info"}
                                    className="px-2 py-1 text-[8px] font-bold rounded-lg shadow-2xs cursor-pointer"
                                />
                            </div>
                        </div>

                    </div>

                    {/* MODAL FOOTER */}
                    <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end items-center gap-3 shrink-0">
                        <Button
                            type="button"
                            variant="secondary"
                            label="Batal"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold"
                        />
                        <Button
                            type="submit"
                            label={isCreating ? "Menyimpan..." : "Simpan Bonus"}
                            variant="success"
                            isLoading={isCreating}
                            icon={<PlusCircle size={16} />}
                            disabled={isCreating || selectedPegawaiIds.length === 0}
                            className="px-5 py-2 text-xs font-bold shadow-md cursor-pointer"
                        />
                    </div>
                </form>

            </div>

            {/* MODAL DATE RANGE PICKER (CALENDAR) */}
            <CustomDateRangePickerModal
                isOpen={isDatePickerOpen}
                onClose={() => setIsDatePickerOpen(false)}
                startDate={startDate}
                endDate={endDate}
                title="Pilih Rentang Tanggal Bonus"
                onApply={(start, end) => {
                    setStartDate(start);
                    setEndDate(end);
                }}
            />
        </div>
    );
}
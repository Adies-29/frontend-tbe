import React, { useState, useMemo, useEffect } from 'react';
import { X, PlusCircle, Search, Scissors, Calendar } from 'lucide-react';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/InputText';
import CustomDateRangePickerModal from '../../jadwalShift/components/CustomDateRangePickerModal';

interface ModalTambahPotonganCustomProps {
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

export default function ModalTambahPotonganCustom({
    isOpen,
    onClose,
    listPegawai,
    isCreating,
    onSubmit
}: ModalTambahPotonganCustomProps) {
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
            const todayStr = new Date().toISOString().split('T')[0];
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
                        <div className="p-2 bg-red-100 text-red-700 rounded-xl">
                            <Scissors size={20} />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-gray-800 text-lg">Buat Potongan Baru</h3>
                            <p className="text-xs text-gray-500 font-semibold mt-0.5">
                                Tambahkan pemotongan gaji khusus ke satu atau beberapa pegawai sekaligus
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
                        
                        {/* LEFT COLUMN: PENGATURAN POTONGAN */}
                        <div className="md:col-span-5 flex flex-col gap-4 bg-gray-50/70 p-4 rounded-xl border border-gray-200 h-full overflow-y-auto">
                            <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wide border-b border-gray-200 pb-2">
                                1. Pengaturan Potongan
                            </h4>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Rentang Tanggal Diberikan
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setIsDatePickerOpen(true)}
                                    className="w-full flex items-center justify-between border border-gray-300 hover:border-red-500 rounded-xl px-3 py-2.5 bg-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-2 text-gray-800 truncate">
                                        <Calendar size={16} className="text-red-600 shrink-0" />
                                        <span className="truncate">
                                            {startDate && endDate
                                                ? startDate === endDate
                                                    ? formatDateIndo(startDate)
                                                    : `${formatDateIndo(startDate)} - ${formatDateIndo(endDate)}`
                                                : 'Pilih Rentang Tanggal'}
                                        </span>
                                    </div>
                                    {startDate && endDate && (
                                        <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200 shrink-0 ml-1">
                                            {getDaysCount(startDate, endDate)} Hari
                                        </span>
                                    )}
                                </button>
                            </div>

                            <Input
                                label="Keterangan / Alasan Potongan"
                                type="text"
                                placeholder="Cth: Potongan Kerusakan Alat, Denda Seragam"
                                value={keterangan}
                                onChange={(e) => setKeterangan(e.target.value)}
                                required
                            />

                            <Input
                                label="Nominal Potongan (Rp)"
                                type="number"
                                placeholder="Cth: 50000"
                                value={nominal}
                                onChange={(e) => setNominal(e.target.value)}
                                min="1"
                                required
                                helperText={
                                    nominal && Number(nominal) > 0 ? (
                                        <span className="text-xs font-extrabold text-red-600 animate-in fade-in duration-200">
                                            Preview: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(nominal))}
                                        </span>
                                    ) : undefined
                                }
                            />
                        </div>

                        {/* RIGHT COLUMN: PILIH PEGAWAI (MULTI-SELECT) */}
                        <div className="md:col-span-7 flex flex-col bg-white p-4 rounded-xl border border-gray-200 h-full overflow-hidden min-h-0">
                            <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-3 shrink-0">
                                <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wide">
                                    2. Pilih Pegawai Penerima ({selectedPegawaiIds.length} Dipilih)
                                </h4>

                                <button
                                    type="button"
                                    onClick={handleToggleSelectAllFiltered}
                                    className="text-xs font-bold text-red-600 hover:text-red-800 transition-colors"
                                >
                                    {isAllFilteredSelected ? 'Batal Pilih Semua' : 'Pilih Semua'}
                                </button>
                            </div>

                            {/* SEARCH & FILTERS FOR PEGAWAI LIST */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3 shrink-0">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                                    <input
                                        type="text"
                                        placeholder="Cari pegawai..."
                                        value={formSearchQuery}
                                        onChange={(e) => setFormSearchQuery(e.target.value)}
                                        className="w-full text-xs pl-8 pr-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 focus:outline-none"
                                    />
                                </div>

                                <select
                                    value={formFilterDept}
                                    onChange={(e) => {
                                        setFormFilterDept(e.target.value);
                                        setFormFilterJabatan('');
                                    }}
                                    className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-red-500 focus:outline-none"
                                >
                                    <option value="">Semua Dept</option>
                                    {formUniqueDepts.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>

                                <select
                                    value={formFilterJabatan}
                                    onChange={(e) => setFormFilterJabatan(e.target.value)}
                                    className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-red-500 focus:outline-none"
                                >
                                    <option value="">Semua Jabatan</option>
                                    {formUniqueJabs.map(jab => (
                                        <option key={jab} value={jab}>{jab}</option>
                                    ))}
                                </select>
                            </div>

                            {/* PEGAWAI CHECKLIST LIST CONTAINER */}
                            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-2 divide-y divide-gray-100 min-h-0 bg-gray-50/50">
                                {formFilteredPegawai.length > 0 ? (
                                    formFilteredPegawai.map((pegawai: any) => {
                                        const pId = String(pegawai.id);
                                        const isChecked = selectedPegawaiIds.includes(pId);
                                        return (
                                            <label
                                                key={pId}
                                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                                                    isChecked ? 'bg-red-50/80 border border-red-200/60' : 'hover:bg-gray-100/80'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => {
                                                            setSelectedPegawaiIds(prev =>
                                                                isChecked ? prev.filter(id => id !== pId) : [...prev, pId]
                                                            );
                                                        }}
                                                        className="w-4 h-4 text-red-600 rounded-xs focus:ring-red-500 border-gray-300"
                                                    />
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-800">{pegawai.nama}</p>
                                                        <p className="text-[10px] text-gray-500">
                                                            {pegawai.jabatan?.departemen?.nama_departemen || '-'} • {pegawai.jabatan?.nama_jabatan || '-'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </label>
                                        );
                                    })
                                ) : (
                                    <div className="p-6 text-center text-xs text-gray-400 italic">
                                        Pegawai tidak ditemukan.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* MODAL FOOTER */}
                    <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-between items-center shrink-0">
                        <div className="text-xs font-semibold text-gray-500">
                            {selectedPegawaiIds.length === 0 ? (
                                <span className="text-red-500 font-bold">* Pilih minimal 1 pegawai</span>
                            ) : (
                                <span className="text-emerald-600 font-bold">
                                    Total: {selectedPegawaiIds.length} Pegawai ({getDaysCount(startDate, endDate)} Hari)
                                </span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                label="Batal"
                                variant="secondary"
                                type="button"
                                onClick={onClose}
                                disabled={isCreating}
                            />
                            <Button
                                label={isCreating ? "Menyimpan..." : "Simpan Potongan"}
                                variant="primary"
                                type="submit"
                                icon={<PlusCircle size={16} />}
                                disabled={isCreating || selectedPegawaiIds.length === 0 || !keterangan || !nominal}
                            />
                        </div>
                    </div>
                </form>
            </div>

            {/* CUSTOM DATE RANGE PICKER MODAL */}
            <CustomDateRangePickerModal
                isOpen={isDatePickerOpen}
                onClose={() => setIsDatePickerOpen(false)}
                startDate={startDate}
                endDate={endDate}
                onApply={(start, end) => {
                    setStartDate(start);
                    setEndDate(end);
                    setIsDatePickerOpen(false);
                }}
            />
        </div>
    );
}

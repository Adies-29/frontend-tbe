import React, { useState, useMemo, useEffect } from 'react';
import { X, Target, Search, Users, Calendar, PlusCircle } from 'lucide-react';
import Button from '../../../components/common/Button';
import CustomDateRangePickerModal from '../../jadwalShift/components/CustomDateRangePickerModal';

interface MasterTarget {
    id: number;
    nama_target: string;
    harga_satuan: number;
    is_active: boolean;
}

interface Pegawai {
    id: number;
    nama: string;
    nik?: string;
    jabatan?: { nama_jabatan: string; departemen?: { nama_departemen: string } };
    departemen?: { nama_departemen: string };
}

interface ModalInputPencapaianMassalProps {
    isOpen: boolean;
    onClose: () => void;
    listPegawai: Pegawai[];
    listMasterTargets: MasterTarget[];
    targetJabatanNames: string[];
    isSaving: boolean;
    onSubmit: (
        data: {
            pegawai_ids: number[];
            tanggals: string[];
            master_target_id: number;
            jumlah_pencapaian: number;
        },
        callbacks: { onSuccess: () => void }
    ) => void;
}



const formatDateDisplay = (startStr: string, endStr: string) => {
    if (!startStr && !endStr) return "Pilih Rentang Tanggal...";
    if (startStr && !endStr) return `${startStr} (Pilih tanggal selesai)`;
    if (!startStr && endStr) return `${endStr} (Pilih tanggal mulai)`;
    return `${startStr}  s/d  ${endStr}`;
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

export default function ModalInputPencapaianMassal({
    isOpen,
    onClose,
    listPegawai,
    listMasterTargets,
    targetJabatanNames,
    isSaving,
    onSubmit
}: ModalInputPencapaianMassalProps) {
    // Form States
    const [selectedPegawaiIds, setSelectedPegawaiIds] = useState<number[]>([]);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [selectedTargetId, setSelectedTargetId] = useState<string>('');
    const [jumlahPencapaian, setJumlahPencapaian] = useState<string>('');

    // Modal Date Picker State
    const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);

    // Form Filter & Search States
    const [formFilterDept, setFormFilterDept] = useState<string>('');
    const [formFilterJabatan, setFormFilterJabatan] = useState<string>('');
    const [formSearchQuery, setFormSearchQuery] = useState<string>('');

    // Helper functions for employee target validation
    const getDeptName = (p: any) => p.departemen?.nama_departemen || p.jabatan?.departemen?.nama_departemen || 'Umum';
    const getJabName = (p: any) => p.jabatan?.nama_jabatan || p.jabatan || 'Tanpa Jabatan';

    // Only allow employees with target positions
    const targetPegawaiList = useMemo(() => {
        return listPegawai.filter(p => {
            const jName = getJabName(p);
            return targetJabatanNames.length === 0 || targetJabatanNames.includes(jName);
        });
    }, [listPegawai, targetJabatanNames]);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            const todayStr = new Date().toLocaleDateString('en-CA');
            setSelectedPegawaiIds([]);
            setStartDate(todayStr);
            setEndDate(todayStr);
            setSelectedTargetId(listMasterTargets.length > 0 ? String(listMasterTargets[0].id) : '');
            setJumlahPencapaian('');
            setFormFilterDept('');
            setFormFilterJabatan('');
            setFormSearchQuery('');
            setIsDatePickerOpen(false);
        }
    }, [isOpen, listMasterTargets]);

    // Derived states for checklist
    const formUniqueDepts = useMemo(() => {
        const depts: string[] = targetPegawaiList
            .map(getDeptName)
            .filter((dept): dept is string => !!dept);
        return Array.from(new Set(depts));
    }, [targetPegawaiList]);

    const formUniqueJabs = useMemo(() => {
        const jabs: string[] = targetPegawaiList
            .filter((p: any) => !formFilterDept || getDeptName(p) === formFilterDept)
            .map(getJabName)
            .filter((jab): jab is string => !!jab);
        return Array.from(new Set(jabs));
    }, [targetPegawaiList, formFilterDept]);

    const formFilteredPegawai = useMemo(() => {
        return targetPegawaiList.filter((p: any) => {
            const matchSearch = p.nama.toLowerCase().includes(formSearchQuery.toLowerCase());
            const matchDept = !formFilterDept || getDeptName(p) === formFilterDept;
            const matchJab = !formFilterJabatan || getJabName(p) === formFilterJabatan;
            return matchSearch && matchDept && matchJab;
        });
    }, [targetPegawaiList, formSearchQuery, formFilterDept, formFilterJabatan]);

    const isAllFilteredSelected = useMemo(() => {
        return formFilteredPegawai.length > 0 && formFilteredPegawai.every((p: any) => selectedPegawaiIds.includes(p.id));
    }, [formFilteredPegawai, selectedPegawaiIds]);

    const handleToggleSelectAllFiltered = () => {
        const filteredIds = formFilteredPegawai.map((p: any) => p.id);
        if (isAllFilteredSelected) {
            setSelectedPegawaiIds(prev => prev.filter(id => !filteredIds.includes(id)));
        } else {
            setSelectedPegawaiIds(prev => {
                const next = [...prev];
                filteredIds.forEach((id: number) => {
                    if (!next.includes(id)) next.push(id);
                });
                return next;
            });
        }
    };

    const targetDetailsObj = useMemo(() => {
        if (!selectedTargetId) return null;
        return listMasterTargets.find(t => String(t.id) === selectedTargetId);
    }, [selectedTargetId, listMasterTargets]);

    const nominalPreview = useMemo(() => {
        if (!targetDetailsObj || !jumlahPencapaian) return 0;
        return targetDetailsObj.harga_satuan * parseInt(jumlahPencapaian);
    }, [targetDetailsObj, jumlahPencapaian]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedPegawaiIds.length === 0 || !startDate || !endDate || !selectedTargetId || !jumlahPencapaian) return;

        const allDates = generateDatesInRange(startDate, endDate);

        onSubmit(
            {
                pegawai_ids: selectedPegawaiIds,
                tanggals: allDates,
                master_target_id: parseInt(selectedTargetId),
                jumlah_pencapaian: parseInt(jumlahPencapaian)
            },
            {
                onSuccess: () => {
                    onClose();
                }
            }
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl lg:max-w-5xl h-[82vh] max-h-[700px] min-h-[560px] overflow-hidden border border-gray-200 animate-in zoom-in-95 my-auto flex flex-col">
                
                {/* HEADER MODAL */}
                <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="font-extrabold text-gray-800 text-lg flex items-center gap-2">
                            <Target size={22} className="text-indigo-600" />
                            Buat Pencapaian Target Massal
                        </h3>
                        <p className="text-xs text-gray-500 font-semibold mt-0.5">
                            Catat pencapaian target harian untuk banyak pegawai sekaligus dalam rentang tanggal tertentu
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                        title="Tutup Modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* FORM BODY */}
                <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-hidden flex flex-col justify-between">
                    <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-5 flex-1 min-h-0 overflow-hidden">
                        
                        {/* LEFT COLUMN: PARAMETERS */}
                        <div className="md:col-span-5 h-full min-h-0 flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar">
                            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-4">
                                <h4 className="text-xs font-extrabold text-gray-700 uppercase tracking-wide border-b border-gray-200 pb-2">
                                    1. Parameter Target Massal
                                </h4>

                                {/* DATE RANGE */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                                        Rentang Tanggal
                                    </label>
                                    <div
                                        onClick={() => setIsDatePickerOpen(true)}
                                        className="flex items-center justify-between border border-gray-300 rounded-xl p-3 bg-white hover:border-indigo-500 hover:ring-2 hover:ring-indigo-100 cursor-pointer shadow-2xs transition-all"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <Calendar size={18} className="text-indigo-600 shrink-0" />
                                            <span className="text-sm font-extrabold text-gray-800">
                                                {formatDateDisplay(startDate, endDate)}
                                            </span>
                                        </div>
                                        <span className="text-xs text-indigo-600 font-bold bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors border border-indigo-200">
                                            Pilih Tanggal
                                        </span>
                                    </div>
                                </div>

                                {/* MASTER TARGET SELECTION */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                                        Pilih Item Target
                                    </label>
                                    <select
                                        value={selectedTargetId}
                                        onChange={(e) => setSelectedTargetId(e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-medium shadow-2xs outline-none"
                                        required
                                    >
                                        <option value="">-- Pilih Master Target --</option>
                                        {listMasterTargets.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.nama_target} ({new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(t.harga_satuan)}/pack)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* QUANTITY */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                                        Jumlah Pencapaian (Pack)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="Contoh: 100"
                                        value={jumlahPencapaian}
                                        onChange={(e) => setJumlahPencapaian(e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-medium shadow-2xs outline-none"
                                        required
                                    />
                                </div>

                                {/* PREVIEW ESTIMASI NOMINAL */}
                                {targetDetailsObj && jumlahPencapaian && (
                                    <div className="bg-emerald-50 text-emerald-800 text-xs p-3.5 rounded-xl border border-emerald-200 flex flex-col gap-1">
                                        <div className="flex justify-between items-center font-bold">
                                            <span>Estimasi Upah Target/Hari:</span>
                                            <span className="text-sm text-emerald-700">
                                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(nominalPreview)}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-emerald-600 font-medium">
                                            Harga Satuan: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(targetDetailsObj.harga_satuan)} &times; {jumlahPencapaian} pack
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: PILIH KARYAWAN TARGET */}
                        <div className="md:col-span-7 h-full min-h-0 flex flex-col bg-gray-50/80 p-4 rounded-xl border border-gray-200 gap-3">
                            <div className="flex items-center justify-between pb-1 border-b border-gray-200 shrink-0">
                                <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
                                    <Users size={15} className="text-indigo-600" />
                                    2. Pilih Karyawan Penerima Target
                                </h4>
                                <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                                    Terpilih: {selectedPegawaiIds.length} Pegawai
                                </span>
                            </div>

                            {/* FILTERS & SEARCH */}
                            <div className="flex flex-col gap-2 shrink-0">
                                <div className="grid grid-cols-2 gap-2">
                                    <select
                                        value={formFilterDept}
                                        onChange={(e) => {
                                            setFormFilterDept(e.target.value);
                                            setFormFilterJabatan('');
                                        }}
                                        className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none text-[11px] shadow-2xs font-medium"
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
                                        className={`w-full border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none text-[11px] shadow-2xs font-medium ${!formFilterDept ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'}`}
                                    >
                                        <option value="">Semua Jabatan</option>
                                        {formUniqueJabs.map((jab, idx) => (
                                            <option key={idx} value={jab}>{jab}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                    <input
                                        type="text"
                                        placeholder="Cari nama pegawai..."
                                        value={formSearchQuery}
                                        onChange={(e) => setFormSearchQuery(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg pl-8 pr-2.5 py-1.5 focus:outline-none text-xs bg-white shadow-2xs"
                                    />
                                </div>
                            </div>

                            {/* CHECKLIST BOX */}
                            <div className="border border-gray-300 rounded-xl p-2 bg-white flex flex-col gap-1 w-full flex-1 overflow-y-auto custom-scrollbar shadow-2xs min-h-0">
                                {formFilteredPegawai.map((p) => {
                                    const isChecked = selectedPegawaiIds.includes(p.id);
                                    return (
                                        <label key={p.id} className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer hover:bg-blue-50/60 p-2 rounded-lg transition-colors border border-transparent hover:border-blue-100 select-none">
                                            <input 
                                                type="checkbox" 
                                                checked={isChecked}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedPegawaiIds(prev => [...prev, p.id]);
                                                    } else {
                                                        setSelectedPegawaiIds(prev => prev.filter(id => id !== p.id));
                                                    }
                                                }}
                                                className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                                            />
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-800">{p.nama}</span>
                                                <span className="text-[10px] text-gray-400 mt-0.5 font-medium">
                                                    {getDeptName(p)} &middot; {getJabName(p)}
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
                            <div className="flex flex-wrap gap-2 justify-between items-center w-full shrink-0 pt-0.5">
                                <Button
                                    type="button"
                                    onClick={handleToggleSelectAllFiltered}
                                    disabled={formFilteredPegawai.length === 0}
                                    label={isAllFilteredSelected ? "Batal Pilih Terfilter" : "Pilih Semua Terfilter"}
                                    variant={isAllFilteredSelected ? "danger" : "info"}
                                    className="px-2 py-1 text-[9px] font-bold rounded-lg shadow-2xs cursor-pointer"
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
                            label={isSaving ? "Menyimpan..." : "Simpan Target Massal"} 
                            variant="success" 
                            isLoading={isSaving}
                            icon={<PlusCircle size={16} />} 
                            disabled={isSaving || selectedPegawaiIds.length === 0 || !startDate || !endDate || !selectedTargetId || !jumlahPencapaian}
                            className="px-5 py-2 text-xs font-bold shadow-md cursor-pointer"
                        />
                    </div>
                </form>

            </div>

            {/* DATE RANGE PICKER MODAL */}
            <CustomDateRangePickerModal
                isOpen={isDatePickerOpen}
                onClose={() => setIsDatePickerOpen(false)}
                startDate={startDate}
                endDate={endDate}
                title="Pilih Rentang Tanggal Target"
                onApply={(start, end) => {
                    setStartDate(start);
                    setEndDate(end);
                }}
            />
        </div>
    );
}

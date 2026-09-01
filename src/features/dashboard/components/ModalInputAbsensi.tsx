import React, { useState, useMemo, useEffect } from 'react';
import { X, Clock, Search, Calendar, UserCheck, CheckCircle2, Info, Loader2 } from 'lucide-react';
import Button from '../../../components/common/Button';
import { Input } from '../../../components/common/InputText';
import CustomDateRangePickerModal from '../../jadwalShift/components/CustomDateRangePickerModal';
import { apiFetchJson } from '../../../utils/apiFetch';
import Notif from '../../../components/common/Notif';
import { useNotif } from '../../../hooks/useNotif';

interface ModalInputAbsensiProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface PegawaiOption {
    id: number | string;
    nama: string;
    pin_mesin?: string;
    nik?: string;
    default_shift_id?: number | string | null;
    pola_rotasi_id?: string | null;
    pola_rotasi_shift?: {
        id?: string;
        nama_pola?: string;
    } | null;
    jabatan?: {
        nama_jabatan?: string;
        departemen?: {
            nama_departemen?: string;
        };
    };
    shifts?: {
        id?: number | string;
        kode_shift?: string;
        jam_masuk?: string;
        jam_pulang?: string;
    };
}

interface MasterShiftOption {
    id: number | string;
    kode_shift: string;
    jam_masuk?: string;
    jam_pulang?: string;
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

export default function ModalInputAbsensi({ isOpen, onClose, onSuccess }: ModalInputAbsensiProps) {
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

    // Master Data
    const [pegawaiList, setPegawaiList] = useState<PegawaiOption[]>([]);
    const [masterShifts, setMasterShifts] = useState<MasterShiftOption[]>([]);
    const [jadwalMap, setJadwalMap] = useState<Record<string | number, string>>({});
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State Sisi Kiri
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [jamMasuk, setJamMasuk] = useState<string>('');
    const [jamPulang, setJamPulang] = useState<string>('');
    const [penanggungJawab, setPenanggungJawab] = useState<string>('');
    const [errorPJ, setErrorPJ] = useState<string>('');

    // Modal Date Range Picker State
    const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);

    // Form State Sisi Kanan (Pegawai, Search & Filter)
    const [selectedPegawaiIds, setSelectedPegawaiIds] = useState<string[]>([]);
    const [formFilterDept, setFormFilterDept] = useState<string>('');
    const [formFilterJabatan, setFormFilterJabatan] = useState<string>('');
    const [formFilterShift, setFormFilterShift] = useState<string>('');
    const [formSearchQuery, setFormSearchQuery] = useState<string>('');

    const { notif, showNotif, showErrorNotif, closeNotif } = useNotif();

    // Fetch Pegawai dan Master Shift saat modal dibuka
    useEffect(() => {
        if (isOpen) {
            setStartDate(todayStr);
            setEndDate(todayStr);
            setJamMasuk('');
            setJamPulang('');
            setPenanggungJawab('');
            setErrorPJ('');
            setSelectedPegawaiIds([]);
            setFormFilterDept('');
            setFormFilterJabatan('');
            setFormFilterShift('');
            setFormSearchQuery('');
            setIsDatePickerOpen(false);

            const fetchInitialData = async () => {
                setIsLoadingData(true);
                try {
                    const [pegawaiRes, shiftRes] = await Promise.all([
                        apiFetchJson('/api/v1/pegawai'),
                        apiFetchJson('/api/v1/shifts')
                    ]);
                    setPegawaiList(pegawaiRes.data || []);
                    setMasterShifts(shiftRes.data || []);
                } catch (error) {
                    console.error('Gagal mengambil data:', error);
                } finally {
                    setIsLoadingData(false);
                }
            };
            fetchInitialData();
        }
    }, [isOpen, todayStr]);

    // Fetch Jadwal Shift Aktif berdasarkan tanggal mulai terpilih
    useEffect(() => {
        if (isOpen) {
            const dateToFetch = startDate || todayStr;
            const fetchJadwal = async () => {
                try {
                    const res = await apiFetchJson(`/api/v1/jadwal?start_date=${dateToFetch}&end_date=${dateToFetch}`);
                    const map: Record<string | number, string> = {};
                    (res.data || []).forEach((j: { pegawai_id?: number | string; shifts?: { kode_shift?: string } }) => {
                        if (j.pegawai_id && j.shifts?.kode_shift) {
                            map[j.pegawai_id] = j.shifts.kode_shift;
                        }
                    });
                    setJadwalMap(map);
                } catch (err) {
                    console.warn('Gagal load jadwal shift harian:', err);
                }
            };
            fetchJadwal();
        }
    }, [isOpen, startDate, todayStr]);

    // Helper untuk menentukan Shift Pegawai secara akurat
    const getPegawaiShiftName = (p: PegawaiOption): string => {
        // 1. Cek dari jadwal aktif pada tanggal terpilih
        if (jadwalMap[p.id]) {
            return jadwalMap[p.id];
        }
        // 2. Cek dari relasi shifts
        if (p.shifts?.kode_shift) {
            return p.shifts.kode_shift;
        }
        // 3. Cek dari default_shift_id master shifts
        if (p.default_shift_id) {
            const found = masterShifts.find(s => String(s.id) === String(p.default_shift_id));
            if (found?.kode_shift) return found.kode_shift;
        }
        // 4. Cek dari pola rotasi shift
        if (p.pola_rotasi_shift?.nama_pola) {
            return p.pola_rotasi_shift.nama_pola;
        }
        return '';
    };

    // Unique Departemen untuk Filter
    const formUniqueDepts = useMemo(() => {
        const depts = pegawaiList
            .map(p => p.jabatan?.departemen?.nama_departemen)
            .filter((dept): dept is string => !!dept);
        return Array.from(new Set(depts));
    }, [pegawaiList]);

    // Unique Jabatan untuk Filter
    const formUniqueJabs = useMemo(() => {
        const jabs = pegawaiList
            .filter(p => !formFilterDept || p.jabatan?.departemen?.nama_departemen === formFilterDept)
            .map(p => p.jabatan?.nama_jabatan)
            .filter((jab): jab is string => !!jab);
        return Array.from(new Set(jabs));
    }, [pegawaiList, formFilterDept]);

    // Daftar Semua Shift untuk Filter (dari master shifts + pola rotasi + jadwal harian + pegawai)
    const formUniqueShifts = useMemo(() => {
        const list: string[] = [];
        masterShifts.forEach(s => {
            if (s.kode_shift) list.push(s.kode_shift);
        });
        pegawaiList.forEach(p => {
            if (p.pola_rotasi_shift?.nama_pola) list.push(p.pola_rotasi_shift.nama_pola);
            if (p.shifts?.kode_shift) list.push(p.shifts.kode_shift);
        });
        Object.values(jadwalMap).forEach(sName => {
            if (sName) list.push(sName);
        });
        return Array.from(new Set(list.filter(Boolean)));
    }, [masterShifts, pegawaiList, jadwalMap]);

    // Filtered Pegawai
    const formFilteredPegawai = useMemo(() => {
        return pegawaiList.filter(p => {
            const q = formSearchQuery.toLowerCase().trim();
            const matchSearch = !q ||
                (p.nama && p.nama.toLowerCase().includes(q)) ||
                (p.pin_mesin && p.pin_mesin.toLowerCase().includes(q)) ||
                (p.nik && p.nik.toLowerCase().includes(q));

            const matchDept = !formFilterDept || p.jabatan?.departemen?.nama_departemen === formFilterDept;
            const matchJab = !formFilterJabatan || p.jabatan?.nama_jabatan === formFilterJabatan;
            
            const empShift = getPegawaiShiftName(p).toLowerCase().trim();
            const selectedShift = formFilterShift.toLowerCase().trim();
            const matchShift = !selectedShift || empShift === selectedShift || empShift.includes(selectedShift) || selectedShift.includes(empShift);

            return matchSearch && matchDept && matchJab && matchShift;
        });
    }, [pegawaiList, formSearchQuery, formFilterDept, formFilterJabatan, formFilterShift, jadwalMap, masterShifts]);


    const isAllFilteredSelected = useMemo(() => {
        return formFilteredPegawai.length > 0 && formFilteredPegawai.every(p => selectedPegawaiIds.includes(String(p.id)));
    }, [formFilteredPegawai, selectedPegawaiIds]);

    const handleToggleSelectAllFiltered = () => {
        const filteredIds = formFilteredPegawai.map(p => String(p.id));
        if (isAllFilteredSelected) {
            setSelectedPegawaiIds(prev => prev.filter(id => !filteredIds.includes(id)));
        } else {
            setSelectedPegawaiIds(prev => {
                const next = [...prev];
                filteredIds.forEach(id => {
                    if (!next.includes(id)) next.push(id);
                });
                return next;
            });
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Validasi Penanggung Jawab
        if (!penanggungJawab.trim()) {
            setErrorPJ('Nama penanggung jawab wajib diisi.');
            return;
        }
        setErrorPJ('');

        // 2. Validasi Pegawai
        if (selectedPegawaiIds.length === 0) {
            showNotif('Pilih minimal 1 pegawai untuk diabsen manual!', 'error');
            return;
        }

        // 3. Validasi Tanggal
        if (!startDate || !endDate) {
            showNotif('Pilih rentang tanggal absensi terlebih dahulu!', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                pegawai_ids: selectedPegawaiIds.map(id => parseInt(id, 10)),
                tanggal_mulai: startDate,
                tanggal_selesai: endDate,
                jam_masuk: jamMasuk || undefined,
                jam_pulang: jamPulang || undefined,
                penanggung_jawab: penanggungJawab.trim()
            };

            const result = await apiFetchJson('/api/v1/absen/manual', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const successCount = result.data?.successCount ?? selectedPegawaiIds.length;
            const skippedCount = result.data?.skippedCount ?? 0;

            if (successCount > 0) {
                showNotif(
                    `Absensi manual berhasil disimpan (${successCount} diproses${skippedCount > 0 ? `, ${skippedCount} dilewati karena sudah ada absensi tersimpan` : ''})`,
                    'success'
                );
            } else {
                showNotif(
                    `Semua data (${skippedCount}) dilewati karena sudah memiliki rekaman absensi tersimpan atau tidak ada shift.`,
                    'success'
                );
            }

            setTimeout(() => {
                onClose();
                onSuccess();
            }, 1500);

        } catch (error) {
            console.error('Error Absen Manual:', error);
            showErrorNotif(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl lg:max-w-5xl h-[84vh] max-h-[720px] min-h-[560px] overflow-hidden border border-gray-200 animate-in zoom-in-95 my-auto flex flex-col">

                {/* MODAL HEADER */}
                <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                            <Clock size={20} />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-gray-800 text-lg">Input Absensi Manual</h3>
                            <p className="text-xs text-gray-500 font-semibold mt-0.5">
                                Entri absensi satu atau beberapa pegawai sekaligus dengan proteksi anti-duplikasi
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

                        {/* LEFT COLUMN: PENGATURAN WAKTU & PENANGGUNG JAWAB (5 COLS) */}
                        <div className="md:col-span-5 flex flex-col gap-3.5 bg-gray-50/70 p-4 rounded-xl border border-gray-200 h-full overflow-y-auto custom-scrollbar">
                            <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wide border-b border-gray-200 pb-2">
                                1. Pengaturan Waktu & Tanggal
                            </h4>

                            {/* RENTANG TANGGAL PICKER BUTTON */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Rentang Tanggal Absensi <span className="text-red-500">*</span>
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

                            {/* INPUT JAM MASUK & PULANG */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Jam Masuk
                                    </label>
                                    <input
                                        type="time"
                                        value={jamMasuk}
                                        onChange={(e) => setJamMasuk(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium shadow-2xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Jam Pulang
                                    </label>
                                    <input
                                        type="time"
                                        value={jamPulang}
                                        onChange={(e) => setJamPulang(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium shadow-2xs"
                                    />
                                </div>
                            </div>

                            <p className="text-[11px] text-gray-500 italic flex items-center gap-1.5 -mt-1">
                                <Info size={13} className="text-blue-600 shrink-0" />
                                <span>Bila jam dikosongkan, sistem otomatis mengikuti jadwal shift kerja pegawai.</span>
                            </p>

                            {/* INPUT PENANGGUNG JAWAB (WAJIB) */}
                            <div>
                                <Input
                                    label="Penanggung Jawab Absen Manual"
                                    type="text"
                                    placeholder="Cth: Admin HRD Budi / Mandor Agus"
                                    value={penanggungJawab}
                                    onChange={(e) => {
                                        setPenanggungJawab(e.target.value);
                                        if (e.target.value.trim()) setErrorPJ('');
                                    }}
                                    required
                                    helperText={
                                        errorPJ ? (
                                            <span className="text-xs font-semibold text-red-500">
                                                {errorPJ}
                                            </span>
                                        ) : (
                                            <span className="text-[11px] text-gray-400">
                                                Tampil di kolom <b>Absensi (Manual - Nama PJ)</b> pada tabel monitoring.
                                            </span>
                                        )
                                    }
                                />
                            </div>

                            {/* AUDIT / PROTEKSI NOTE */}
                            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 text-[11px] text-emerald-800 mt-auto flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 font-bold">
                                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                                    <span>Proteksi Integritas:</span>
                                </div>
                                <p className="text-emerald-900/80 leading-relaxed">
                                    Absensi yang sudah tersimpan pada tanggal tersebut <b>tidak akan diubah/diduplikasi</b>.
                                </p>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: PILIH PEGAWAI, FILTER & SEARCH (7 COLS) */}
                        <div className="md:col-span-7 flex flex-col gap-3 h-full min-h-0 bg-gray-50/70 p-4 rounded-xl border border-gray-200">
                            <div className="flex items-center justify-between pb-1 border-b border-gray-200 shrink-0">
                                <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wide">
                                    2. Pilih Pegawai
                                </h4>
                                <span className="text-xs font-extrabold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-md border border-green-200">
                                    Terpilih: {selectedPegawaiIds.length} Pegawai
                                </span>
                            </div>

                            {/* FILTERS & SEARCH */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 shrink-0">
                                <div className="sm:col-span-4">
                                    <select
                                        value={formFilterDept}
                                        onChange={(e) => {
                                            setFormFilterDept(e.target.value);
                                            setFormFilterJabatan('');
                                        }}
                                        className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none text-xs shadow-2xs font-medium"
                                    >
                                        <option value="">Semua Dept</option>
                                        {formUniqueDepts.map((dept, idx) => (
                                            <option key={idx} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="sm:col-span-4">
                                    <select
                                        value={formFilterJabatan}
                                        onChange={(e) => setFormFilterJabatan(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none text-xs shadow-2xs font-medium"
                                    >
                                        <option value="">Semua Jabatan</option>
                                        {formUniqueJabs.map((jab, idx) => (
                                            <option key={idx} value={jab}>{jab}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="sm:col-span-4">
                                    <select
                                        value={formFilterShift}
                                        onChange={(e) => setFormFilterShift(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none text-xs shadow-2xs font-medium"
                                    >
                                        <option value="">Semua Shift</option>
                                        {formUniqueShifts.map((s, idx) => (
                                            <option key={idx} value={s}>Shift {s}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="sm:col-span-12 relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                    <input
                                        type="text"
                                        placeholder="Cari nama, PIN, atau NIK pegawai..."
                                        value={formSearchQuery}
                                        onChange={(e) => setFormSearchQuery(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg pl-8 pr-2.5 py-1.5 focus:outline-none text-xs bg-white shadow-2xs"
                                    />
                                </div>
                            </div>

                            {/* CHECKLIST BOX */}
                            <div className="border border-gray-300 rounded-xl p-2 bg-white flex flex-col gap-1 w-full flex-1 overflow-y-auto custom-scrollbar shadow-2xs min-h-0">
                                {isLoadingData ? (
                                    <div className="p-8 flex flex-col items-center justify-center gap-2 text-gray-400 my-auto">
                                        <Loader2 className="animate-spin text-blue-600" size={24} />
                                        <span className="text-xs font-semibold">Memuat daftar pegawai...</span>
                                    </div>
                                ) : formFilteredPegawai.length === 0 ? (
                                    <span className="text-xs text-gray-400 italic text-center my-auto py-8">
                                        Pegawai tidak ditemukan.
                                    </span>
                                ) : (
                                    formFilteredPegawai.map((p) => {
                                        const isChecked = selectedPegawaiIds.includes(String(p.id));
                                        return (
                                            <label
                                                key={p.id}
                                                className="flex items-center justify-between gap-2.5 text-xs text-gray-700 cursor-pointer hover:bg-blue-50/60 p-2 rounded-lg transition-colors border border-transparent hover:border-blue-100 select-none"
                                            >
                                                <div className="flex items-center gap-2.5">
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
                                                            {p.jabatan?.departemen?.nama_departemen || '-'} &middot; {p.jabatan?.nama_jabatan || 'Pegawai'} {p.pin_mesin ? `• PIN: ${p.pin_mesin}` : ''}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="text-right shrink-0">
                                                    {(() => {
                                                        const sName = getPegawaiShiftName(p);
                                                        return sName ? (
                                                            <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                                {sName.toLowerCase().startsWith('shift') ? sName : `Shift ${sName}`}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                                                                Non-Shift
                                                            </span>
                                                        );
                                                    })()}
                                                </div>

                                            </label>
                                        );
                                    })
                                )}
                            </div>

                            {/* QUICK SELECT BUTTON */}
                            <div className="flex flex-wrap gap-2 justify-between items-center w-full shrink-0 pt-1">
                                <Button
                                    type="button"
                                    onClick={handleToggleSelectAllFiltered}
                                    disabled={formFilteredPegawai.length === 0}
                                    label={isAllFilteredSelected ? 'Batal Pilih Terfilter' : `Pilih Semua Terfilter (${formFilteredPegawai.length})`}
                                    variant={isAllFilteredSelected ? 'danger' : 'info'}
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
                            className="px-4 py-2 text-xs font-semibold cursor-pointer"
                        />
                        <Button
                            type="submit"
                            label={isSubmitting ? 'Menyimpan Absen...' : `Simpan Absen (${selectedPegawaiIds.length} Pegawai)`}
                            variant="success"
                            disabled={isSubmitting || selectedPegawaiIds.length === 0}
                            icon={isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <UserCheck size={16} />}
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
                title="Pilih Rentang Tanggal Absensi"
                onApply={(start, end) => {
                    setStartDate(start);
                    setEndDate(end);
                }}
            />

            <Notif
                show={notif.show}
                message={notif.message}
                type={notif.type}
                onClose={closeNotif}
            />
        </div>
    );
}



import React, { useState, useEffect } from 'react';
import { X, Search, Users, PlayCircle, AlertCircle, CheckCircle, Calendar } from 'lucide-react';
import Button from '../../../components/common/Button';
import { apiFetch } from '../../../utils/apiFetch';
import { useAuthStore } from '../../../store/useAuthStore';
import CustomDateRangePickerModal from './CustomDateRangePickerModal';

interface Shift {
    id: string | number;
    kode_shift: string;
    jam_masuk?: string;
    jam_pulang?: string;
}

interface Pegawai {
    id: number;
    nama: string;
    nik?: string;
    pola_rotasi_id?: string;
    tanggal_mulai_pola?: string;
    jabatan?: { nama_jabatan: string; departemen?: { nama_departemen: string } };
    departemen?: { nama_departemen: string };
}

interface DetailPola {
    urutan_hari: number;
    shift_id: string | null;
    shifts?: { kode_shift: string };
}

interface PolaRotasi {
    id: string;
    nama_pola: string;
    jumlah_hari_siklus: number;
    keterangan?: string;
    detail_pola_rotasi?: DetailPola[];
}

interface DisplayItem {
    id: string | number;
    label: string;
    subLabel: string;
    pegawaiIds: number[];
}

export interface ModalKelolaJadwalMassalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTab?: 'generate' | 'pola';
    listPegawai: Pegawai[];
    listMasterShifts: Shift[];
    filterLevel1: 'all_karyawan' | 'filter_departemen';
    setFilterLevel1: (val: 'all_karyawan' | 'filter_departemen') => void;
    filterLevel2: string;
    setFilterLevel2: (val: string) => void;
    filterLevel3: string;
    setFilterLevel3: (val: string) => void;
    selectedPegawaiIds: number[];
    setSelectedPegawaiIds: (updater: (prev: number[]) => number[] | number[]) => void;
    massalTanggalMulai: string;
    setMassalTanggalMulai: (val: string) => void;
    massalTanggalSelesai: string;
    setMassalTanggalSelesai: (val: string) => void;
    massalShiftId: string;
    setMassalShiftId: (val: string) => void;
    isSaving: boolean;
    handleProsesGenerateMassal: () => void;
    onSuccess?: () => void;
}

export default function ModalKelolaJadwalMassal({
    isOpen,
    onClose,
    initialTab = 'generate',
    listPegawai,
    listMasterShifts,
    filterLevel1,
    setFilterLevel1,
    filterLevel2,
    setFilterLevel2,
    filterLevel3,
    setFilterLevel3,
    selectedPegawaiIds,
    setSelectedPegawaiIds,
    massalTanggalMulai,
    setMassalTanggalMulai,
    massalTanggalSelesai,
    setMassalTanggalSelesai,
    massalShiftId,
    setMassalShiftId,
    isSaving,
    handleProsesGenerateMassal,
    onSuccess
}: ModalKelolaJadwalMassalProps) {
    const token = useAuthStore((state) => state.token);
    const [activeTab, setActiveTab] = useState<'generate' | 'pola'>(initialTab);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [pickerTarget, setPickerTarget] = useState<'generate' | 'pola'>('generate');

    const formatDateDisplay = (startStr: string, endStr: string) => {
        if (!startStr && !endStr) return "Pilih Rentang Tanggal...";
        if (startStr && !endStr) return `${startStr} (Pilih tanggal selesai)`;
        if (!startStr && endStr) return `${endStr} (Pilih tanggal mulai)`;
        return `${startStr}  s/d  ${endStr}`;
    };

    // Sync activeTab saat modal dibuka
    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
        }
    }, [isOpen, initialTab]);

    // ==========================================
    // STATE & HELPER FILTER PEGAWAI TARGET (SHARED)
    // ==========================================
    const [searchTargetQuery, setSearchTargetQuery] = useState("");

    const getDeptName = (p: any) => p.departemen?.nama_departemen || p.jabatan?.departemen?.nama_departemen || 'Umum';
    const getJabName = (p: any) => p.jabatan?.nama_jabatan || p.jabatan || 'Tanpa Jabatan';

    const uniqueDepartemen = Array.from(new Set(listPegawai.map(getDeptName)));
    const pInSelectedDept = listPegawai.filter(p => getDeptName(p) === filterLevel2);
    const uniqueJabatanInDept = Array.from(new Set(pInSelectedDept.map(getJabName)));

    let displayListTarget: DisplayItem[] = [];

    if (filterLevel1 === 'all_karyawan') {
        displayListTarget = listPegawai.map(p => ({
            id: p.id, label: p.nama, subLabel: getJabName(p), pegawaiIds: [p.id]
        }));
    } else if (filterLevel1 === 'filter_departemen') {
        if (filterLevel2 === '') {
            uniqueDepartemen.forEach(deptName => {
                const pInDept = listPegawai.filter(p => getDeptName(p) === deptName);
                displayListTarget.push({ id: deptName as string, label: deptName as string, subLabel: `${pInDept.length} Pegawai`, pegawaiIds: pInDept.map(p => p.id) });
            });
        } else if (filterLevel3 === '') {
            uniqueJabatanInDept.forEach(jabName => {
                const pInJab = pInSelectedDept.filter(p => getJabName(p) === jabName);
                displayListTarget.push({ id: jabName as string, label: jabName as string, subLabel: `${pInJab.length} Pegawai`, pegawaiIds: pInJab.map(p => p.id) });
            });
        } else {
            const pFinal = pInSelectedDept.filter(p => getJabName(p) === filterLevel3);
            displayListTarget.push(...pFinal.map(p => ({
                id: p.id, label: p.nama, subLabel: p.nik || '-', pegawaiIds: [p.id]
            })));
        }
    }

    if (searchTargetQuery.trim() !== '') {
        const query = searchTargetQuery.toLowerCase();
        displayListTarget = displayListTarget.filter(item =>
            String(item.label).toLowerCase().includes(query) ||
            String(item.subLabel).toLowerCase().includes(query)
        );
    }

    const isItemSelectedTarget = (itemIds: number[]) => itemIds.length > 0 && itemIds.every(id => selectedPegawaiIds.includes(id));

    const handleToggleItemTarget = (itemIds: number[]) => {
        if (isItemSelectedTarget(itemIds)) {
            setSelectedPegawaiIds(prev => prev.filter(id => !itemIds.includes(id)));
        } else {
            setSelectedPegawaiIds(prev => Array.from(new Set([...prev, ...itemIds])));
        }
    };

    const visiblePegawaiIdsTarget = Array.from(new Set(displayListTarget.flatMap(item => item.pegawaiIds)));
    const isAllVisibleSelectedTarget = visiblePegawaiIdsTarget.length > 0 && visiblePegawaiIdsTarget.every(id => selectedPegawaiIds.includes(id));

    const handleSelectAllVisibleTarget = () => {
        if (isAllVisibleSelectedTarget) {
            setSelectedPegawaiIds(prev => prev.filter(id => !visiblePegawaiIdsTarget.includes(id)));
        } else {
            setSelectedPegawaiIds(prev => Array.from(new Set([...prev, ...visiblePegawaiIdsTarget])));
        }
    };

    // ==========================================
    // STATE UNTUK TAB ASSIGN POLA ROLLING
    // ==========================================
    const [polaList, setPolaList] = useState<PolaRotasi[]>([]);
    const [selectedPolaId, setSelectedPolaId] = useState<string>('');
    const [tanggalMulaiPola, setTanggalMulaiPola] = useState<string>(
        new Date().toLocaleDateString('en-CA')
    );
    const [isSavingPola, setIsSavingPola] = useState(false);
    const [autoGenerateJadwal, setAutoGenerateJadwal] = useState(true);
    const [generateSampai, setGenerateSampai] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toLocaleDateString('en-CA');
    });
    const [errorMsgPola, setErrorMsgPola] = useState('');
    const [successMsgPola, setSuccessMsgPola] = useState('');

    useEffect(() => {
        if (isOpen && activeTab === 'pola') {
            fetchPolaList();
            setErrorMsgPola('');
            setSuccessMsgPola('');
        }
    }, [isOpen, activeTab]);

    const fetchPolaList = async () => {
        try {
            const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
            const res = await apiFetch(`${baseUrl}/api/v1/pola-rotasi`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setPolaList(json.data || []);
                if (json.data?.length > 0 && !selectedPolaId) {
                    setSelectedPolaId(json.data[0].id);
                }
            }
        } catch (err: any) {
            console.error('Gagal memuat pola rotasi:', err);
        }
    };

    const selectedPolaObj = polaList.find(p => p.id === selectedPolaId);

    const handleSubmitPola = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsgPola('');
        setSuccessMsgPola('');

        if (selectedPegawaiIds.length === 0) {
            setErrorMsgPola('Pilih minimal 1 pegawai target.');
            return;
        }

        if (!selectedPolaId) {
            setErrorMsgPola('Pilih pola rotasi yang akan diterapkan.');
            return;
        }

        if (!tanggalMulaiPola) {
            setErrorMsgPola('Tanggal mulai pola (Anchor Date) wajib diisi.');
            return;
        }

        setIsSavingPola(true);
        try {
            const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

            let countSuccess = 0;
            for (const pId of selectedPegawaiIds) {
                const res = await apiFetch(`${baseUrl}/api/v1/pegawai/${pId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        pola_rotasi_id: selectedPolaId === 'NONE' ? null : selectedPolaId,
                        tanggal_mulai_pola: tanggalMulaiPola
                    })
                });

                const json = await res.json();
                if (json.success) countSuccess++;
            }

            if (autoGenerateJadwal && selectedPolaId !== 'NONE') {
                const genRes = await apiFetch(`${baseUrl}/api/v1/jadwal/generate-massal`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        list_pegawai_ids: selectedPegawaiIds,
                        tanggal_mulai: tanggalMulaiPola,
                        tanggal_selesai: generateSampai
                    })
                });
                const genJson = await genRes.json();
                if (!genRes.ok || !genJson.success) {
                    throw new Error(genJson.message || 'Gagal generate kalender jadwal.');
                }
            }

            setSuccessMsgPola(`Berhasil menerapkan pola rotasi & generate jadwal untuk ${countSuccess} pegawai!`);
            if (onSuccess) onSuccess();
            setTimeout(() => {
                onClose();
            }, 1200);
        } catch (err: any) {
            setErrorMsgPola(err.message || 'Gagal menerapkan pola rotasi.');
        } finally {
            setIsSavingPola(false);
        }
    };

    if (!isOpen) return null;

    const renderTargetPegawaiPanel = () => (
        <div className="flex flex-col gap-2 bg-gray-50/80 p-3.5 rounded-xl border border-gray-200 h-full">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <label className="text-xs font-extrabold text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Users size={15} className="text-blue-600" />
                    Pilih Pegawai Target
                </label>
                <span className="text-[11px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    {selectedPegawaiIds.length} Terpilih
                </span>
            </div>
            
            <div className="flex flex-col gap-2 mt-1">
                <select 
                    value={filterLevel1} 
                    onChange={(e) => {
                        setFilterLevel1(e.target.value as 'all_karyawan' | 'filter_departemen');
                        setFilterLevel2("");
                        setFilterLevel3("");
                    }}
                    className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs outline-none bg-white font-medium shadow-2xs focus:border-blue-500"
                >
                    <option value="all_karyawan">Semua Pegawai</option>
                    <option value="filter_departemen">Filter Departemen</option>
                </select>

                {filterLevel1 === 'filter_departemen' && (
                    <select 
                        value={filterLevel2} 
                        onChange={(e) => {
                            setFilterLevel2(e.target.value);
                            setFilterLevel3("");
                        }} 
                        className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs outline-none bg-white font-medium shadow-2xs focus:border-blue-500"
                    >
                        <option value="">-- Pilih Departemen --</option>
                        {uniqueDepartemen.map(d => <option key={d as string} value={d as string}>{d as string}</option>)}
                    </select>
                )}

                {filterLevel1 === 'filter_departemen' && filterLevel2 !== '' && (
                    <select 
                        value={filterLevel3} 
                        onChange={(e) => setFilterLevel3(e.target.value)} 
                        className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs outline-none bg-white font-medium shadow-2xs focus:border-blue-500"
                    >
                        <option value="">-- Pilih Jabatan --</option>
                        {uniqueJabatanInDept.map(j => <option key={j as string} value={j as string}>{j as string}</option>)}
                    </select>
                )}
            </div>

            {/* SEARCH PEGAWAI */}
            <div className="relative mt-0.5">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <Search size={14} className="text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Cari nama pegawai..."
                    value={searchTargetQuery}
                    onChange={(e) => setSearchTargetQuery(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none focus:border-blue-500 shadow-2xs bg-white"
                />
            </div>

            <div className="border border-gray-300 bg-white rounded-xl flex flex-col mt-1 shadow-2xs overflow-hidden flex-1 min-h-0">
                <label className="flex items-center gap-2 p-2.5 border-b border-gray-200 bg-blue-50/70 hover:bg-blue-50 cursor-pointer text-xs font-extrabold text-gray-800 transition-colors shrink-0">
                    <input 
                        type="checkbox" 
                        checked={isAllVisibleSelectedTarget}
                        onChange={handleSelectAllVisibleTarget}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300"
                    />
                    Pilih Semua ({visiblePegawaiIdsTarget.length} Pegawai)
                </label>

                <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1 custom-scrollbar min-h-0">
                    {displayListTarget.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-6">Data tidak ditemukan.</p>
                    ) : (
                        displayListTarget.map(item => (
                            <label key={item.id} className="flex items-center gap-2 p-2 hover:bg-blue-50 cursor-pointer rounded-lg text-xs transition-colors border border-transparent hover:border-blue-100">
                                <input 
                                    type="checkbox" 
                                    checked={isItemSelectedTarget(item.pegawaiIds)}
                                    onChange={() => handleToggleItemTarget(item.pegawaiIds)}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300"
                                />
                                <span className="text-gray-800 font-semibold">{item.label}</span>
                                <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-md text-gray-500 ml-auto border border-gray-200 whitespace-nowrap font-medium">
                                    {item.subLabel}
                                </span>
                            </label>
                        ))
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl lg:max-w-5xl h-[82vh] max-h-[700px] min-h-[560px] overflow-hidden border border-gray-200 animate-in zoom-in-95 my-auto flex flex-col">
                
                {/* HEADER MODAL */}
                <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="font-extrabold text-gray-800 text-lg">Pengelolaan Shift & Pola Massal</h3>
                        <p className="text-xs text-gray-500 font-semibold mt-0.5">
                            Generate shift fixed atau terapkan siklus pola rolling shift ke pegawai target
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

                {/* NAVIGATION TAB DALAM MODAL */}
                <div className="flex border-b border-gray-200 bg-gray-100/70 px-4 gap-4 shrink-0">
                    <button
                        onClick={() => setActiveTab('generate')}
                        className={`flex items-center gap-2 py-3 px-4 text-xs md:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                            activeTab === 'generate'
                                ? 'border-blue-600 text-blue-600 bg-white shadow-2xs rounded-t-lg'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <PlayCircle size={16} />
                        Generate Shift Massal
                    </button>
                    <button
                        onClick={() => setActiveTab('pola')}
                        className={`flex items-center gap-2 py-3 px-4 text-xs md:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                            activeTab === 'pola'
                                ? 'border-blue-600 text-blue-600 bg-white shadow-2xs rounded-t-lg'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Users size={16} />
                        Assign Pola Rolling
                    </button>
                </div>

                {/* CONTENT BODY TAB 1: GENERATE SHIFT MASSAL */}
                {activeTab === 'generate' && (
                    <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-5 flex-1 min-h-0 overflow-hidden">
                        
                        {/* LEFT COLUMN: PEGAWAI TARGET */}
                        <div className="md:col-span-5 h-full min-h-0 flex flex-col">
                            {renderTargetPegawaiPanel()}
                        </div>

                        {/* RIGHT COLUMN: PARAMETER & ACTION */}
                        <div className="md:col-span-7 h-full min-h-0 flex flex-col justify-between overflow-y-auto pr-1 custom-scrollbar gap-4">
                            <div className="flex flex-col gap-4">
                                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-4">
                                    <h4 className="text-xs font-extrabold text-gray-700 uppercase tracking-wide border-b border-gray-200 pb-2">
                                        Konfigurasi Generate Shift
                                    </h4>

                                    {/* RENTANG TANGGAL */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                                            Rentang Tanggal Shift
                                        </label>
                                        <div
                                            onClick={() => {
                                                setPickerTarget('generate');
                                                setIsDatePickerOpen(true);
                                            }}
                                            className="flex items-center justify-between border border-gray-300 rounded-xl p-3 bg-white hover:border-blue-500 hover:ring-2 hover:ring-blue-100 cursor-pointer shadow-2xs transition-all"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Calendar size={18} className="text-blue-600 shrink-0" />
                                                <span className="text-sm font-extrabold text-gray-800">
                                                    {formatDateDisplay(massalTanggalMulai, massalTanggalSelesai)}
                                                </span>
                                            </div>
                                            <span className="text-xs text-blue-600 font-bold bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors border border-blue-200">
                                                Pilih Tanggal
                                            </span>
                                        </div>
                                    </div>

                                    {/* PILIHAN SHIFT */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                                            Pilihan Shift Target
                                        </label>
                                        <select 
                                            value={massalShiftId}
                                            onChange={(e) => setMassalShiftId(e.target.value)}
                                            className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:border-blue-500 shadow-2xs bg-white outline-none w-full font-medium"
                                        >
                                            <option value="">-- Gunakan Shift Default Pegawai --</option>
                                            {listMasterShifts.map((shift) => (
                                                <option key={shift.id} value={shift.id}>
                                                    OVERRIDE JADI: {shift.kode_shift} ({shift.jam_masuk?.substring(0, 5)} - {shift.jam_pulang?.substring(0, 5)})
                                                </option>
                                            ))}
                                            <option value="off">OVERRIDE JADI: LIBUR (OFF)</option>
                                        </select>
                                    </div>

                                    {/* INFO BANNER */}
                                    <div className="bg-blue-50 text-blue-800 text-xs p-3.5 rounded-xl border border-blue-200 flex items-start gap-2">
                                        <span className="text-base leading-none">💡</span>
                                        <span>
                                            Jika jadwal di rentang tanggal tersebut sudah ada, sistem akan otomatis <strong>menimpa (overwrite)</strong> jadwal lama dengan jadwal baru ini.
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* SUBMIT BUTTON */}
                            <div className="pt-2 shrink-0">
                                <Button 
                                    label={isSaving ? "Memproses Data..." : "Eksekusi Generate Shift Massal"} 
                                    variant='success'
                                    className="w-full py-3 rounded-xl font-bold text-sm shadow-md" 
                                    disabled={isSaving}
                                    onClick={handleProsesGenerateMassal} 
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* CONTENT BODY TAB 2: ASSIGN POLA ROLLING */}
                {activeTab === 'pola' && (
                    <form onSubmit={handleSubmitPola} className="p-5 grid grid-cols-1 md:grid-cols-12 gap-5 flex-1 min-h-0 overflow-hidden">
                        
                        {/* LEFT COLUMN: PEGAWAI TARGET */}
                        <div className="md:col-span-5 h-full min-h-0 flex flex-col">
                            {renderTargetPegawaiPanel()}
                        </div>

                        {/* RIGHT COLUMN: PARAMETER & ACTION */}
                        <div className="md:col-span-7 h-full min-h-0 flex flex-col justify-between overflow-y-auto pr-1 custom-scrollbar gap-4">
                            <div className="flex flex-col gap-4">
                                {errorMsgPola && (
                                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
                                        <AlertCircle size={16} className="shrink-0" />
                                        <span>{errorMsgPola}</span>
                                    </div>
                                )}

                                {successMsgPola && (
                                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-xs font-semibold">
                                        <CheckCircle size={16} className="shrink-0" />
                                        <span>{successMsgPola}</span>
                                    </div>
                                )}

                                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-4">
                                    <h4 className="text-xs font-extrabold text-gray-700 uppercase tracking-wide border-b border-gray-200 pb-2">
                                        Konfigurasi Pola Rotasi Shift
                                    </h4>

                                    {/* SECTION 1: PILIH POLA ROTASI */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                                            1. Pilih Pola Rotasi Shift
                                        </label>
                                        <select
                                            value={selectedPolaId}
                                            onChange={e => setSelectedPolaId(e.target.value)}
                                            className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium shadow-2xs"
                                        >
                                            <option value="">-- Pilih Pola Rotasi --</option>
                                            <option value="NONE">-- Lepas dari Pola (Non-Rolling) --</option>
                                            {polaList.map(pola => (
                                                <option key={pola.id} value={pola.id}>
                                                    {pola.nama_pola} ({pola.jumlah_hari_siklus} Hari Siklus)
                                                </option>
                                            ))}
                                        </select>

                                        {selectedPolaObj && (
                                            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 space-y-1">
                                                <div className="font-bold flex items-center gap-1.5 text-blue-800">
                                                    <span>Preview Siklus Pola: {selectedPolaObj.nama_pola}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {selectedPolaObj.detail_pola_rotasi?.map(det => (
                                                        <span
                                                            key={det.urutan_hari}
                                                            className="px-2 py-1 bg-white border border-blue-300 rounded-md font-semibold text-[11px] shadow-2xs text-blue-900"
                                                        >
                                                            H-{det.urutan_hari}: {det.shifts?.kode_shift || 'OFF'}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* SECTION 2: RENTANG TANGGAL */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                                            2. Rentang Tanggal Pola Rolling Shift
                                        </label>
                                        <div
                                            onClick={() => {
                                                setPickerTarget('pola');
                                                setIsDatePickerOpen(true);
                                            }}
                                            className="flex items-center justify-between border border-gray-300 rounded-xl p-3 bg-white hover:border-blue-500 hover:ring-2 hover:ring-blue-100 cursor-pointer shadow-2xs transition-all"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Calendar size={18} className="text-blue-600 shrink-0" />
                                                <span className="text-sm font-extrabold text-gray-800">
                                                    {formatDateDisplay(tanggalMulaiPola, generateSampai)}
                                                </span>
                                            </div>
                                            <span className="text-xs text-blue-600 font-bold bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors border border-blue-200">
                                                Pilih Tanggal
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 font-medium">
                                            Hari pertama (H-1) siklus pola dihitung mulai tanggal awal rentang.
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 pt-1">
                                        <input
                                            type="checkbox"
                                            id="autoGen"
                                            checked={autoGenerateJadwal}
                                            onChange={e => setAutoGenerateJadwal(e.target.checked)}
                                            className="w-4 h-4 text-blue-600 rounded border-gray-300 cursor-pointer"
                                        />
                                        <label htmlFor="autoGen" className="text-xs font-bold text-gray-700 cursor-pointer">
                                            Otomatis isi (generate) jadwal ke kalender kerja pegawai
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* SUBMIT BUTTON */}
                            <div className="pt-2 shrink-0">
                                <Button
                                    type="submit"
                                    label={isSavingPola ? 'Menerapkan Pola...' : 'Terapkan Pola Rolling Shift'}
                                    variant="primary"
                                    className="w-full py-3 rounded-xl font-bold text-sm shadow-md"
                                    disabled={isSavingPola}
                                    isLoading={isSavingPola}
                                />
                            </div>

                        </div>
                    </form>
                )}

            </div>

            <CustomDateRangePickerModal
                isOpen={isDatePickerOpen}
                onClose={() => setIsDatePickerOpen(false)}
                title={pickerTarget === 'generate' ? "Pilih Rentang Tanggal Shift Massal" : "Pilih Rentang Tanggal Pola Rolling"}
                startDate={pickerTarget === 'generate' ? massalTanggalMulai : tanggalMulaiPola}
                endDate={pickerTarget === 'generate' ? massalTanggalSelesai : generateSampai}
                onApply={(start, end) => {
                    if (pickerTarget === 'generate') {
                        setMassalTanggalMulai(start);
                        setMassalTanggalSelesai(end);
                    } else {
                        setTanggalMulaiPola(start);
                        setGenerateSampai(end);
                    }
                }}
            />
        </div>
    );
}

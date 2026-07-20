import { useState, useMemo, useRef } from 'react';
import { Loader2, PlusCircle, Search } from 'lucide-react';
import Input from '../../../components/common/InputText';
import Button from '../../../components/common/Button';
import Notif from '../../../components/common/Notif';
import { TabelBonusCustom, type BonusCustomData } from '../components/TabelBonusCustom';
import { useBonusCustom } from '../hooks/useBonusCustom';

export default function BonusCustomIndex() {
    const formRef = useRef<HTMLDivElement>(null);
    
    const {
        listPegawai,
        listBonus,
        isLoadingBonus,
        isCreating,
        isUpdating,
        notif,
        closeNotif,
        createBonus,
        updateBonus,
        handleDeleteBonus
    } = useBonusCustom();

    // Form State
    const [selectedPegawaiIds, setSelectedPegawaiIds] = useState<string[]>([]);
    const [tanggal, setTanggal] = useState("");
    const [keterangan, setKeterangan] = useState("");
    const [nominal, setNominal] = useState("");
    const [editingBonusId, setEditingBonusId] = useState<string | null>(null);

    // Form Search & Filter States
    const [formFilterDept, setFormFilterDept] = useState('');
    const [formFilterJabatan, setFormFilterJabatan] = useState('');
    const [formSearchQuery, setFormSearchQuery] = useState('');

    const handleEditBonus = (bonus: BonusCustomData) => {
        setEditingBonusId(bonus.id);
        setTanggal(bonus.tanggal_diberikan);
        setKeterangan(bonus.keterangan || "");
        setNominal(String(bonus.nominal || ""));
        setSelectedPegawaiIds([String(bonus.pegawai_id)]);
        
        // Scroll smooth to form
        if (formRef.current) {
            formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleCancelEdit = () => {
        setEditingBonusId(null);
        setSelectedPegawaiIds([]);
        setTanggal("");
        setKeterangan("");
        setNominal("");
    };

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedPegawaiIds.length === 0 || !tanggal || !keterangan || !nominal) return;

        if (editingBonusId) {
            updateBonus({
                id: editingBonusId,
                pegawai_id: selectedPegawaiIds[0],
                tanggal_diberikan: tanggal,
                keterangan: keterangan,
                nominal: Number(nominal)
            }, {
                onSuccess: () => {
                    handleCancelEdit();
                }
            });
        } else {
            createBonus({
                pegawai_ids: selectedPegawaiIds,
                tanggal_diberikan: tanggal,
                keterangan: keterangan,
                nominal: Number(nominal)
            }, {
                onSuccess: () => {
                    setSelectedPegawaiIds([]);
                    setTanggal("");
                    setKeterangan("");
                    setNominal("");
                }
            });
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300 pb-10">

            {/* FORM INPUT BONUS BARU / EDIT */}
            <div ref={formRef} data-tour="bonus-form" className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 w-full scroll-mt-6 relative">
                {editingBonusId ? (
                    <div className="flex items-center justify-between border-b border-amber-200 bg-amber-50/60 -mx-6 -mt-6 p-4 px-6 rounded-t-2xl mb-6">
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold text-amber-900">Edit Bonus Custom</h2>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-5 bg-linear-to-b from-red-500 to-rose-600 rounded-full" />
                            <h2 className="text-base font-bold text-slate-800">Form Tambah Bonus Baru</h2>
                        </div>
                        <span className="text-xs font-medium text-slate-400">Isi detail & pilih penerima</span>
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* KIRI: PENGATURAN BONUS (5 KOLOM) */}
                    <div className="lg:col-span-5 flex flex-col gap-4 w-full bg-slate-50/60 p-4 rounded-xl border border-slate-200/80">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider pb-2 border-b border-slate-200/60">
                            <span className="text-black flex items-center justify-center text-[10px] font-black">1</span>
                            <span>Detail & Nominal Bonus</span>
                        </div>
                        
                        <Input
                            label="Tanggal Diberikan"
                            type="date"
                            value={tanggal}
                            onChange={(e) => setTanggal(e.target.value)}
                            required
                        />

                        <Input
                            label="Keterangan / Nama Bonus"
                            type="text"
                            placeholder="Contoh: Reward Performa, Bonus Lembur Khusus"
                            value={keterangan}
                            onChange={(e) => setKeterangan(e.target.value)}
                            required
                        />

                        <div>
                            <Input
                                label="Nominal Bonus (Rp)"
                                type="number"
                                placeholder="50000"
                                value={nominal}
                                onChange={(e) => setNominal(e.target.value)}
                                min="1"
                                required
                            />
                        </div>

                            {nominal && Number(nominal) > 0 && (
                                <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-200">
                                    <span className="text-emerald-700 font-medium">Preview Nominal:</span>
                                    <span className="font-extrabold text-emerald-800">
                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(nominal))}
                                    </span>
                                </div>
                            )}
                        </div>

                    {/* KANAN: PILIH KARYAWAN PENERIMA (7 KOLOM) */}
                    <div className="lg:col-span-7 flex flex-col gap-4 w-full bg-slate-50/60 p-4 rounded-xl border border-slate-200/80">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
                                <span className="text-black flex items-center justify-center text-[10px] font-black">2</span>
                                <span>Pilih Karyawan Penerima</span>
                            </div>
                            <span className="text-[11px] font-bold text-slate-500 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                                Terpilih: <span className="text-emerald-600 font-black">{selectedPegawaiIds.length}</span> Karyawan
                            </span>
                        </div>
                        
                        {/* Filters & Search Bar */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                                <select
                                    value={formFilterDept}
                                    onChange={(e) => {
                                        setFormFilterDept(e.target.value);
                                        setFormFilterJabatan('');
                                    }}
                                    className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-xs font-medium text-slate-700 shadow-2xs transition-all"
                                >
                                    <option value="">Semua Dept</option>
                                    {formUniqueDepts.map((dept, idx) => (
                                        <option key={idx} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <select
                                    value={formFilterJabatan}
                                    onChange={(e) => setFormFilterJabatan(e.target.value)}
                                    disabled={!formFilterDept}
                                    className={`w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs transition-all ${
                                        !formFilterDept ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : 'bg-white text-slate-700'
                                    }`}
                                >
                                    <option value="">Semua Jabatan</option>
                                    {formUniqueJabs.map((jab, idx) => (
                                        <option key={idx} value={jab}>{jab}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input
                                    type="text"
                                    placeholder="Cari pegawai..."
                                    value={formSearchQuery}
                                    onChange={(e) => setFormSearchQuery(e.target.value)}
                                    className="w-full border border-slate-300 rounded-xl pl-8 pr-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-xs font-medium text-slate-800 placeholder-slate-400 shadow-2xs transition-all"
                                />
                            </div>
                        </div>

                        {/* Checklist Container */}
                        <div className="border border-slate-200 rounded-xl p-2 max-h-48 h-48 overflow-y-auto bg-white flex flex-col gap-1 w-full shadow-inner scrollbar-thin">
                            {formFilteredPegawai.map((p: any) => {
                                const isChecked = selectedPegawaiIds.includes(String(p.id));
                                return (
                                    <label
                                        key={p.id}
                                        className={`flex items-center justify-between gap-3 text-xs p-2 rounded-lg cursor-pointer transition-all border border-slate-300 select-none ${
                                            isChecked
                                                ? 'text-black font-semibold'
                                                : 'text-black'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
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
                                                className="rounded-md text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer shrink-0 accent-blue-600"
                                            />
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-bold text-slate-800 truncate">{p.nama}</span>
                                                <span className="text-[10px] text-black truncate">
                                                    {p.jabatan?.departemen?.nama_departemen || "-"} &middot; {p.jabatan?.nama_jabatan || "Karyawan"}
                                                </span>
                                            </div>
                                        </div>
                                    </label>
                                );
                            })}

                            {formFilteredPegawai.length === 0 && (
                                <div className="flex flex-col items-center justify-center my-auto py-6 text-slate-400 gap-1">
                                    <Search size={18} />
                                    <span className="text-xs italic">Karyawan tidak ditemukan</span>
                                </div>
                            )}
                        </div>

                        {/* Toggle select all button */}
                        <div className="flex justify-between items-center pt-1">
                            <button
                                type="button"
                                onClick={handleToggleSelectAllFiltered}
                                disabled={formFilteredPegawai.length === 0}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-300 transition-all cursor-pointer ${
                                    isAllFilteredSelected
                                        ? 'text-black'
                                        : 'text-black'
                                } ${formFilteredPegawai.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isAllFilteredSelected ? 'Batal Pilih semua Terfilter' : 'Pilih Semua Terfilter'}
                            </button>

                            <span className="text-[11px] text-black font-medium">
                                {formFilteredPegawai.length} Karyawan tampil
                            </span>
                        </div>
                    </div>

                    {/* FOOTER BUTTONS */}
                    <div className="lg:col-span-12 flex flex-col sm:flex-row justify-between items-start sm:items-center border-t border-slate-100 pt-4 gap-3 w-full">
                        <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                            Bonus yang tersimpan akan langsung tercatat pada matriks riwayat di bawah.
                        </p>
                        
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            {editingBonusId && (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleCancelEdit}
                                    label="Batal Edit"
                                    className="w-full sm:w-auto text-xs font-semibold rounded-xl"
                                />
                            )}
                            
                            <Button
                                type="submit"
                                variant="success"
                                disabled={selectedPegawaiIds.length === 0 || !tanggal || !keterangan || !nominal}
                                isLoading={isCreating || isUpdating}
                                label={editingBonusId ? "Update Bonus" : "Simpan Bonus"}
                                icon={<PlusCircle size={16} />}
                                className="w-full sm:w-auto text-xs font-bold rounded-xl"
                            />
                        </div>
                    </div>
                </form>
            </div>

            {/* TABEL RIWAYAT BONUS (FULL WIDTH) */}
            <div data-tour="bonus-table" className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col w-full">
                <div className="p-4 sm:p-5 border-b border-slate-200 bg-white flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                        <div>
                            <h2 className="text-base font-bold text-slate-800">Riwayat Pemberian Bonus</h2>
                            <p className="text-xs text-slate-400">Matriks pemberian bonus per tanggal & karyawan</p>
                        </div>
                    </div>
                </div>
                
                {isLoadingBonus ? (
                    <div className="p-16 flex flex-col items-center justify-center text-slate-400 gap-3">
                        <Loader2 className="animate-spin text-red-600" size={36} />
                        <span className="text-xs font-semibold">Memuat riwayat bonus custom...</span>
                    </div>
                ) : (
                    <TabelBonusCustom data={listBonus} listPegawai={listPegawai} onDelete={handleDeleteBonus} onEdit={handleEditBonus} />
                )}
            </div>

            <Notif show={notif.show} message={notif.message} type={notif.type} onClose={closeNotif} />
        </div>
    );
}
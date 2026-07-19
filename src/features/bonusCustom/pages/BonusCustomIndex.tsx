import { useState, useMemo } from 'react';
import { PlusCircle, Loader2, Search } from 'lucide-react';
import Button from '../../../components/common/Button';
import Notif from '../../../components/common/Notif';
import { TabelBonusCustom } from '../components/TabelBonusCustom';
import { useBonusCustom } from '../hooks/useBonusCustom';


export default function BonusCustomIndex() {
    
    const {
        listPegawai,
        listBonus,
        isLoadingBonus,
        isCreating,
        notif,
        closeNotif,
        createBonus,
        handleDeleteBonus
    } = useBonusCustom();

    // Form State
    const [selectedPegawaiIds, setSelectedPegawaiIds] = useState<string[]>([]);
    const [tanggal, setTanggal] = useState("");
    const [keterangan, setKeterangan] = useState("");
    const [nominal, setNominal] = useState("");

    // Form Search & Filter States
    const [formFilterDept, setFormFilterDept] = useState('');
    const [formFilterJabatan, setFormFilterJabatan] = useState('');
    const [formSearchQuery, setFormSearchQuery] = useState('');

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedPegawaiIds.length === 0 || !tanggal || !keterangan || !nominal) return;

        createBonus({
            pegawai_ids: selectedPegawaiIds,
            tanggal_diberikan: tanggal,
            keterangan: keterangan,
            nominal: Number(nominal)
        }, {
            onSuccess: () => {
                // Reset form setelah sukses
                setSelectedPegawaiIds([]);
                setTanggal("");
                setKeterangan("");
                setNominal("");
            }
        });
    };

    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
            
            {/* HEADER */}
            <div data-tour="bonus-header" className="flex items-center gap-3 border-b pb-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-800">Bonus Custom</h1>

                </div>
            </div>

            {/* FORM INPUT BONUS BARU */}
            <div data-tour="bonus-form" className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 w-full">
                <h2 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">Buat Bonus Baru</h2>
                
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* KIRI: PENGATURAN BONUS (1 KOLOM) */}
                    <div className="lg:col-span-1 flex flex-col gap-4 w-full">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">1. Pengaturan Gaji/Bonus</h3>
                        
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Diberikan</label>
                            <input 
                                type="date" 
                                value={tanggal} 
                                onChange={(e) => setTanggal(e.target.value)} 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Keterangan / Nama Bonus</label>
                            <input 
                                type="text" 
                                placeholder="Cth: Reward Teladan, Ganti Bensin"
                                value={keterangan} 
                                onChange={(e) => setKeterangan(e.target.value)} 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                required
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-semibold text-gray-700">Nominal (Rp)</label>
                                {nominal && (
                                    <span className="text-xs font-bold text-green-600 animate-in fade-in duration-200">
                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(nominal))}
                                    </span>
                                )}
                            </div>
                            <input 
                                type="number" 
                                placeholder="Cth: 50000"
                                value={nominal} 
                                onChange={(e) => setNominal(e.target.value)} 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                min="1"
                                required
                            />
                        </div>
                    </div>

                    {/* KANAN: PILIH KARYAWAN PENERIMA (2 KOLOM) */}
                    <div className="lg:col-span-2 flex flex-col gap-4 w-full">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">2. Pilih Karyawan Penerima</h3>
                        
                        {/* Filters & Search */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                                <select
                                    value={formFilterDept}
                                    onChange={(e) => {
                                        setFormFilterDept(e.target.value);
                                        setFormFilterJabatan('');
                                    }}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none text-xs"
                                >
                                    <option value="">Semua Departemen</option>
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
                                    className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none text-xs ${!formFilterDept ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'}`}
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
                                    placeholder="Cari nama karyawan..."
                                    value={formSearchQuery}
                                    onChange={(e) => setFormSearchQuery(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 focus:outline-none text-xs bg-white"
                                />
                            </div>
                        </div>

                        {/* Checklist box */}
                        <div className="border border-gray-300 rounded-lg p-2 h-44 overflow-y-auto bg-white flex flex-col gap-1.5 w-full">
                            {formFilteredPegawai.map((p: any) => {
                                const isChecked = selectedPegawaiIds.includes(String(p.id));
                                return (
                                    <label key={p.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded select-none">
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
                                            <span className="font-semibold text-gray-800 leading-none">{p.nama}</span>
                                            <span className="text-[10px] text-gray-400 mt-0.5">
                                                {p.jabatan?.departemen?.nama_departemen || "-"} &middot; {p.jabatan?.nama_jabatan || "Karyawan"}
                                            </span>
                                        </div>
                                    </label>
                                );
                            })}
                            {formFilteredPegawai.length === 0 && (
                                <span className="text-xs text-gray-400 italic text-center my-auto">Karyawan tidak ditemukan.</span>
                            )}
                        </div>

                        {/* Quick select buttons */}
                        <div className="flex flex-wrap gap-2 justify-between items-center w-full">
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const filteredIds = formFilteredPegawai.map((p: any) => String(p.id));
                                        setSelectedPegawaiIds(prev => {
                                            const next = [...prev];
                                            filteredIds.forEach((id: string) => {
                                                if (!next.includes(id)) next.push(id);
                                            });
                                            return next;
                                        });
                                    }}
                                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 border border-indigo-200 rounded px-2 py-1 transition-colors cursor-pointer"
                                >
                                    Pilih Semua Terfilter
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const filteredIds = formFilteredPegawai.map((p: any) => String(p.id));
                                        setSelectedPegawaiIds(prev => prev.filter(id => !filteredIds.includes(id)));
                                    }}
                                    className="text-[11px] font-semibold text-red-600 hover:text-red-800 hover:bg-red-50 border border-red-200 rounded px-2 py-1 transition-colors cursor-pointer"
                                >
                                    Batal Pilih Terfilter
                                </button>
                            </div>
                            <span className="text-xs text-gray-500 font-semibold">
                                Terpilih: <span className="text-green-600 font-bold">{selectedPegawaiIds.length}</span> Karyawan
                            </span>
                        </div>
                    </div>

                    {/* FOOTER BUTTONS */}
                    <div className="lg:col-span-3 flex flex-col sm:flex-row justify-between items-start sm:items-center mt-2 border-t pt-3 gap-2 w-full">
                        <p className="text-[11px] text-gray-400 font-medium">*Penentu bonus masuk ke periode gaji minggu/bulan ke berapa.</p>
                        <Button 
                            type="submit" 
                            label={isCreating ? "Menyimpan..." : "Simpan Bonus"} 
                            variant="primary" 
                            icon={isCreating ? <Loader2 className="animate-spin" size={18} /> : <PlusCircle size={18} />} 
                            disabled={isCreating || selectedPegawaiIds.length === 0}
                            className="w-full sm:w-auto justify-center"
                        />
                    </div>
                </form>
            </div>

            {/* TABEL RIWAYAT BONUS (FULL WIDTH) */}
            <div data-tour="bonus-table" className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col w-full">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-700">Riwayat Pemberian Bonus</h2>
                </div>
                
                {isLoadingBonus ? (
                    <div className="p-10 flex justify-center text-gray-500"><Loader2 className="animate-spin" size={32} /></div>
                ) : (
                    <TabelBonusCustom data={listBonus} listPegawai={listPegawai} onDelete={handleDeleteBonus} />
                )}
            </div>

            <Notif show={notif.show} message={notif.message} type={notif.type} onClose={closeNotif} />
        </div>
    );
}
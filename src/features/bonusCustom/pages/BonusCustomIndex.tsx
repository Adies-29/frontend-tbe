import { useState } from 'react';
import { Gift, PlusCircle, Loader2 } from 'lucide-react';
import Button from '../../../components/common/Button';
import Notif from '../../../components/common/Notif';
import { TabelBonusCustom } from '../components/TabelBonusCustom';
import { useBonusCustom } from '../hooks/useBonusCustom';


export default function BonusCustomIndex() {
    
    const {
        listPegawai,
        listBonus,
        isLoadingPegawai,
        isLoadingBonus,
        isCreating,
        notif,
        closeNotif,
        createBonus,
        handleDeleteBonus
    } = useBonusCustom();

    // Form State
    const [pegawaiId, setPegawaiId] = useState("");
    const [tanggal, setTanggal] = useState("");
    const [keterangan, setKeterangan] = useState("");
    const [nominal, setNominal] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!pegawaiId || !tanggal || !keterangan || !nominal) return;

        createBonus({
            pegawai_id: pegawaiId,
            tanggal_diberikan: tanggal,
            keterangan: keterangan,
            nominal: Number(nominal)
        }, {
            onSuccess: () => {
                // Reset form setelah sukses
                setPegawaiId("");
                setTanggal("");
                setKeterangan("");
                setNominal("");
            }
        });
    };

    return (
        <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
            
            {/* HEADER */}
            <div className="flex items-center gap-3 border-b pb-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                    <Gift size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-gray-800">Bonus Custom & Ad-Hoc</h1>
                    <p className="text-sm text-gray-500">Berikan bonus manual di luar sistem absensi yang akan otomatis masuk ke struk gaji.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* KIRI: FORM INPUT BONUS BARU */}
                <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl shadow-sm p-5 h-fit">
                    <h2 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">Buat Bonus Baru</h2>
                    
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Pegawai</label>
                            <select 
                                value={pegawaiId} 
                                onChange={(e) => setPegawaiId(e.target.value)} 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                disabled={isLoadingPegawai}
                                required
                            >
                                <option value="">-- Pilih Pegawai --</option>
                                {listPegawai.map((p: any) => (
                                    <option key={p.id} value={p.id}>{p.nama}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Diberikan</label>
                            <input 
                                type="date" 
                                value={tanggal} 
                                onChange={(e) => setTanggal(e.target.value)} 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                required
                            />
                            <p className="text-[11px] text-gray-400 mt-1">*Penentu bonus masuk ke periode gaji minggu/bulan ke berapa.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan / Nama Bonus</label>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nominal (Rp)</label>
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

                        <Button 
                            type="submit" 
                            label={isCreating ? "Menyimpan..." : "Simpan Bonus"} 
                            variant="primary" 
                            icon={isCreating ? <Loader2 className="animate-spin" size={18} /> : <PlusCircle size={18} />} 
                            className="w-full mt-2 justify-center"
                            disabled={isCreating}
                        />
                    </form>
                </div>

                {/* KANAN: TABEL RIWAYAT BONUS */}
                <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-700">Riwayat Pemberian Bonus</h2>
                    </div>
                    
                    {isLoadingBonus ? (
                        <div className="p-10 flex justify-center text-gray-500"><Loader2 className="animate-spin" size={32} /></div>
                    ) : (
                        <TabelBonusCustom data={listBonus} onDelete={handleDeleteBonus} />
                    )}
                </div>

            </div>

            <Notif show={notif.show} message={notif.message} type={notif.type} onClose={closeNotif} />
        </div>
    );
}
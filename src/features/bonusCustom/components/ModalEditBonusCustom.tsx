import React, { useState, useEffect } from 'react';
import { X, Pencil, Loader2 } from 'lucide-react';
import Button from '../../../components/common/Button';
import type { BonusCustomData } from './TabelBonusCustom';

interface ModalEditBonusCustomProps {
    isOpen: boolean;
    onClose: () => void;
    bonusData: BonusCustomData | null;
    listPegawai: any[];
    isUpdating: boolean;
    onSubmit: (
        data: {
            id: string;
            pegawai_id: string;
            tanggal_diberikan: string;
            keterangan: string;
            nominal: number;
        },
        callbacks: { onSuccess: () => void }
    ) => void;
}

export default function ModalEditBonusCustom({
    isOpen,
    onClose,
    bonusData,
    listPegawai,
    isUpdating,
    onSubmit
}: ModalEditBonusCustomProps) {
    const [pegawaiId, setPegawaiId] = useState<string>('');
    const [tanggal, setTanggal] = useState<string>('');
    const [keterangan, setKeterangan] = useState<string>('');
    const [nominal, setNominal] = useState<string>('');

    useEffect(() => {
        if (isOpen && bonusData) {
            setPegawaiId(bonusData.pegawai_id || '');
            setTanggal(bonusData.tanggal_diberikan || '');
            setKeterangan(bonusData.keterangan || '');
            setNominal(String(bonusData.nominal || ''));
        }
    }, [isOpen, bonusData]);

    if (!isOpen || !bonusData) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!pegawaiId || !tanggal || !keterangan || !nominal) return;

        onSubmit(
            {
                id: bonusData.id,
                pegawai_id: pegawaiId,
                tanggal_diberikan: tanggal,
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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 animate-in zoom-in-95 my-auto flex flex-col">
                
                {/* MODAL HEADER */}
                <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                            <Pencil size={18} />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-gray-800 text-base">Edit Bonus Custom</h3>
                            <p className="text-xs text-gray-500 font-semibold mt-0.5">
                                Ubah rincian pemberian bonus untuk {bonusData.nama_pegawai}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                        title="Tutup Modal"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* FORM BODY */}
                <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Karyawan Penerima
                        </label>
                        <select
                            value={pegawaiId}
                            onChange={(e) => setPegawaiId(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white font-semibold"
                            required
                        >
                            <option value="">-- Pilih Karyawan --</option>
                            {listPegawai.map((p: any) => (
                                <option key={p.id} value={String(p.id)}>
                                    {p.nama} ({p.jabatan?.departemen?.nama_departemen || '-'} &middot; {p.jabatan?.nama_jabatan || '-'})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Tanggal Diberikan
                        </label>
                        <input 
                            type="date" 
                            value={tanggal} 
                            onChange={(e) => setTanggal(e.target.value)} 
                            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white font-semibold"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Keterangan / Nama Bonus
                        </label>
                        <input 
                            type="text" 
                            placeholder="Cth: Reward Teladan, Ganti Bensin"
                            value={keterangan} 
                            onChange={(e) => setKeterangan(e.target.value)} 
                            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white"
                            required
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-bold text-gray-700">
                                Nominal (Rp)
                            </label>
                            {nominal && (
                                <span className="text-xs font-extrabold text-green-600 animate-in fade-in duration-200">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(nominal))}
                                </span>
                            )}
                        </div>
                        <input 
                            type="number" 
                            placeholder="Cth: 50000"
                            value={nominal} 
                            onChange={(e) => setNominal(e.target.value)} 
                            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white font-bold"
                            min="1"
                            required
                        />
                    </div>

                    {/* MODAL FOOTER */}
                    <div className="pt-3 border-t border-gray-200 flex justify-end items-center gap-3 mt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            label="Batal"
                            onClick={onClose}
                            className="px-4 py-2 text-xs"
                        />
                        <Button 
                            type="submit" 
                            label={isUpdating ? "Menyimpan..." : "Simpan Perubahan"} 
                            variant="primary" 
                            icon={isUpdating ? <Loader2 className="animate-spin" size={16} /> : <Pencil size={16} />} 
                            disabled={isUpdating || !pegawaiId || !tanggal || !keterangan || !nominal}
                            className="px-5 py-2 text-xs font-bold shadow-md"
                        />
                    </div>
                </form>

            </div>
        </div>
    );
}

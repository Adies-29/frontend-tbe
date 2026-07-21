import React, { useState, useEffect } from 'react';
import { X, User, Lock } from 'lucide-react';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/InputText';
import type { PotonganCustomData } from './TabelPotonganCustom';

interface ModalEditPotonganCustomProps {
    isOpen: boolean;
    onClose: () => void;
    potonganData: PotonganCustomData | null;
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

export default function ModalEditPotonganCustom({
    isOpen,
    onClose,
    potonganData,
    listPegawai,
    isUpdating,
    onSubmit
}: ModalEditPotonganCustomProps) {
    const [pegawaiId, setPegawaiId] = useState<string>('');
    const [tanggal, setTanggal] = useState<string>('');
    const [keterangan, setKeterangan] = useState<string>('');
    const [nominal, setNominal] = useState<string>('');

    useEffect(() => {
        if (isOpen && potonganData) {
            setPegawaiId(potonganData.pegawai_id || '');
            setTanggal(potonganData.tanggal_diberikan || '');
            setKeterangan(potonganData.keterangan || '');
            setNominal(String(potonganData.nominal || ''));
        }
    }, [isOpen, potonganData]);

    if (!isOpen || !potonganData) return null;

    // Find employee detail from listPegawai
    const selectedPegawai = listPegawai.find(p => String(p.id) === String(potonganData.pegawai_id));
    const deptNama = selectedPegawai?.jabatan?.departemen?.nama_departemen || 'Umum';
    const jabNama = selectedPegawai?.jabatan?.nama_jabatan || 'Pegawai';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!pegawaiId || !tanggal || !keterangan || !nominal) return;

        onSubmit(
            {
                id: potonganData.id,
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
                        <div>
                            <h3 className="font-extrabold text-gray-800 text-base">Edit Potongan Custom</h3>
                            <p className="text-xs text-gray-500 font-semibold mt-0.5">
                                Perbarui rincian pemotongan gaji Pegawai
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
                    
                    {/* KARYAWAN PENERIMA (READ-ONLY CARD) */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                            <span>Pegawai Penerima Potongan</span>
                            <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                                <Lock size={10} /> Tidak dapat diubah saat edit
                            </span>
                        </label>
                        <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-50 text-red-600 rounded-lg border border-red-100">
                                    <User size={16} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-gray-800">
                                        {potonganData.nama_pegawai}
                                    </span>
                                    <span className="text-[10px] text-gray-500 font-medium">
                                        {deptNama} &middot; {jabNama}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TANGGAL DIBERIKAN */}
                    <Input
                        label="Tanggal Diberikan"
                        type="date"
                        value={tanggal}
                        onChange={(e) => setTanggal(e.target.value)}
                        required
                    />

                    {/* KETERANGAN */}
                    <Input
                        label="Keterangan / Alasan Potongan"
                        type="text"
                        placeholder="Cth: Potongan Kerusakan Alat, Denda Seragam"
                        value={keterangan}
                        onChange={(e) => setKeterangan(e.target.value)}
                        required
                    />

                    {/* NOMINAL */}
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

                    {/* MODAL FOOTER */}
                    <div className="pt-3 border-t border-gray-200 flex justify-end items-center gap-3 mt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            label="Batal"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold"
                        />
                        <Button 
                            type="submit" 
                            label={isUpdating ? "Menyimpan..." : "Simpan Perubahan"} 
                            variant="danger" 
                            isLoading={isUpdating} 
                            disabled={isUpdating || !pegawaiId || !tanggal || !keterangan || !nominal}
                            className="px-5 py-2 text-xs font-bold shadow-md cursor-pointer"
                        />
                    </div>
                </form>

            </div>
        </div>
    );
}

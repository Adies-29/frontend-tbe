import { X, Target, Trash2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import Button from '../../../components/common/Button';
import type { SelectedCell, TargetDetail } from '../hooks/useMatrixPencapaian';


interface ModalInputPencapaianProps {
    isModalOpen: boolean;
    setIsModalOpen: (val: boolean) => void;
    selectedCell: SelectedCell;
    listMasterTargets: any[];
    pencapaianExisting: { totalPack: number, totalNominal: number, details: TargetDetail[] } | null;
    isSaving: boolean;
    onSave: (data: { master_target_id: number, jumlah: number }) => Promise<void>;
    onDelete: (pencapaianId: number) => Promise<void>;
}

export default function ModalInputPencapaian(props: ModalInputPencapaianProps) {
    const [selectedTargetId, setSelectedTargetId] = useState("");
    const [jumlah, setJumlah] = useState("");
    const [editingItem, setEditingItem] = useState<TargetDetail | null>(null);

    const targetDetails = useMemo(() => {
        if (!selectedTargetId) return null;
        return props.listMasterTargets.find(t => t.id.toString() === selectedTargetId);
    }, [selectedTargetId, props.listMasterTargets]);

    const nominalPreview = useMemo(() => {
        if (!targetDetails || !jumlah) return 0;
        return targetDetails.harga_satuan * parseInt(jumlah);
    }, [targetDetails, jumlah]);

    const handleEditClick = (item: TargetDetail) => {
        // Klik baris yang sama = batal edit
        if (editingItem?.pencapaian_id === item.pencapaian_id) {
            setEditingItem(null);
            setSelectedTargetId("");
            setJumlah("");
            return;
        }
        setEditingItem(item);
        setSelectedTargetId(item.master_target_id.toString());
        setJumlah(item.jumlah_pencapaian.toString());
    };

    const handleSave = () => {
        if (!selectedTargetId || !jumlah) return;
        props.onSave({
            master_target_id: parseInt(selectedTargetId),
            jumlah: parseInt(jumlah)
        });
        // reset form & edit mode
        setEditingItem(null);
        setSelectedTargetId("");
        setJumlah("");
    };

    if (!props.isModalOpen) return null;

    const isEditMode = editingItem !== null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200">
                
                <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                            <Target size={20} className="text-blue-600" /> Pencapaian Target
                        </h3>
                        <p className="text-xs text-gray-500 font-semibold mt-0.5">
                            {props.selectedCell.pegawaiNama} • {new Date(props.selectedCell.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <button onClick={() => props.setIsModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-5 max-h-[70vh] overflow-y-auto">
                    {/* BAGIAN 1: RIWAYAT HARI INI */}
                    <div className="mb-6">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Target Tercapai Hari Ini</h4>
                        
                        {(!props.pencapaianExisting || props.pencapaianExisting.details.length === 0) ? (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-sm text-gray-500 italic">
                                Belum ada pencapaian target yang dicatat hari ini.
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-600 text-[11px] uppercase border-b border-gray-200">
                                            <tr>
                                                <th className="px-3 py-2 font-semibold">Nama Target</th>
                                                <th className="px-3 py-2 font-semibold text-right">Jumlah</th>
                                                <th className="px-3 py-2 font-semibold text-right">Nominal</th>
                                                <th className="px-3 py-2 w-16"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {props.pencapaianExisting.details.map((item, idx) => {
                                                const isBeingEdited = editingItem?.pencapaian_id === item.pencapaian_id;
                                                return (
                                                    <tr 
                                                        key={idx} 
                                                        className={`transition-colors group cursor-pointer ${
                                                            isBeingEdited 
                                                                ? 'bg-blue-50 ring-1 ring-inset ring-blue-300' 
                                                                : 'bg-white hover:bg-blue-50/50'
                                                        }`}
                                                        onClick={() => handleEditClick(item)}
                                                        title="Klik untuk edit"
                                                    >
                                                        <td className="px-3 py-2.5 font-medium text-gray-800">{item.nama_target}</td>
                                                        <td className="px-3 py-2.5 text-right font-bold text-emerald-600">{item.jumlah_pencapaian}</td>
                                                        <td className="px-3 py-2.5 text-right text-gray-600">
                                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.nominal)}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right">
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); props.onDelete(item.pencapaian_id); }}
                                                                className="text-red-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all p-1"
                                                                title="Hapus"
                                                                disabled={props.isSaving}
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            <tr className="bg-emerald-50 font-bold border-t-2 border-emerald-100">
                                                <td className="px-3 py-2 text-emerald-800">TOTAL</td>
                                                <td className="px-3 py-2 text-right text-emerald-800">{props.pencapaianExisting.totalPack}</td>
                                                <td className="px-3 py-2 text-right text-emerald-800">
                                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(props.pencapaianExisting.totalNominal)}
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-gray-200 my-4"></div>

                    {/* BAGIAN 2: FORM INPUT / EDIT */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: isEditMode ? '#2563eb' : '#6b7280' }}>
                            {isEditMode ? `Edit: ${editingItem?.nama_target}` : 'Tambah Pencapaian Baru'}
                        </h4>
                        
                        <div className={`flex flex-col gap-4 p-4 rounded-xl border ${isEditMode ? 'bg-blue-50/50 border-blue-200' : 'bg-blue-50/50 border-blue-100'}`}>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-gray-700">Pilih Jenis Target</label>
                                <select 
                                    value={selectedTargetId}
                                    onChange={(e) => setSelectedTargetId(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-blue-500 shadow-sm bg-white outline-none w-full"
                                    disabled={isEditMode}
                                >
                                    <option value="">-- Pilih Master Target --</option>
                                    {props.listMasterTargets.map((target) => (
                                        <option key={target.id} value={target.id}>
                                            {target.nama_target} ({new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(target.harga_satuan)}/pack)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex flex-col gap-1.5 flex-1">
                                    <label className="text-sm font-semibold text-gray-700">Jumlah (Pack)</label>
                                    <input 
                                        type="number" 
                                        min="1"
                                        placeholder="Contoh: 150"
                                        value={jumlah}
                                        onChange={(e) => setJumlah(e.target.value)}
                                        className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-blue-500 shadow-sm bg-white outline-none w-full"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5 flex-1">
                                    <label className="text-sm font-semibold text-gray-700">Preview Nominal</label>
                                    <div className="bg-gray-100 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-600 font-semibold flex items-center h-[42px]">
                                        {nominalPreview > 0 
                                            ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(nominalPreview)
                                            : "Rp 0"}
                                    </div>
                                </div>
                            </div>

                            <Button 
                                label={props.isSaving ? "Menyimpan..." : (isEditMode ? "Perbarui Pencapaian" : "Simpan Pencapaian")} 
                                variant={isEditMode ? 'success' : 'success'}
                                className="mt-2 w-full" 
                                disabled={props.isSaving || !selectedTargetId || !jumlah || parseInt(jumlah) <= 0}
                                onClick={handleSave} 
                            />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

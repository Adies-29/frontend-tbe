import { X, UserCog, Edit3, ArrowDownUp, MousePointerClick } from 'lucide-react';
import Button from '../../../components/common/Button';
import type { SelectedCell } from '../hooks/useMatrixJadwal';


interface ModalKelolaShiftProps {
    isModalOpen: boolean;
    setIsModalOpen: (val: boolean) => void;
    selectedCell: SelectedCell;
    cellTujuan: SelectedCell | null;
    modeAksi: 'ubah' | 'tukar';
    setModeAksi: (val: 'ubah' | 'tukar') => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listMasterShifts: any[];
    inputShiftId: string;
    setInputShiftId: (val: string) => void;
    setPickerActive: (val: 'asal' | 'tujuan' | 'none') => void;
    isSaving: boolean;
    handleSimpanShiftHarian: () => void;
    handleProsesTukarShift: () => void;
}

export default function ModalKelolaShift(props: ModalKelolaShiftProps) {
    if (!props.isModalOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200">
                
                <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-gray-800 text-lg">Kelola Slot Jadwal Kerja</h3>
                        <p className="text-xs text-gray-500 font-semibold mt-0.5">{props.selectedCell.pegawaiNama} • {props.selectedCell.tanggal}</p>
                    </div>
                    <button onClick={() => props.setIsModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex border-b border-gray-200 bg-gray-50/50">
                    <button 
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${props.modeAksi === 'ubah' ? 'border-b-2 border-blue-600 text-blue-700 bg-white' : 'text-gray-500 hover:bg-gray-100'}`}
                        onClick={() => props.setModeAksi('ubah')}
                    >
                        Ganti Shift Satuan
                    </button>
                    <button 
                        className={`flex-1 py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${props.modeAksi === 'tukar' ? 'border-b-2 border-blue-600 text-blue-700 bg-white' : 'text-gray-500 hover:bg-gray-100'}`}
                        onClick={() => props.setModeAksi('tukar')}
                    >
                        <UserCog size={16} /> Tukar Lintas Hari
                    </button>
                </div>

                <div className="p-5">
                    {props.modeAksi === 'ubah' ? (
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Pilih Shift Baru</label>
                                <select 
                                    value={props.inputShiftId}
                                    onChange={(e) => props.setInputShiftId(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 shadow-sm bg-white outline-none w-full"
                                >
                                    <option value="">-- Pilih Aturan Shift --</option>
                                    {props.listMasterShifts.map((shift) => (
                                        <option key={shift.id} value={shift.id}>
                                            {shift.kode_shift} ({shift.jam_masuk?.substring(0, 5)} - {shift.jam_pulang?.substring(0, 5)})
                                        </option>
                                    ))}
                                    <option value="off">LIBUR (OFF)</option>
                                </select>
                            </div>
                            <Button 
                                label={props.isSaving ? "Menyimpan..." : "Simpan Perubahan"} 
                                variant='success'
                                className="mt-2 w-full" 
                                disabled={props.isSaving}
                                onClick={props.handleSimpanShiftHarian} 
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <div className="bg-blue-50 text-blue-800 text-[11px] p-2.5 rounded border border-blue-200 font-medium">
                                Klik pada kotak di bawah ini untuk memilih jadwal langsung dari tabel kalender.
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Jadwal Asal</label>
                                <div 
                                    onClick={() => { props.setIsModalOpen(false); props.setPickerActive('asal'); }}
                                    className="border border-gray-300 rounded-lg p-3 flex justify-between items-center bg-white cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group"
                                >
                                    <div>
                                        <p className="font-bold text-gray-800 text-sm group-hover:text-blue-600 transition-colors">{props.selectedCell.pegawaiNama}</p>
                                        <p className="text-xs text-gray-500">{props.selectedCell.tanggal}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded border shadow-sm ${props.selectedCell.warna || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                            {props.selectedCell.shiftKode || 'OFF'}
                                        </span>
                                        <Edit3 size={14} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-center -my-3 z-10 relative">
                                <div className="bg-white border border-gray-200 shadow-sm p-1.5 rounded-full text-blue-600">
                                    <ArrowDownUp size={16} />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1 mt-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Jadwal Tujuan (Target)</label>
                                <div 
                                    onClick={() => { props.setIsModalOpen(false); props.setPickerActive('tujuan'); }}
                                    className={`border rounded-lg p-3 flex justify-between items-center cursor-pointer transition-all group ${props.cellTujuan ? 'border-gray-300 bg-white hover:border-blue-500 hover:shadow-md' : 'border-dashed border-blue-400 bg-blue-50 hover:bg-blue-100 hover:border-blue-600'}`}
                                >
                                    {props.cellTujuan ? (
                                        <>
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm group-hover:text-blue-600 transition-colors">{props.cellTujuan.pegawaiNama}</p>
                                                <p className="text-xs text-gray-500">{props.cellTujuan.tanggal}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded border shadow-sm ${props.cellTujuan.warna || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                                    {props.cellTujuan.shiftKode || 'OFF'}
                                                </span>
                                                <Edit3 size={14} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-blue-600 text-xs font-bold w-full py-2 text-center flex items-center justify-center gap-2">
                                            <MousePointerClick size={16} className="animate-bounce" /> KLIK UNTUK MEMILIH SEL DI TABEL
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button 
                                label={props.isSaving ? "Memproses Tukar..." : "Konfirmasi Pertukaran"} 
                                className="mt-3 w-full" 
                                variant='success'
                                disabled={props.isSaving || !props.cellTujuan}
                                onClick={props.handleProsesTukarShift} 
                            />
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

import { X } from 'lucide-react';
import Button from '../../../components/common/Button';

interface DisplayItem {
    id: string | number;
    label: string;
    subLabel: string;
    pegawaiIds: number[];
}

interface ModalGenerateMassalProps {
    isModalMassalOpen: boolean;
    setIsModalMassalOpen: (val: boolean) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listPegawai: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listMasterShifts: any[];
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
}

export default function ModalGenerateMassal(props: ModalGenerateMassalProps) {
    if (!props.isModalMassalOpen) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getDeptName = (p: any) => p.departemen?.nama_departemen || p.jabatan?.departemen?.nama_departemen || 'Umum';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getJabName = (p: any) => p.jabatan?.nama_jabatan || p.jabatan || 'Tanpa Jabatan';

    const uniqueDepartemen = Array.from(new Set(props.listPegawai.map(getDeptName)));
    const pInSelectedDept = props.listPegawai.filter(p => getDeptName(p) === props.filterLevel2);
    const uniqueJabatanInDept = Array.from(new Set(pInSelectedDept.map(getJabName)));

    let displayList: DisplayItem[] = [];

    if (props.filterLevel1 === 'all_karyawan') {
        displayList = props.listPegawai.map(p => ({
            id: p.id, label: p.nama, subLabel: getJabName(p), pegawaiIds: [p.id]
        }));
    } else if (props.filterLevel1 === 'filter_departemen') {
        if (props.filterLevel2 === '') {
            uniqueDepartemen.forEach(deptName => {
                const pInDept = props.listPegawai.filter(p => getDeptName(p) === deptName);
                displayList.push({ id: deptName as string, label: deptName as string, subLabel: `${pInDept.length} Pegawai`, pegawaiIds: pInDept.map(p => p.id) });
            });
        } else if (props.filterLevel3 === '') {
            uniqueJabatanInDept.forEach(jabName => {
                const pInJab = pInSelectedDept.filter(p => getJabName(p) === jabName);
                displayList.push({ id: jabName as string, label: jabName as string, subLabel: `${pInJab.length} Pegawai`, pegawaiIds: pInJab.map(p => p.id) });
            });
        } else {
            const pFinal = pInSelectedDept.filter(p => getJabName(p) === props.filterLevel3);
            displayList.push(...pFinal.map(p => ({
                id: p.id, label: p.nama, subLabel: p.nik || '-', pegawaiIds: [p.id]
            })));
        }
    }

    const isItemSelected = (itemIds: number[]) => itemIds.length > 0 && itemIds.every(id => props.selectedPegawaiIds.includes(id));

    const handleToggleItem = (itemIds: number[]) => {
        if (isItemSelected(itemIds)) {
            props.setSelectedPegawaiIds(prev => prev.filter(id => !itemIds.includes(id)));
        } else {
            props.setSelectedPegawaiIds(prev => Array.from(new Set([...prev, ...itemIds])));
        }
    };

    const visiblePegawaiIds = Array.from(new Set(displayList.flatMap(item => item.pegawaiIds)));
    const isAllVisibleSelected = visiblePegawaiIds.length > 0 && visiblePegawaiIds.every(id => props.selectedPegawaiIds.includes(id));

    const handleSelectAllVisible = () => {
        if (isAllVisibleSelected) {
            props.setSelectedPegawaiIds(prev => prev.filter(id => !visiblePegawaiIds.includes(id)));
        } else {
            props.setSelectedPegawaiIds(prev => Array.from(new Set([...prev, ...visiblePegawaiIds])));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 animate-in zoom-in-95">
                
                <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-gray-800 text-lg">Generate Jadwal Massal</h3>
                        <p className="text-xs text-gray-500 font-semibold mt-0.5">Buat slot jadwal untuk banyak tanggal sekaligus</p>
                    </div>
                    <button onClick={() => props.setIsModalMassalOpen(false)} className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-5 flex flex-col gap-4">
                    
                    <div className="flex flex-col gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Pilih Pegawai Target</label>
                        
                        <div className="flex flex-wrap gap-2">
                            <select 
                                value={props.filterLevel1} 
                                onChange={(e) => {
                                    props.setFilterLevel1(e.target.value as 'all_karyawan' | 'filter_departemen');
                                    props.setFilterLevel2("");
                                    props.setFilterLevel3("");
                                }}
                                className="border border-gray-300 rounded px-2 py-1.5 text-xs outline-none flex-1 min-w-[130px] bg-white"
                            >
                                <option value="all_karyawan">Semua Pegawai</option>
                                <option value="filter_departemen">Filter Departemen</option>
                            </select>

                            {props.filterLevel1 === 'filter_departemen' && (
                                <select 
                                    value={props.filterLevel2} 
                                    onChange={(e) => {
                                        props.setFilterLevel2(e.target.value);
                                        props.setFilterLevel3("");
                                    }} 
                                    className="border border-gray-300 rounded px-2 py-1.5 text-xs outline-none flex-1 min-w-[130px] bg-white"
                                >
                                    <option value="">-- Pilih Departemen --</option>
                                    {uniqueDepartemen.map(d => <option key={d as string} value={d as string}>{d as string}</option>)}
                                </select>
                            )}

                            {props.filterLevel1 === 'filter_departemen' && props.filterLevel2 !== '' && (
                                <select 
                                    value={props.filterLevel3} 
                                    onChange={(e) => props.setFilterLevel3(e.target.value)} 
                                    className="border border-gray-300 rounded px-2 py-1.5 text-xs outline-none flex-1 min-w-[130px] bg-white"
                                >
                                    <option value="">-- Pilih Jabatan --</option>
                                    {uniqueJabatanInDept.map(j => <option key={j as string} value={j as string}>{j as string}</option>)}
                                </select>
                            )}
                        </div>

                        <div className="border border-gray-300 bg-white rounded-lg flex flex-col mt-1 shadow-sm">
                            <label className="flex items-center gap-2 p-2.5 border-b border-gray-200 bg-blue-50/50 hover:bg-blue-50 cursor-pointer text-sm font-bold text-gray-800 rounded-t-lg transition-colors">
                                <input 
                                    type="checkbox" 
                                    checked={isAllVisibleSelected}
                                    onChange={handleSelectAllVisible}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300"
                                />
                                Pilih Semua ({visiblePegawaiIds.length} Karyawan)
                            </label>

                            <div className="max-h-40 overflow-y-auto p-2 flex flex-col gap-1 custom-scrollbar">
                                {displayList.length === 0 ? (
                                    <p className="text-xs text-gray-400 text-center py-4">Data tidak ditemukan.</p>
                                ) : (
                                    displayList.map(item => (
                                        <label key={item.id} className="flex items-center gap-2 p-1.5 hover:bg-blue-50 cursor-pointer rounded text-sm transition-colors border border-transparent hover:border-blue-100">
                                            <input 
                                                type="checkbox" 
                                                checked={isItemSelected(item.pegawaiIds)}
                                                onChange={() => handleToggleItem(item.pegawaiIds)}
                                                className="w-4 h-4 text-blue-600 rounded border-gray-300"
                                            />
                                            <span className="text-gray-800 font-medium">{item.label}</span>
                                            <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 ml-auto border border-gray-200 whitespace-nowrap">
                                                {item.subLabel}
                                            </span>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>
                        
                        <div className="text-[10px] font-bold text-blue-600 text-right mt-1">
                            ✓ Total Target: {props.selectedPegawaiIds.length} Pegawai Terpilih
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Dari Tanggal</label>
                            <input 
                                type="date" 
                                value={props.massalTanggalMulai}
                                onChange={(e) => props.setMassalTanggalMulai(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 shadow-sm outline-none w-full" 
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Sampai Tanggal</label>
                            <input 
                                type="date" 
                                value={props.massalTanggalSelesai}
                                onChange={(e) => props.setMassalTanggalSelesai(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 shadow-sm outline-none w-full" 
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5 mt-2">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Pilihan Shift</label>
                        <select 
                            value={props.massalShiftId}
                            onChange={(e) => props.setMassalShiftId(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 shadow-sm bg-white outline-none w-full"
                        >
                            <option value="">-- Gunakan Shift Default Pegawai --</option>
                            {props.listMasterShifts.map((shift) => (
                                <option key={shift.id} value={shift.id}>
                                    OVERRIDE JADI: {shift.kode_shift} ({shift.jam_masuk?.substring(0, 5)} - {shift.jam_pulang?.substring(0, 5)})
                                </option>
                            ))}
                            <option value="off">OVERRIDE JADI: LIBUR (OFF)</option>
                        </select>
                    </div>

                    <div className="bg-blue-50 text-blue-800 text-[11px] p-3 rounded border border-blue-200 mt-2">
                        💡 Jika jadwal di rentang tanggal tersebut sudah ada, sistem akan otomatis <strong>menimpa (overwrite)</strong> jadwal lama dengan jadwal baru ini.
                    </div>

                    <Button 
                        label={props.isSaving ? "Memproses Data..." : "Eksekusi Generate"} 
                        variant='success'
                        className="mt-2 w-full" 
                        disabled={props.isSaving}
                        onClick={props.handleProsesGenerateMassal} 
                    />
                </div>

            </div>
        </div>
    );
}

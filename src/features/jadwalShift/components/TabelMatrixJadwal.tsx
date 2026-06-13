import { useState, useEffect, useRef } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { Loader2, MousePointerClick, X, Search } from 'lucide-react';
import Button from '../../../components/common/Button';
import ModalKelolaShift from './ModalKelolaShift';
import ModalGenerateMassal from './ModalGenerateMassal';
import { useMatrixJadwal } from '../hooks/useMatrixJadwal';
import Notif from '../../../components/common/Notif';

export default function TabelMatrixJadwal() {
    const hookParams = useMatrixJadwal();
    const [selectedJabatan, setSelectedJabatan] = useState<string>("");

    // 1. Pindahkan helper dan definisi variabel ke atas (sebelum useEffect)
    const getDatesInRange = (startStr: string, endStr: string) => {
        const dateArray = [];
        const currentDate = new Date(startStr);
        const stopDate = new Date(endStr);
        while (currentDate <= stopDate) {
            dateArray.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dateArray;
    };

    const daysArray = getDatesInRange(hookParams.filterStartDate, hookParams.filterEndDate);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getJabName = (p: any) => p.jabatan || ""; 
    const uniqueJabatan = Array.from(new Set(hookParams.filteredMatrixKaryawan.map(getJabName))).filter(Boolean);
    const hasInitialized = useRef(false);
    // 2. BARU PASANG useEffect di bawah sini
    useEffect(() => {
        // Cek apakah sudah pernah di-inisialisasi
        if (!hasInitialized.current && uniqueJabatan.length > 0) {
            if (uniqueJabatan.includes("Web Developer")) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setSelectedJabatan("Web Developer");
            }
            // Tandai bahwa inisialisasi sudah selesai
            hasInitialized.current = true;
        }
    }, [selectedJabatan, uniqueJabatan]); // Sekarang 'uniqueJabatan' sudah dikenal di sini

    const daysInMonth = daysArray.length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getDeptName = (p: any) => p.departemen?.nama_departemen || p.departemen || "";

    // 2. Terapkan filter pada data yang akan di-render ke tabel
    const finalDataToRender = hookParams.filteredMatrixKaryawan.filter((pegawai) => {
        const matchJab = selectedJabatan ? getJabName(pegawai) === selectedJabatan : true;
        
        return matchJab;
    });

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col w-full overflow-hidden relative">
            
            {/* TOOLBAR TIMELINE FLEKSIBEL */}
            <div className="p-4 border-b border-gray-200 flex flex-wrap items-center bg-gray-50 gap-4">
                
                {/* KELOMPOK PENCARIAN & FILTER DROPDOWN */}
                <div className="flex flex-wrap gap-3 w-full md:w-auto mr-auto">
                    {/* Input Cari Nama */}
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Cari nama Pegawai..." 
                            value={hookParams.searchQuery}
                            onChange={(e) => hookParams.setSearchQuery(e.target.value)}
                            className="border border-gray-300 rounded-lg pl-9 pr-3 py-1.5 outline-none focus:border-red-500 shadow-sm text-sm w-full"
                        />
                    </div>

                    {/* Filter Jabatan */}
                    <select
                        value={selectedJabatan}
                        onChange={(e) => setSelectedJabatan(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-1.5 bg-white outline-none focus:border-red-500 shadow-sm text-sm"
                    >
                        <option value="">Semua Jabatan</option>
                        {uniqueJabatan.map((jab, idx) => (
                            <option key={idx} value={jab as string}>{jab as string}</option>
                        ))}
                    </select>
                </div>

                {/* KELOMPOK FILTER PERIODE WAKTU */}
                <div className="flex flex-wrap gap-2 items-center w-full md:w-auto px-3">
                    <select 
                        value={hookParams.periode} 
                        onChange={hookParams.handlePeriodeChange} 
                        className="border border-gray-300 rounded-lg px-3 py-1.5 bg-white outline-none focus:border-red-500 shadow-sm text-sm"
                    >
                        <option value="minggu">Mingguan</option>
                        <option value="bulan">Bulanan</option>
                        <option value="tahun">Tahunan</option>
                    </select>

                    {hookParams.periode === "minggu" && <input type="week" value={hookParams.filterValue} onChange={(e) => hookParams.setFilterValue(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:border-red-500 shadow-sm text-sm" />}
                    {hookParams.periode === "bulan" && <input type="month" value={hookParams.filterValue} onChange={(e) => hookParams.setFilterValue(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:border-red-500 shadow-sm text-sm" />}
                    {hookParams.periode === "tahun" && (
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                views={['year']}
                                value={hookParams.filterValue ? dayjs().year(parseInt(hookParams.filterValue)) : null}
                                onChange={(newValue: Dayjs | null) => newValue && hookParams.setFilterValue(newValue.year().toString())}
                                slotProps={{ textField: { size: 'small', className: "bg-white w-32", sx: { '& .MuiOutlinedInput-root': { borderRadius: '8px' } } } }}
                            />
                        </LocalizationProvider>
                    )}
                    
                    <Button label="Filter Periode" variant='warning' onClick={hookParams.handleFilter} />
                </div>

                <div className="flex gap-2">
                    <Button variant="primary" label="Generate Jadwal Massal" onClick={() => hookParams.setIsModalMassalOpen(true)} />
                </div>
            </div>

            {/* AREA MATRIX LOAD DATA */}
            {hookParams.isLoading ? (
                <div className="flex flex-col items-center justify-center h-72 text-gray-400">
                    <Loader2 className="animate-spin mb-3 text-blue-600" size={36} />
                    <p className="text-sm font-medium">Sinkronisasi Peta Shift Pegawai...</p>
                </div>
            ) : hookParams.errorMsg ? (
                <div className="p-8 text-center text-red-600 font-medium bg-red-50/50 m-4 rounded-xl border border-red-200">
                    {hookParams.errorMsg}
                </div>
            ) : (
                <div className="overflow-x-auto w-full relative">
                    <table className="w-full text-sm text-left border-collapse min-w-max">
                        <thead className="text-xs text-gray-600 uppercase bg-gray-100 sticky top-0 z-20 shadow-sm">
                            <tr>
                                <th scope="col" className="px-4 py-3 border-r border-gray-200 sticky left-0 z-30 bg-gray-100 min-w-55">
                                    Nama Pegawai
                                </th>
                                {daysArray.map((dateObj, idx) => {
                                    const isWeekend = dateObj.getDay() === 0 ;
                                    return (
                                        <th key={idx} scope="col" className={`px-2 py-3 border-r border-gray-200 text-center min-w-15 leading-tight ${isWeekend ? 'bg-red-50/50' : ''}`}>
                                            <div className={`text-lg ${isWeekend ? 'text-red-600 font-bold' : ''}`}>{dateObj.getDate()}</div>
                                            <div className={`text-[9px] ${isWeekend ? 'text-red-400 font-medium' : 'text-gray-400'}`}>
                                                {dateObj.toLocaleDateString('id-ID', { month: 'short' })}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>

                        <tbody>
                            {/* KITA GUNAKAN finalDataToRender BUKAN filteredMatrixKaryawan ASLI */}
                            {finalDataToRender.length === 0 ? (
                                <tr>
                                    <td colSpan={daysInMonth + 1} className="text-center p-10 text-gray-400 font-medium">
                                        Data jadwal Pegawai tidak ditemukan untuk filter ini.
                                    </td>
                                </tr>
                            ) : (
                                finalDataToRender.map((pegawai, index) => (
                                    <tr key={pegawai.id} className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                                        
                                        <td className="px-4 py-3 border-r border-gray-200 sticky left-0 z-10 bg-inherit shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                                            <div className="font-bold text-gray-800">{pegawai.nama}</div>
                                            {/* Tampilkan Departemen & Jabatan agar lebih informatif */}
                                            <div className="text-[11px] text-gray-500 font-medium">{getJabName(pegawai)}</div>
                                            <div className="text-[10px] text-gray-400">{getDeptName(pegawai)}</div>
                                        </td>

                                        {daysArray.map((dateObj, idx) => {
                                            const isWeekend = dateObj.getDay() === 0;
                                            const tglKey = dateObj.toLocaleDateString('en-CA');
                                            const shiftDetail = pegawai.jadwal[tglKey];

                                            return (
                                                <td key={idx} className={`p-1 border-r border-gray-100 relative group cursor-pointer transition-colors hover:bg-blue-100/30 ${isWeekend ? 'bg-red-50/10' : ''}`}
                                                    onClick={() => hookParams.handleCellClick(pegawai.id, pegawai.nama, tglKey, shiftDetail)}>
                                                    
                                                    <div className="w-full h-full min-h-10.5 flex items-center justify-center">
                                                        {shiftDetail ? (
                                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wide transition-all truncate max-w-16.25 ${shiftDetail.warna} border-none shadow-none`}>
                                                                {shiftDetail.kode.replace(/^SHIFT[\s-]?/i, '')}
                                                            </span>
                                                        ) : (
                                                            <span className="text-transparent group-hover:text-blue-300 transition-colors select-none text-lg leading-none">&middot;</span>
                                                        )}
                                                    </div>

                                                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-400/50 rounded pointer-events-none transition-colors" />
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* FLOATING BANNER SAAT MODE PICKER AKTIF */}
            {hookParams.pickerActive !== 'none' && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-100 bg-blue-600 text-white px-6 py-3 rounded-full shadow-2xl font-bold flex items-center gap-3 animate-in slide-in-from-top-10">
                    <MousePointerClick size={20} className="animate-bounce" />
                    <span className="text-sm">Silakan klik kotak jadwal di tabel untuk memilih sel {hookParams.pickerActive === 'asal' ? 'ASAL' : 'TUJUAN'}...</span>
                    <button 
                        onClick={() => { hookParams.setPickerActive('none'); hookParams.setIsModalOpen(true); }} 
                        className="ml-4 bg-white/20 p-1.5 rounded-full hover:bg-white/40 transition-colors"
                        title="Batal Memilih"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* KOMPONEN MODAL */}
            <ModalKelolaShift 
                isModalOpen={hookParams.isModalOpen}
                setIsModalOpen={hookParams.setIsModalOpen}
                selectedCell={hookParams.selectedCell}
                cellTujuan={hookParams.cellTujuan}
                modeAksi={hookParams.modeAksi}
                setModeAksi={hookParams.setModeAksi}
                listMasterShifts={hookParams.listMasterShifts}
                inputShiftId={hookParams.inputShiftId}
                setInputShiftId={hookParams.setInputShiftId}
                setPickerActive={hookParams.setPickerActive}
                isSaving={hookParams.isSaving}
                handleSimpanShiftHarian={hookParams.handleSimpanShiftHarian}
                handleProsesTukarShift={hookParams.handleProsesTukarShift}
            />

            <ModalGenerateMassal 
                isModalMassalOpen={hookParams.isModalMassalOpen}
                setIsModalMassalOpen={hookParams.setIsModalMassalOpen}
                listPegawai={hookParams.listPegawai}
                listMasterShifts={hookParams.listMasterShifts}
                filterLevel1={hookParams.filterLevel1}
                setFilterLevel1={hookParams.setFilterLevel1}
                filterLevel2={hookParams.filterLevel2}
                setFilterLevel2={hookParams.setFilterLevel2}
                filterLevel3={hookParams.filterLevel3}
                setFilterLevel3={hookParams.setFilterLevel3}
                selectedPegawaiIds={hookParams.selectedPegawaiIds}
                setSelectedPegawaiIds={hookParams.setSelectedPegawaiIds}
                massalTanggalMulai={hookParams.massalTanggalMulai}
                setMassalTanggalMulai={hookParams.setMassalTanggalMulai}
                massalTanggalSelesai={hookParams.massalTanggalSelesai}
                setMassalTanggalSelesai={hookParams.setMassalTanggalSelesai}
                massalShiftId={hookParams.massalShiftId}
                setMassalShiftId={hookParams.setMassalShiftId}
                isSaving={hookParams.isSaving}
                handleProsesGenerateMassal={hookParams.handleProsesGenerateMassal}
            />

            <Notif 
                show={hookParams.notifState.show}
                message={hookParams.notifState.message}
                type={hookParams.notifState.type}
                onClose={hookParams.closeNotif}
            />
        </div>
    );
}
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { Edit3, Loader2, MousePointerClick, X } from 'lucide-react';
import Button from '../../Button';
import { useMatrixJadwal } from './hooks/useMatrixJadwal';
import ModalKelolaShift from './ModalKelolaShift';
import ModalGenerateMassal from './ModalGenerateMassal';

export default function TabelMatrixJadwal() {
    const hookParams = useMatrixJadwal();

    // Helper untuk generate array Date
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
    const daysInMonth = daysArray.length;

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col w-full overflow-hidden relative">
            
            {/* TOOLBAR TIMELINE FLEKSIBEL */}
            <div className="p-4 border-b border-gray-200 flex flex-wrap justify-end items-center bg-gray-50 gap-4 ">
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
                    
                    <Button label="Filter" variant='warning' onClick={hookParams.handleFilter} />
                </div>

                <div className="flex gap-2">
                    <Button variant="primary" label="Generate Jadwal Massal" onClick={() => hookParams.setIsModalMassalOpen(true)} />
                </div>
            </div>

            {/* AREA MATRIX LOAD DATA */}
            {hookParams.isLoading ? (
                <div className="flex flex-col items-center justify-center h-72 text-gray-400">
                    <Loader2 className="animate-spin mb-3 text-blue-600" size={36} />
                    <p className="text-sm font-medium">Sinkronisasi Peta Shift Karyawan...</p>
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
                                <th scope="col" className="px-4 py-3 border-r border-gray-200 sticky left-0 z-30 bg-gray-100 min-w-[220px]">
                                    Nama Karyawan
                                </th>
                                {daysArray.map((dateObj, idx) => (
                                    <th key={idx} scope="col" className="px-2 py-3 border-r border-gray-200 text-center min-w-[60px] leading-tight">
                                        <div className="text-lg">{dateObj.getDate()}</div>
                                        <div className="text-[9px] text-gray-400">
                                            {dateObj.toLocaleDateString('id-ID', { month: 'short' })}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {hookParams.matrixKaryawan.length === 0 ? (
                                <tr>
                                    <td colSpan={daysInMonth + 1} className="text-center p-10 text-gray-400 font-medium">
                                        Belum ada jadwal kerja dirilis pada bulan ini.
                                    </td>
                                </tr>
                            ) : (
                                hookParams.matrixKaryawan.map((pegawai, index) => (
                                    <tr key={pegawai.id} className={`border-b border-gray-100 hover:bg-blue-50/40 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'}`}>
                                        
                                        <td className="px-4 py-3 border-r border-gray-200 sticky left-0 z-10 bg-inherit shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                            <div className="font-bold text-gray-800">{pegawai.nama}</div>
                                            <div className="text-xs text-gray-500 font-medium">{pegawai.jabatan}</div>
                                        </td>

                                        {daysArray.map((dateObj, idx) => {
                                            const tglKey = dateObj.toLocaleDateString('en-CA');
                                            const shiftDetail = pegawai.jadwal[tglKey];

                                            return (
                                                <td key={idx} className="p-1 border-r border-gray-100 relative group cursor-pointer"
                                                    onClick={() => hookParams.handleCellClick(pegawai.id, pegawai.nama, tglKey, shiftDetail)}>
                                                    
                                                    <div className="w-full h-full min-h-[38px] flex items-center justify-center">
                                                        {shiftDetail ? (
                                                            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded border tracking-wider shadow-sm transition-all ${shiftDetail.warna}`}>
                                                                {shiftDetail.kode}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-300 font-bold">-</span>
                                                        )}
                                                    </div>

                                                    <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded">
                                                        <Edit3 size={14} className="text-blue-600 animate-pulse" />
                                                    </div>
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

        </div>
    );
}
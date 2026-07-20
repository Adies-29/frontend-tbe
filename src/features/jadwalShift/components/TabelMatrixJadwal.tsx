import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { Loader2, MousePointerClick, X, Search, Users } from 'lucide-react';
import Button from '../../../components/common/Button';

import ModalKelolaShift from './ModalKelolaShift';
import ModalKelolaJadwalMassal from './ModalKelolaJadwalMassal';
import { useMatrixJadwal } from '../hooks/useMatrixJadwal';
import Notif from '../../../components/common/Notif';

export default function TabelMatrixJadwal() {
    const hookParams = useMatrixJadwal();

    // Helper untuk generate array Date (menggunakan UTC untuk mencegah pergeseran zona waktu)
    const getDatesInRange = (startStr: string, endStr: string) => {
        const dateArray: Date[] = [];
        if (!startStr || !endStr) return dateArray;
        const [sY, sM, sD] = startStr.split('-').map(Number);
        const [eY, eM, eD] = endStr.split('-').map(Number);

        const currentDate = new Date(Date.UTC(sY, sM - 1, sD));
        const stopDate = new Date(Date.UTC(eY, eM - 1, eD));

        while (currentDate <= stopDate) {
            dateArray.push(new Date(currentDate));
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }
        return dateArray;
    };

    const daysArray = getDatesInRange(hookParams.filterStartDate, hookParams.filterEndDate);
    const daysInMonth = daysArray.length;

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col w-full overflow-hidden relative">

            {/* TOOLBAR TIMELINE FLEKSIBEL */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col gap-4">
                
                {/* Baris 1: Search & Tombol Aksi Pengelolaan */}
                <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
                    {/* Pencarian Pegawai */}
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Cari nama Pegawai..."
                            value={hookParams.searchQuery}
                            onChange={(e) => hookParams.setSearchQuery(e.target.value)}
                            className="border border-gray-300 rounded-lg pl-9 pr-3 py-2 outline-none focus:border-red-500 shadow-sm text-sm w-full bg-white"
                        />
                    </div>

                    {/* Group Tombol Aksi Pengelolaan */}
                    <div className="flex flex-wrap items-center gap-2">
                        <Button 
                            variant="primary" 
                            label="Kelola Shift & Pola Massal" 
                            icon={<Users size={15} />}
                            onClick={() => hookParams.setIsModalMassalOpen(true)} 
                        />
                    </div>
                </div>

                {/* Baris 2: Filter Periode & Departemen/Jabatan */}
                <div className="flex flex-col md:flex-row flex-wrap gap-3 items-start md:items-center pt-2 border-t border-gray-200/80">
                    {/* Grup Periode */}
                    <div className="flex gap-2 w-full md:w-auto items-center">
                        <select
                            value={hookParams.periode}
                            onChange={hookParams.handlePeriodeChange}
                            className="border border-gray-300 rounded-lg px-3 py-2 bg-white outline-none focus:border-red-500 shadow-sm text-sm flex-1 md:flex-none"
                        >
                            <option value="minggu">Mingguan</option>
                            <option value="bulan">Bulanan</option>
                            <option value="tahun">Tahunan</option>
                        </select>

                        {hookParams.periode === "minggu" && <input type="week" value={hookParams.filterValue} onChange={(e) => hookParams.handleFilterValueChange(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-red-500 shadow-sm text-sm flex-1 md:flex-none bg-white" />}
                        {hookParams.periode === "bulan" && <input type="month" value={hookParams.filterValue} onChange={(e) => hookParams.handleFilterValueChange(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-red-500 shadow-sm text-sm flex-1 md:flex-none bg-white" />}
                        {hookParams.periode === "tahun" && (
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    views={['year']}
                                    value={hookParams.filterValue ? dayjs().year(parseInt(hookParams.filterValue)) : null}
                                    onChange={(newValue: Dayjs | null) => newValue && hookParams.handleFilterValueChange(newValue.year().toString())}
                                    slotProps={{ textField: { size: 'small', className: "bg-white flex-1 md:w-32", sx: { '& .MuiOutlinedInput-root': { borderRadius: '8px' } } } }}
                                />
                            </LocalizationProvider>
                        )}
                    </div>

                    <div className="hidden md:block h-6 w-px bg-gray-300 mx-1"></div>

                    {/* Grup Departemen & Jabatan */}
                    <div className="flex gap-2 w-full md:w-auto items-center">
                        <select
                            value={hookParams.filterDepartemen}
                            onChange={(e) => hookParams.setFilterDepartemen(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 bg-white outline-none focus:border-red-500 shadow-sm text-sm flex-1 md:flex-none md:max-w-[150px] truncate"
                        >
                            <option value="">Semua Dept</option>
                            {hookParams.uniqueDepartemenList.map((dept: string, idx: number) => (
                                <option key={idx} value={dept}>{dept}</option>
                            ))}
                        </select>

                        <select
                            value={hookParams.filterJabatan}
                            onChange={(e) => hookParams.setFilterJabatan(e.target.value)}
                            disabled={!hookParams.filterDepartemen}
                            className={`border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-red-500 shadow-sm text-sm flex-1 md:flex-none md:max-w-[150px] truncate ${!hookParams.filterDepartemen ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'}`}
                            title={!hookParams.filterDepartemen ? "Pilih Departemen terlebih dahulu" : "Filter berdasarkan Jabatan"}
                        >
                            <option value="">{hookParams.filterDepartemen ? "Semua Jabatan" : "Pilih Departemen Dulu"}</option>
                            {hookParams.uniqueJabatanList?.map((jab: string, idx: number) => (
                                <option key={idx} value={jab}>{jab}</option>
                            ))}
                        </select>

                        <Button label="Load Data" variant='warning' onClick={hookParams.handleFilter} className="ml-auto md:ml-2" />
                    </div>
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
                <div data-tour="matrix-table" className="overflow-x-auto w-full relative">
                    <table className="w-full text-sm text-left border-collapse min-w-max">
                        <thead className="text-xs text-gray-600 uppercase bg-gray-100 sticky top-0 z-20 shadow-sm">
                            <tr>
                                <th scope="col" className="px-4 py-3 border-r border-gray-200 sticky left-0 z-30 bg-gray-100 min-w-[150px] md:min-w-[220px]">
                                    Nama Pegawai
                                </th>
                                {daysArray.map((dateObj, idx) => {
                                    const isWeekend = dateObj.getUTCDay() === 0;
                                    return (
                                        <th key={idx} scope="col" className={`px-2 py-3 border-r border-gray-200 text-center min-w-[60px] leading-tight ${isWeekend ? 'bg-red-50/50' : ''}`}>
                                            <div className={`text-lg ${isWeekend ? 'text-red-600 font-bold' : ''}`}>{dateObj.getUTCDate()}</div>
                                            <div className={`text-[9px] ${isWeekend ? 'text-red-400 font-medium' : 'text-gray-400'}`}>
                                                {dateObj.toLocaleDateString('id-ID', { month: 'short', timeZone: 'UTC' })}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>

                        <tbody>
                            {hookParams.filteredMatrixKaryawan.length === 0 ? (
                                <tr>
                                    <td colSpan={daysInMonth + 1} className="text-center p-10 text-gray-400 font-medium">
                                        Data jadwal Pegawai tidak ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                hookParams.filteredMatrixKaryawan.map((pegawai, index) => (
                                    <tr key={pegawai.id} className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>

                                        <td className="px-4 py-3 border-r border-gray-200 sticky left-0 z-10 bg-inherit shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                                            <div className="font-bold text-gray-800">{pegawai.nama}</div>
                                            <div className="text-xs text-gray-500 font-medium">{pegawai.jabatan}</div>
                                        </td>

                                        {daysArray.map((dateObj, idx) => {
                                            const isWeekend = dateObj.getUTCDay() === 0;
                                            const y = dateObj.getUTCFullYear();
                                            const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
                                            const d = String(dateObj.getUTCDate()).padStart(2, '0');
                                            const tglKey = `${y}-${m}-${d}`;
                                            const shiftDetail = pegawai.jadwal[tglKey];

                                            const isAsal = hookParams.selectedCell?.pegawaiId === pegawai.id && hookParams.selectedCell?.tanggal === tglKey;
                                            const isTujuan = hookParams.cellTujuan?.pegawaiId === pegawai.id && hookParams.cellTujuan?.tanggal === tglKey;

                                            let cellBg = isWeekend ? 'bg-red-50/10' : '';
                                            if (isAsal) cellBg = 'bg-amber-100/70 shadow-[inset_0_0_0_2px_#f59e0b] z-10'; // Warna Oranye untuk Asal
                                            if (isTujuan) cellBg = 'bg-blue-100/70 shadow-[inset_0_0_0_2px_#3b82f6] z-10'; // Warna Biru untuk Tujuan

                                            return (
                                                <td key={idx} className={`p-1 border-r border-gray-100 relative group cursor-pointer transition-colors hover:bg-blue-100/40 ${cellBg}`}
                                                    onClick={() => hookParams.handleCellClick(pegawai.id, pegawai.nama, tglKey, shiftDetail, pegawai.jabatan)}>

                                                    <div className="w-full h-full min-h-[42px] flex flex-col items-center justify-center relative">
                                                        {shiftDetail ? (
                                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wide transition-all truncate max-w-[65px] ${shiftDetail.warna} border-none shadow-none mt-1`}>
                                                                {shiftDetail.kode.replace(/^SHIFT[\s-]?/i, '')}
                                                            </span>
                                                        ) : (
                                                            <span className="text-transparent group-hover:text-blue-300 transition-colors select-none text-lg leading-none">&middot;</span>
                                                        )}
                                                        
                                                        {isAsal && (
                                                            <span className="absolute top-0 left-0 bg-amber-500 text-white text-[8px] font-bold px-1 rounded-br-md leading-tight">
                                                                ASAL
                                                            </span>
                                                        )}
                                                        {isTujuan && (
                                                            <span className="absolute top-0 right-0 bg-blue-500 text-white text-[8px] font-bold px-1 rounded-bl-md leading-tight">
                                                                TUJUAN
                                                            </span>
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
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-100 w-[90%] md:w-auto max-w-sm md:max-w-none bg-blue-600 text-white px-4 md:px-6 py-3 rounded-2xl md:rounded-full shadow-2xl font-bold flex flex-col md:flex-row items-center justify-between md:justify-start gap-3 animate-in slide-in-from-top-10 text-center md:text-left">
                    <div className="flex flex-col md:flex-row items-center gap-2">
                        <MousePointerClick size={20} className="animate-bounce shrink-0" />
                        <span className="text-xs md:text-sm">Silakan klik kotak jadwal di tabel untuk memilih sel {hookParams.pickerActive === 'asal' ? 'ASAL' : 'TUJUAN'}...</span>
                    </div>
                    <button
                        onClick={() => { hookParams.setPickerActive('none'); hookParams.setIsModalOpen(true); }}
                        className="bg-white/20 p-1.5 rounded-full hover:bg-white/40 transition-colors shrink-0"
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

            <ModalKelolaJadwalMassal
                isOpen={hookParams.isModalMassalOpen}
                onClose={() => hookParams.setIsModalMassalOpen(false)}
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
                onSuccess={hookParams.handleFilter}
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
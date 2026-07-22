import { useMemo } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { Loader2, Search, RotateCcw } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { apiFetch } from '../../../utils/apiFetch';
import Button from '../../../components/common/Button';
import { useMatrixPencapaian } from '../hooks/useMatrixPencapaian';
import Notif from '../../../components/common/Notif';
import ModalInputPencapaian from './ModalInputPencapaian';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function TabelMatrixPencapaian() {
    const hookParams = useMatrixPencapaian();
    const token = useAuthStore(state => state.token);
    const queryClient = useQueryClient();

    const saveMutation = useMutation({
        mutationFn: async (payload: any) => {
            const res = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/target/pencapaian`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Gagal menyimpan data pencapaian");
            return data;
        },
        onSuccess: () => {
            hookParams.showNotif("Pencapaian berhasil diperbarui!", "success");
            queryClient.invalidateQueries({ queryKey: ['pencapaianList'] });
        },
        onError: (err: any) => hookParams.showNotif(err.message, "error")
    });

    const deleteMutation = useMutation({
        mutationFn: async (payload: { pencapaian_id?: number; pegawai_id: number; tanggal: string }) => {
            const res = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/target/pencapaian`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Gagal menghapus data pencapaian");
            return data;
        },
        onSuccess: () => {
            hookParams.showNotif("Data pencapaian dihapus", "success");
            queryClient.invalidateQueries({ queryKey: ['pencapaianList'] });
        },
        onError: (err: any) => hookParams.showNotif(err.message, "error")
    });

    // Memoized formatted dates array untuk mencegah freeze UI saat rentang tahunan (365 hari)
    const formattedDays = useMemo(() => {
        if (!hookParams.filterStartDate || !hookParams.filterEndDate) return [];
        const [sY, sM, sD] = hookParams.filterStartDate.split('-').map(Number);
        const [eY, eM, eD] = hookParams.filterEndDate.split('-').map(Number);

        const currentDate = new Date(Date.UTC(sY, sM - 1, sD));
        const stopDate = new Date(Date.UTC(eY, eM - 1, eD));
        const result = [];

        while (currentDate <= stopDate) {
            const isWeekend = currentDate.getUTCDay() === 0;
            const dayNum = currentDate.getUTCDate();
            const monthShort = currentDate.toLocaleDateString('id-ID', { month: 'short', timeZone: 'UTC' });
            const y = currentDate.getUTCFullYear();
            const m = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
            const d = String(dayNum).padStart(2, '0');
            const tglKey = `${y}-${m}-${d}`;

            result.push({
                tglKey,
                dayNum,
                monthShort,
                isWeekend
            });

            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }
        return result;
    }, [hookParams.filterStartDate, hookParams.filterEndDate]);

    const daysInMonth = formattedDays.length;

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col w-full overflow-hidden relative">

            {/* TOOLBAR TIMELINE FLEKSIBEL */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col gap-4">
                {/* Baris Atas: Search Input */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[240px] max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Cari nama pegawai di matriks..."
                            value={hookParams.searchQuery}
                            onChange={(e) => hookParams.setSearchQuery(e.target.value)}
                            className="w-full border border-slate-300 rounded-xl pl-10 pr-9 py-2 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs transition-all"
                        />
                        {hookParams.searchQuery && (
                            <button
                                onClick={() => hookParams.setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                            >
                                &times;
                            </button>
                        )}
                    </div>
                </div>

                {/* Baris Bawah: Filter Departemen, Jabatan & Tanggal */}
                <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center pt-1 border-t border-slate-200/80">
                    <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                        {/* Select Dept */}
                        <div className="relative flex-1 sm:flex-none">
                            <select
                                value={hookParams.filterDepartemen}
                                onChange={(e) => {
                                    hookParams.setFilterDepartemen(e.target.value);
                                    hookParams.setFilterJabatan('');
                                }}
                                className="w-full sm:min-w-[150px] border border-slate-300 rounded-xl px-3 py-1.5 bg-white text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs transition-all cursor-pointer"
                            >
                                <option value="">Semua Departemen</option>
                                {hookParams.uniqueDepartemenList.map((dept: string, idx: number) => (
                                    <option key={idx} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>

                        {/* Select Jabatan */}
                        <div className="relative flex-1 sm:flex-none">
                            <select
                                value={hookParams.filterJabatan}
                                onChange={(e) => hookParams.setFilterJabatan(e.target.value)}
                                disabled={!hookParams.filterDepartemen}
                                className={`w-full sm:min-w-[150px] border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs transition-all ${
                                    !hookParams.filterDepartemen
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200'
                                        : 'bg-white text-slate-700 cursor-pointer'
                                }`}
                                title={!hookParams.filterDepartemen ? "Pilih Departemen terlebih dahulu" : "Filter Jabatan"}
                            >
                                <option value="">{hookParams.filterDepartemen ? "Semua Jabatan" : "Pilih Departemen Dulu"}</option>
                                {hookParams.uniqueJabatanList?.map((jab: string, idx: number) => (
                                    <option key={idx} value={jab}>{jab}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="hidden sm:block h-6 w-px bg-slate-300 mx-1"></div>

                    {/* Period Switcher & Date Controls */}
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        {/* Segmented Control */}
                        <div className="bg-slate-200/80 p-1 rounded-xl flex items-center gap-1 shadow-inner">
                            <Button
                                label="Mingguan"
                                onClick={() => hookParams.handlePeriodeChange('minggu')}
                                className={`px-3! py-1.5! text-xs! font-semibold! shadow-none ${
                                    hookParams.periode === 'minggu'
                                        ? 'bg-white! text-slate-800! shadow-xs'
                                        : 'bg-transparent! text-slate-600! hover:text-slate-900!'
                                }`}
                            />
                            <Button
                                label="Bulanan"
                                onClick={() => hookParams.handlePeriodeChange('bulan')}
                                className={`px-3! py-1.5! text-xs! font-semibold! shadow-none ${
                                    hookParams.periode === 'bulan'
                                        ? 'bg-white! text-slate-800! shadow-xs'
                                        : 'bg-transparent! text-slate-600! hover:text-slate-900!'
                                }`}
                            />
                            <Button
                                label="Tahunan"
                                onClick={() => hookParams.handlePeriodeChange('tahun')}
                                className={`px-3! py-1.5! text-xs! font-semibold shadow-none ${
                                    hookParams.periode === 'tahun'
                                        ? 'bg-white! text-slate-800! shadow-xs'
                                        : 'bg-transparent! text-slate-600! hover:text-slate-900!'
                                }`}
                            />
                        </div>

                        {/* Date Picker Input */}
                        <div className="relative">
                            {hookParams.periode === 'minggu' && (
                                <input
                                    type="week"
                                    value={hookParams.filterValue}
                                    onChange={(e) => hookParams.setFilterValue(e.target.value)}
                                    className="border border-slate-300 rounded-xl px-3 py-1.5 bg-white text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs cursor-pointer"
                                />
                            )}
                            {hookParams.periode === 'bulan' && (
                                <input
                                    type="month"
                                    value={hookParams.filterValue}
                                    onChange={(e) => hookParams.setFilterValue(e.target.value)}
                                    className="border border-slate-300 rounded-xl px-3 py-1.5 bg-white text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs cursor-pointer"
                                />
                            )}
                            {hookParams.periode === 'tahun' && (
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        views={['year']}
                                        value={hookParams.filterValue ? dayjs().year(parseInt(hookParams.filterValue)) : null}
                                        onChange={(newValue: Dayjs | null) => newValue && hookParams.setFilterValue(newValue.year().toString())}
                                        slotProps={{ textField: { size: 'small', className: "bg-white flex-1 md:w-32", sx: { '& .MuiOutlinedInput-root': { borderRadius: '12px', fontSize: '12px' } } } }}
                                    />
                                </LocalizationProvider>
                            )}
                        </div>

                        {(hookParams.searchQuery || hookParams.filterDepartemen || hookParams.filterJabatan) && (
                            <button
                                type="button"
                                onClick={hookParams.handleResetFilters}
                                className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Reset semua filter"
                            >
                                <RotateCcw size={13} />
                                <span className="hidden sm:inline">Reset</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* AREA MATRIX LOAD DATA */}
            {hookParams.isLoading ? (
                <div className="flex flex-col items-center justify-center h-72 text-gray-400">
                    <Loader2 className="animate-spin mb-3 text-blue-600" size={36} />
                    <p className="text-sm font-medium">Sinkronisasi Data Pencapaian...</p>
                </div>
            ) : hookParams.errorMsg ? (
                <div className="p-8 text-center text-red-600 font-medium bg-red-50/50 m-4 rounded-xl border border-red-200">
                    {hookParams.errorMsg}
                </div>
            ) : (
                <div className="overflow-x-auto w-full relative">
                    <table className="w-full text-sm text-left border-collapse min-w-max table-fixed">
                        <thead className="text-xs text-gray-600 uppercase bg-gray-100 sticky top-0 z-20 shadow-sm">
                            <tr>
                                <th scope="col" className="px-4 py-3 border-r border-gray-200 sticky left-0 z-30 bg-gray-100 min-w-[150px] md:min-w-[220px]">
                                    Nama Pegawai
                                </th>
                                {formattedDays.map((item, idx) => (
                                    <th key={idx} scope="col" className={`px-2 py-3 border-r border-gray-200 text-center min-w-[60px] leading-tight ${item.isWeekend ? 'bg-red-50/50' : ''}`}>
                                        <div className={`text-lg ${item.isWeekend ? 'text-red-600 font-bold' : ''}`}>{item.dayNum}</div>
                                        <div className={`text-[9px] ${item.isWeekend ? 'text-red-400 font-medium' : 'text-gray-400'}`}>
                                            {item.monthShort}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {hookParams.filteredMatrixKaryawan.length === 0 ? (
                                <tr>
                                    <td colSpan={daysInMonth + 1} className="text-center p-10 text-gray-400 font-medium">
                                        Data pencapaian pegawai tidak ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                hookParams.filteredMatrixKaryawan.map((pegawai, index) => (
                                    <tr key={pegawai.id} className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>

                                        <td className="px-4 py-3 border-r border-gray-200 sticky left-0 z-10 bg-inherit shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                                            <div className="font-bold text-gray-800">{pegawai.nama}</div>
                                            <div className="text-xs text-gray-500 font-medium">{pegawai.jabatan}</div>
                                        </td>

                                        {formattedDays.map((item, idx) => {
                                            const pencapaianHariIni = pegawai.pencapaian[item.tglKey];

                                            let cellBg = item.isWeekend ? 'bg-red-50/10' : '';
                                            if (pencapaianHariIni && pencapaianHariIni.totalPack > 0) {
                                                cellBg = 'bg-emerald-50'; // Warna hijau jika ada target
                                            }

                                            return (
                                                <td key={idx} className={`p-1 border-r border-gray-100 relative group cursor-pointer transition-colors hover:bg-blue-100/40 ${cellBg}`}
                                                    onClick={() => hookParams.handleCellClick(pegawai.id, pegawai.nama, item.tglKey, pegawai.jabatan)}>

                                                    <div className="w-full h-full min-h-[42px] flex flex-col items-center justify-center relative">
                                                        {pencapaianHariIni && pencapaianHariIni.totalPack > 0 ? (
                                                            <div className="flex flex-col items-center">
                                                                <span className="text-sm font-bold text-emerald-700">
                                                                    {pencapaianHariIni.totalPack}
                                                                </span>
                                                                <span className="text-[9px] text-emerald-600 font-medium mt-0.5">
                                                                    pack
                                                                </span>
                                                            </div>
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

            {/* KOMPONEN MODAL */}
            {hookParams.selectedCell.tanggal && (
                <ModalInputPencapaian
                    isModalOpen={hookParams.isModalOpen}
                    setIsModalOpen={hookParams.setIsModalOpen}
                    selectedCell={hookParams.selectedCell}
                    listMasterTargets={hookParams.listMasterTargets}
                  
                    pencapaianExisting={
                        hookParams.matrixKaryawan.find(p => p.id === hookParams.selectedCell.pegawaiId)
                            ?.pencapaian[hookParams.selectedCell.tanggal] || null
                    }
                    isSaving={saveMutation.isPending || deleteMutation.isPending}
                    onSave={async (data) => {
                        await saveMutation.mutateAsync({
                            pegawai_id: hookParams.selectedCell.pegawaiId,
                            master_target_id: data.master_target_id,
                            tanggal: hookParams.selectedCell.tanggal,
                            jumlah_pencapaian: data.jumlah
                        });
                    }}
                    onDelete={async (pencapaianId) => {
                        await deleteMutation.mutateAsync({
                            pencapaian_id: pencapaianId,
                            pegawai_id: hookParams.selectedCell.pegawaiId,
                            tanggal: hookParams.selectedCell.tanggal
                        });
                    }}
                />
            )}

            <Notif
                show={hookParams.notifState.show}
                message={hookParams.notifState.message}
                type={hookParams.notifState.type}
                onClose={hookParams.closeNotif}
            />
        </div>
    );
}

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { Loader2, Search } from 'lucide-react';
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
            const result = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(result.message || result.error || "Gagal menyimpan pencapaian (500)");
            return result;
        },
        onSuccess: () => {
            hookParams.showNotif("Pencapaian berhasil disimpan", "success");
            queryClient.invalidateQueries({ queryKey: ['pencapaianList'] });
            hookParams.setIsModalOpen(false);
        },
        onError: (err: any) => hookParams.showNotif(err.message, "error")
    });

    const deleteMutation = useMutation({
        mutationFn: async (pencapaianId: number) => {
            const res = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/target/pencapaian/${pencapaianId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(result.message || result.error || "Gagal menghapus pencapaian");
            return result;
        },
        onSuccess: () => {
            hookParams.showNotif("Data pencapaian dihapus", "success");
            queryClient.invalidateQueries({ queryKey: ['pencapaianList'] });
            hookParams.setIsModalOpen(false);
        },
        onError: (err: any) => hookParams.showNotif(err.message, "error")
    });

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
            <div className="p-4 border-b border-gray-200 flex flex-wrap items-center bg-gray-50 gap-4">
                <div className="flex gap-2 w-full md:w-auto mr-auto">
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
                </div>

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
                    <div className="hidden sm:block h-6 w-px bg-gray-300 mx-1"></div>

                    <select
                        value={hookParams.filterDepartemen}
                        onChange={(e) => {
                            hookParams.setFilterDepartemen(e.target.value);
                            hookParams.setFilterJabatan("");
                        }}
                        className="border border-gray-300 rounded-lg px-3 py-1.5 bg-white outline-none focus:border-red-500 shadow-sm text-sm max-w-[150px] truncate"
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
                        className={`border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:border-red-500 shadow-sm text-sm max-w-[150px] truncate ${!hookParams.filterDepartemen ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'}`}
                        title={!hookParams.filterDepartemen ? "Pilih Departemen terlebih dahulu" : "Filter berdasarkan Jabatan"}
                    >
                        <option value="">{hookParams.filterDepartemen ? "Semua Jabatan" : "Pilih Departemen Dulu"}</option>
                        {hookParams.uniqueJabatanList?.map((jab: string, idx: number) => (
                            <option key={idx} value={jab}>{jab}</option>
                        ))}
                    </select>

                    <Button label="Load Data" variant='warning' onClick={hookParams.handleFilter} />
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
                    <table className="w-full text-sm text-left border-collapse min-w-max">
                        <thead className="text-xs text-gray-600 uppercase bg-gray-100 sticky top-0 z-20 shadow-sm">
                            <tr>
                                <th scope="col" className="px-4 py-3 border-r border-gray-200 sticky left-0 z-30 bg-gray-100 min-w-[220px]">
                                    Nama Pegawai
                                </th>
                                {daysArray.map((dateObj, idx) => {
                                    const isWeekend = dateObj.getDay() === 0;
                                    return (
                                        <th key={idx} scope="col" className={`px-2 py-3 border-r border-gray-200 text-center min-w-[60px] leading-tight ${isWeekend ? 'bg-red-50/50' : ''}`}>
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

                                        {daysArray.map((dateObj, idx) => {
                                            const isWeekend = dateObj.getDay() === 0;
                                            const tglKey = dateObj.toLocaleDateString('en-CA');
                                            const pencapaianHariIni = pegawai.pencapaian[tglKey];

                                            let cellBg = isWeekend ? 'bg-red-50/10' : '';
                                            if (pencapaianHariIni && pencapaianHariIni.totalPack > 0) {
                                                cellBg = 'bg-emerald-50'; // Warna hijau jika ada target
                                            }

                                            return (
                                                <td key={idx} className={`p-1 border-r border-gray-100 relative group cursor-pointer transition-colors hover:bg-blue-100/40 ${cellBg}`}
                                                    onClick={() => hookParams.handleCellClick(pegawai.id, pegawai.nama, tglKey, pegawai.jabatan)}>

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
                        await deleteMutation.mutateAsync(pencapaianId);
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

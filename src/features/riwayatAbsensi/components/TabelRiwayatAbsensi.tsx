import { Search, Users, RotateCcw, Clock, AlertTriangle, LogOut, UserX, CheckCircle2, XCircle, Info } from 'lucide-react';
import { useState, useMemo } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import type { AbsensiData } from '../hooks/useRiwayatAbsensi';
import { getCurrentWeek, getCurrentMonth, getCurrentYear, parseWeekValue } from '../../../utils/dateHelpers';

interface JadwalItem {
    pegawai_id: string;
    tanggal: string;
    shift_kode: string | null;
    jam_masuk: string | null;
    jam_pulang: string | null;
}

// ============================================================
// STATUS BADGE TYPES
// ============================================================
type StatusAbsensi = 'hadir' | 'terlambat' | 'pulang_awal' | 'lupa_absen_pulang' | 'void' | 'tidak_hadir' | 'kosong';

interface StatusInfo {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: React.ReactNode;
    textColor: string;
}

const STATUS_MAP: Record<StatusAbsensi, StatusInfo> = {
    hadir: {
        label: 'Hadir',
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        textColor: 'text-emerald-600',
        icon: <CheckCircle2 size={11} className="text-emerald-600" />,
    },
    terlambat: {
        label: 'Terlambat',
        color: 'text-amber-700',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-600',
        icon: <Clock size={11} className="text-amber-600" />,
    },
    pulang_awal: {
        label: 'Pulang Awal',
        color: 'text-orange-700',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-600',
        icon: <LogOut size={11} className="text-orange-600" />,
    },
    lupa_absen_pulang: {
        label: 'Lupa Absen',
        color: 'text-purple-700',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        textColor: 'text-purple-600',
        icon: <AlertTriangle size={11} className="text-purple-600" />,
    },
    void: {
        label: 'Void',
        color: 'text-rose-700',
        bgColor: 'bg-rose-50',
        borderColor: 'border-rose-300',
        textColor: 'text-rose-600',
        icon: <XCircle size={11} className="text-rose-600" />,
    },
    tidak_hadir: {
        label: 'Tidak Hadir',
        color: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-600',
        icon: <UserX size={11} className="text-red-600" />,
    },
    kosong: {
        label: '-',
        color: 'text-slate-300',
        bgColor: '',
        borderColor: '',
        textColor: 'text-slate-300',
        icon: null,
    },
};

// ============================================================
// HELPER: Determine absensi status
// ============================================================
function determineStatus(
    absensi: AbsensiData | null,
    jadwal: JadwalItem | null
): StatusAbsensi {
    // If there's absensi data
    if (absensi) {
        if (absensi.status === 'void') return 'void';
        if (absensi.status === 'late') return 'terlambat';

        // Check lupa absen pulang: ada waktu masuk tapi tidak ada waktu pulang
        if (absensi.waktu_awal && !absensi.waktu_akhir) return 'lupa_absen_pulang';

        // Check pulang awal: ada jadwal shift, pulang lebih cepat dari jam pulang shift
        if (absensi.waktu_akhir && jadwal?.jam_pulang) {
            const waktuPulangActual = absensi.waktu_akhir.substring(0, 5); // "HH:mm"
            const jamPulangShift = jadwal.jam_pulang.substring(0, 5);
            if (waktuPulangActual < jamPulangShift) return 'pulang_awal';
        }

        if (absensi.status === 'intime') return 'hadir';

        // Default: if there's data but status unknown, treat as hadir
        return 'hadir';
    }

    // If no absensi but there's a jadwal (schedule exists → tidak hadir/absent)
    if (jadwal && jadwal.shift_kode && jadwal.shift_kode !== 'OFF') {
        return 'tidak_hadir';
    }

    // No data at all
    return 'kosong';
}

// ============================================================
// HELPER: Format time string
// ============================================================
function formatWaktu(waktu: string | null): string {
    if (!waktu) return '-';
    // Handle "HH:mm:ss" or "HH:mm" format
    return waktu.substring(0, 5);
}


// ============================================================
// PROPS
// ============================================================
interface TabelRiwayatAbsensiProps {
    data: AbsensiData[];
    listPegawai: any[];
    listJadwal: JadwalItem[];
}

export const TabelRiwayatAbsensi = ({ data = [], listPegawai = [], listJadwal = [] }: TabelRiwayatAbsensiProps) => {
    const defaultWeekStr = getCurrentWeek();

    // States for Filter & Search
    const [periode, setPeriode] = useState<'minggu' | 'bulan' | 'tahun'>('minggu');
    const [filterValue, setFilterValue] = useState(defaultWeekStr);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDepartemen, setFilterDepartemen] = useState('');
    const [filterJabatan, setFilterJabatan] = useState('');

    // Calculate filterStartDate and filterEndDate reactively
    const { filterStartDate, filterEndDate } = useMemo(() => {
        if (!filterValue) {
            const parsed = parseWeekValue(defaultWeekStr);
            return {
                filterStartDate: parsed?.startDate || '',
                filterEndDate: parsed?.endDate || ''
            };
        }

        const year = parseInt(filterValue.substring(0, 4));

        if (periode === 'minggu') {
            const parsed = parseWeekValue(filterValue);
            if (parsed) {
                return { filterStartDate: parsed.startDate, filterEndDate: parsed.endDate };
            }
            return { filterStartDate: '', filterEndDate: '' };
        } else if (periode === 'bulan') {
            const month = parseInt(filterValue.substring(5, 7));
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            return {
                filterStartDate: startDate.toLocaleDateString('en-CA'),
                filterEndDate: endDate.toLocaleDateString('en-CA')
            };
        } else {
            const startDate = new Date(year, 0, 1);
            const endDate = new Date(year, 11, 31);
            return {
                filterStartDate: startDate.toLocaleDateString('en-CA'),
                filterEndDate: endDate.toLocaleDateString('en-CA')
            };
        }
    }, [periode, filterValue]);

    // Calculate dates array
    const daysArray = useMemo(() => {
        if (!filterStartDate || !filterEndDate) return [];
        const dateArray: Date[] = [];
        const currentDate = new Date(filterStartDate);
        const stopDate = new Date(filterEndDate);
        while (currentDate <= stopDate) {
            dateArray.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dateArray;
    }, [filterStartDate, filterEndDate]);

    // Map absensi: pegawaiId -> tanggal -> AbsensiData
    const absensiMap = useMemo(() => {
        const map: { [pegawaiId: string]: { [date: string]: AbsensiData } } = {};
        data.forEach(item => {
            if (!map[item.pegawai_id]) map[item.pegawai_id] = {};
            map[item.pegawai_id][item.tanggal] = item;
        });
        return map;
    }, [data]);

    // Map jadwal: pegawaiId -> tanggal -> JadwalItem
    const jadwalMap = useMemo(() => {
        const map: { [pegawaiId: string]: { [date: string]: JadwalItem } } = {};
        listJadwal.forEach(item => {
            if (!map[item.pegawai_id]) map[item.pegawai_id] = {};
            map[item.pegawai_id][item.tanggal] = item;
        });
        return map;
    }, [listJadwal]);

    // Calculate unique departments & positions from listPegawai
    const uniqueDepartemenList = useMemo(() => {
        const depts = listPegawai
            .map(p => p.jabatan?.departemen?.nama_departemen)
            .filter((dept): dept is string => !!dept);
        return Array.from(new Set(depts));
    }, [listPegawai]);

    const uniqueJabatanList = useMemo(() => {
        const jabs = listPegawai
            .filter(p => !filterDepartemen || p.jabatan?.departemen?.nama_departemen === filterDepartemen)
            .map(p => p.jabatan?.nama_jabatan)
            .filter((jab): jab is string => !!jab);
        return Array.from(new Set(jabs));
    }, [listPegawai, filterDepartemen]);

    // Filter employees
    const filteredPegawai = useMemo(() => {
        return listPegawai.filter(p => {
            const matchSearch = p.nama.toLowerCase().includes(searchQuery.toLowerCase());
            const matchDept = !filterDepartemen || p.jabatan?.departemen?.nama_departemen === filterDepartemen;
            const matchJab = !filterJabatan || p.jabatan?.nama_jabatan === filterJabatan;
            return matchSearch && matchDept && matchJab;
        });
    }, [listPegawai, searchQuery, filterDepartemen, filterJabatan]);

    // Handle period change
    const handlePeriodeChange = (newPeriode: 'minggu' | 'bulan' | 'tahun') => {
        setPeriode(newPeriode);
        if (newPeriode === 'minggu') {
            setFilterValue(defaultWeekStr);
        } else if (newPeriode === 'bulan') {
            setFilterValue(getCurrentMonth());
        } else {
            setFilterValue(getCurrentYear());
        }
    };

    const handleDepartemenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilterDepartemen(e.target.value);
        setFilterJabatan('');
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setFilterDepartemen('');
        setFilterJabatan('');
        setPeriode('minggu');
        setFilterValue(defaultWeekStr);
    };

    const isFiltered = searchQuery || filterDepartemen || filterJabatan;

    // Statistics
    const stats = useMemo(() => {
        let hadir = 0, terlambat = 0, pulangAwal = 0, lupaAbsen = 0, tidakHadir = 0, voidCount = 0;
        filteredPegawai.forEach((pegawai: any) => {
            daysArray.forEach(dateObj => {
                const dateKey = dateObj.toLocaleDateString('en-CA');
                const absensi = absensiMap[String(pegawai.id)]?.[dateKey] || null;
                const jadwal = jadwalMap[String(pegawai.id)]?.[dateKey] || null;
                const status = determineStatus(absensi, jadwal);
                if (status === 'hadir') hadir++;
                else if (status === 'terlambat') terlambat++;
                else if (status === 'pulang_awal') pulangAwal++;
                else if (status === 'lupa_absen_pulang') lupaAbsen++;
                else if (status === 'tidak_hadir') tidakHadir++;
                else if (status === 'void') voidCount++;
            });
        });
        return { hadir, terlambat, pulangAwal, lupaAbsen, tidakHadir, voidCount };
    }, [filteredPegawai, daysArray, absensiMap, jadwalMap]);


    return (
        <div className="flex flex-col w-full bg-white relative rounded-b-xl">
            {/* Filter Toolbar */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col gap-4">
                {/* Baris Atas: Search */}
                <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[240px] max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Cari nama pegawai..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full border border-slate-300 rounded-xl pl-10 pr-9 py-2 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                            >
                                &times;
                            </button>
                        )}
                    </div>

                    {/* Statistics Summary Badges */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={10} /> {stats.hadir} Hadir
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                            <Clock size={10} /> {stats.terlambat} Terlambat
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200">
                            <LogOut size={10} /> {stats.pulangAwal} Pulang Awal
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                            <AlertTriangle size={10} /> {stats.lupaAbsen} Lupa Absen
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                            <UserX size={10} /> {stats.tidakHadir} Tidak Hadir
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                            <XCircle size={10} /> {stats.voidCount} Void
                        </span>
                    </div>
                </div>

                {/* Baris Bawah: Filter Departemen & Jabatan + Date Filters */}
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between pt-1">
                    {/* Left: Departemen & Jabatan */}
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                        {/* Select Dept */}
                        <div className="relative flex-1 sm:flex-none">
                            <select
                                value={filterDepartemen}
                                onChange={handleDepartemenChange}
                                className="w-full sm:min-w-[160px] border border-slate-300 rounded-xl px-3 py-1.5 bg-white text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs transition-all cursor-pointer"
                            >
                                <option value="">Semua Departemen</option>
                                {uniqueDepartemenList.map((dept, idx) => (
                                    <option key={idx} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>

                        {/* Select Jabatan */}
                        <div className="relative flex-1 sm:flex-none">
                            <select
                                value={filterJabatan}
                                onChange={(e) => setFilterJabatan(e.target.value)}
                                disabled={!filterDepartemen}
                                className={`w-full sm:min-w-[160px] border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs transition-all ${
                                    !filterDepartemen
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200'
                                        : 'bg-white text-slate-700 cursor-pointer'
                                }`}
                                title={!filterDepartemen ? "Pilih Departemen terlebih dahulu" : "Filter Jabatan"}
                            >
                                <option value="">{filterDepartemen ? "Semua Jabatan" : "Pilih Departemen Dulu"}</option>
                                {uniqueJabatanList.map((jab, idx) => (
                                    <option key={idx} value={jab}>{jab}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Right: Date Controls */}
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap md:justify-end">
                        {/* Segmented Control */}
                        <div className="bg-slate-200/80 p-1 rounded-xl flex items-center gap-1 shadow-inner">
                            <button
                                type="button"
                                onClick={() => handlePeriodeChange('minggu')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                    periode === 'minggu'
                                        ? 'bg-white text-slate-800 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Mingguan
                            </button>
                            <button
                                type="button"
                                onClick={() => handlePeriodeChange('bulan')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                    periode === 'bulan'
                                        ? 'bg-white text-slate-800 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Bulanan
                            </button>
                            <button
                                type="button"
                                onClick={() => handlePeriodeChange('tahun')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                    periode === 'tahun'
                                        ? 'bg-white text-slate-800 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Tahunan
                            </button>
                        </div>

                        {/* Date Picker Input */}
                        <div className="relative">
                            {periode === 'minggu' && (
                                <input
                                    type="week"
                                    value={filterValue}
                                    onChange={(e) => setFilterValue(e.target.value)}
                                    className="border border-slate-300 rounded-xl px-3 py-1.5 bg-white text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs cursor-pointer"
                                />
                            )}
                            {periode === 'bulan' && (
                                <input
                                    type="month"
                                    value={filterValue}
                                    onChange={(e) => setFilterValue(e.target.value)}
                                    className="border border-slate-300 rounded-xl px-3 py-1.5 bg-white text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs cursor-pointer"
                                />
                            )}
                            {periode === 'tahun' && (
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        views={['year']}
                                        value={filterValue ? dayjs().year(parseInt(filterValue)) : null}
                                        onChange={(newValue: Dayjs | null) => newValue && setFilterValue(newValue.year().toString())}
                                        slotProps={{
                                            textField: {
                                                size: 'small',
                                                className: "bg-white flex-1 md:w-32",
                                                sx: {
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: '12px',
                                                        fontSize: '12px',
                                                        fontWeight: 600,
                                                        height: '35px',
                                                        color: '#334155',
                                                        '& fieldset': { borderColor: '#cbd5e1' },
                                                        '&:hover fieldset': { borderColor: '#94a3b8' },
                                                        '&.Mui-focused fieldset': { borderColor: '#ef4444' },
                                                    },
                                                    '& .MuiOutlinedInput-input': { padding: '6px 12px' },
                                                    '& .MuiIconButton-root': { padding: '4px', color: '#64748b' }
                                                }
                                            }
                                        }}
                                    />
                                </LocalizationProvider>
                            )}
                        </div>

                        {isFiltered && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
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

            {/* Matrix Table */}
            <div className="overflow-x-auto w-full relative max-h-[500px] rounded-b-xl scrollbar-thin">
                <table className="w-full text-xs text-left border-collapse min-w-max">
                    <thead className="text-[11px] font-bold text-slate-600 uppercase bg-slate-100/90 sticky top-0 z-20 shadow-xs backdrop-blur-xs">
                        <tr>
                            <th scope="col" className="px-4 py-3.5 border-r border-b border-slate-200 sticky left-0 z-30 bg-slate-100 min-w-[200px] shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]">
                                <div className="flex items-center gap-2">
                                    <Users size={14} className="text-slate-500" />
                                    <span>Nama Pegawai</span>
                                </div>
                            </th>
                            {daysArray.map((dateObj, idx) => {
                                const isSunday = dateObj.getDay() === 0;
                                const isSaturday = dateObj.getDay() === 6;
                                const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'short' });
                                return (
                                    <th
                                        key={idx}
                                        scope="col"
                                        className={`px-3 py-2.5 border-r border-b border-slate-200 text-center min-w-[105px] transition-colors ${
                                            isSunday ? 'bg-rose-50/70 text-rose-700' : isSaturday ? 'text-slate-700' : 'bg-slate-100 text-slate-700'
                                        }`}
                                    >
                                        <div className="flex flex-col items-center justify-center">
                                            <span className={`text-[10px] font-bold tracking-wider ${isSunday ? 'text-rose-500' : 'text-slate-400'}`}>
                                                {dayName}
                                            </span>
                                            <span className={`text-sm font-black ${isSunday ? 'text-rose-600' : 'text-slate-800'}`}>
                                                {dateObj.getDate()}
                                            </span>
                                            <span className={`text-[9px] font-medium ${isSunday ? 'text-rose-400' : 'text-slate-400'}`}>
                                                {dateObj.toLocaleDateString('id-ID', { month: 'short' })}
                                            </span>
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-200/60">
                        {filteredPegawai.length === 0 ? (
                            <tr>
                                <td colSpan={daysArray.length + 1} className="text-center py-16 px-4 bg-white">
                                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto text-slate-400">
                                        <div className="p-3 bg-slate-100 rounded-full text-slate-400">
                                            <Search size={24} />
                                        </div>
                                        <p className="font-semibold text-slate-600 text-sm">Pegawai Tidak Ditemukan</p>
                                        <p className="text-xs text-slate-400 text-center">
                                            Tidak ada data pegawai yang sesuai dengan kata kunci search atau filter yang dipilih.
                                        </p>
                                        {isFiltered && (
                                            <button
                                                onClick={handleResetFilters}
                                                className="mt-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
                                            >
                                                Bersihkan Filter
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredPegawai.map((pegawai: any, index: number) => {
                                const rowBg = index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50';
                                const cellBg = index % 2 === 0 ? 'bg-white' : 'bg-slate-50';
                                return (
                                    <tr key={pegawai.id} className={`border-b border-slate-100 hover:bg-slate-100/60 transition-colors ${rowBg}`}>
                                        {/* Sticky Employee Info */}
                                        <td className={`px-4 py-3 border-r border-slate-200 sticky left-0 z-10 ${cellBg} shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]`}>
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-bold text-slate-800 text-xs truncate" title={pegawai.nama}>
                                                        {pegawai.nama}
                                                    </span>
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <span className="inline-block text-[9px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/80 truncate">
                                                            {pegawai.jabatan?.departemen?.nama_departemen || "Umum"}
                                                        </span>
                                                        <span className="text-[9px] text-slate-400 font-medium truncate">
                                                            {pegawai.jabatan?.nama_jabatan || "Pegawai"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Date Cells */}
                                        {daysArray.map((dateObj, idx) => {
                                            const isSunday = dateObj.getDay() === 0;
                                            const dateKey = dateObj.toLocaleDateString('en-CA');
                                            const pegawaiId = String(pegawai.id);

                                            const absensi = absensiMap[pegawaiId]?.[dateKey] || null;
                                            const jadwal = jadwalMap[pegawaiId]?.[dateKey] || null;
                                            const status = determineStatus(absensi, jadwal);
                                            const statusInfo = STATUS_MAP[status];

                                            let baseCellBg = isSunday ? 'bg-rose-50/20' : '';
                                            if (status !== 'kosong') {
                                                baseCellBg = `${statusInfo.bgColor}/30 hover:${statusInfo.bgColor}/50`;
                                            }

                                            return (
                                                <td
                                                    key={idx}
                                                    className={`p-2 border-r border-slate-100 relative group transition-colors hover:bg-slate-100/80 min-w-[110px] align-top ${baseCellBg}`}
                                                >
                                                    <div className="w-full min-h-[44px] flex flex-col gap-1 items-center justify-center relative">
                                                        {status !== 'kosong' ? (
                                                            <div className={`relative group/badge ${statusInfo.bgColor} hover:brightness-95 ${statusInfo.color} border ${statusInfo.borderColor} rounded-lg p-1.5 shadow-2xs transition-all w-full flex flex-col gap-0.5 select-none`}>
                                                                {/* Status Badge Header */}
                                                                <div className="flex items-center justify-between gap-1 w-full">
                                                                    <div className="flex items-center gap-1">
                                                                        {statusInfo.icon}
                                                                        <span className={`font-extrabold text-[10px] ${statusInfo.textColor} tracking-tight`}>
                                                                            {statusInfo.label}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Time Info (if absensi exists) */}
                                                                {absensi && (
                                                                    <div className={`text-[9px] font-medium ${statusInfo.textColor}/80 border-t ${statusInfo.borderColor}/60 pt-0.5 flex items-center gap-1`}>
                                                                        <Clock size={8} className="shrink-0" />
                                                                        <span>{formatWaktu(absensi.waktu_awal)} - {formatWaktu(absensi.waktu_akhir)}</span>
                                                                    </div>
                                                                )}

                                                                {/* Hover Tooltip */}
                                                                <div className={`absolute left-1/2 -translate-x-1/2 hidden group-hover/badge:flex flex-col bg-white border border-slate-200 text-slate-800 p-3 rounded-xl shadow-xl w-52 z-40 pointer-events-none transition-all ${
                                                                    index < 2 ? 'top-full mt-2' : 'bottom-full mb-2'
                                                                }`}>
                                                                    {/* Tooltip Header */}
                                                                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold pb-1.5 border-b border-slate-200">
                                                                        <div className="flex items-center gap-1">
                                                                            <Info size={10} />
                                                                            <span>Detail Absensi</span>
                                                                        </div>
                                                                        <span className="text-slate-400">{dateKey}</span>
                                                                    </div>

                                                                    {/* Status */}
                                                                    <div className="mt-2 flex items-center gap-1.5">
                                                                        {statusInfo.icon}
                                                                        <span className={`font-bold text-xs ${statusInfo.textColor}`}>
                                                                            {statusInfo.label}
                                                                        </span>
                                                                    </div>

                                                                    {/* Jam Masuk */}
                                                                    <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                                                                        <span className="text-slate-500 font-medium">Jam Masuk</span>
                                                                        <span className="font-bold text-slate-700">
                                                                            {absensi ? formatWaktu(absensi.waktu_awal) : '-'}
                                                                        </span>

                                                                        {/* Jam Pulang */}
                                                                        <span className="text-slate-500 font-medium">Jam Pulang</span>
                                                                        <span className="font-bold text-slate-700">
                                                                            {absensi ? formatWaktu(absensi.waktu_akhir) : '-'}
                                                                        </span>

                                                                        {/* Status Lembur */}
                                                                        <span className="text-slate-500 font-medium">Status Lembur</span>
                                                                        <span className={`font-bold ${absensi?.status_lembur ? 'text-blue-600' : 'text-slate-400'}`}>
                                                                            {absensi?.status_lembur || 'Tidak Ada'}
                                                                        </span>

                                                                        {/* Jadwal Shift */}
                                                                        {jadwal && (
                                                                            <>
                                                                                <span className="text-slate-500 font-medium">Shift</span>
                                                                                <span className="font-bold text-slate-700">
                                                                                    {jadwal.shift_kode || '-'}
                                                                                </span>
                                                                                <span className="text-slate-500 font-medium">Jadwal Masuk</span>
                                                                                <span className="font-bold text-slate-700">
                                                                                    {formatWaktu(jadwal.jam_masuk)}
                                                                                </span>
                                                                                <span className="text-slate-500 font-medium">Jadwal Pulang</span>
                                                                                <span className="font-bold text-slate-700">
                                                                                    {formatWaktu(jadwal.jam_pulang)}
                                                                                </span>
                                                                            </>
                                                                        )}
                                                                    </div>

                                                                    {/* Deskripsi Tambahan */}
                                                                    {status === 'terlambat' && (
                                                                        <div className="mt-1.5 pt-1.5 border-t border-slate-100 text-[9px] text-amber-600 font-medium italic">
                                                                            Pegawai masuk melewati jam masuk yang dijadwalkan.
                                                                        </div>
                                                                    )}
                                                                    {status === 'pulang_awal' && (
                                                                        <div className="mt-1.5 pt-1.5 border-t border-slate-100 text-[9px] text-orange-600 font-medium italic">
                                                                            Pegawai pulang sebelum jam pulang shift berakhir.
                                                                        </div>
                                                                    )}
                                                                    {status === 'lupa_absen_pulang' && (
                                                                        <div className="mt-1.5 pt-1.5 border-t border-slate-100 text-[9px] text-purple-600 font-medium italic">
                                                                            Tercatat masuk tetapi tidak ada rekam absen pulang.
                                                                        </div>
                                                                    )}
                                                                    {status === 'tidak_hadir' && (
                                                                        <div className="mt-1.5 pt-1.5 border-t border-slate-100 text-[9px] text-red-600 font-medium italic">
                                                                            Pegawai memiliki jadwal shift tetapi tidak ada catatan absensi masuk.
                                                                        </div>
                                                                    )}
                                                                    {status === 'void' && (
                                                                        <div className="mt-1.5 pt-1.5 border-t border-slate-100 text-[9px] text-rose-600 font-medium italic">
                                                                            Absensi ini telah di-void oleh admin.
                                                                        </div>
                                                                    )}

                                                                    {/* Pegawai Name */}
                                                                    <div className="text-[9px] text-slate-400 mt-1.5 italic border-t border-slate-100 pt-1">
                                                                        Pegawai: {pegawai.nama}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-200 group-hover:text-slate-400 transition-colors select-none text-base font-bold">&middot;</span>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

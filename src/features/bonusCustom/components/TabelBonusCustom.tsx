import { Trash2, Search, Pencil,  Users, RotateCcw } from 'lucide-react';
import { useState, useMemo } from 'react';

export interface BonusCustomData {
    id: string;
    nama_pegawai: string;
    pegawai_id: string;
    tanggal_diberikan: string;
    keterangan: string;
    nominal: number;
}

interface TabelBonusCustomProps {
    data: BonusCustomData[];
    listPegawai: any[];
    onDelete: (id: string) => void;
    onEdit?: (bonus: BonusCustomData) => void;
}

export const TabelBonusCustom = ({ data = [], listPegawai = [], onDelete, onEdit }: TabelBonusCustomProps) => {
    // Helper to calculate week number
    const getWeekNumber = (d: Date) => {
        const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        return { year: date.getUTCFullYear(), week: weekNo };
    };

    const now = new Date();
    const weekData = getWeekNumber(now);
    const defaultWeekStr = `${weekData.year}-W${weekData.week.toString().padStart(2, '0')}`;

    // States for Filter & Search
    const [periode, setPeriode] = useState<'minggu' | 'bulan' | 'tahun'>('minggu');
    const [filterValue, setFilterValue] = useState(defaultWeekStr);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDepartemen, setFilterDepartemen] = useState('');
    const [filterJabatan, setFilterJabatan] = useState('');

    // Calculate filterStartDate and filterEndDate reactively based on period & input selection
    const { filterStartDate, filterEndDate } = useMemo(() => {
        if (!filterValue) {
            const currentDay = now.getDay();
            const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
            const monday = new Date(now);
            monday.setDate(diff);
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            return {
                filterStartDate: monday.toLocaleDateString('en-CA'),
                filterEndDate: sunday.toLocaleDateString('en-CA')
            };
        }

        const year = parseInt(filterValue.substring(0, 4));

        if (periode === 'minggu') {
            const week = parseInt(filterValue.substring(6, 8));
            const jan4 = new Date(year, 0, 4);
            const jan4Day = jan4.getDay() || 7;
            const startDate = new Date(year, 0, 4 - jan4Day + 1 + (week - 1) * 7);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);

            return {
                filterStartDate: startDate.toLocaleDateString('en-CA'),
                filterEndDate: endDate.toLocaleDateString('en-CA')
            };
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
        const dateArray = [];
        const currentDate = new Date(filterStartDate);
        const stopDate = new Date(filterEndDate);
        while (currentDate <= stopDate) {
            dateArray.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dateArray;
    }, [filterStartDate, filterEndDate]);

    // Map bonuses: pegawaiId -> tanggal_diberikan -> BonusCustomData[]
    const bonusesMap = useMemo(() => {
        const map: { [pegawaiIdOrName: string]: { [date: string]: BonusCustomData[] } } = {};
        data.forEach(bonus => {
            const key = bonus.pegawai_id || bonus.nama_pegawai;
            if (!map[key]) map[key] = {};
            if (!map[key][bonus.tanggal_diberikan]) map[key][bonus.tanggal_diberikan] = [];
            map[key][bonus.tanggal_diberikan].push(bonus);
        });
        return map;
    }, [data]);

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

    // Filter employees reactively by search query, department and position
    const filteredPegawai = useMemo(() => {
        return listPegawai.filter(p => {
            const matchSearch = p.nama.toLowerCase().includes(searchQuery.toLowerCase());
            const matchDept = !filterDepartemen || p.jabatan?.departemen?.nama_departemen === filterDepartemen;
            const matchJab = !filterJabatan || p.jabatan?.nama_jabatan === filterJabatan;
            return matchSearch && matchDept && matchJab;
        });
    }, [listPegawai, searchQuery, filterDepartemen, filterJabatan]);


    // Handle when period selection changes
    const handlePeriodeChange = (newPeriode: 'minggu' | 'bulan' | 'tahun') => {
        setPeriode(newPeriode);
        if (newPeriode === 'minggu') {
            setFilterValue(defaultWeekStr);
        } else if (newPeriode === 'bulan') {
            const monthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
            setFilterValue(monthStr);
        } else {
            setFilterValue(String(now.getFullYear()));
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

    return (
        <div className="flex flex-col w-full bg-white relative rounded-b-xl">
            {/* Filter Toolbar */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col gap-4">
                {/* Baris Atas: Search & Period Switcher */}
                <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[240px] max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Cari nama pegawai di matriks..."
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

                    {/* Period Switcher & Date Controls */}
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
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
                                <input
                                    type="number"
                                    min="2000"
                                    max="2099"
                                    value={filterValue}
                                    onChange={(e) => setFilterValue(e.target.value)}
                                    className="w-24 border border-slate-300 rounded-xl px-3 py-1.5 bg-white text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs cursor-pointer"
                                />
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

                {/* Baris Bawah: Filter Departemen & Jabatan + Metrics Summary */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between pt-1">
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
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
                        <div className="relative flex- sm:flex-none">
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
                                            isSunday ? 'bg-rose-50/70 text-rose-700' : isSaturday ? 'bg-amber-50/40 text-slate-700' : 'bg-slate-100 text-slate-700'
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
                            filteredPegawai.map((pegawai, index) => {
                                const rowBg = index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50';
                                return (
                                    <tr key={pegawai.id} className={`border-b border-slate-100 hover:bg-slate-100/60 transition-colors ${rowBg}`}>
                                        {/* Sticky Employee Info */}
                                        <td className="px-4 py-3 border-r border-slate-200 sticky left-0 z-10 bg-inherit shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]">
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
                                            
                                            // Match by either pegawai_id or name
                                            const bonusesOnDay = bonusesMap[String(pegawai.id)]?.[dateKey] || 
                                                                  bonusesMap[pegawai.nama]?.[dateKey] || [];

                                            let cellBg = isSunday ? 'bg-rose-50/20' : '';
                                            if (bonusesOnDay.length > 0) {
                                                cellBg = 'bg-emerald-50/30 hover:bg-emerald-100/40';
                                            }

                                            return (
                                                <td
                                                    key={idx}
                                                    className={`p-2 border-r border-slate-100 relative group transition-colors hover:bg-slate-100/80 min-w-[110px] vertical-top ${cellBg}`}
                                                >
                                                    <div className="w-full min-h-[44px] flex flex-col gap-1.5 items-center justify-center relative">
                                                        {bonusesOnDay.length === 1 ? (
                                                            (() => {
                                                                const bonus = bonusesOnDay[0];
                                                                return (
                                                                    <div 
                                                                        key={bonus.id} 
                                                                        className="relative group/bonus bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg p-1.5 shadow-2xs transition-all w-full flex flex-col gap-1 select-none"
                                                                    >
                                                                        {/* Main Nominal & Action Bar */}
                                                                        <div className="flex items-center justify-between gap-1 w-full">
                                                                            <span className="font-extrabold text-[11px] text-emerald-700 tracking-tight">
                                                                                Rp{bonus.nominal.toLocaleString('id-ID')}
                                                                            </span>
                                                                            
                                                                            <div className="flex items-center gap-1 opacity-90 group-hover/bonus:opacity-100 transition-opacity">
                                                                                {onEdit && (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            onEdit(bonus);
                                                                                        }}
                                                                                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-200/50 p-1 rounded-md transition-colors cursor-pointer"
                                                                                        title={`Edit: ${bonus.keterangan || 'Tanpa keterangan'}`}
                                                                                    >
                                                                                        <Pencil size={11} />
                                                                                    </button>
                                                                                )}
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        onDelete(bonus.id);
                                                                                    }}
                                                                                    className="text-rose-600 hover:text-rose-800 hover:bg-rose-200/50 p-1 rounded-md transition-colors cursor-pointer"
                                                                                    title={`Hapus: ${bonus.keterangan || 'Tanpa keterangan'}`}
                                                                                >
                                                                                    <Trash2 size={11} />
                                                                                </button>
                                                                            </div>
                                                                        </div>

                                                                        {/* Keterangan Tag */}
                                                                        {bonus.keterangan && (
                                                                            <div className="text-[9px] font-medium text-emerald-600/90 truncate border-t border-emerald-200/60 pt-0.5" title={bonus.keterangan}>
                                                                                {bonus.keterangan}
                                                                            </div>
                                                                        )}

                                                                        {/* Rich Tooltip Popover on Hover */}
                                                                        {bonus.keterangan && (
                                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/bonus:flex flex-col bg-white border border-slate-200 text-slate-800 p-2.5 rounded-xl shadow-xl w-48 z-40 pointer-events-none transition-all">
                                                                                <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium pb-1 border-b border-slate-200">
                                                                                    <span>Detail Bonus</span>
                                                                                    <span>{bonus.tanggal_diberikan}</span>
                                                                                </div>
                                                                                <div className="mt-1 font-bold text-emerald-600 text-xs">
                                                                                    Rp{bonus.nominal.toLocaleString('id-ID')}
                                                                                </div>
                                                                                <div className="text-[10px] text-slate-700 font-normal mt-0.5 leading-snug">
                                                                                    {bonus.keterangan}
                                                                                </div>
                                                                                <div className="text-[9px] text-slate-400 mt-1 italic">
                                                                                    Pegawai: {bonus.nama_pegawai}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })()
                                                        ) : bonusesOnDay.length > 1 ? (
                                                            (() => {
                                                                const totalNominal = bonusesOnDay.reduce((acc, b) => acc + (Number(b.nominal) || 0), 0);
                                                                return (
                                                                    <div className="relative group/cell bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg p-1.5 shadow-2xs transition-all w-full flex flex-col gap-0.5 select-none cursor-pointer">
                                                                        <div className="flex items-center justify-between gap-1 w-full">
                                                                            <span className="font-extrabold text-[11px] text-emerald-700 tracking-tight">
                                                                                Rp{totalNominal.toLocaleString('id-ID')}
                                                                            </span>
                                                                            <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-200/80 px-1.5 py-0.2 rounded border border-emerald-300/60">
                                                                                {bonusesOnDay.length} item
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-[9px] font-medium text-emerald-600/90 truncate border-t border-emerald-200/60 pt-0.5">
                                                                            {bonusesOnDay.map(b => b.keterangan).filter(Boolean).join(', ')}
                                                                        </div>

                                                                        {/* Popover Breakdown on Hover */}
                                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/cell:flex flex-col bg-white border border-slate-200 text-slate-800 p-2.5 rounded-xl shadow-xl w-56 z-50 transition-all pointer-events-auto">
                                                                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold pb-1.5 border-b border-slate-200">
                                                                                <span>{bonusesOnDay.length} Bonus ({dateKey})</span>
                                                                                <span className="text-emerald-700 font-black">Total: Rp{totalNominal.toLocaleString('id-ID')}</span>
                                                                            </div>
                                                                            <div className="flex flex-col gap-1.5 mt-2 max-h-40 overflow-y-auto scrollbar-thin">
                                                                                {bonusesOnDay.map((b) => (
                                                                                    <div key={b.id} className="flex items-center justify-between gap-2 p-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                                                                                        <div className="flex flex-col min-w-0">
                                                                                            <span className="font-bold text-emerald-700 text-[11px]">Rp{b.nominal.toLocaleString('id-ID')}</span>
                                                                                            <span className="text-[10px] text-slate-600 truncate">{b.keterangan || "Tanpa keterangan"}</span>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-1 shrink-0">
                                                                                            {onEdit && (
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                        onEdit(b);
                                                                                                    }}
                                                                                                    className="text-blue-600 hover:bg-blue-100 p-1 rounded transition-colors cursor-pointer"
                                                                                                    title="Edit bonus ini"
                                                                                                >
                                                                                                    <Pencil size={11} />
                                                                                                </button>
                                                                                            )}
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    onDelete(b.id);
                                                                                                }}
                                                                                                className="text-rose-600 hover:bg-rose-100 p-1 rounded transition-colors cursor-pointer"
                                                                                                title="Hapus bonus ini"
                                                                                            >
                                                                                                <Trash2 size={11} />
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })()
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
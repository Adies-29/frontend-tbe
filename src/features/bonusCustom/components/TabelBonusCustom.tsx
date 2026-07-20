import { Trash2, Search } from 'lucide-react';
import { useState, useMemo } from 'react';

// const formatRupiah = (angka: number) => {
//     return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
// };

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
}

export const TabelBonusCustom = ({ data = [], listPegawai = [], onDelete }: TabelBonusCustomProps) => {
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
    const [periode, setPeriode] = useState<'minggu' | 'bulan'>('minggu');
    const [filterValue, setFilterValue] = useState(defaultWeekStr);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDepartemen, setFilterDepartemen] = useState('');
    const [filterJabatan, setFilterJabatan] = useState('');

    // Calculate filterStartDate and filterEndDate reactively based on period & input selection
    const { filterStartDate, filterEndDate } = useMemo(() => {
        if (!filterValue) {
            // Default to current week range
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
            const firstDayOfYear = new Date(year, 0, 1);
            const daysToFirstMonday = (8 - firstDayOfYear.getDay()) % 7;
            const firstMonday = new Date(year, 0, 1 + daysToFirstMonday);
            const startDate = new Date(firstMonday.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
            const endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);

            return {
                filterStartDate: startDate.toLocaleDateString('en-CA'),
                filterEndDate: endDate.toLocaleDateString('en-CA')
            };
        } else {
            const month = parseInt(filterValue.substring(5, 7));
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);

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
    const handlePeriodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPeriode = e.target.value as 'minggu' | 'bulan';
        setPeriode(newPeriode);
        if (newPeriode === 'minggu') {
            setFilterValue(defaultWeekStr);
        } else {
            const monthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
            setFilterValue(monthStr);
        }
    };

    const handleDepartemenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilterDepartemen(e.target.value);
        setFilterJabatan('');
    };

    return (
        <div className="flex flex-col w-full h-full bg-white relative">
            {/* Filter Toolbar */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col gap-4">
                {/* Bagian Atas: Pencarian & Date Controls */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                    {/* Search */}
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Cari nama Pegawai..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="border border-gray-300 rounded-lg pl-9 pr-3 py-1.5 outline-none focus:border-red-500 shadow-sm text-xs w-full bg-white"
                        />
                    </div>

                    {/* Date Controls */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <select
                            value={periode}
                            onChange={handlePeriodeChange}
                            className="border border-gray-300 rounded-lg px-2 py-1.5 bg-white outline-none focus:border-red-500 shadow-sm text-xs"
                        >
                            <option value="minggu">Mingguan</option>
                            <option value="bulan">Bulanan</option>
                        </select>

                        {periode === 'minggu' ? (
                            <input
                                type="week"
                                value={filterValue}
                                onChange={(e) => setFilterValue(e.target.value)}
                                className="border border-gray-300 rounded-lg px-2 py-1.5 outline-none focus:border-red-500 shadow-sm text-xs bg-white"
                            />
                        ) : (
                            <input
                                type="month"
                                value={filterValue}
                                onChange={(e) => setFilterValue(e.target.value)}
                                className="border border-gray-300 rounded-lg px-2 py-1.5 outline-none focus:border-red-500 shadow-sm text-xs bg-white"
                            />
                        )}
                    </div>
                </div>

                {/* Bagian Bawah: Filter Departemen & Jabatan */}
                <div className="flex flex-col sm:flex-row gap-2 items-center">
                    <div className="flex gap-2 w-full sm:w-auto">
                        <select
                            value={filterDepartemen}
                            onChange={handleDepartemenChange}
                            className="border border-gray-300 rounded-lg px-3 py-1.5 bg-white outline-none focus:border-red-500 shadow-sm text-xs flex-1 sm:flex-none sm:min-w-[150px] truncate"
                        >
                            <option value="">Semua Dept</option>
                            {uniqueDepartemenList.map((dept, idx) => (
                                <option key={idx} value={dept}>{dept}</option>
                            ))}
                        </select>

                        <select
                            value={filterJabatan}
                            onChange={(e) => setFilterJabatan(e.target.value)}
                            disabled={!filterDepartemen}
                            className={`border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:border-red-500 shadow-sm text-xs flex-1 sm:flex-none sm:min-w-[150px] truncate ${!filterDepartemen ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'}`}
                            title={!filterDepartemen ? "Pilih Departemen terlebih dahulu" : "Filter berdasarkan Jabatan"}
                        >
                            <option value="">{filterDepartemen ? "Semua Jabatan" : "Pilih Departemen Dulu"}</option>
                            {uniqueJabatanList.map((jab, idx) => (
                                <option key={idx} value={jab}>{jab}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto w-full relative max-h-[450px]">
                <table className="w-full text-sm text-left border-collapse min-w-max">
                    <thead className="text-xs text-gray-600 uppercase bg-gray-100 sticky top-0 z-20 shadow-sm">
                        <tr>
                            <th scope="col" className="px-4 py-3 border-r border-gray-200 sticky left-0 z-30 bg-gray-100 min-w-[150px] md:min-w-[200px]">
                                Nama Pegawai
                            </th>
                            {daysArray.map((dateObj, idx) => {
                                const isWeekend = dateObj.getDay() === 0;
                                return (
                                    <th key={idx} scope="col" className={`px-2 py-2 border-r border-gray-200 text-center min-w-[75px] leading-tight ${isWeekend ? 'bg-red-50/50' : ''}`}>
                                        <div className={`text-sm ${isWeekend ? 'text-red-600 font-bold' : 'text-gray-700'}`}>{dateObj.getDate()}</div>
                                        <div className={`text-[9px] ${isWeekend ? 'text-red-400 font-medium' : 'text-gray-400'}`}>
                                            {dateObj.toLocaleDateString('id-ID', { month: 'short' })}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                        {filteredPegawai.length === 0 ? (
                            <tr>
                                <td colSpan={daysArray.length + 1} className="text-center p-10 text-gray-400 font-medium">
                                    Pegawai tidak ditemukan.
                                </td>
                            </tr>
                        ) : (
                            filteredPegawai.map((pegawai, index) => {
                                const rowBg = index % 2 === 0 ? 'bg-white' : 'bg-slate-50';
                                return (
                                    <tr key={pegawai.id} className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${rowBg}`}>
                                        {/* Sticky Employee Info */}
                                        <td className="px-4 py-3 border-r border-gray-200 sticky left-0 z-10 bg-inherit shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                                            <div className="font-bold text-gray-800 leading-tight">{pegawai.nama}</div>
                                            <div className="text-[10px] text-gray-500 font-medium mt-0.5">
                                                {pegawai.jabatan?.nama_jabatan || "Karyawan"}
                                            </div>
                                        </td>

                                        {/* Date Cells */}
                                        {daysArray.map((dateObj, idx) => {
                                            const isWeekend = dateObj.getDay() === 0;
                                            const dateKey = dateObj.toLocaleDateString('en-CA');
                                            
                                            // Match by either pegawai_id or name
                                            const bonusesOnDay = bonusesMap[String(pegawai.id)]?.[dateKey] || 
                                                                  bonusesMap[pegawai.nama]?.[dateKey] || [];

                                            let cellBg = isWeekend ? 'bg-red-50/10' : '';
                                            if (bonusesOnDay.length > 0) {
                                                cellBg = 'bg-emerald-50/40';
                                            }

                                            return (
                                                <td key={idx} className={`p-1.5 border-r border-gray-100 relative group transition-colors hover:bg-blue-100/40 min-w-[85px] ${cellBg}`}>
                                                    <div className="w-full min-h-[42px] flex flex-col gap-1 items-center justify-center relative">
                                                        {bonusesOnDay.length > 0 ? (
                                                            bonusesOnDay.map((bonus) => (
                                                                <div 
                                                                    key={bonus.id} 
                                                                    className="relative group/bonus bg-emerald-50 hover:bg-emerald-100 text-emerald-850 border border-emerald-200 rounded px-1.5 py-0.5 text-[10px] font-bold shadow-sm flex items-center justify-between gap-1 select-none w-full max-w-[90px]"
                                                                >
                                                                    <span className="truncate" title={bonus.keterangan}>
                                                                        Rp{bonus.nominal.toLocaleString('id-ID')}
                                                                    </span>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            onDelete(bonus.id);
                                                                        }}
                                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-0.5 transition-colors cursor-pointer shrink-0"
                                                                        title={`Hapus: ${bonus.keterangan || 'Tanpa keterangan'}`}
                                                                    >
                                                                        <Trash2 size={10} />
                                                                    </button>

                                                                    {/* Custom Tooltip */}
                                                                    {bonus.keterangan && (
                                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/bonus:block bg-gray-800 text-white text-[9px] font-medium px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-30 pointer-events-none">
                                                                            {bonus.keterangan}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <span className="text-transparent group-hover:text-blue-300 transition-colors select-none text-lg leading-none">&middot;</span>
                                                        )}
                                                    </div>

                                                    <div className="absolute inset-0 border border-transparent group-hover:border-blue-400/50 rounded pointer-events-none transition-colors" />
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
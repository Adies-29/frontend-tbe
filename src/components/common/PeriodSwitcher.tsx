import dayjs, { type Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

export type PeriodeType = 'minggu' | 'bulan' | 'tahun' | string;

interface PeriodSwitcherProps {
    periode: PeriodeType;
    filterValue: string;
    onPeriodeChange: (newPeriode: 'minggu' | 'bulan' | 'tahun') => void;
    onFilterValueChange: (newValue: string) => void;
    className?: string;
    allowedPeriodes?: ('minggu' | 'bulan' | 'tahun')[];
}

/**
 * Shared Period Switcher Component (Mingguan | Bulanan | Tahunan)
 */
export default function PeriodSwitcher({
    periode,
    filterValue,
    onPeriodeChange,
    onFilterValueChange,
    className = "",
    allowedPeriodes = ['minggu', 'bulan', 'tahun']
}: PeriodSwitcherProps) {
    return (
        <div className={`flex items-center gap-2 flex-wrap sm:flex-nowrap ${className}`}>
            {/* Segmented Control */}
            <div className="bg-slate-200/80 p-1 rounded-xl flex items-center gap-1 shadow-inner">
                {allowedPeriodes.includes('minggu') && (
                    <button
                        type="button"
                        onClick={() => onPeriodeChange('minggu')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            periode === 'minggu'
                                ? 'bg-white text-slate-800 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Mingguan
                    </button>
                )}
                {allowedPeriodes.includes('bulan') && (
                    <button
                        type="button"
                        onClick={() => onPeriodeChange('bulan')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            periode === 'bulan'
                                ? 'bg-white text-slate-800 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Bulanan
                    </button>
                )}
                {allowedPeriodes.includes('tahun') && (
                    <button
                        type="button"
                        onClick={() => onPeriodeChange('tahun')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            periode === 'tahun'
                                ? 'bg-white text-slate-800 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Tahunan
                    </button>
                )}
            </div>

            {/* Input Date Picker */}
            <div className="relative">
                {periode === 'minggu' && (
                    <input
                        type="week"
                        value={filterValue}
                        onChange={(e) => onFilterValueChange(e.target.value)}
                        className="border border-slate-300 rounded-xl px-3 py-1.5 bg-white text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs cursor-pointer"
                    />
                )}
                {periode === 'bulan' && (
                    <input
                        type="month"
                        value={filterValue}
                        onChange={(e) => onFilterValueChange(e.target.value)}
                        className="border border-slate-300 rounded-xl px-3 py-1.5 bg-white text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs cursor-pointer"
                    />
                )}
                {periode === 'tahun' && (
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            views={['year']}
                            value={filterValue ? dayjs().year(parseInt(filterValue, 10)) : null}
                            onChange={(newValue: Dayjs | null) => newValue && onFilterValueChange(newValue.year().toString())}
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
                                            '& fieldset': {
                                                borderColor: '#cbd5e1',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: '#94a3b8',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#ef4444',
                                            },
                                        },
                                        '& .MuiOutlinedInput-input': {
                                            padding: '6px 12px',
                                        },
                                        '& .MuiIconButton-root': {
                                            padding: '4px',
                                            color: '#64748b'
                                        }
                                    }
                                }
                            }}
                        />
                    </LocalizationProvider>
                )}
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar, RotateCcw } from 'lucide-react';
import Button from '../../../components/common/Button';

interface CustomDateRangePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
    onApply: (start: string, end: string) => void;
    title?: string;
}

const MONTH_NAMES_ID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES_ID = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export default function CustomDateRangePickerModal({
    isOpen,
    onClose,
    startDate,
    endDate,
    onApply,
    title = "Pilih Rentang Tanggal Shift"
}: CustomDateRangePickerModalProps) {
    const [tempStart, setTempStart] = useState<string>(startDate);
    const [tempEnd, setTempEnd] = useState<string>(endDate);
    const [activeTarget, setActiveTarget] = useState<'start' | 'end'>('start');
    const [hoveredDate, setHoveredDate] = useState<string | null>(null);

    // Initial calendar month view based on startDate or current date
    const initialDate = startDate ? new Date(startDate) : new Date();
    const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear() || new Date().getFullYear());
    const [viewMonth, setViewMonth] = useState<number>(
        isNaN(initialDate.getMonth()) ? new Date().getMonth() : initialDate.getMonth()
    );

    useEffect(() => {
        if (isOpen) {
            setTempStart(startDate);
            setTempEnd(endDate);
            setActiveTarget(startDate ? 'end' : 'start');
            const d = startDate ? new Date(startDate) : new Date();
            if (!isNaN(d.getFullYear())) {
                setViewYear(d.getFullYear());
                setViewMonth(d.getMonth());
            }
        }
    }, [isOpen, startDate, endDate]);

    if (!isOpen) return null;

    const handlePrevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear(prev => prev - 1);
        } else {
            setViewMonth(prev => prev - 1);
        }
    };

    const handleNextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear(prev => prev + 1);
        } else {
            setViewMonth(prev => prev + 1);
        }
    };

    const formatDateIndo = (dateStr: string) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-').map(Number);
        if (!y || !m || !d) return dateStr;
        return `${d} ${MONTH_NAMES_ID[m - 1].substring(0, 3)} ${y}`;
    };

    // Calculate Days for Calendar View (Monday-first)
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    // In JS, 0 is Sunday. Convert to Monday=0, Sunday=6
    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;

    const calendarDays: Array<{ dateStr: string; dayNum: number; isCurrentMonth: boolean }> = [];

    // Empty leading padding days
    for (let i = 0; i < startDayOfWeek; i++) {
        calendarDays.push({ dateStr: '', dayNum: 0, isCurrentMonth: false });
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
        const mPad = String(viewMonth + 1).padStart(2, '0');
        const dPad = String(day).padStart(2, '0');
        calendarDays.push({
            dateStr: `${viewYear}-${mPad}-${dPad}`,
            dayNum: day,
            isCurrentMonth: true
        });
    }

    const handleDayClick = (dateStr: string) => {
        if (!dateStr) return;

        if (activeTarget === 'start') {
            setTempStart(dateStr);
            if (tempEnd && dateStr > tempEnd) {
                setTempEnd('');
            }
            setActiveTarget('end');
        } else {
            if (tempStart && dateStr < tempStart) {
                setTempStart(dateStr);
                setTempEnd('');
                setActiveTarget('end');
            } else {
                setTempEnd(dateStr);
            }
        }
    };

    const handleReset = () => {
        setTempStart('');
        setTempEnd('');
        setActiveTarget('start');
        setHoveredDate(null);
    };

    const handleSave = () => {
        let finalStart = tempStart;
        let finalEnd = tempEnd;

        if (finalStart && !finalEnd) {
            finalEnd = finalStart;
        } else if (!finalStart && finalEnd) {
            finalStart = finalEnd;
        }

        onApply(finalStart, finalEnd);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 animate-in zoom-in-95 my-4 flex flex-col">
                
                {/* MODAL HEADER */}
                <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Calendar size={20} className="text-black" />
                        <div>
                            <h3 className="font-bold text-gray-800 text-base">{title}</h3>
                            <p className="text-xs text-gray-500 font-semibold mt-0.5">
                                Klik tanggal mulai, lalu klik tanggal selesai
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* DYNAMIC TOP INDICATOR BUTTONS */}
                <div className="p-4 bg-gray-100/80 border-b border-gray-200 grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setActiveTarget('start')}
                        className={`flex flex-col p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                            activeTarget === 'start'
                                ? 'bg-white border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                                : 'bg-gray-50 border-gray-300 hover:bg-white text-gray-600'
                        }`}
                    >
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                            Tanggal Mulai
                        </span>
                        <span className="text-sm font-extrabold text-gray-800 mt-0.5 truncate">
                            {tempStart ? formatDateIndo(tempStart) : 'Pilih Tanggal'}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTarget('end')}
                        className={`flex flex-col p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                            activeTarget === 'end'
                                ? 'bg-white border-green-600 ring-2 ring-green-500/20 shadow-md'
                                : 'bg-gray-50 border-gray-300 hover:bg-white text-gray-600'
                        }`}
                    >
                        <span className="text-[10px] font-bold uppercase tracking-wider text-green-600">
                            Tanggal Selesai
                        </span>
                        <span className="text-sm font-extrabold text-gray-800 mt-0.5 truncate">
                            {tempEnd ? formatDateIndo(tempEnd) : 'Pilih Tanggal'}
                        </span>
                    </button>
                </div>

                {/* CALENDAR MONTH NAVIGATOR */}
                <div className="px-5 pt-4 pb-2 flex justify-between items-center">
                    <button
                        type="button"
                        onClick={handlePrevMonth}
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
                        title="Bulan Sebelumnya"
                    >
                        <ChevronLeft size={18} />
                    </button>

                    <h4 className="font-extrabold text-gray-800 text-base">
                        {MONTH_NAMES_ID[viewMonth]} {viewYear}
                    </h4>

                    <button
                        type="button"
                        onClick={handleNextMonth}
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
                        title="Bulan Berikutnya"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>

                {/* CALENDAR GRID */}
                <div className="p-4 pt-1">
                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-1 text-center mb-1">
                        {DAY_NAMES_ID.map((dayName, idx) => (
                            <div key={idx} className="text-xs font-bold text-gray-400 py-1 uppercase tracking-wider">
                                {dayName}
                            </div>
                        ))}
                    </div>

                    {/* Day Cells */}
                    <div className="grid grid-cols-7 gap-y-1 gap-x-0 text-center">
                        {calendarDays.map((item, idx) => {
                            if (!item.isCurrentMonth) {
                                return <div key={idx} className="h-9 w-full" />;
                            }

                            const dStr = item.dateStr;
                            const isStart = dStr === tempStart;
                            const isEnd = dStr === tempEnd;

                            // Confirmed saved range
                            const isInRange = Boolean(tempStart && tempEnd && dStr >= tempStart && dStr <= tempEnd);

                            // Dynamic hover preview range
                            const effectiveEnd = tempEnd || (activeTarget === 'end' && hoveredDate && hoveredDate >= tempStart ? hoveredDate : '');
                            const isHoveredRange = Boolean(
                                tempStart &&
                                !tempEnd &&
                                effectiveEnd &&
                                dStr >= tempStart &&
                                dStr <= effectiveEnd
                            );

                            let cellStyle = "hover:bg-blue-100 hover:text-blue-700 text-gray-700 rounded-lg";
                            let containerStyle = "";

                            if (isStart && isEnd) {
                                cellStyle = "bg-blue-600 text-white font-bold rounded-lg shadow-sm";
                            } else if (isStart) {
                                cellStyle = "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-l-lg shadow-sm";
                                containerStyle = "bg-blue-100/60 rounded-l-lg";
                            } else if (isEnd) {
                                cellStyle = "bg-gradient-to-r from-green-600 to-green-600 text-white font-bold rounded-r-lg shadow-sm";
                                containerStyle = "bg-blue-100/60 rounded-r-lg";
                            } else if (isInRange) {
                                cellStyle = "bg-blue-100 text-blue-900 font-semibold rounded-none";
                                containerStyle = "bg-blue-100";
                            } else if (isHoveredRange) {
                                cellStyle = "bg-blue-100/70 text-blue-800 font-medium rounded-none";
                                containerStyle = "bg-blue-100/70";
                            }

                            return (
                                <div key={idx} className={`p-0.5 ${containerStyle}`}>
                                    <button
                                        type="button"
                                        onClick={() => handleDayClick(dStr)}
                                        onMouseEnter={() => setHoveredDate(dStr)}
                                        className={`w-full h-9 flex items-center justify-center text-xs transition-all cursor-pointer ${cellStyle}`}
                                    >
                                        {item.dayNum}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* MODAL FOOTER ACTIONS */}
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 font-semibold px-2 py-1.5 rounded transition-colors cursor-pointer"
                    >
                        <RotateCcw size={14} />
                        Reset
                    </button>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            label="Batal"
                            onClick={onClose}
                            className="text-xs px-3 py-2"
                        />
                        <Button
                            variant="success"
                            label="Simpan & Terapkan"
                            onClick={handleSave}
                            className="text-xs px-4 py-2 font-bold"
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}

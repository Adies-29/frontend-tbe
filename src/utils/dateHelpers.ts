/**
 * Mengembalikan string minggu ISO saat ini (contoh: "2026-W29")
 */
export const getCurrentWeek = (date: Date = new Date()): string => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayNum = d.getDay() || 7;
    d.setDate(d.getDate() + 4 - dayNum);
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

/**
 * Mengembalikan string bulan saat ini (contoh: "2026-07")
 */
export const getCurrentMonth = (): string => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Mengembalikan string tahun saat ini (contoh: "2026")
 */
export const getCurrentYear = (): string => {
    return new Date().getFullYear().toString();
};

export interface ParsedWeekResult {
    startDate: string;
    endDate: string;
    tanggalMulai: string;
    tanggalSelesai: string;
    year: number;
    week: number;
    targetBulan: number;
    targetTahun: number;
}

/**
 * Mem-parse string minggu ISO (contoh: "2026-W29") menjadi tanggal mulai & selesai ISO ("YYYY-MM-DD")
 */
export const parseWeekValue = (weekStr: string): ParsedWeekResult | null => {
    if (!weekStr || !weekStr.includes('-W')) return null;
    const [tahunStr, mingguStr] = weekStr.split('-W');
    const year = parseInt(tahunStr, 10);
    const week = parseInt(mingguStr, 10);
    if (isNaN(year) || isNaN(week)) return null;

    const jan4 = new Date(year, 0, 4);
    const dayOfJan4 = jan4.getDay() || 7;
    const week1Start = new Date(year, 0, 4 - dayOfJan4 + 1);
    const startDateObj = new Date(week1Start.getFullYear(), week1Start.getMonth(), week1Start.getDate() + (week - 1) * 7);
    const endDateObj = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), startDateObj.getDate() + 6);

    const formatISO = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const startDate = formatISO(startDateObj);
    const endDate = formatISO(endDateObj);

    return {
        startDate,
        endDate,
        tanggalMulai: startDate,
        tanggalSelesai: endDate,
        year,
        week,
        targetBulan: startDateObj.getMonth() + 1,
        targetTahun: startDateObj.getFullYear()
    };
};

/**
 * Format tanggal "YYYY-MM-DD" menjadi "05-09 Mei 2026" tanpa offset timezone
 */
export const formatPeriodeGaji = (startStr?: string, endStr?: string, fallback?: string): string => {
    if (!startStr || !endStr) return fallback || "-";
    const [sY, sM, sD] = startStr.split('-').map(Number);
    const [eY, eM, eD] = endStr.split('-').map(Number);

    if (!sY || !sM || !sD || !eY || !eM || !eD) return fallback || "-";

    const namaBulan = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const pad = (n: number) => String(n).padStart(2, '0');

    if (sY === eY && sM === eM) {
        return `${pad(sD)}-${pad(eD)} ${namaBulan[sM - 1]} ${sY}`;
    }

    if (sY === eY) {
        return `${pad(sD)} ${namaBulan[sM - 1]} - ${pad(eD)} ${namaBulan[eM - 1]} ${sY}`;
    }

    return `${pad(sD)} ${namaBulan[sM - 1]} ${sY} - ${pad(eD)} ${namaBulan[eM - 1]} ${eY}`;
};

export function formatMinutesToText(totalMinutes: number | undefined | null): string {
    if (!totalMinutes || isNaN(totalMinutes) || totalMinutes <= 0) return "";
    const jam = Math.floor(totalMinutes / 60);
    const menit = totalMinutes % 60;
    
    if (jam > 0 && menit > 0) return `Setara dengan ${jam} Jam ${menit} Menit`;
    if (jam > 0) return `Setara dengan ${jam} Jam`;
    return `Setara dengan ${menit} Menit`;
}

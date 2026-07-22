import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import TabelJadwalShift from "../../components/TabelJadwalShift";
import { useMasterShift } from "../../hooks/useMasterShift";


export default function TabShift() {
    const { dataJadwalShift, isLoading, errorMsg, fetchJadwalShift } = useMasterShift();

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchJadwalShift();
        }, 0);
        
        return () => clearTimeout(timeoutId);
    }, [fetchJadwalShift]);

    return (
        <div className="flex flex-col gap-6">
            {/* INFO BANNER */}
            <div data-tour="shift-info-banner" className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3 shadow-sm transition-all duration-300">
                <p className="text-sm text-yellow-700">
                    💡 <strong>Catatan:</strong> Perubahan aturan master shift dan nominal denda akan otomatis berlaku pada kalkulasi absensi di hari berikutnya.
                </p>
            </div>

            <div className="animate-in fade-in duration-300">
                {errorMsg ? (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center font-medium shadow-sm">
                        {errorMsg}
                    </div>
                ) : isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <Loader2 className="animate-spin mb-4 text-blue-600" size={32} />
                        <p>Memuat data Master Shift...</p>
                    </div>
                ) : (
                    <div data-tour="shift-table">
                        <TabelJadwalShift data={dataJadwalShift} onRefresh={fetchJadwalShift} />
                    </div>
                )}
            </div>
        </div>
    );
}

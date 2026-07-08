
import { useLocation, useNavigate } from "react-router-dom";
import TabelMatrixPencapaian from "../components/TabelMatrixPencapaian";
import MasterTargetTab from "../components/MasterTargetTab";

export default function TargetPackingIndex() {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Derivasi tab aktif langsung dari location.state agar tidak memicu cascading render
    const activeTab = (location.state?.tab as 'pencapaian' | 'master') || 'pencapaian';

    const handleTabChange = (tab: 'pencapaian' | 'master') => {
        navigate(location.pathname, { replace: true, state: { tab } });
    };

    return (
        <div className="flex flex-col gap-4 md:gap-6 w-full">
            {/* HEADER & TAB NAVIGATION */}
            <section data-tour="target-header" className="bg-white border border-gray-300 rounded-2xl p-4 md:p-6 shadow-sm w-full print:hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Target Pegawai</h1>
                        <p className="text-sm text-gray-500 mt-1">Kelola pencapaian target harian dan harga satuan target.</p>
                    </div>
                </div>
                
                {/* TAB NAVIGATION */}
                <div className="flex gap-6 mt-6 border-b border-gray-300">
                    <button
                        onClick={() => handleTabChange('pencapaian')}
                        className={`pb-3 px-2 text-[15px] md:text-sm font-semibold transition-colors duration-200 ${
                            activeTab === 'pencapaian'
                                ? 'border-b-2 border-indigo-600 text-indigo-700'
                                : 'text-gray-500 hover:text-indigo-600 active:scale-95'
                        }`}
                    >
                        Pencapaian Harian
                    </button>
                    <button
                        onClick={() => handleTabChange('master')}
                        className={`pb-3 px-2 text-[15px] md:text-sm font-semibold transition-colors duration-200 ${
                            activeTab === 'master'
                                ? 'border-b-2 border-indigo-600 text-indigo-700'
                                : 'text-gray-500 hover:text-indigo-600 active:scale-95'
                        }`}
                    >
                        Master Target
                    </button>
                </div>
            </section>

            {/* TAB CONTENT */}
            <div className="w-full">
                {activeTab === 'pencapaian' && <TabelMatrixPencapaian />}
                {activeTab === 'master' && <MasterTargetTab />}
            </div>
        </div>
    );
}

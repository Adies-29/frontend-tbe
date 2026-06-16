import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TabelMatrixPencapaian from "../components/TabelMatrixPencapaian";
import MasterTargetTab from "../components/MasterTargetTab";

export default function TargetPackingIndex() {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Manage tabs: 'pencapaian' | 'master'
    const [activeTab, setActiveTab] = useState<'pencapaian' | 'master'>('pencapaian');

    useEffect(() => {
        if (location.state?.tab) {
            setActiveTab(location.state.tab as 'pencapaian' | 'master');
        }
    }, [location.state]);

    const handleTabChange = (tab: 'pencapaian' | 'master') => {
        setActiveTab(tab);
        navigate(location.pathname, { replace: true, state: { tab } });
    };

    return (
        <div className="flex flex-col gap-6 w-full p-2">
            {/* HEADER */}
            <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-gray-200 shadow-sm print:hidden">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Target Pegawai</h1>
                    <p className="text-sm text-gray-500 mt-1">Kelola pencapaian target harian dan harga satuan target.</p>
                </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex gap-6 border-b border-gray-300 print:hidden px-2">
                <button
                    onClick={() => handleTabChange('pencapaian')}
                    className={`pb-3 px-2 text-sm font-semibold transition-colors duration-200 ${
                        activeTab === 'pencapaian'
                            ? 'border-b-2 border-indigo-600 text-indigo-700'
                            : 'text-gray-500 hover:text-indigo-600'
                    }`}
                >
                    Pencapaian Harian
                </button>
                <button
                    onClick={() => handleTabChange('master')}
                    className={`pb-3 px-2 text-sm font-semibold transition-colors duration-200 ${
                        activeTab === 'master'
                            ? 'border-b-2 border-indigo-600 text-indigo-700'
                            : 'text-gray-500 hover:text-indigo-600'
                    }`}
                >
                    Master Target
                </button>
            </div>

            {/* TAB CONTENT */}
            <div className="mt-2">
                {activeTab === 'pencapaian' && <TabelMatrixPencapaian />}
                {activeTab === 'master' && <MasterTargetTab />}
            </div>
        </div>
    );
}

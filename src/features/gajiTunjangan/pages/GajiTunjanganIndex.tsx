import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ReceiptText, Briefcase } from 'lucide-react';
import TabRekapGaji from './tabs/TabRekapGaji';
import TabMasterGaji from './tabs/TabMasterGaji';

export default function GajiTunjanganIndex() {
    const location = useLocation();
    
    // State Navigasi
    const [activeTab, setActiveTab] = useState<'rekap' | 'master'>(location.state?.tab || 'rekap');

    return (
        <div className="flex flex-col gap-4 md:gap-6 w-full">
            
            {/* HEADER & TAB NAVIGATION */}
            <section className="bg-white border border-gray-300 rounded-2xl p-4 md:p-6 shadow-sm w-full print:hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Manajemen Gaji & Tunjangan</h1>
                        <p className="text-sm text-gray-500 mt-1">Kelola rekapitulasi gaji pegawai dan atur master nominal gaji berdasarkan jabatan.</p>
                    </div>
                </div>

                {/* SISTEM TAB NAVIGASI UI */}
                <div className="flex mt-6 gap-6 border-b border-gray-300">
                    <button
                        onClick={() => setActiveTab('rekap')}
                        className={`flex items-center gap-2 pb-3 px-2 text-[15px] md:text-sm font-semibold transition-all duration-200 ${
                            activeTab === 'rekap'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 active:scale-95'
                        }`}
                    >
                        <ReceiptText size={18} />
                        Rekap Gaji
                    </button>
                    <button
                        onClick={() => setActiveTab('master')}
                        className={`flex items-center gap-2 pb-3 px-2 text-[15px] md:text-sm font-semibold transition-all duration-200 ${
                            activeTab === 'master'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 active:scale-95'
                        }`}
                    >
                        <Briefcase size={18} />
                        Master Jabatan
                    </button>
                </div>
            </section>

            {/* RENDER KONTEN BERDASARKAN TAB AKTIF */}
            <div className="w-full min-h-[400px]">
                {activeTab === 'rekap' ? <TabRekapGaji /> : <TabMasterGaji />}
            </div>

        </div>
    );
}
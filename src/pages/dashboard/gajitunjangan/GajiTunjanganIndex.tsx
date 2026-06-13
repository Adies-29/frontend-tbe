import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import TabRekapGaji from './tabs/TabRekapGaji';
import TabMasterGaji from './tabs/TabMasterGaji';

export default function GajiTunjanganIndex() {
    const location = useLocation();
    
    // State Navigasi
    const [activeTab, setActiveTab] = useState<'rekap' | 'master'>(location.state?.tab || 'rekap');

    return (
        <div className="flex flex-col gap-6 w-full p-2">

            {/* SISTEM TAB NAVIGASI */}
            <div className="flex gap-6 border-b border-gray-200 px-2 print:hidden">
                <button
                    onClick={() => setActiveTab('rekap')}
                    className={`pb-3 text-sm font-bold border-b-2 transition-all duration-200 ${activeTab === 'rekap' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Rekap Gaji Karyawan
                </button>
                <button
                    onClick={() => setActiveTab('master')}
                    className={`pb-3 text-sm font-bold border-b-2 transition-all duration-200 ${activeTab === 'master' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Master Gaji Jabatan
                </button>
            </div>

            {/* RENDER KONTEN BERDASARKAN TAB */}
            {activeTab === 'rekap' ? <TabRekapGaji /> : <TabMasterGaji />}

        </div>
    );
}
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
        <div className="flex flex-col gap-6 w-full p-2">
            
            {/* HEADER */}
            <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-gray-200 shadow-sm print:hidden">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Manajemen Gaji & Tunjangan</h1>
                    <p className="text-sm text-gray-500 mt-1">Kelola rekapitulasi gaji pegawai dan atur master nominal gaji berdasarkan jabatan.</p>
                </div>
            </div>

            {/* SISTEM TAB NAVIGASI UI */}
            <div className="flex border-b border-gray-300 print:hidden">
                <button
                    onClick={() => setActiveTab('rekap')}
                    className={`flex items-center gap-2 py-3 px-6 font-semibold transition-all duration-200 ${
                        activeTab === 'rekap'
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    <ReceiptText size={18} />
                    Rekap Gaji Pegawai
                </button>
                <button
                    onClick={() => setActiveTab('master')}
                    className={`flex items-center gap-2 py-3 px-6 font-semibold transition-all duration-200 ${
                        activeTab === 'master'
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    <Briefcase size={18} />
                    Master Gaji Jabatan
                </button>
            </div>

            {/* RENDER KONTEN BERDASARKAN TAB AKTIF */}
            <div className="min-h-[400px]">
                {activeTab === 'rekap' ? <TabRekapGaji /> : <TabMasterGaji />}
            </div>

        </div>
    );
}
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Clock } from "lucide-react";
import Button from '../../../components/ui/Button';

import TabJadwal from "./tabs/TabJadwal";
import TabShift from "./tabs/TabShift";

export default function JadwalShiftIndex() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'jadwal' | 'shift'>('jadwal');

    return (
        <div className="flex flex-col gap-6 w-full p-2">
            {/* HEADER */}
            <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Manajemen Jadwal & Shift</h1>
                    <p className="text-sm text-gray-500 mt-1">Kelola kalender kerja karyawan dan master aturan shift.</p>
                </div>
                {/* Tombol aksi dinamis berdasarkan Tab yang aktif */}
                {activeTab === 'shift' && (
                    <Button  
                        label="Tambah Master Shift" 
                        onClick={() => navigate('/dashboard/jadwal-shift/tambah')} 
                    />
                )}
            </div>

            {/* SISTEM TAB NAVIGASI UI */}
            <div className="flex border-b border-gray-300">
                <button
                    onClick={() => setActiveTab('jadwal')}
                    className={`flex items-center gap-2 py-3 px-6 font-semibold transition-all duration-200 ${
                        activeTab === 'jadwal'
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    <CalendarDays size={18} />
                    Jadwal Karyawan
                </button>
                <button
                    onClick={() => setActiveTab('shift')}
                    className={`flex items-center gap-2 py-3 px-6 font-semibold transition-all duration-200 ${
                        activeTab === 'shift'
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    <Clock size={18} />
                    Master Shift
                </button>
            </div>

            {/* RENDER KONTEN BERDASARKAN TAB AKTIF */}
            <div className="min-h-[400px]">
                {activeTab === 'jadwal' ? <TabJadwal /> : <TabShift />}
            </div>
        </div>
    );
}
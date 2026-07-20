import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CalendarDays, Clock, RefreshCw } from "lucide-react";
import Button from '../../../components/common/Button';
import TabJadwal from "./tabs/TabJadwal";
import TabShift from "./tabs/TabShift";
import { ModalKelolaPolaRotasi } from "../components/ModalKelolaPolaRotasi";
import { useMasterShift } from "../hooks/useMasterShift";
import { useAuthStore } from "../../../store/useAuthStore";

export default function JadwalShiftIndex() {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState<'jadwal' | 'shift'>(
        (location.state as any)?.activeTab || 'jadwal'
    );
    const [isModalPolaOpen, setIsModalPolaOpen] = useState(false);
    const token = useAuthStore((state) => state.token) || "";
    const { dataJadwalShift, fetchJadwalShift } = useMasterShift();

    return (
        <div className="flex flex-col gap-4 md:gap-6 w-full">
            {/* HEADER & TAB NAVIGATION */}
            <section data-tour="shift-header" className="bg-white border border-gray-300 rounded-2xl p-4 md:p-6 shadow-sm w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Manajemen Jadwal & Shift</h1>
                        <p className="text-sm text-gray-500 mt-1">Kelola kalender kerja pegawai dan master aturan shift.</p>
                    </div>
                    {/* Tombol aksi dinamis berdasarkan Tab yang aktif */}
                    {activeTab === 'shift' && (
                        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                            <Button 
                                variant="secondary" 
                                label="Pola Rolling Shift" 
                                icon={<RefreshCw size={15} className="text-blue-600" />}
                                onClick={() => setIsModalPolaOpen(true)} 
                                className="w-full sm:w-auto rounded-xl active:scale-95 py-3 md:py-2 text-[15px] md:text-sm"
                            />
                            <Button  
                                data-tour="btn-add-shift"
                                label="Tambah Master Shift" 
                                onClick={() => navigate('/dashboard/jadwal-shift/tambah')}
                                className="w-full sm:w-auto active:scale-95 py-3 md:py-2 text-[15px] md:text-sm rounded-xl"
                            />
                        </div>
                    )}
                </div>

                {/* SISTEM TAB NAVIGASI UI */}
                <div className="flex mt-6 gap-6 border-b border-gray-300">
                    <button
                        data-tour="shift-tab-jadwal"
                        onClick={() => setActiveTab('jadwal')}
                        className={`flex items-center gap-2 pb-3 px-2 text-[15px] md:text-sm font-semibold transition-all duration-200 ${
                            activeTab === 'jadwal'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 active:scale-95'
                        }`}
                    >
                        <CalendarDays size={18} />
                        Jadwal Pegawai
                    </button>
                    <button
                        data-tour="shift-tab-master"
                        onClick={() => setActiveTab('shift')}
                        className={`flex items-center gap-2 pb-3 px-2 text-[15px] md:text-sm font-semibold transition-all duration-200 ${
                            activeTab === 'shift'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 active:scale-95'
                        }`}
                    >
                        <Clock size={18} />
                        Master Shift
                    </button>
                </div>
            </section>

            {/* RENDER KONTEN BERDASARKAN TAB AKTIF */}
            <div className="w-full min-h-[400px]">
                {activeTab === 'jadwal' ? <TabJadwal /> : <TabShift />}
            </div>

            <ModalKelolaPolaRotasi
                isOpen={isModalPolaOpen}
                onClose={() => setIsModalPolaOpen(false)}
                shifts={dataJadwalShift}
                token={token}
                onSuccess={fetchJadwalShift}
            />
        </div>
    );
}
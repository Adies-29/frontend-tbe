import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ReceiptText, Briefcase, Loader2, PlayCircle, Printer } from 'lucide-react';
import Button from '../../../components/common/Button';
import TabRekapGaji from './tabs/TabRekapGaji';
import TabMasterGaji from './tabs/TabMasterGaji';
import { useRekapGaji } from '../hooks/useRekapGaji';

export default function GajiTunjanganIndex() {
    const location = useLocation();
    
    // State Navigasi
    const [activeTab, setActiveTab] = useState<'rekap' | 'master'>(location.state?.tab || 'rekap');

    const rekapGajiParams = useRekapGaji();

    return (
        <div className="flex flex-col gap-4 md:gap-6 w-full">
            
            {/* HEADER & TAB NAVIGATION */}
            <section data-tour="gaji-header" className="bg-white border border-gray-300 rounded-2xl p-4 md:p-6 shadow-sm w-full print:hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                            Manajemen Gaji & Tunjangan
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Kelola rekapitulasi gaji pegawai dan atur master nominal gaji berdasarkan jabatan.</p>
                    </div>
                    {/* Tombol aksi dinamis berdasarkan Tab yang aktif */}
                    {activeTab === 'rekap' && (
                        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                            <Button 
                                label="Cetak Slip Gaji" 
                                variant="success" 
                                icon={<Printer size={16} />} 
                                onClick={rekapGajiParams.handleCetakSemuaSlip} 
                                disabled={rekapGajiParams.rekapGajiData.length === 0}
                                className="w-full md:w-auto active:scale-95 py-3 md:py-2 text-[15px] md:text-sm rounded-xl font-bold shadow-2xs cursor-pointer"
                            />
                            {(rekapGajiParams.periode === "bulan" || rekapGajiParams.periode === "minggu") && (
                                <Button 
                                    label={rekapGajiParams.isGenerating ? "Memproses..." : "Generate Gaji"} 
                                    variant="primary" 
                                    icon={rekapGajiParams.isGenerating ? <Loader2 className="animate-spin" size={16} /> : <PlayCircle size={16} />} 
                                    onClick={rekapGajiParams.handleGenerateGaji} 
                                    isLoading={rekapGajiParams.isGenerating}
                                    disabled={!rekapGajiParams.filterValue}
                                    className="w-full md:w-auto active:scale-95 py-3 md:py-2 text-[15px] md:text-sm rounded-xl font-bold shadow-md cursor-pointer"
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* SISTEM TAB NAVIGASI UI */}
                <div className="flex mt-6 gap-6 border-b border-gray-300">
                    <button
                        data-tour="gaji-tab-rekap"
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
                        data-tour="gaji-tab-master"
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
            <div className="w-full min-h-100">
                {activeTab === 'rekap' ? <TabRekapGaji hookParams={rekapGajiParams} /> : <TabMasterGaji />}
            </div>

        </div>
    );
}

import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TabelMasterGaji } from '../../../../features/gajiTunjangan/components/TabelMasterGaji';
import { useMasterGaji } from '../../hooks/useMasterGaji';


export default function TabMasterGaji() {
    const navigate = useNavigate();
    const { masterJabatanData, isLoadingMaster, isErrorMaster } = useMasterGaji();

    const handleNavigasiAturGaji = (id: number | string) => {
        navigate(`/dashboard/gaji-tunjangan/master-gaji/${id}`);
    };

    return (
        <div className='w-full'>
            <div className="flex flex-col gap-6 animate-in fade-in duration-300 relative min-h-50 w-full print:hidden">
                {isErrorMaster && (
                    <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm border border-red-300">
                        Gagal memuat master jabatan. Pastikan koneksi internet & backend berjalan lancar.
                    </div>
                )}
                {isLoadingMaster && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                        <Loader2 className="animate-spin text-red-600" size={32} />
                    </div>
                )}

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm w-full">
                    <h1 className="text-xl font-bold text-gray-800 mb-1">Standar Upah & Bonus</h1>
                    <p className="text-sm text-gray-500">Atur nominal gaji pokok, tunjangan, dan bonus berdasarkan masing-masing jabatan.</p>

                    <TabelMasterGaji data={masterJabatanData} onAturGaji={handleNavigasiAturGaji} />
                </div>
            </div>
        </div>
    );
}

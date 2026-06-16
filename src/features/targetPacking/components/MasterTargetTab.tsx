import { useState, useEffect } from 'react';
import { Loader2, Rows2 } from 'lucide-react';
import { apiFetch } from '../../../utils/apiFetch';
import { useAuthStore } from '../../../store/useAuthStore';
import FormMasterTarget from './FormMasterTarget';

export default function MasterTargetTab() {
    const [jabatans, setJabatans] = useState<{ id: number; nama_jabatan: string }[]>([]);
    const [selectedJabatanId, setSelectedJabatanId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const token = useAuthStore(state => state.token);

    useEffect(() => {
        const fetchJabatans = async () => {
            setIsLoading(true);
            try {
                const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/jabatan`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    const listJabatan = data.data || [];
                    setJabatans(listJabatan);
                    
                    const packingJabatan = listJabatan.find((j: any) => 
                        j.nama_jabatan.toLowerCase().includes('packing')
                    );
                    
                    if (packingJabatan) {
                        setSelectedJabatanId(packingJabatan.id.toString());
                    } else if (listJabatan.length > 0) {
                       
                    }
                }
            } catch (error) {
                console.error("Gagal memuat daftar jabatan", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchJabatans();
    }, [token]);

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-6 w-full print:hidden">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-indigo-700 font-bold border-b border-gray-300 pb-3">
                    <Rows2 size={22} />
                    <h2 className="text-lg">Pilih Jabatan</h2>
                </div>

                {isLoading ? (
                    <div className="flex items-center gap-2 text-gray-500">
                        <Loader2 className="animate-spin" size={18} />
                        <span className="text-sm">Memuat jabatan...</span>
                    </div>
                ) : (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tampilkan Master Target untuk Jabatan:
                        </label>
                        <select
                            value={selectedJabatanId}
                            onChange={(e) => setSelectedJabatanId(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 shadow-sm text-sm bg-white min-w-[300px]"
                        >
                            
                            {jabatans.map((jab) => (
                                <option key={jab.id} value={jab.id.toString()}>
                                    {jab.nama_jabatan}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {selectedJabatanId && (
                <FormMasterTarget jabatanId={selectedJabatanId} />
            )}
        </div>
    );
}

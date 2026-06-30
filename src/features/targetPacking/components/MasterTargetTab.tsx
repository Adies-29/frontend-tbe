import { useState } from 'react';
import { Loader2, Rows2, Plus } from 'lucide-react';
import { apiFetch } from '../../../utils/apiFetch';
import { useAuthStore } from '../../../store/useAuthStore';
import FormMasterTarget from './FormMasterTarget';
import { useQuery } from '@tanstack/react-query';
import Button from '../../../components/common/Button';

export default function MasterTargetTab() {
    const token = useAuthStore((state) => state.token);
    const [selectedJabatanId, setSelectedJabatanId] = useState<string>('');
    const [isAdding, setIsAdding] = useState(false);

    const jabatanQuery = useQuery({
        queryKey: ['jabatanList'],
        queryFn: async () => {
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/jabatan`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error("Gagal memuat daftar jabatan");
            
            return data.data || [];
        }
    });

    const packingJabatan = (jabatanQuery.data || []).find((j: any) => 
        j.nama_jabatan.toLowerCase().includes('packing')
    );
    const defaultJabatanId = packingJabatan ? packingJabatan.id.toString() : ((jabatanQuery.data || []).length > 0 ? (jabatanQuery.data || [])[0].id.toString() : '');
    const currentJabatanId = selectedJabatanId || defaultJabatanId;

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-6 w-full print:hidden">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-indigo-700 font-bold border-b border-gray-300 pb-3">
                    <Rows2 size={22} />
                    <h2 className="text-lg">Pilih Jabatan</h2>
                </div>

                {jabatanQuery.isLoading ? (
                    <div className="flex items-center gap-2 text-gray-500">
                        <Loader2 className="animate-spin" size={18} />
                        <span className="text-sm">Memuat jabatan...</span>
                    </div>
                ) : (
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div className="w-full sm:w-auto">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tampilkan Master Target untuk Jabatan:
                            </label>
                            <select
                                value={currentJabatanId}
                                onChange={(e) => {
                                    setSelectedJabatanId(e.target.value);
                                    setIsAdding(false); // Reset status isAdding jika pindah jabatan
                                }}
                                className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 shadow-sm text-sm bg-white min-w-[300px] w-full sm:w-auto"
                            >
                                {jabatanQuery.data?.map((jab: any) => (
                                    <option key={jab.id} value={jab.id.toString()}>
                                        {jab.nama_jabatan}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {currentJabatanId && !isAdding && (
                            <div className="w-full sm:w-auto">
                                <Button 
                                    label="Tambah Target Baru" 
                                    icon={<Plus size={16} />} 
                                    onClick={() => setIsAdding(true)}
                                    className="w-full sm:w-auto"
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {currentJabatanId && (
                <FormMasterTarget 
                    jabatanId={currentJabatanId} 
                    isAdding={isAdding} 
                    setIsAdding={setIsAdding} 
                />
            )}
        </div>
    );
}

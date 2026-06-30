import { useState } from 'react';
import { Pencil, Trash2, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Button from '../../../components/common/Button';
import ConfirmPopUp from '../../../components/common/ConfirmPopUp';
import Notif from '../../../components/common/Notif';
import type { MasterTargetData } from '../../../types';
import { apiFetch } from '../../../utils/apiFetch';
import { useAuthStore } from '../../../store/useAuthStore';

interface FormMasterTargetProps {
    jabatanId: string;
    isAdding: boolean;
    setIsAdding: (val: boolean) => void;
}

export default function FormMasterTarget({ jabatanId, isAdding, setIsAdding }: FormMasterTargetProps) {
    const queryClient = useQueryClient();
    const token = useAuthStore((state) => state.token);
    
    // Inline Add state (isAdding moved to props)
    const [newTargetName, setNewTargetName] = useState("");
    const [newTargetPrice, setNewTargetPrice] = useState("");

    // Inline Edit state
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editTargetName, setEditTargetName] = useState("");
    const [editTargetPrice, setEditTargetPrice] = useState("");

    // Delete state
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Notifications
    const [notifState, setNotifState] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({
        show: false,
        message: "",
        type: "success"
    });

    const showNotif = (message: string, type: 'success' | 'error' = 'success') => {
        setNotifState({ show: true, message, type });
    };

    const targetsQuery = useQuery({
        queryKey: ['masterTargetList', jabatanId],
        queryFn: async () => {
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/target/master?jabatan_id=${jabatanId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await response.json();
            if (!response.ok) throw new Error("Gagal mengambil data");
            return result.data || result || [];
        }
    });

    const targets: MasterTargetData[] = targetsQuery.data || [];

    const handleCancelAdd = () => {
        setIsAdding(false);
    };

    const addMutation = useMutation({
        mutationFn: async () => {
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/target/master`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },  
                body: JSON.stringify({
                    jabatan_id: parseInt(jabatanId),
                    nama_target: newTargetName,
                    harga_satuan: parseInt(newTargetPrice),
                    is_active: true
                })
            });
            if (!response.ok) throw new Error("Gagal menyimpan data");
        },
        onSuccess: () => {
            showNotif("Target baru berhasil ditambahkan", "success");
            setIsAdding(false);
            queryClient.invalidateQueries({ queryKey: ['masterTargetList', jabatanId] });
        },
        onError: (error: any) => showNotif(error.message || "Gagal menambah target", "error")
    });

    const handleSaveAdd = () => {
        if (!newTargetName || !newTargetPrice) return;
        addMutation.mutate();
    };

    const handleEditClick = (target: MasterTargetData) => {
        setEditingId(target.id);
        setEditTargetName(target.nama_target);
        setEditTargetPrice(target.harga_satuan.toString());
    };

    const handleCancelEdit = () => {
        setEditingId(null);
    };

    const editMutation = useMutation({
        mutationFn: async (payload: any) => {
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/target/master`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },  
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error("Gagal menyimpan data");
        },
        onSuccess: (_, variables) => {
            if (variables.is_active === false && Object.keys(variables).length > 2) {
                showNotif("Target dinonaktifkan (karena belum ada fungsi delete permanen)", "success");
                setShowDeletePopup(false);
                setDeleteId(null);
            } else if (Object.keys(variables).length === 3) {
                showNotif(`Status target diubah menjadi ${variables.is_active ? 'Aktif' : 'Nonaktif'}`, "success");
            } else {
                showNotif("Perubahan target berhasil disimpan", "success");
                setEditingId(null);
            }
            queryClient.invalidateQueries({ queryKey: ['masterTargetList', jabatanId] });
        },
        onError: (error: any) => showNotif(error.message || "Gagal menyimpan data", "error")
    });

    const handleSaveEdit = () => {
        if (!editTargetName || !editTargetPrice || !editingId) return;
        const targetToEdit = targets.find(t => t.id === editingId);
        editMutation.mutate({
            id: editingId,
            jabatan_id: parseInt(jabatanId),
            nama_target: editTargetName,
            harga_satuan: parseInt(editTargetPrice),
            is_active: targetToEdit?.is_active ?? true
        });
    };

    const handleToggleActive = (target: MasterTargetData) => {
        editMutation.mutate({
            id: target.id,
            jabatan_id: target.jabatan_id,
            is_active: !target.is_active
        });
    };

    const handleDeleteClick = (id: number) => {
        setDeleteId(id);
        setShowDeletePopup(true);
    };

    const confirmDelete = () => {
        if (!deleteId) return;
        const targetToDelete = targets.find(t => t.id === deleteId);
        if (targetToDelete) {
            editMutation.mutate({
                ...targetToDelete,
                is_active: false
            });
        }
    };

    return (
        <section className="flex flex-col gap-4 mt-2">

            {targetsQuery.isLoading ? (
                <div className="flex justify-center items-center h-32">
                    <Loader2 className="animate-spin text-indigo-600" size={24} />
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    <div className="border border-gray-200 rounded-lg overflow-x-auto w-full relative">
                        <table className="w-full text-sm text-left min-w-[500px]">
                            <thead className="bg-gray-50 text-gray-600 text-[11px] uppercase border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Nama Target</th>
                                    <th className="px-4 py-3 font-semibold">Harga Satuan</th>
                                    <th className="px-4 py-3 font-semibold text-center w-24">Status</th>
                                    <th className="px-4 py-3 font-semibold text-right w-24">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {targets.length === 0 && !isAdding ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-6 text-center text-gray-500 italic">
                                            Belum ada target untuk jabatan ini. Silakan tambah baru.
                                        </td>
                                    </tr>
                                ) : (
                                    targets.map((target) => (
                                        <tr key={target.id} className="bg-white hover:bg-gray-50 transition-colors">
                                            {editingId === target.id ? (
                                                // EDIT MODE ROW
                                                <>
                                                    <td className="px-4 py-2">
                                                        <input 
                                                            type="text" 
                                                            value={editTargetName}
                                                            onChange={(e) => setEditTargetName(e.target.value)}
                                                            className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm outline-none focus:border-indigo-500"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input 
                                                            type="number" 
                                                            value={editTargetPrice}
                                                            onChange={(e) => setEditTargetPrice(e.target.value)}
                                                            className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm outline-none focus:border-indigo-500"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 text-center text-xs text-gray-400 italic">
                                                        -
                                                    </td>
                                                    <td className="px-4 py-2 text-right space-x-2">
                                                        <div className="flex gap-2 justify-end">
                                                            <Button 
                                                                variant="success"
                                                                label="Simpan"
                                                                onClick={handleSaveEdit}
                                                                isLoading={editMutation.isPending}
                                                                className="px-3 py-1.5 text-xs"
                                                            />
                                                            <Button 
                                                                variant="secondary"
                                                                label="Batal"
                                                                onClick={handleCancelEdit}
                                                                disabled={editMutation.isPending}
                                                                className="px-3 py-1.5 text-xs"
                                                            />
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                // READ MODE ROW
                                                <>
                                                    <td className="px-4 py-3 font-medium text-gray-800">
                                                        {target.nama_target}
                                                    </td>
                                                    <td className="px-4 py-3 font-bold text-gray-700">
                                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(target.harga_satuan)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button 
                                                            onClick={() => handleToggleActive(target)}
                                                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${target.is_active ? 'bg-emerald-500' : 'bg-gray-200'}`}
                                                            title={target.is_active ? "Nonaktifkan" : "Aktifkan"}
                                                        >
                                                            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${target.is_active ? 'translate-x-4' : 'translate-x-0'}`} />
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button 
                                                                onClick={() => handleEditClick(target)}
                                                                className="text-indigo-400 hover:text-indigo-600 p-1 transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Pencil size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteClick(target.id)}
                                                                className="text-red-400 hover:text-red-600 p-1 transition-colors"
                                                                title="Hapus"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))
                                )}

                                {/* ADD NEW ROW */}
                                {isAdding && (
                                    <tr className="bg-indigo-50/50">
                                        <td className="px-4 py-2 border-l-2 border-indigo-500">
                                            <input 
                                                type="text" 
                                                placeholder="Nama target baru..."
                                                value={newTargetName}
                                                onChange={(e) => setNewTargetName(e.target.value)}
                                                className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm outline-none focus:border-indigo-500 bg-white"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input 
                                                type="number" 
                                                placeholder="Harga satuan"
                                                value={newTargetPrice}
                                                onChange={(e) => setNewTargetPrice(e.target.value)}
                                                className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm outline-none focus:border-indigo-500 bg-white"
                                            />
                                        </td>
                                        <td className="px-4 py-2 text-center text-xs text-gray-400 italic">
                                            Aktif otomatis
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <div className="flex gap-2 justify-end">
                                                <Button 
                                                    variant="success"
                                                    label="Simpan"
                                                    onClick={handleSaveAdd}
                                                    disabled={!newTargetName || !newTargetPrice}
                                                    isLoading={addMutation.isPending}
                                                    className="px-3 py-1.5 text-xs"
                                                />
                                                <Button 
                                                    variant="secondary"
                                                    label="Batal"
                                                    onClick={handleCancelAdd}
                                                    disabled={addMutation.isPending}
                                                    className="px-3 py-1.5 text-xs"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <ConfirmPopUp 
                isOpen={showDeletePopup}
                onClose={() => setShowDeletePopup(false)}
                onConfirm={confirmDelete}
                title="Nonaktifkan Target?"
                message="Karena belum ada fungsi hapus permanen, target ini akan dinonaktifkan. Apakah Anda yakin?"
                confirmText="Ya, Nonaktifkan"
                variant="danger"
            />
            
            <Notif 
                show={notifState.show} 
                message={notifState.message} 
                type={notifState.type} 
                onClose={() => setNotifState(prev => ({...prev, show: false}))} 
            />
        </section>
    );
}

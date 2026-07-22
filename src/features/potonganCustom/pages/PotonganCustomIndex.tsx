import { useState } from 'react';
import { PlusCircle, Loader2 } from 'lucide-react';
import Button from '../../../components/common/Button';
import Notif from '../../../components/common/Notif';
import ConfirmPopUp from '../../../components/common/ConfirmPopUp';
import { TabelPotonganCustom, type PotonganCustomData } from '../components/TabelPotonganCustom';
import { usePotonganCustom } from '../hooks/usePotonganCustom';
import ModalTambahPotonganCustom from '../components/ModalTambahPotonganCustom';
import ModalEditPotonganCustom from '../components/ModalEditPotonganCustom';

export default function PotonganCustomIndex() {
    const {
        listPegawai,
        listPotongan,
        isLoadingPotongan,
        isCreating,
        isUpdating,
        notif,
        closeNotif,
        createPotongan,
        updatePotongan,
        handleDeletePotongan
    } = usePotonganCustom();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPotongan, setEditingPotongan] = useState<PotonganCustomData | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
            
            {/* HEADER */}
            <div data-tour="potongan-header" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-800">Potongan Custom</h1>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                        Kelola dan berikan pemotongan gaji khusus secara mandiri ke pegawai
                    </p>
                </div>

                <Button
                    label="Buat Potongan Baru"
                    variant="danger"
                    icon={<PlusCircle size={18} />}
                    onClick={() => setIsModalOpen(true)}
                    className="font-bold shadow-md cursor-pointer"
                />
            </div>

            {/* TABEL RIWAYAT POTONGAN (FULL WIDTH) */}
            <div data-tour="potongan-table" className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col w-full">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-700">Riwayat Pemotongan Gaji</h2>
                    <span className="text-xs text-gray-500 font-medium">
                        Total {listPotongan.length} Data Potongan
                    </span>
                </div>
                
                {isLoadingPotongan ? (
                    <div className="p-10 flex justify-center text-gray-500">
                        <Loader2 className="animate-spin" size={32} />
                    </div>
                ) : (
                    <TabelPotonganCustom 
                        data={listPotongan} 
                        listPegawai={listPegawai} 
                        onDelete={(id) => setDeleteConfirmId(id)} 
                        onEdit={(potongan) => setEditingPotongan(potongan)}
                    />
                )}
            </div>

            {/* MODAL BUAT POTONGAN BARU */}
            <ModalTambahPotonganCustom
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                listPegawai={listPegawai}
                isCreating={isCreating}
                onSubmit={createPotongan}
            />

            {/* MODAL EDIT POTONGAN CUSTOM */}
            <ModalEditPotonganCustom
                isOpen={!!editingPotongan}
                onClose={() => setEditingPotongan(null)}
                potonganData={editingPotongan}
                listPegawai={listPegawai}
                isUpdating={isUpdating}
                onSubmit={updatePotongan}
            />

            {/* MODAL KONFIRMASI HAPUS */}
            <ConfirmPopUp
                isOpen={!!deleteConfirmId}
                onClose={() => setDeleteConfirmId(null)}
                onConfirm={() => {
                    if (deleteConfirmId) {
                        handleDeletePotongan(deleteConfirmId);
                        setDeleteConfirmId(null);
                    }
                }}
                title="Hapus Riwayat Potongan"
                message="Apakah Anda yakin ingin menghapus riwayat potongan ini? (Pastikan gaji periode tersebut belum di-generate ulang)"
                confirmText="Ya, Hapus"
                cancelText="Batal"
                variant="danger"
            />

            {/* NOTIFIKASI TOAST SUCCESS/ERROR */}
            <Notif show={notif.show} message={notif.message} type={notif.type} onClose={closeNotif} />
        </div>
    );
}

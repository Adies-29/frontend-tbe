import { useState } from 'react';
import { Plus, Loader2, Scissors } from 'lucide-react';
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
            <section data-tour="potongan-header" className="bg-white border border-gray-300 rounded-2xl p-4 md:p-6 shadow-sm w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <Scissors size={28} className="text-rose-600" /> Potongan Custom
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Kelola dan berikan pemotongan gaji khusus secara mandiri ke pegawai.
                        </p>
                    </div>
                    <div className="flex gap-3 items-center w-full md:w-auto">
                        <Button
                            label="Buat Potongan Baru"
                            variant="danger"
                            icon={<Plus size={16} />}
                            onClick={() => setIsModalOpen(true)}
                            className="w-full md:w-auto active:scale-95 py-3 md:py-2 text-[15px] md:text-sm rounded-xl font-bold shadow-md cursor-pointer"
                        />
                    </div>
                </div>
            </section>

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

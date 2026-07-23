import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import Button from '../../../components/common/Button';
import Notif from '../../../components/common/Notif';
import ConfirmPopUp from '../../../components/common/ConfirmPopUp';
import TabelBonusCustom, { type BonusCustomData } from '../components/TabelBonusCustom';
import { useBonusCustom } from '../hooks/useBonusCustom';
import ModalTambahBonusCustom from '../components/ModalTambahBonusCustom';
import ModalEditBonusCustom from '../components/ModalEditBonusCustom';

export default function BonusCustomIndex() {
    const {
        listPegawai,
        listBonus,
        isLoadingBonus,
        isCreating,
        isUpdating,
        notif,
        closeNotif,
        createBonus,
        updateBonus,
        handleDeleteBonus,
        handleBatchDelete,
        handleBatchAdd
    } = useBonusCustom();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBonus, setEditingBonus] = useState<BonusCustomData | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
            
            {/* HEADER */}
            <section data-tour="bonus-header" className="bg-white border border-gray-300 rounded-2xl p-4 md:p-6 shadow-sm w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                             Bonus Custom
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Kelola dan berikan bonus/reward khusus secara mandiri ke pegawai.
                        </p>
                    </div>
                    <div className="flex gap-3 items-center w-full md:w-auto">
                        <Button
                            label="Buat Bonus Baru"
                            icon={<Plus size={16} />}
                            onClick={() => setIsModalOpen(true)}
                            className="w-full md:w-auto active:scale-95 py-3 md:py-2 text-[15px] md:text-sm rounded-xl font-bold shadow-md cursor-pointer"
                        />
                    </div>
                </div>
            </section>

            {/* TABEL RIWAYAT BONUS (FULL WIDTH) */}
            <div data-tour="bonus-table" className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col w-full">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-700">Riwayat Pemberian Bonus</h2>
                    <span className="text-xs text-gray-500 font-medium">
                        Total {listBonus.length} Data Bonus
                    </span>
                </div>
                
                {isLoadingBonus ? (
                    <div className="p-10 flex justify-center text-gray-500">
                        <Loader2 className="animate-spin" size={32} />
                    </div>
                ) : (
                    <TabelBonusCustom 
                        data={listBonus} 
                        listPegawai={listPegawai} 
                        onDelete={(id) => setDeleteConfirmId(id)} 
                        onEdit={(bonus) => setEditingBonus(bonus)}
                        onBatchDelete={handleBatchDelete}
                        onBatchAdd={handleBatchAdd}
                    />
                )}
            </div>

            {/* MODAL BUAT BONUS BARU */}
            <ModalTambahBonusCustom
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                listPegawai={listPegawai}
                isCreating={isCreating}
                onSubmit={createBonus}
            />

            {/* MODAL EDIT BONUS CUSTOM */}
            <ModalEditBonusCustom
                isOpen={!!editingBonus}
                onClose={() => setEditingBonus(null)}
                bonusData={editingBonus}
                listPegawai={listPegawai}
                isUpdating={isUpdating}
                onSubmit={updateBonus}
            />

            {/* MODAL KONFIRMASI HAPUS (CUSTOM CONFIRM POPUP) */}
            <ConfirmPopUp
                isOpen={!!deleteConfirmId}
                onClose={() => setDeleteConfirmId(null)}
                onConfirm={() => {
                    if (deleteConfirmId) {
                        handleDeleteBonus(deleteConfirmId);
                        setDeleteConfirmId(null);
                    }
                }}
                title="Hapus Riwayat Bonus"
                message="Apakah Anda yakin ingin menghapus riwayat bonus ini? (Pastikan gaji bulan tersebut belum di-generate ulang)"
                confirmText="Ya, Hapus"
                cancelText="Batal"
                variant="danger"
            />

            {/* NOTIFIKASI TOAST SUCCESS/ERROR */}
            <Notif show={notif.show} message={notif.message} type={notif.type} onClose={closeNotif} />
        </div>
    );
}
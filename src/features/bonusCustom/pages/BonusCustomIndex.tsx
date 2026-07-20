import { useState } from 'react';
import { PlusCircle, Loader2 } from 'lucide-react';
import Button from '../../../components/common/Button';
import Notif from '../../../components/common/Notif';
import { TabelBonusCustom, type BonusCustomData } from '../components/TabelBonusCustom';
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
        handleDeleteBonus
    } = useBonusCustom();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBonus, setEditingBonus] = useState<BonusCustomData | null>(null);

    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
            
            {/* HEADER */}
            <div data-tour="bonus-header" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-800">Bonus Custom</h1>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                        Kelola dan berikan bonus/reward khusus secara mandiri ke karyawan
                    </p>
                </div>

                <Button
                    label="Buat Bonus Baru"
                    variant="primary"
                    icon={<PlusCircle size={18} />}
                    onClick={() => setIsModalOpen(true)}
                    className="font-bold shadow-md"
                />
            </div>

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
                        onDelete={handleDeleteBonus} 
                        onEdit={(bonus) => setEditingBonus(bonus)}
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

            <Notif show={notif.show} message={notif.message} type={notif.type} onClose={closeNotif} />
        </div>
    );
}
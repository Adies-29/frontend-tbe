
import { useState, useMemo } from 'react';
import { Wallet, TrendingDown, TrendingUp, Loader2, PlayCircle, Printer, Search } from 'lucide-react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';

import Button from '../../../../components/common/Button';
import Notif from '../../../../components/common/Notif';
import { TabelRekapGaji, type RekapGajiData } from '../../../../features/gajiTunjangan/components/TabelRekapGaji';
import SlipGajiTemplate from '../../../../features/gajiTunjangan/components/SlipGajiTemplate';
import ModalRincianGaji from '../../../../features/gajiTunjangan/components/ModalRincianGaji';
import { useRekapGaji } from '../../hooks/useRekapGaji';


const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
};

export default function TabRekapGaji() {
    const {
        periode,
        filterValue,
        setFilterValue,
        rekapGajiData,
        isLoadingRekap,
        isErrorRekap,
        isGenerating,
        summaryCards,
        notif,
        handleGenerateGaji,
        handlePelunasanGaji,
        handleCetakSemuaSlip,
        handleFilter,
        handlePeriodeChange,
        closeNotif
    } = useRekapGaji();

    const [searchQuery, setSearchQuery] = useState("");
    const [modalDetail, setModalDetail] = useState<{
        isOpen: boolean;
        type: 'bonus' | 'potongan';
        pegawaiNama: string;
        jabatan: string;
        periodeTanggal?: string;
        totalNominal: number;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rincianData: any;
    }>({
        isOpen: false,
        type: 'bonus',
        pegawaiNama: '',
        jabatan: '',
        periodeTanggal: '',
        totalNominal: 0,
        rincianData: null
    });

    // Filter rekapGajiData berdasarkan pencarian nama atau jabatan pegawai
    const filteredRekapGajiData = useMemo(() => {
        if (!searchQuery.trim()) return rekapGajiData;
        const q = searchQuery.toLowerCase();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return rekapGajiData.filter((item: any) =>
            (item.nama && item.nama.toLowerCase().includes(q)) ||
            (item.jabatan && item.jabatan.toLowerCase().includes(q))
        );
    }, [rekapGajiData, searchQuery]);

    const handleShowDetail = (row: RekapGajiData, type: 'bonus' | 'potongan') => {
        setModalDetail({
            isOpen: true,
            type,
            pegawaiNama: row.nama,
            jabatan: row.jabatan,
            periodeTanggal: row.periode_tanggal,
            totalNominal: type === 'bonus' ? row.total_bonus : row.total_potongan,
            rincianData: type === 'bonus' ? row.rincian_bonus : row.rincian_potongan
        });
    };

    const handleCloseModalDetail = () => {
        setModalDetail(prev => ({ ...prev, isOpen: false }));
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            {isErrorRekap && (
                <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm border border-red-300">
                    Gagal memuat data rekap gaji. Pastikan koneksi internet & backend berjalan lancar.
                </div>
            )}
            {/* WIDGETS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><Wallet size={24} /></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Estimasi Pengeluaran</p>
                        <h3 className="text-xl font-bold text-gray-800">
                            {isLoadingRekap ? "Menghitung..." : formatRupiah(summaryCards.estimasiPengeluaran)}
                        </h3>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 rounded-lg"><TrendingUp size={24} /></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Bonus Disalurkan</p>
                        <h3 className="text-xl font-bold text-gray-800">
                            {isLoadingRekap ? "Menghitung..." : formatRupiah(summaryCards.totalBonus)}
                        </h3>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-red-100 text-red-600 rounded-lg"><TrendingDown size={24} /></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Potongan Denda</p>
                        <h3 className="text-xl font-bold text-gray-800">
                            {isLoadingRekap ? "Menghitung..." : formatRupiah(summaryCards.totalPotongan)}
                        </h3>
                    </div>
                </div>
            </div>

            {/* TABEL DATA GAJI */}
            <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col print:hidden">
                <div className="p-4 border-b flex flex-col gap-4 items-start bg-gray-50">
                    <div className="flex flex-col md:flex-row justify-between w-full items-start md:items-center gap-4">
                        <h2 className="text-lg font-bold text-gray-700">Rincian Gaji Pegawai</h2>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                            {/* SEARCH PEGAWAI */}
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Cari nama / jabatan..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:border-red-500 shadow-sm"
                                />
                            </div>

                            <Button 
                                label="Cetak Slip Gaji" 
                                variant="info" 
                                icon={<Printer size={16} />} 
                                onClick={handleCetakSemuaSlip} 
                                className="w-full sm:w-auto"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row flex-wrap gap-3 items-start md:items-center w-full">
                        <div className="flex gap-2 w-full md:w-auto">
                            <select value={periode} onChange={handlePeriodeChange} className="border border-gray-300 rounded-lg px-3 py-2 bg-white outline-none focus:border-red-500 shadow-sm text-sm flex-1 md:flex-none">
                                <option value="minggu">Mingguan</option>
                                <option value="bulan">Bulanan</option>
                                <option value="tahun">Tahunan</option>
                            </select>

                            {periode === "minggu" && <input type="week" value={filterValue} onChange={(e) => setFilterValue(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-red-500 shadow-sm text-sm flex-1 md:flex-none" />}
                            {periode === "bulan" && <input type="month" value={filterValue} onChange={(e) => setFilterValue(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-red-500 shadow-sm text-sm flex-1 md:flex-none" />}
                            {periode === "tahun" && (
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        views={['year']}
                                        value={filterValue ? dayjs().year(parseInt(filterValue)) : null}
                                        onChange={(newValue: Dayjs | null) => newValue && setFilterValue(newValue.year().toString())}
                                        slotProps={{ textField: { size: 'small', className: "bg-white flex-1 md:w-32", sx: { '& .MuiOutlinedInput-root': { borderRadius: '8px' } } } }}
                                    />
                                </LocalizationProvider>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto mt-1 md:mt-0">
                            <Button label="Filter" variant='warning' onClick={handleFilter} className="w-full sm:w-auto" />
                            
                            {(periode === "bulan" || periode === "minggu") && (
                                <Button 
                                    label={isGenerating ? "Memproses..." : "Generate Gaji"} 
                                    variant="primary" 
                                    icon={isGenerating ? <Loader2 className="animate-spin" size={16} /> : <PlayCircle size={16} />} 
                                    onClick={handleGenerateGaji} 
                                    isLoading={isGenerating}
                                    disabled={!filterValue}
                                    className="w-full sm:w-auto border border-transparent"
                                />
                            )}
                        </div>
                    </div>
                </div>

                <TabelRekapGaji 
                    data={filteredRekapGajiData}
                    onPelunasan={handlePelunasanGaji}
                    onShowDetail={handleShowDetail}
                />

            </section>
            
            <SlipGajiTemplate data={rekapGajiData} filterValue={filterValue} />

            <ModalRincianGaji 
                isOpen={modalDetail.isOpen}
                onClose={handleCloseModalDetail}
                type={modalDetail.type}
                pegawaiNama={modalDetail.pegawaiNama}
                jabatan={modalDetail.jabatan}
                periodeTanggal={modalDetail.periodeTanggal}
                totalNominal={modalDetail.totalNominal}
                rincianData={modalDetail.rincianData}
            />

            <Notif 
                show={notif.show} 
                message={notif.message} 
                type={notif.type} 
                onClose={closeNotif} 
            />
        </div>
    );
}


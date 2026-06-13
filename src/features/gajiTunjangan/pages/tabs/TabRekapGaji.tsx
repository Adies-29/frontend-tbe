import { useEffect } from 'react';
import { Wallet, TrendingDown, TrendingUp, Loader2, PlayCircle, Printer } from 'lucide-react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';

import Button from '../../../../components/common/Button';
import { TabelRekapGaji } from '../../../../features/gajiTunjangan/components/TabelRekapGaji';
import SlipGajiTemplate from '../../../../features/gajiTunjangan/components/SlipGajiTemplate';
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
        isGenerating,
        summaryCards,
        fetchRekapGaji,
        handleGenerateGaji,
        handleCetakSemuaSlip,
        handleFilter,
        handlePeriodeChange
    } = useRekapGaji();

    useEffect(() => {
        fetchRekapGaji();
    }, [fetchRekapGaji]);

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
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
                <div className="p-4 border-b flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 gap-4">
                    <h2 className="text-lg font-bold text-gray-700">Rincian Gaji Pegawai</h2>

                    <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
                        <Button 
                            label="Cetak Slip Gaji" 
                            variant="info" 
                            icon={<Printer size={16} />} 
                            onClick={handleCetakSemuaSlip} 
                            className="mr-2"
                        />

                        <select value={periode} onChange={handlePeriodeChange} className="border border-gray-300 rounded-lg px-3 py-1.5 bg-white outline-none focus:border-red-500 shadow-sm text-sm">
                            <option value="minggu">Mingguan</option>
                            <option value="bulan">Bulanan</option>
                            <option value="tahun">Tahunan</option>
                        </select>

                        {periode === "minggu" && <input type="week" value={filterValue} onChange={(e) => setFilterValue(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:border-red-500 shadow-sm text-sm" />}
                        {periode === "bulan" && <input type="month" value={filterValue} onChange={(e) => setFilterValue(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:border-red-500 shadow-sm text-sm" />}
                        {periode === "tahun" && (
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    views={['year']}
                                    value={filterValue ? dayjs().year(parseInt(filterValue)) : null}
                                    onChange={(newValue: Dayjs | null) => newValue && setFilterValue(newValue.year().toString())}
                                    slotProps={{ textField: { size: 'small', className: "bg-white w-32", sx: { '& .MuiOutlinedInput-root': { borderRadius: '8px' } } } }}
                                />
                            </LocalizationProvider>
                        )}
                        <Button label="Filter" variant='warning' onClick={handleFilter} />

                        {periode === "bulan" && (
                            <Button 
                                label={isGenerating ? "Memproses..." : "Generate Gaji"} 
                                variant="primary" 
                                icon={isGenerating ? <Loader2 className="animate-spin" size={16} /> : <PlayCircle size={16} />} 
                                onClick={handleGenerateGaji} 
                                isLoading={isGenerating}
                                disabled={!filterValue}
                                className="ml-2 border border-transparent"
                            />
                        )}
                    </div>
                </div>

                <TabelRekapGaji data={rekapGajiData} />

            </section>
            
            <SlipGajiTemplate data={rekapGajiData} filterValue={filterValue} />
        </div>
    );
}

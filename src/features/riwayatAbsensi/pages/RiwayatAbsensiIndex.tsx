import { Loader2 } from 'lucide-react';
import { TabelRiwayatAbsensi } from '../components/TabelRiwayatAbsensi';
import { useRiwayatAbsensi } from '../hooks/useRiwayatAbsensi';

export default function RiwayatAbsensiIndex() {
    const {
        listAbsensi,
        listPegawai,
        listJadwal,
        isLoading,
    } = useRiwayatAbsensi();

    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">

            {/* HEADER */}
            <section className="bg-white border border-gray-300 rounded-2xl p-4 md:p-6 shadow-sm w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                            Riwayat Absensi
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Pantau dan lihat rekap riwayat kehadiran seluruh pegawai secara lengkap.
                        </p>
                    </div>
                </div>
            </section>

            {/* TABEL RIWAYAT ABSENSI */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col w-full">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-700">Matriks Kehadiran Pegawai</h2>
                    <span className="text-xs text-gray-500 font-medium">
                        Total {listAbsensi.length} Data Absensi
                    </span>
                </div>

                {isLoading ? (
                    <div className="p-10 flex justify-center text-gray-500">
                        <Loader2 className="animate-spin" size={32} />
                    </div>
                ) : (
                    <TabelRiwayatAbsensi
                        data={listAbsensi}
                        listPegawai={listPegawai}
                        listJadwal={listJadwal}
                    />
                )}
            </div>
        </div>
    );
}

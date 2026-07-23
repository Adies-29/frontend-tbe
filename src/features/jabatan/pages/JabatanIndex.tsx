import { useNavigate } from "react-router-dom";
import { Briefcase, Users, Loader2, Plus } from "lucide-react";
import Button from "../../../components/common/Button";
import type { JabatanData, JabatanOption, PegawaiData } from "../../../types";
import { apiFetchJson } from "../../../utils/apiFetch";
import Notif from "../../../components/common/Notif";
import TabelJabatan from "../components/TabelJabatan";
import { useQuery } from "@tanstack/react-query";
import { useNotif } from "../../../hooks/useNotif";

export default function JabatanIndex() {
    const navigate = useNavigate();
    const { notif, showErrorNotif, closeNotif } = useNotif();

    const fetchJabatan = async (): Promise<JabatanData[]> => {
        try {
            const [resultJabatan, resultPegawai] = await Promise.all([
                apiFetchJson('/api/v1/jabatan'),
                apiFetchJson('/api/v1/pegawai')
            ]);

            const listJabatan = resultJabatan.data || [];
            const listPegawai = resultPegawai.data || [];

            const mappedData: JabatanData[] = listJabatan.map((jab: JabatanOption) => {
                const jumlah = listPegawai.filter(
                    (peg: PegawaiData) => String(peg.jabatan_id) === String(jab.id)
                ).length;

                return {
                    id: jab.id,
                    nama_jabatan: jab.nama_jabatan,
                    departemen: jab.departemen?.nama_departemen || "Tanpa Departemen",
                    departemen_id: jab.departemen_id,
                    jumlah_pegawai: jumlah
                };
            });

            return mappedData;
        } catch (error) {
            console.error("Error fetching jabatan:", error);
            showErrorNotif(error);
            return [];
        }
    };

    const {
        data: dataJabatan = [],
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['jabatan_pegawai'],
        queryFn: fetchJabatan
    });

    const totalJabatan = dataJabatan.length;
    const totalPegawai = dataJabatan.reduce((acc, curr) => acc + (curr.jumlah_pegawai || 0), 0);


    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
            {isError && (
                <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm border border-red-300">
                    Gagal memuat data jabatan. Pastikan koneksi internet & backend berjalan lancar.
                </div>
            )}

            {/* HEADER */}
            <section data-tour="jabatan-header" className="bg-white border border-gray-300 rounded-2xl p-4 md:p-6 shadow-sm w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                            Data Jabatan
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Kelola data jabatan, hierarki, dan kapasitas pegawai di perusahaan.</p>
                    </div>
                    <div className="flex gap-3 items-center w-full md:w-auto">
                        <Button
                            variant="primary"
                            label="Tambah Jabatan"
                            icon={<Plus size={16} />}
                            onClick={() => navigate("/dashboard/jabatan/tambah-jabatan")}
                            className="w-full md:w-auto active:scale-95 py-3 md:py-2 text-[15px] md:text-sm rounded-xl font-bold shadow-md cursor-pointer"
                            data-tour="btn-add-jabatan"
                        />
                    </div>
                </div>
            </section>

            {/* STATS */}
            <div data-tour="jabatan-stats" className="flex flex-col md:flex-row gap-4 w-full">
                {/* Kotak 1: Total Jabatan */}
                <div className="bg-white border border-gray-300 rounded-xl p-4 w-full md:min-w-48 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                        <Briefcase size={24} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm md:text-base font-medium">Total Jabatan</p>
                        <p className="text-2xl font-bold text-black">{totalJabatan}</p>
                    </div>
                </div>

                {/* Kotak 2: Total Karyawan Menjabat */}
                <div className="bg-white border border-gray-300 rounded-xl p-4 w-full md:min-w-48 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm md:text-base font-medium">Pegawai Terisi</p>
                        <p className="text-2xl font-bold text-black">{totalPegawai}</p>
                    </div>
                </div>
            </div>

            {/* 2. BAGIAN TABEL */}
            <section className="bg-white border border-gray-300 rounded-2xl p-4 md:p-6 shadow-sm w-full min-h-100">
                {/* PEMANGGILAN KOMPONEN TABEL */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <Loader2 className="animate-spin mb-4 text-red-600" size={32} />
                        <p>Memuat data dari database...</p>
                    </div>
                ) : (
                    <TabelJabatan data={dataJabatan} />
                )}
            </section>
            <Notif
                show={notif.show}
                message={notif.message}
                type={notif.type}
                onClose={closeNotif}
            />
        </div>
    );
}

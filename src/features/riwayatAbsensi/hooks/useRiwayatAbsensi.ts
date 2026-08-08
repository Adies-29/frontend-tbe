import { apiFetchJson } from '../../../utils/apiFetch';
import { useQuery } from '@tanstack/react-query';

export interface AbsensiData {
    id: string;
    pegawai_id: string;
    nama_pegawai: string;
    jabatan: string;
    tanggal: string;
    waktu_awal: string | null;
    waktu_akhir: string | null;
    status: string; // 'intime' | 'late' | 'void'
    status_lembur: string | null;
}

export function useRiwayatAbsensi() {

    // 1. Fetch semua data absensi
    const { data: listAbsensi = [], isLoading: isLoadingAbsensi } = useQuery({
        queryKey: ['riwayatAbsensi'],
        queryFn: async () => {
            const result = await apiFetchJson('/api/v1/absen');
            return (result.data || []).map((item: any) => ({
                id: String(item.id),
                pegawai_id: String(item.pegawai?.id || ''),
                nama_pegawai: item.pegawai?.nama || 'Tanpa Nama',
                jabatan: item.pegawai?.jabatan?.nama_jabatan || '-',
                tanggal: item.tanggal ? String(item.tanggal).split('T')[0] : '',
                waktu_awal: item.waktu_awal || null,
                waktu_akhir: item.waktu_akhir || null,
                status: item.status || '',
                status_lembur: item.status_lembur || null,
            }));
        }
    });

    // 2. Fetch semua data pegawai (untuk dropdown filter departemen/jabatan)
    const { data: listPegawai = [], isLoading: isLoadingPegawai } = useQuery({
        queryKey: ['pegawai'],
        queryFn: async () => {
            const result = await apiFetchJson('/api/v1/pegawai');
            return result.data || [];
        }
    });

    // 3. Fetch data jadwal (untuk deteksi "tidak hadir" - ada jadwal tapi tidak absen)
    const { data: listJadwal = [], isLoading: isLoadingJadwal } = useQuery({
        queryKey: ['jadwalAll'],
        queryFn: async () => {
            const result = await apiFetchJson('/api/v1/jadwal');
            return (result.data || []).map((item: any) => ({
                pegawai_id: String(item.pegawai_id),
                tanggal: item.tanggal ? String(item.tanggal).split('T')[0] : '',
                shift_kode: item.shifts?.kode_shift || null,
                jam_masuk: item.shifts?.jam_masuk || null,
                jam_pulang: item.shifts?.jam_pulang || null,
            }));
        }
    });

    return {
        listAbsensi,
        listPegawai,
        listJadwal,
        isLoading: isLoadingAbsensi || isLoadingPegawai || isLoadingJadwal,
    };
}

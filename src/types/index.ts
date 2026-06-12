
export interface AbsensiData {
    id: number | string;
    nama: string;
    jabatan: string;
    waktu_masuk: string;
    status_masuk: string;
    waktu_pulang: string;
    status_lembur: string;
}

export interface LemburData{
    id: number;
    pegawai_id: number;
    tanggal: string;
    menit_lembur_diizinkan: number;
    alasan_lembur: string;
    disetujui_oleh: string;
    nama?: string;
    pegawai?: { nama: string };
}

export interface PegawaiData {
    id: number;
    nama: string;
    jabatan_id: number | null;
    default_shift_id: number | null;
    tanggal_bergabung: string;
    pin_mesin: string;
    nik?: string; 
    no_hp?: string;
    email?: string;
    masakerja?: string;
    jabatan?: {
        nama_jabatan: string;
        departemen?: {
            nama_departemen: string;
        };
    };
    shifts?: {
        kode_shift: string;
    };
}

export interface JabatanData {
    id: string | number;
    nama_jabatan: string;
    departemen_id?: number;
    departemen?: {
        nama_departemen: string;
    };
    jumlah_pegawai?: number; 
    upah_per_kehadiran?: number | null;
    bonus_disiplin_harian?: number | null;
    upah_lembur_per_jam?: number | null;
    bonus_minggu_6_hari?: number | null;
    bonus_minggu_5_hari?: number | null;
    bonus_minggu_harian?: number | null;
    bonus_kerapian_harian?: number | null;
    bonus_lembur_tahunan?: number | null;
    created_at?: string;

    isNew?: boolean;
}

export interface KaryawanDetail {
    id: string;
    nama: string;
    jabatan: string;
    shift: string;
}

export interface DepartemenData {
    id: string;
    nama_departemen: string;
    jumlah_jabatan?: string; // dari index
    total_pegawai?: number; // dari tabel
    karyawan?: KaryawanDetail[]; // dari tabel
}

export interface JadwalShiftData {
    id: number;
    kode_shift: string;
    jam_masuk: string;
    jam_pulang: string;
    
    // Aturan Waktu & Toleransi
    lintas_hari?: boolean;
    batas_toleransi_menit?: number;
    batas_maksimal_lembur_menit?: number;
    batas_akhir_scan_masuk_menit?: number;
    batas_akhir_scan_pulang_menit?: number;
    
    // Aturan Denda & Potongan
    is_potong_gaji_terlambat?: boolean;
    denda_terlambat_per_menit?: number;
    is_potong_gaji_pulang_awal?: boolean;
    toleransi_pulang_awal_menit?: number;
    denda_pulang_awal_per_menit?: number;
    
    created_at?: string;
}

export interface DepartemenOption {
    id: number;
    nama_departemen: string;
}
export interface JabatanOption {
    id: number;
    nama_jabatan: string;
    departemen_id?: number;
    departemen?: { nama_departemen: string }; 
}
export interface ShiftOption {
    id: number;
    kode_shift: string;
    nama_shift?: string;
}
export interface DetailDepartemenRow {
    id: number | string;
    jabatan: string;
    jumlah_karyawan: number;
}

export interface KotaOption {
    id: number;
    nama_kota: string;
}

export interface DashboardKaryawanResponse {
    id?: number | string;
    id_pegawai?: number | string;
    nama?: string;
    jabatan?: string;
    waktu_masuk?: string;
    waktu_pulang?: string;
    status?: string;
    status_masuk?: string;
    status_lembur?: string;
    is_kerapian?: boolean;
}

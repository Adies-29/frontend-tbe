import type { DriveStep } from 'driver.js';

// ============================================================
// TIPE DATA UNTUK KONFIGURASI PANDUAN
// ============================================================

export interface GuidanceFaq {
    question: string;
    answer: string;
}

export interface GuidancePageConfig {
    id: string;
    title: string;
    description: string;
    icon: string;        // Emoji icon
    tier: 1 | 2 | 3;    // 1 = Full Tour, 2 = Tooltip/Hotspot, 3 = Deskripsi Singkat
    pathPattern: string; // Regex pattern untuk mencocokkan URL halaman
    keywords?: string[]; // Keywords untuk pencarian kontekstual terpusat
    tourSteps: DriveStep[];
    faqs: GuidanceFaq[];
}

// ============================================================
// KONFIGURASI KONTAK BANTUAN SUPPORT WHATSAPP
// ============================================================
export const HELP_CENTER_SUPPORT_CONFIG = {
    //  GANTI NOMOR WHATSAPP DI SINI (Gunakan kode negara 62 tanpa tanda + atau spasi)
    whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER || '62882007730579',
    messageText: 'Halo Admin Support Tiga Berlian, saya butuh bantuan mengenai aplikasi HRIS.',
};

// ============================================================
// KONFIGURASI PANDUAN UNTUK SEMUA FITUR
// ============================================================

export const guidancePages: GuidancePageConfig[] = [
    // -------------------------------------------------------
    // 🌟 TIER 1: WALKTHROUGH INTERAKTIF LENGKAP
    // -------------------------------------------------------

    // 📅 JADWAL & SHIFT
    {
        id: 'jadwal-shift',
        title: 'Jadwal & Shift',
        description: 'Kelola kalender kerja pegawai dan master aturan shift.',
        icon: '📅',
        tier: 1,
        pathPattern: '/dashboard/jadwal-shift',
        tourSteps: [
            {
                element: '[data-tour="shift-header"]',
                popover: {
                    title: '📅 Manajemen Jadwal & Shift',
                    description: 'Halaman ini terdiri dari 2 tab utama: <b>Jadwal Pegawai</b> (kalender kerja harian) dan <b>Master Shift</b> (template jam kerja seperti Pagi, Siang, Malam).',
                    side: 'bottom',
                    align: 'start',
                },
            },
            {
                element: '[data-tour="shift-tab-jadwal"]',
                popover: {
                    title: '📋 Tab Jadwal Pegawai',
                    description: 'Di tab ini, Anda bisa melihat <b>matriks jadwal kerja</b> seluruh pegawai berdasarkan bulan. Anda juga bisa <b>generate jadwal otomatis</b> secara massal.',
                    side: 'bottom',
                    align: 'center',
                },
                onHighlightStarted: () => {
                    const btn = document.querySelector('[data-tour="shift-tab-jadwal"]') as HTMLElement;
                    if (btn) btn.click();
                }
            },
            {
                element: '[data-tour="matrix-filters"]',
                popover: {
                    title: '🔍 Filter Jadwal',
                    description: 'Gunakan filter ini untuk memilih periode waktu (Mingguan/Bulanan/Tahunan) dan menyaring tampilan jadwal berdasarkan Departemen serta Jabatan pegawai.',
                    side: 'bottom',
                    align: 'center',
                },
                onHighlightStarted: () => {
                    const btn = document.querySelector('[data-tour="shift-tab-jadwal"]') as HTMLElement;
                    if (btn) btn.click();
                }
            },
            {
                element: '[data-tour="btn-generate-jadwal"]',
                popover: {
                    title: '⚡ Generate Jadwal Massal',
                    description: 'Klik tombol ini untuk membuat jadwal kerja bulanan untuk seluruh pegawai secara otomatis dan cepat tanpa perlu input satu per satu.',
                    side: 'left',
                    align: 'start',
                },
                onHighlightStarted: () => {
                    const btn = document.querySelector('[data-tour="shift-tab-jadwal"]') as HTMLElement;
                    if (btn) btn.click();
                }
            },
            {
                element: '[data-tour="matrix-table"]',
                popover: {
                    title: '📊 Tabel Matriks Jadwal',
                    description: 'Menampilkan penugasan shift kerja harian setiap pegawai. Anda dapat melihat shift apa yang berjalan untuk masing-masing tanggal.',
                    side: 'top',
                    align: 'center',
                },
                onHighlightStarted: () => {
                    const btn = document.querySelector('[data-tour="shift-tab-jadwal"]') as HTMLElement;
                    if (btn) btn.click();
                }
            },
            {
                element: '[data-tour="shift-tab-master"]',
                popover: {
                    title: '⏰ Tab Master Shift',
                    description: 'Tab ini berisi <b>template shift</b> (jam masuk & jam pulang). Anda bisa membuat shift baru seperti <i>Shift Pagi (07:00-15:00)</i> atau <i>Shift Malam (22:00-06:00)</i>.',
                    side: 'bottom',
                    align: 'center',
                },
                onHighlightStarted: () => {
                    const btn = document.querySelector('[data-tour="shift-tab-master"]') as HTMLElement;
                    if (btn) btn.click();
                }
            },
            {
                element: '[data-tour="btn-add-shift"]',
                popover: {
                    title: '➕ Tambah Master Shift Baru',
                    description: 'Klik tombol ini untuk membuat template jam kerja baru lengkap dengan aturan denda keterlambatan.',
                    side: 'left',
                    align: 'start',
                },
                onHighlightStarted: () => {
                    const btn = document.querySelector('[data-tour="shift-tab-master"]') as HTMLElement;
                    if (btn) btn.click();
                }
            },
            {
                element: '[data-tour="shift-info-banner"]',
                popover: {
                    title: '💡 Informasi Penting',
                    description: 'Banner ini berisi catatan penting: perubahan aturan master shift dan denda akan <b>otomatis berlaku</b> pada kalkulasi absensi di hari berikutnya.',
                    side: 'bottom',
                    align: 'start',
                },
                onHighlightStarted: () => {
                    const btn = document.querySelector('[data-tour="shift-tab-master"]') as HTMLElement;
                    if (btn) btn.click();
                }
            },
            {
                element: '[data-tour="shift-table"]',
                popover: {
                    title: '📊 Tabel Daftar Shift',
                    description: 'Semua shift yang telah dibuat akan muncul di tabel ini. Anda bisa melihat kode shift, jam masuk, jam pulang, dan aturan denda.',
                    side: 'top',
                    align: 'center',
                },
                onHighlightStarted: () => {
                    const btn = document.querySelector('[data-tour="shift-tab-master"]') as HTMLElement;
                    if (btn) btn.click();
                }
            },
            {
                element: '.MuiDataGrid-columnHeader[data-field="actions"]',
                popover: {
                    title: '⚙️ Kolom Aksi',
                    description: 'Gunakan ikon <b>pensil</b> (✏️) untuk mengedit rincian shift (jam masuk/pulang, toleransi, denda) atau ikon <b>tempat sampah</b> (🗑️) untuk menghapus shift.',
                    side: 'left',
                    align: 'center',
                },
                onHighlightStarted: () => {
                    const btn = document.querySelector('[data-tour="shift-tab-master"]') as HTMLElement;
                    if (btn) btn.click();
                }
            },
        ],
        faqs: [
            {
                question: 'Apa itu "Lintas Hari" pada shift?',
                answer: 'Lintas Hari artinya shift yang melewati tengah malam (contoh: masuk jam 22:00, pulang jam 06:00 keesokan harinya). Sistem akan otomatis menghitung durasi kerja dengan benar.',
            },
            {
                question: 'Bagaimana cara generate jadwal massal?',
                answer: 'Buka tab "Jadwal Pegawai", lalu klik tombol "Generate Jadwal Massal". Pilih bulan, departemen, dan pola shift yang diinginkan, lalu klik Generate.',
            },
            {
                question: 'Apakah denda terlambat bisa dimatikan?',
                answer: 'Ya, saat membuat atau mengedit shift, Anda bisa menonaktifkan opsi "Potong Gaji Terlambat" agar tidak ada denda.',
            },
        ],
    },

    // 💰 GAJI & TUNJANGAN
    {
        id: 'gaji-tunjangan',
        title: 'Gaji & Tunjangan',
        description: 'Kelola rekapitulasi gaji pegawai dan atur master nominal gaji berdasarkan jabatan.',
        icon: '💰',
        tier: 1,
        pathPattern: '/dashboard/gaji-tunjangan',
        tourSteps: [
            {
                element: '[data-tour="gaji-header"]',
                popover: {
                    title: '💰 Manajemen Gaji & Tunjangan',
                    description: 'Halaman ini terdiri dari 2 tab: <b>Rekap Gaji</b> (lihat slip gaji bulanan semua pegawai) dan <b>Master Jabatan</b> (atur komponen gaji per jabatan).',
                    side: 'bottom',
                    align: 'start',
                },
            },
            {
                element: '[data-tour="gaji-tab-rekap"]',
                popover: {
                    title: '📊 Tab Rekap Gaji',
                    description: 'Lihat <b>rekapitulasi gaji bulanan</b> seluruh pegawai. Anda bisa filter berdasarkan bulan dan departemen, serta mencetak / download slip gaji.',
                    side: 'bottom',
                    align: 'center',
                },
                onHighlightStarted: () => {
                    const btn = document.querySelector('[data-tour="gaji-tab-rekap"]') as HTMLElement;
                    if (btn) btn.click();
                }
            },
            {
                element: '[data-tour="gaji-tab-master"]',
                popover: {
                    title: '⚙️ Tab Master Jabatan',
                    description: 'Di tab ini, Anda mengatur <b>komponen gaji</b> (gaji pokok, tunjangan, uang makan, dll) untuk <b>setiap jabatan</b>. Klik tombol "Atur Gaji" pada jabatan untuk mengelola komponennya.',
                    side: 'bottom',
                    align: 'center',
                },
                onHighlightStarted: () => {
                    const btn = document.querySelector('[data-tour="gaji-tab-master"]') as HTMLElement;
                    if (btn) btn.click();
                }
            },
        ],
        faqs: [
            {
                question: 'Bagaimana cara menambah komponen gaji baru untuk suatu jabatan?',
                answer: 'Buka tab "Master Jabatan", lalu klik tombol "Atur Gaji" di baris jabatan yang diinginkan. Anda akan dibawa ke halaman untuk menambah, mengubah, atau menghapus komponen gaji.',
            },
            {
                question: 'Apakah potongan kasbon otomatis masuk ke rekap gaji?',
                answer: 'Ya, jika pengajuan kasbon sudah disetujui dan memiliki cicilan berjalan, potongannya akan otomatis muncul di slip gaji bulanan.',
            },
            {
                question: 'Apa bedanya Gaji Bulanan, Harian, dan Target?',
                answer: 'Bulanan: gaji pokok tetap per bulan. Harian: upah dihitung per hari kehadiran (cocok untuk pegawai harian lepas). Target: upah dihitung berdasarkan pencapaian target packing.',
            },
            {
                question: 'Apakah lembur otomatis masuk ke rekap gaji?',
                answer: 'Ya, lembur yang sudah disetujui otomatis dihitung dalam komponen "Uang Lembur" di slip gaji bulanan.',
            },
        ],
    },

    // ⏰ LEMBUR
    {
        id: 'lembur',
        title: 'Lembur',
        description: 'Kelola data pengajuan dan persetujuan lembur pegawai.',
        icon: '⏰',
        tier: 1,
        pathPattern: '/dashboard/lembur',
        tourSteps: [
            {
                element: '[data-tour="lembur-header"]',
                popover: {
                    title: '⏰ Manajemen Lembur',
                    description: 'Halaman ini menampilkan seluruh data Surat Perintah Lembur (SPL). Lembur yang sudah disetujui akan <b>otomatis masuk ke komponen gaji</b> bulanan pegawai.',
                    side: 'bottom',
                    align: 'start',
                },
            },
            {
                element: '[data-tour="btn-add-lembur"]',
                popover: {
                    title: '➕ Tambah Perintah Lembur',
                    description: 'Klik tombol ini untuk membuat <b>SPL (Surat Perintah Lembur)</b> baru. Isi nama pegawai, tanggal, durasi lembur, dan alasan.',
                    side: 'left',
                    align: 'start',
                },
            },
            {
                element: '[data-tour="lembur-table"]',
                popover: {
                    title: '📋 Tabel Data Lembur',
                    description: 'Tabel ini menampilkan daftar lembur pegawai. Anda bisa melihat <b>nama</b>, <b>tanggal</b>, <b>durasi</b>, dan <b>status</b> setiap pengajuan lembur. Gunakan ikon pensil untuk mengedit atau ikon hapus untuk menghapus data.',
                    side: 'top',
                    align: 'center',
                },
            },
        ],
        faqs: [
            {
                question: 'Bagaimana cara mengajukan lembur baru?',
                answer: 'Klik tombol "Tambah Lembur", isi form pengajuan (nama pegawai, tanggal, durasi dalam menit, dan alasan), lalu klik Simpan.',
            },
            {
                question: 'Apakah lembur otomatis masuk ke rekap gaji?',
                answer: 'Ya, lembur yang sudah disetujui akan otomatis dihitung dalam komponen "Uang Lembur" di slip gaji bulanan.',
            },
            {
                question: 'Apakah upah lembur bisa berbeda dari pengaturan jabatan?',
                answer: 'Ya, saat membuat SPL baru, aktifkan toggle "Atur Upah Lembur" untuk memasukkan nominal upah custom per jam. Jika tidak diaktifkan, sistem menggunakan upah lembur sesuai jabatan.',
            },
            {
                question: 'Bisa tidak menambahkan lembur langsung dari dashboard?',
                answer: 'Bisa. Pada tabel dashboard, klik tombol "+ Lembur" di kolom Status Lembur pada baris pegawai yang bersangkutan.',
            },
        ],
    },

    // 💸 KASBON
    {
        id: 'kasbon',
        title: 'Kasbon',
        description: 'Kelola pengajuan kasbon dan cicilan pemotongan gaji pegawai.',
        icon: '💸',
        tier: 1,
        pathPattern: '/dashboard/kasbon',
        tourSteps: [
            {
                element: '[data-tour="kasbon-header"]',
                popover: {
                    title: '💸 Manajemen Kasbon',
                    description: 'Halaman ini digunakan untuk mengelola <b>pinjaman (kasbon) pegawai</b>. Anda bisa melihat status kasbon aktif, mencatat pembayaran cicilan, dan menambah pengajuan baru.',
                    side: 'bottom',
                    align: 'start',
                },
            },
            {
                element: '[data-tour="btn-add-kasbon"]',
                popover: {
                    title: '➕ Ajukan Kasbon Baru',
                    description: 'Klik tombol ini untuk membuat pengajuan kasbon/pinjaman baru. Isi nama pegawai, nominal, persentase cicilan, dan keterangan.',
                    side: 'left',
                    align: 'start',
                },
            },
            {
                element: '[data-tour="kasbon-tab-daftar"]',
                popover: {
                    title: '📋 Tab Daftar Kasbon Aktif',
                    description: 'Tab ini menampilkan semua kasbon yang <b>masih aktif</b> (belum lunas). Anda bisa mengubah status (Setujui/Tolak), mencatat pembayaran, atau menghapus kasbon dari sini.',
                    side: 'bottom',
                    align: 'center',
                },
                onHighlightStarted: () => {
                    const btn = document.querySelector('[data-tour="kasbon-tab-daftar"]') as HTMLElement;
                    if (btn) btn.click();
                }
            },
            {
                element: '[data-tour="kasbon-tab-riwayat"]',
                popover: {
                    title: '📜 Tab Riwayat Pembayaran',
                    description: 'Tab ini menampilkan <b>riwayat semua pembayaran cicilan</b> kasbon yang pernah dilakukan, termasuk tanggal, nominal, dan metode pembayaran.',
                    side: 'bottom',
                    align: 'center',
                },
                onHighlightStarted: () => {
                    const btn = document.querySelector('[data-tour="kasbon-tab-riwayat"]') as HTMLElement;
                    if (btn) btn.click();
                }
            },
        ],
        faqs: [
            {
                question: 'Bagaimana sistem cicilan kasbon bekerja?',
                answer: 'Setelah kasbon disetujui, sistem akan otomatis memotong gaji pegawai setiap minggu sesuai persentase cicilan yang ditentukan hingga lunas.',
            },
            {
                question: 'Bagaimana cara kerja persentase cicilan?',
                answer: 'Persentase cicilan menentukan berapa persen dari total pinjaman yang dipotong per minggu. Contoh: pinjaman Rp1.000.000 dengan cicilan 10% = potong Rp100.000/minggu selama 10 minggu.',
            },
            {
                question: 'Apakah potongan kasbon otomatis masuk ke slip gaji?',
                answer: 'Ya, jika kasbon sudah disetujui dan memiliki cicilan berjalan, potongannya akan otomatis muncul di slip gaji.',
            },
        ],
    },

    // 📦 TARGET PACKING
    {
        id: 'target-packing',
        title: 'Target Packing',
        description: 'Kelola target produksi harian dan hitung insentif packing pegawai.',
        icon: '📦',
        tier: 1,
        pathPattern: '/dashboard/target-packing',
        tourSteps: [
            {
                element: '[data-tour="target-header"]',
                popover: {
                    title: '📦 Target Packing',
                    description: 'Halaman ini digunakan untuk mengelola <b>target produksi harian</b> dan menghitung <b>insentif</b> berdasarkan pencapaian packing pegawai. Terdiri dari 2 tab utama.',
                    side: 'bottom',
                    align: 'start',
                },
            },
            {
                element: '[data-tour="target-tab-pencapaian"]',
                popover: {
                    title: '📊 Tab Pencapaian Harian',
                    description: 'Di tab ini Anda bisa melihat dan menginput <b>hasil packing harian</b> per pegawai. Data ini digunakan untuk menghitung insentif yang masuk ke komponen gaji.',
                    side: 'bottom',
                    align: 'center',
                },
                onHighlightStarted: () => {
                    const btn = document.querySelector('[data-tour="target-tab-pencapaian"]') as HTMLElement;
                    if (btn) btn.click();
                }
            },
            {
                element: '[data-tour="target-tab-master"]',
                popover: {
                    title: '⚙️ Tab Master Target',
                    description: 'Tab ini berisi <b>template target packing</b>: jumlah target per unit dan nominal insentif per unit. Atur master target terlebih dahulu sebelum menginput pencapaian.',
                    side: 'bottom',
                    align: 'center',
                },
                onHighlightStarted: () => {
                    const btn = document.querySelector('[data-tour="target-tab-master"]') as HTMLElement;
                    if (btn) btn.click();
                }
            },
        ],
        faqs: [
            {
                question: 'Bagaimana insentif target packing dihitung?',
                answer: 'Insentif dihitung berdasarkan jumlah unit yang berhasil di-packing dikalikan harga per unit yang telah diatur di Master Target. Jika melebihi target, pegawai mendapat bonus tambahan.',
            },
            {
                question: 'Kapan insentif packing masuk ke gaji?',
                answer: 'Insentif packing yang sudah tercatat otomatis masuk sebagai komponen tambahan di slip gaji bulanan pegawai.',
            },
        ],
    },

    // 🎁 BONUS CUSTOM
    {
        id: 'bonus-custom',
        title: 'Bonus Custom',
        description: 'Kelola bonus khusus di luar komponen gaji standar.',
        icon: '🎁',
        tier: 1,
        pathPattern: '/dashboard/bonus-custom',
        tourSteps: [
            {
                element: '[data-tour="bonus-header"]',
                popover: {
                    title: '🎁 Bonus Custom',
                    description: 'Halaman ini digunakan untuk memberikan <b>bonus tambahan</b> di luar gaji pokok dan tunjangan standar, seperti bonus Lebaran, THR, reward teladan, atau ganti bensin.',
                    side: 'bottom',
                    align: 'start',
                },
            },
            {
                element: '[data-tour="bonus-form"]',
                popover: {
                    title: '📝 Form Buat Bonus Baru',
                    description: 'Isi formulir ini untuk memberikan bonus: pilih <b>Pegawai</b>, tentukan <b>Tanggal Diberikan</b> (menentukan periode gaji), isi <b>Keterangan/Nama Bonus</b> dan <b>Nominal</b>. Klik <b>Simpan Bonus</b> untuk menyimpan.',
                    side: 'right',
                    align: 'start',
                },
            },
            {
                element: '[data-tour="bonus-table"]',
                popover: {
                    title: '📊 Riwayat Pemberian Bonus',
                    description: 'Tabel ini menampilkan <b>semua bonus</b> yang pernah diberikan. Anda bisa melihat detail nama pegawai, keterangan, nominal, tanggal, dan menghapus bonus jika diperlukan.',
                    side: 'left',
                    align: 'start',
                },
            },
        ],
        faqs: [
            {
                question: 'Apakah bonus custom masuk ke slip gaji?',
                answer: 'Ya, bonus custom yang sudah diinput akan otomatis muncul sebagai komponen tambahan di slip gaji periode bersangkutan (berdasarkan tanggal diberikan).',
            },
            {
                question: 'Apa contoh penggunaan bonus custom?',
                answer: 'Contoh: THR Lebaran, Bonus Tahunan, Reward Pegawai Teladan, Ganti Bensin, Uang Makan Lembur, atau bonus lainnya yang tidak termasuk dalam komponen gaji tetap.',
            },
            {
                question: 'Bagaimana cara menentukan tanggal bonus yang benar?',
                answer: 'Tanggal Diberikan menentukan bonus masuk ke periode gaji minggu/bulan ke berapa. Jika Anda ingin bonus masuk di gaji bulan Juli, pilih tanggal di bulan Juli.',
            },
        ],
    },

    // ✂️ POTONGAN CUSTOM
    {
        id: 'potongan-custom',
        title: 'Potongan Custom',
        description: 'Kelola potongan khusus (denda custom, sanksi, atau pemotongan lain) di luar potongan standar.',
        icon: '✂️',
        tier: 1,
        pathPattern: '/dashboard/potongan-custom',
        keywords: ['potongan', 'denda', 'potongan custom', 'sanksi', 'kasbon', 'pemotongan'],
        tourSteps: [
            {
                element: '[data-tour="potongan-header"]',
                popover: {
                    title: '✂️ Potongan Custom',
                    description: 'Halaman ini digunakan untuk mencatat <b>potongan khusus</b> di luar denda keterlambatan dan kasbon standar (misal: denda pelanggaran, ganti rugi barang rusak, atau sanksi disiplin).',
                    side: 'bottom',
                    align: 'start',
                },
            },
            {
                element: '[data-tour="potongan-form"]',
                popover: {
                    title: '📝 Form Buat Potongan Baru',
                    description: 'Isi formulir ini untuk memberikan potongan: pilih <b>Pegawai</b>, tentukan <b>Tanggal Diberikan</b> (menentukan periode gaji), isi <b>Keterangan/Nama Potongan</b> dan <b>Nominal</b>. Klik <b>Simpan Potongan</b> untuk menyimpan.',
                    side: 'right',
                    align: 'start',
                },
            },
            {
                element: '[data-tour="potongan-table"]',
                popover: {
                    title: '📊 Riwayat Pemotongan Gaji',
                    description: 'Tabel ini menampilkan <b>semua potongan custom</b> yang pernah diberikan. Anda bisa melihat detail nama pegawai, keterangan, nominal, tanggal, dan menghapus potongan jika diperlukan.',
                    side: 'left',
                    align: 'start',
                },
            },
        ],
        faqs: [
            {
                question: 'Apakah potongan custom otomatis memotong slip gaji?',
                answer: 'Ya, potongan custom yang telah dicatat akan otomatis mengurangi total gaji bersih pegawai pada slip gaji periode bersangkutan.',
            },
            {
                question: 'Apa bedanya potongan custom dengan denda keterlambatan?',
                answer: 'Denda keterlambatan dihitung otomatis oleh sistem berdasarkan scan absensi & aturan shift. Potongan custom diinput secara manual untuk kasus khusus seperti sanksi atau ganti rugi.',
            },
        ],
    },

    // -------------------------------------------------------
    // 🏢 DEPARTEMEN
    {
        id: 'departemen',
        title: 'Data Departemen',
        description: 'Kelola daftar departemen / divisi di perusahaan.',
        icon: '🏢',
        tier: 1,
        pathPattern: '/dashboard/departemen',
        tourSteps: [
            {
                element: '[data-tour="dept-stats"]',
                popover: {
                    title: '📊 Kartu Statistik',
                    description: 'Menampilkan <b>total departemen</b> yang terdaftar di perusahaan saat ini.',
                    side: 'bottom',
                    align: 'start',
                },
            },
            {
                element: '[data-tour="departemen-header"]',
                popover: {
                    title: '🏢 Data Departemen',
                    description: 'Halaman ini menampilkan daftar seluruh <b>departemen / divisi</b> di perusahaan (contoh: HRD, Produksi, Keuangan). Anda bisa menambah, mengedit, atau menghapus departemen.',
                    side: 'bottom',
                    align: 'start',
                },
            },
            {
                element: '[data-tour="btn-add-dept"]',
                popover: {
                    title: '➕ Tambah Departemen',
                    description: 'Klik tombol ini untuk membuat departemen/divisi baru di perusahaan.',
                    side: 'left',
                    align: 'start',
                },
            },
            {
                element: '.MuiDataGrid-columnHeader[data-field="actions"]',
                popover: {
                    title: '⚙️ Kolom Aksi',
                    description: 'Di kolom ini, Anda bisa mengubah nama departemen langsung pada tabel dengan mengklik ikon <b>pensil</b> (✏️) untuk masuk ke mode edit baris, atau menghapusnya dengan ikon <b>tempat sampah</b> (🗑️).',
                    side: 'left',
                    align: 'center',
                },
            },
        ],
        faqs: [
            {
                question: 'Apakah menghapus departemen akan menghapus data pegawai di dalamnya?',
                answer: 'Tidak, menghapus departemen hanya menghapus data departemennya. Namun, pegawai yang terkait perlu dipindahkan ke departemen lain terlebih dahulu sebelum departemen bisa dihapus.',
            },
            {
                question: 'Apakah departemen bisa diedit namanya nanti?',
                answer: 'Ya, Anda bisa mengedit nama departemen kapan saja dengan mengklik ikon pensil (✏️) pada baris departemen di tabel.',
            },
            {
                question: 'Berapa batas maksimal departemen yang bisa dibuat?',
                answer: 'Tidak ada batasan. Anda bisa membuat departemen sesuai kebutuhan struktur organisasi perusahaan.',
            },
        ],
    },

    // 📋 JABATAN
    {
        id: 'jabatan',
        title: 'Data Jabatan',
        description: 'Kelola daftar jabatan dan struktur organisasi.',
        icon: '📋',
        tier: 1,
        pathPattern: '/dashboard/jabatan',
        tourSteps: [
            {
                element: '[data-tour="jabatan-stats"]',
                popover: {
                    title: '📊 Statistik Jabatan & Pegawai',
                    description: 'Menampilkan <b>Total Jabatan</b> yang terdaftar serta total <b>Pegawai Terisi</b> yang telah memiliki jabatan di sistem.',
                    side: 'bottom',
                    align: 'start',
                },
            },
            {
                element: '[data-tour="jabatan-header"]',
                popover: {
                    title: '📋 Data Jabatan',
                    description: 'Halaman ini menampilkan daftar <b>semua jabatan</b> di perusahaan (contoh: Manager, Staff, Supervisor, Operator). Setiap jabatan terkait dengan departemen dan bisa memiliki komponen gaji tersendiri.',
                    side: 'bottom',
                    align: 'start',
                },
            },
            {
                element: '[data-tour="btn-add-jabatan"]',
                popover: {
                    title: '➕ Tambah Jabatan Baru',
                    description: 'Klik tombol ini untuk mendaftarkan jabatan baru ke dalam sistem dan menghubungkannya ke departemen terkait.',
                    side: 'left',
                    align: 'start',
                },
            },
            {
                element: '.MuiDataGrid-columnHeader[data-field="actions"]',
                popover: {
                    title: '⚙️ Kolom Aksi',
                    description: 'Di kolom ini, Anda bisa mengubah informasi jabatan (nama jabatan & departemen) secara langsung pada tabel menggunakan ikon <b>pensil</b> (✏️), atau menghapus jabatan dengan ikon <b>tempat sampah</b> (🗑️).',
                    side: 'left',
                    align: 'center',
                },
            },
        ],
        faqs: [
            {
                question: 'Apa hubungan jabatan dengan gaji?',
                answer: 'Setiap jabatan bisa memiliki komponen gaji tersendiri (gaji pokok, tunjangan, bonus, dll). Atur komponen gaji per jabatan di menu "Gaji & Tunjangan > Tab Master Jabatan".',
            },
            {
                question: 'Satu departemen bisa punya berapa jabatan?',
                answer: 'Tidak terbatas. Satu departemen bisa memiliki banyak jabatan sesuai struktur organisasi perusahaan Anda.',
            },
            {
                question: 'Apakah menghapus jabatan akan mempengaruhi pegawai yang menjabat?',
                answer: 'Ya, pastikan tidak ada pegawai yang masih menggunakan jabatan tersebut sebelum menghapusnya. Pindahkan pegawai ke jabatan lain terlebih dahulu.',
            },
        ],
    },

    // 👥 PEGAWAI
    {
        id: 'pegawai',
        title: 'Data Pegawai',
        description: 'Kelola data lengkap seluruh pegawai perusahaan.',
        icon: '👥',
        tier: 1,
        pathPattern: '/dashboard/data-pegawai',
        tourSteps: [
            {
                element: '[data-tour="pegawai-stats"]',
                popover: {
                    title: '📊 Kartu Statistik',
                    description: 'Menampilkan <b>total pegawai aktif</b> yang terdaftar di sistem saat ini.',
                    side: 'bottom',
                    align: 'start',
                },
            },
            {
                element: '[data-tour="pegawai-header"]',
                popover: {
                    title: '👥 Data Pegawai Aktif',
                    description: 'Halaman ini menampilkan <b>daftar seluruh pegawai</b> perusahaan. Anda bisa menambah pegawai baru, mengedit data, melihat detail profil, atau menghapus data pegawai.',
                    side: 'bottom',
                    align: 'start',
                },
            },
            {
                element: '[data-tour="btn-add-pegawai"]',
                popover: {
                    title: '➕ Tambah Pegawai Baru',
                    description: 'Klik tombol ini untuk mendaftarkan pegawai baru ke dalam sistem. Anda akan diarahkan ke formulir pendaftaran yang terdiri dari 3 bagian: Informasi Pribadi, Kontak, dan Data Pekerjaan.',
                    side: 'left',
                    align: 'start',
                },
            },
            {
                element: '[data-tour="pegawai-table"]',
                popover: {
                    title: '📋 Tabel Data Pegawai',
                    description: 'Tabel ini menampilkan semua pegawai aktif. Anda bisa mencari pegawai dengan filter pencarian di kanan atas tabel, serta mengurutkan kolom dengan mengeklik header kolom.',
                    side: 'top',
                    align: 'center',
                },
            },
            {
                element: '.MuiDataGrid-columnHeader[data-field="actions"]',
                popover: {
                    title: '⚙️ Kolom Aksi',
                    description: 'Di kolom ini, Anda bisa: Klik ikon <b>pensil</b> (✏️) untuk mengedit data pegawai, atau klik ikon <b>tempat sampah</b> (🗑️) untuk menghapus data pegawai dari sistem.',
                    side: 'left',
                    align: 'center',
                },
            },
        ],
        faqs: [
            {
                question: 'Bagaimana cara melihat detail lengkap pegawai?',
                answer: 'Klik ikon mata (👁️) pada kolom Aksi di baris pegawai untuk melihat profil lengkap termasuk identitas, departemen, jabatan, dan shift default.',
            },
            {
                question: 'Mengapa jabatan tidak bisa dipilih saat menambah pegawai?',
                answer: 'Jabatan baru bisa dipilih setelah Anda memilih Departemen terlebih dahulu. Daftar jabatan otomatis terfilter berdasarkan departemen yang dipilih.',
            },
            {
                question: 'Apa itu PIN Mesin Absensi?',
                answer: 'PIN Mesin adalah kode unik yang digunakan pegawai untuk absensi di mesin fingerprint. Setiap pegawai harus memiliki PIN yang berbeda.',
            },
        ],
    },

    // 📊 DASHBOARD / MONITORING
    {
        id: 'dashboard',
        title: 'Dashboard Monitoring',
        description: 'Pantau ringkasan statistik absensi, kehadiran, dan produktivitas.',
        icon: '📊',
        tier: 1,
        pathPattern: '/dashboard$',
        tourSteps: [
            {
                element: '[data-tour="dashboard-stats"]',
                popover: {
                    title: '📈 Kartu Statistik Kehadiran',
                    description: 'Menampilkan ringkasan kehadiran hari ini: <b>Total Hadir</b>, jumlah pegawai yang <b>Tepat Waktu</b>, <b>Terlambat</b>, dan yang <b>Belum Hadir</b>. Kartu ini diperbarui secara otomatis.',
                    side: 'bottom',
                    align: 'center',
                },
            },
            {
                element: '[data-tour="dashboard-header"]',
                popover: {
                    title: '📊 Dashboard Monitoring',
                    description: 'Halaman utama untuk memantau aktivitas absensi pegawai secara real-time. Di sini Anda dapat melihat status kehadiran hari ini.',
                    side: 'bottom',
                    align: 'start',
                },
            },
            {
                element: '[data-tour="btn-input-manual"]',
                popover: {
                    title: '➕ Input Absen Manual',
                    description: 'Jika ada pegawai yang lupa melakukan scan atau mesin absensi bermasalah, Anda dapat menambahkan kehadiran/pulang secara manual melalui tombol ini.',
                    side: 'bottom',
                    align: 'center',
                },
            },
            {
                element: '[data-tour="dashboard-table"]',
                popover: {
                    title: '📋 Tabel Absensi Real-time',
                    description: 'Berisi daftar pegawai beserta waktu masuk/pulang mereka. Anda bisa menilai <b>Kerapihan</b>, memasukkan data <b>Lembur</b>, atau membatalkan absensi (<b>Void</b>) langsung dari tabel ini.',
                    side: 'top',
                    align: 'center',
                },
            },
        ],
        faqs: [
            {
                question: 'Seberapa sering data dashboard diperbarui?',
                answer: 'Data diperbarui otomatis secara real-time setiap 30 detik. Pembaruan otomatis hanya berjalan jika tab aplikasi dalam keadaan aktif/terbuka untuk menghemat resource server.',
            },
            {
                question: 'Bagaimana cara melakukan Input Absen Manual?',
                answer: 'Klik tombol "Input Manual", pilih nama pegawai, tentukan jenis absensi (Masuk atau Pulang), isi jam serta tanggal, lalu klik Simpan. Data pada tabel akan otomatis terupdate.',
            },
            {
                question: 'Bagaimana cara menilai kerapihan pegawai?',
                answer: 'Pada kolom "Cek Kerapihan", beri tanda centang (checkbox) jika penampilan pegawai rapi. Status akan langsung berubah menjadi "Rapi" (hijau) atau "Tidak Rapi" (merah) dan tersimpan ke database.',
            },
            {
                question: 'Apa fungsi tombol "Hapus" pada kolom Hapus Absensi?',
                answer: 'Tombol Hapus berfungsi untuk membatalkan absensi pegawai di hari berjalan (Void). Ini digunakan jika terjadi kesalahan input atau absensi tidak sah. Status masuk pegawai akan berubah menjadi "Absensi di Batalkan" (merah).',
            },
            {
                question: 'Bagaimana cara memasukkan lembur pegawai langsung dari tabel?',
                answer: 'Jika pegawai belum memiliki data lembur di hari tersebut, Anda dapat mengeklik tombol "+ Lembur" pada kolom Status Lembur untuk langsung diarahkan ke form pengajuan lembur bagi pegawai bersangkutan.',
            },
        ],
    },

    // -------------------------------------------------------
    // 🌟 HALAMAN FORM / SUB-HALAMAN (DETAIL STEP-BY-STEP)
    // -------------------------------------------------------

    // 👤 FORM TAMBAH PEGAWAI
    {
        id: 'add-pegawai',
        title: 'Form Tambah Pegawai',
        description: 'Panduan mengisi formulir pendaftaran pegawai baru secara lengkap.',
        icon: '👤',
        tier: 1,
        pathPattern: '/dashboard/data-pegawai/tambah-pegawai',
        tourSteps: [
            {
                element: '[data-tour="add-pegawai-form"]',
                popover: {
                    title: '👤 Form Tambah Pegawai Baru',
                    description: 'Formulir ini digunakan untuk mendaftarkan pegawai baru ke dalam sistem. Terdiri dari 3 bagian: <b>Informasi Pribadi</b>, <b>Kontak & Alamat</b>, dan <b>Data Pekerjaan</b>.',
                    side: 'bottom',
                    align: 'start',
                },
            },
            {
                element: '[data-tour="add-pegawai-pribadi"]',
                popover: {
                    title: '📝 Seksi 1: Informasi Pribadi',
                    description: 'Isi data identitas pegawai: <b>NIK</b> (16 digit), <b>No BPJS</b>, <b>Nama</b>, <b>Jenis Kelamin</b>, <b>Tempat & Tanggal Lahir</b>. NIK dan BPJS bersifat opsional.',
                    side: 'bottom',
                    align: 'start',
                },
            },
            {
                element: '[data-tour="add-pegawai-kontak"]',
                popover: {
                    title: '📞 Seksi 2: Kontak & Alamat',
                    description: 'Masukkan <b>Nomor HP</b>, <b>Email</b>, dan <b>Alamat Lengkap</b> pegawai. Data kontak diperlukan untuk komunikasi dan slip gaji digital.',
                    side: 'top',
                    align: 'start',
                },
            },
            {
                element: '[data-tour="add-pegawai-pekerjaan"]',
                popover: {
                    title: '🏢 Seksi 3: Data Pekerjaan',
                    description: 'Pilih <b>Departemen</b> terlebih dahulu, baru pilih <b>Jabatan</b> (otomatis terfilter). Masukkan <b>Tanggal Bergabung</b>, <b>PIN Mesin Absensi</b>, dan <b>Shift Default</b>.',
                    side: 'top',
                    align: 'start',
                },
            },
            {
                element: '[data-tour="add-pegawai-submit"]',
                popover: {
                    title: '✅ Simpan Data Pegawai',
                    description: 'Klik <b>Simpan</b> untuk mendaftarkan pegawai. Pastikan semua field bertanda (*) sudah terisi. Klik <b>Batal</b> untuk membatalkan.',
                    side: 'top',
                    align: 'end',
                },
            },
        ],
        faqs: [
            {
                question: 'Apa itu PIN Mesin Absensi?',
                answer: 'PIN Mesin adalah kode unik yang digunakan pegawai untuk absensi di mesin fingerprint. Setiap pegawai harus punya PIN yang berbeda.',
            },
            {
                question: 'Mengapa jabatan tidak bisa dipilih?',
                answer: 'Jabatan baru bisa dipilih setelah Anda memilih Departemen terlebih dahulu. Daftar jabatan akan otomatis terfilter berdasarkan departemen.',
            },
        ],
    },

    // 👤 DETAIL PEGAWAI
    {
        id: 'detail-pegawai',
        title: 'Detail Pegawai',
        description: 'Panduan melihat profil dan riwayat lengkap pegawai.',
        icon: '👤',
        tier: 1,
        pathPattern: '/dashboard/data-pegawai/detail/',
        tourSteps: [
            {
                element: '[data-tour="detail-pegawai"]',
                popover: {
                    title: '👤 Profil & Riwayat Pegawai',
                    description: 'Halaman ini menampilkan informasi detail pegawai, mulai dari identitas, departemen & jabatan, hingga shift default yang digunakan.',
                    side: 'bottom',
                    align: 'start',
                },
            },
        ],
        faqs: [
            {
                question: 'Bagaimana cara mengubah data pegawai ini?',
                answer: 'Klik tombol Kembali, lalu klik ikon pensil (Edit) pada baris pegawai di tabel Data Pegawai.',
            },
        ],
    },

    // ✏️ EDIT PEGAWAI
    {
        id: 'edit-pegawai',
        title: 'Edit Pegawai',
        description: 'Panduan mengubah informasi data pegawai.',
        icon: '✏️',
        tier: 1,
        pathPattern: '/dashboard/data-pegawai/edit/',
        tourSteps: [
            {
                element: '[data-tour="edit-pegawai"]',
                popover: {
                    title: '✏️ Edit Data Pegawai',
                    description: 'Di halaman ini Anda bisa memperbarui data identitas, nomor telepon, email, maupun pindah departemen/jabatan pegawai. Klik <b>Simpan Perubahan</b> setelah selesai.',
                    side: 'bottom',
                    align: 'start',
                },
            },
        ],
        faqs: [
            {
                question: 'Apakah mengubah jabatan akan otomatis mengubah gaji pegawai?',
                answer: 'Ya, jika sistem penggajian pegawai mengikuti standar jabatan, maka perhitungan gaji akan otomatis mengikuti jabatan baru.',
            },
        ],
    },

    // 🏢 TAMBAH DEPARTEMEN
    {
        id: 'add-departemen',
        title: 'Tambah Departemen',
        description: 'Panduan membuat departemen / divisi baru.',
        icon: '🏢',
        tier: 1,
        pathPattern: '/dashboard/departemen/tambah',
        tourSteps: [
            {
                element: '[data-tour="add-dept-form"]',
                popover: {
                    title: '🏢 Tambah Departemen Baru',
                    description: 'Masukkan nama departemen atau divisi baru di perusahaan Anda (contoh: HRD, Produksi, Keuangan). Klik <b>Simpan</b> untuk mendaftarkan.',
                    side: 'bottom',
                    align: 'start',
                },
            },
        ],
        faqs: [
            {
                question: 'Apakah departemen bisa diedit namanya nanti?',
                answer: 'Ya, Anda bisa mengedit nama departemen kapan saja dari tabel menu Data Departemen.',
            },
        ],
    },

    // 📋 TAMBAH JABATAN
    {
        id: 'add-jabatan',
        title: 'Tambah Jabatan',
        description: 'Panduan membuat jabatan baru di dalam departemen.',
        icon: '📋',
        tier: 1,
        pathPattern: '/dashboard/jabatan/tambah',
        tourSteps: [
            {
                element: '[data-tour="add-jabatan-form"]',
                popover: {
                    title: '📋 Tambah Jabatan Baru',
                    description: 'Isikan <b>Nama Jabatan</b> (contoh: Manager, Staff, Supervisor), lalu pilih <b>Departemen</b> di mana jabatan tersebut berada. Klik <b>Simpan</b> jika sudah sesuai.',
                    side: 'bottom',
                    align: 'start',
                },
            },
        ],
        faqs: [
            {
                question: 'Satu departemen bisa punya berapa jabatan?',
                answer: 'Tidak terbatas. Satu departemen bisa memiliki banyak jabatan sesuai struktur organisasi perusahaan Anda.',
            },
        ],
    },

    // ⏰ FORM TAMBAH SHIFT
    {
        id: 'add-shift',
        title: 'Form Tambah Shift',
        description: 'Panduan membuat template konfigurasi shift baru lengkap dengan aturan denda.',
        icon: '⏰',
        tier: 1,
        pathPattern: '/dashboard/jadwal-shift/tambah',
        tourSteps: [
            {
                element: '[data-tour="add-shift-header"]',
                popover: {
                    title: '⏰ Konfigurasi Shift Baru',
                    description: 'Halaman ini untuk membuat template shift baru. Anda bisa mengatur <b>jam kerja</b>, <b>toleransi</b>, <b>batas scan</b>, dan <b>aturan denda</b> keterlambatan.',
                    side: 'bottom',
                    align: 'start',
                },
            },
            {
                element: '[data-tour="add-shift-waktu"]',
                popover: {
                    title: '🕐 Grup 1: Informasi Waktu',
                    description: 'Isi <b>Kode Shift</b> (contoh: SHIFT_PAGI), lalu atur <b>Jam Masuk</b> dan <b>Jam Pulang</b>. Aktifkan <b>Lintas Hari</b> jika shift melewati tengah malam (misal: 22:00 - 06:00).',
                    side: 'right',
                    align: 'start',
                },
            },
            {
                element: '[data-tour="add-shift-toleransi"]',
                popover: {
                    title: '⚠️ Grup 2: Toleransi & Batas Scan',
                    description: 'Atur <b>Batas Maksimal Lembur</b> dan aktifkan <b>Batas Scan</b> jika ingin membatasi waktu scan masuk/pulang (contoh: scan masuk hanya berlaku 2 jam setelah jadwal).',
                    side: 'left',
                    align: 'start',
                },
            },
            {
                element: '[data-tour="add-shift-tipe-denda"]',
                popover: {
                    title: '💰 Sistem Perhitungan Denda',
                    description: 'Pilih tipe denda: <b>Per Menit</b> (nominal × jumlah menit telat) atau <b>Tetap/Flat</b> (nominal dipotong sekali saja). Pengaturan ini berlaku untuk denda terlambat dan pulang awal.',
                    side: 'top',
                    align: 'center',
                },
            },
            {
                element: '[data-tour="add-shift-denda-telat"]',
                popover: {
                    title: '🔴 Aturan Denda Terlambat',
                    description: 'Aktifkan <b>Potong Gaji Jika Terlambat</b>, lalu atur <b>Batas Toleransi</b> (misal: 15 menit = tidak kena denda) dan <b>Nominal Denda</b> per menit atau flat.',
                    side: 'right',
                    align: 'start',
                },
            },
            {
                element: '[data-tour="add-shift-pulang-awal"]',
                popover: {
                    title: '🟣 Aturan Pulang Awal',
                    description: 'Sama seperti denda terlambat, atur <b>toleransi</b> dan <b>nominal denda</b> untuk pegawai yang pulang sebelum waktunya. Setelah semua diisi, klik <b>Simpan</b>.',
                    side: 'left',
                    align: 'start',
                },
            },
        ],
        faqs: [
            {
                question: 'Apa bedanya denda "Per Menit" vs "Tetap"?',
                answer: 'Per Menit: denda dikalikan jumlah menit keterlambatan (misal: Rp500 × 30 menit = Rp15.000). Tetap: denda potongan flat sekali saja (misal: Rp10.000 tanpa peduli berapa menit telat).',
            },
            {
                question: 'Apa itu Lintas Hari?',
                answer: 'Lintas Hari diaktifkan untuk shift malam yang melewati jam 00:00 (contoh: masuk 22:00, pulang 06:00 besoknya). Sistem akan otomatis menghitung durasi kerja dengan benar.',
            },
        ],
    },

    // ✏️ FORM EDIT SHIFT
    {
        id: 'edit-shift',
        title: 'Form Edit Shift',
        description: 'Panduan mengubah konfigurasi shift yang sudah ada.',
        icon: '✏️',
        tier: 1,
        pathPattern: '/dashboard/jadwal-shift/edit',
        tourSteps: [
            {
                element: '[data-tour="add-shift-header"]',
                popover: {
                    title: '✏️ Edit Konfigurasi Shift',
                    description: 'Di halaman ini Anda bisa mengubah semua pengaturan shift yang sudah ada: jam kerja, toleransi, dan aturan denda. Perubahan akan berlaku mulai hari berikutnya.',
                    side: 'bottom',
                    align: 'start',
                },
            },
        ],
        faqs: [
            {
                question: 'Apakah perubahan shift langsung berlaku?',
                answer: 'Perubahan aturan shift akan berlaku pada kalkulasi absensi di hari berikutnya, bukan hari ini.',
            },
        ],
    },

    // 💰 FORM ATUR GAJI JABATAN
    {
        id: 'atur-gaji',
        title: 'Atur Gaji Jabatan',
        description: 'Panduan mengatur komponen gaji dan bonus untuk setiap jabatan.',
        icon: '💰',
        tier: 1,
        pathPattern: '/dashboard/gaji-tunjangan/master-gaji',
        tourSteps: [
            {
                element: '[data-tour="atur-gaji-header"]',
                popover: {
                    title: '💰 Pengaturan Gaji & Tunjangan',
                    description: 'Halaman ini untuk mengatur komponen gaji berdasarkan jabatan. Semua pegawai dengan jabatan ini akan otomatis menggunakan pengaturan gaji yang sama.',
                    side: 'bottom',
                    align: 'start',
                },
            },
            {
                element: '[data-tour="atur-gaji-upah"]',
                popover: {
                    title: '💵 Upah Dasar & Lembur',
                    description: 'Pilih <b>Tipe Penggajian</b> (Bulanan/Harian/Target), lalu isi nominal gaji pokok atau upah harian. Atur juga <b>Upah Lembur per Jam</b> dan <b>Bonus Lembur Tahunan</b>.',
                    side: 'right',
                    align: 'start',
                },
            },
            {
                element: '[data-tour="atur-gaji-bonus"]',
                popover: {
                    title: '🏆 Bonus Performa',
                    description: 'Atur bonus performa: <b>Disiplin Harian</b> (hadir tepat waktu), <b>Kerapian Harian</b>, dan <b>Bonus Full Attendance</b> untuk kehadiran penuh 5 atau 6 hari kerja per minggu.',
                    side: 'left',
                    align: 'start',
                },
            },
        ],
        faqs: [
            {
                question: 'Apa bedanya Gaji Bulanan vs Harian?',
                answer: 'Bulanan: gaji pokok tetap per bulan, dibagi 30 hari. Harian: upah dihitung per kehadiran (cocok untuk pegawai harian lepas). Target: upah dihitung berdasarkan pencapaian target packing.',
            },
            {
                question: 'Apa itu Bonus Full Attendance?',
                answer: 'Bonus yang diberikan jika pegawai hadir penuh selama seminggu tanpa izin/absen. Ada varian 5 hari dan 6 hari kerja per minggu.',
            },
        ],
    },

    // ⏰ FORM TAMBAH LEMBUR
    {
        id: 'add-lembur',
        title: 'Form Tambah Lembur',
        description: 'Panduan membuat Surat Perintah Lembur (SPL) baru.',
        icon: '⏰',
        tier: 1,
        pathPattern: '/dashboard/lembur/tambah-lembur',
        tourSteps: [
            {
                element: '[data-tour="add-lembur-form"]',
                popover: {
                    title: '⏰ Buat Perintah Lembur Baru',
                    description: 'Formulir ini untuk membuat SPL (Surat Perintah Lembur). Isi <b>Nama Pegawai</b>, <b>Tanggal</b>, <b>Durasi Lembur</b> dalam menit, dan <b>Alasan</b> (opsional). Anda juga bisa mengatur upah lembur custom jika berbeda dari jabatan.',
                    side: 'bottom',
                    align: 'center',
                },
            },
        ],
        faqs: [
            {
                question: 'Apakah upah lembur bisa berbeda dari pengaturan jabatan?',
                answer: 'Ya, aktifkan toggle "Atur Upah Lembur" untuk memasukkan nominal upah custom per jam. Jika tidak diaktifkan, sistem akan menggunakan upah lembur sesuai jabatan.',
            },
        ],
    },

    // 💸 FORM TAMBAH KASBON
    {
        id: 'add-kasbon',
        title: 'Form Tambah Kasbon',
        description: 'Panduan membuat pengajuan kasbon/pinjaman pegawai baru.',
        icon: '💸',
        tier: 1,
        pathPattern: '/dashboard/kasbon/tambah',
        tourSteps: [
            {
                element: '[data-tour="add-kasbon-form"]',
                popover: {
                    title: '💸 Ajukan Kasbon Baru',
                    description: 'Formulir ini untuk mengajukan pinjaman pegawai. Pilih <b>Pegawai</b>, isi <b>Tanggal</b> dan <b>Nominal Pinjaman</b>, atur <b>Persentase Cicilan</b> per minggu menggunakan slider, lalu tuliskan <b>Keterangan</b> alasan pinjaman.',
                    side: 'bottom',
                    align: 'center',
                },
            },
        ],
        faqs: [
            {
                question: 'Bagaimana cara kerja persentase cicilan?',
                answer: 'Persentase cicilan menentukan berapa persen dari total pinjaman yang dipotong per minggu. Contoh: pinjaman Rp1.000.000 dengan cicilan 10% = potong Rp100.000/minggu selama 10 minggu.',
            },
        ],
    },
];

// ============================================================
// UTILITAS: Mencari konfigurasi panduan berdasarkan URL aktif
// ============================================================

export function getGuidanceForCurrentPage(pathname: string): GuidancePageConfig | undefined {
    const matchedPages = guidancePages.filter((page) => {
        const regex = new RegExp(page.pathPattern);
        return regex.test(pathname);
    });

    if (matchedPages.length > 0) {
        return matchedPages.reduce((best, current) =>
            current.pathPattern.length > best.pathPattern.length ? current : best
        );
    }

    return undefined;
}

export function getAllGuidancePages(): GuidancePageConfig[] {
    return guidancePages;
}

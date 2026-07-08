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
    tourSteps: DriveStep[];
    faqs: GuidanceFaq[];
}

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
            },
            {
                element: '[data-tour="shift-tab-master"]',
                popover: {
                    title: '⏰ Tab Master Shift',
                    description: 'Tab ini berisi <b>template shift</b> (jam masuk & jam pulang). Anda bisa membuat shift baru seperti <i>Shift Pagi (07:00-15:00)</i> atau <i>Shift Malam (22:00-06:00)</i>.',
                    side: 'bottom',
                    align: 'center',
                },
            },
            {
                element: '[data-tour="btn-add-shift"]',
                popover: {
                    title: '➕ Tambah Master Shift Baru',
                    description: 'Klik tombol ini untuk membuat template jam kerja baru lengkap dengan aturan denda keterlambatan.',
                    side: 'left',
                    align: 'start',
                },
            },
            {
                element: '[data-tour="shift-info-banner"]',
                popover: {
                    title: '💡 Informasi Penting',
                    description: 'Banner ini berisi catatan penting: perubahan aturan master shift dan denda akan <b>otomatis berlaku</b> pada kalkulasi absensi di hari berikutnya.',
                    side: 'bottom',
                    align: 'start',
                },
            },
            {
                element: '[data-tour="shift-table"]',
                popover: {
                    title: '📊 Tabel Daftar Shift',
                    description: 'Semua shift yang telah dibuat akan muncul di tabel ini. Anda bisa <b>mengedit</b> (ikon pensil) atau <b>menghapus</b> (ikon tempat sampah) setiap shift dari kolom Aksi.',
                    side: 'top',
                    align: 'center',
                },
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
            },
            {
                element: '[data-tour="gaji-tab-master"]',
                popover: {
                    title: '⚙️ Tab Master Jabatan',
                    description: 'Di tab ini, Anda mengatur <b>komponen gaji</b> (gaji pokok, tunjangan, uang makan, dll) untuk <b>setiap jabatan</b>. Klik tombol "Atur Gaji" pada jabatan untuk mengelola komponennya.',
                    side: 'bottom',
                    align: 'center',
                },
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
                    description: 'Di halaman ini Anda bisa melihat seluruh data lembur pegawai, menambah pengajuan lembur baru, serta mengelola status persetujuannya.',
                    side: 'bottom',
                    align: 'start',
                },
            },
        ],
        faqs: [
            {
                question: 'Bagaimana cara mengajukan lembur baru?',
                answer: 'Klik tombol "Tambah Lembur", isi form pengajuan (tanggal, jam mulai, jam selesai, alasan), lalu submit.',
            },
            {
                question: 'Apakah lembur otomatis masuk ke rekap gaji?',
                answer: 'Ya, lembur yang sudah disetujui (approved) akan otomatis dihitung dalam komponen "Uang Lembur" di slip gaji bulanan.',
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
                    description: 'Halaman ini digunakan untuk mengelola pengajuan pinjaman (kasbon) pegawai. Anda bisa melihat riwayat kasbon, status cicilan, dan menambah pengajuan baru.',
                    side: 'bottom',
                    align: 'start',
                },
            },
        ],
        faqs: [
            {
                question: 'Bagaimana sistem cicilan kasbon bekerja?',
                answer: 'Setelah kasbon disetujui, sistem akan otomatis memotong gaji pegawai setiap bulan sesuai jumlah cicilan yang ditentukan hingga lunas.',
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
                    description: 'Di halaman ini Anda bisa mengatur target produksi harian, mencatat hasil packing, dan melihat perhitungan insentif berdasarkan pencapaian target.',
                    side: 'bottom',
                    align: 'start',
                },
            },
        ],
        faqs: [
            {
                question: 'Bagaimana insentif target packing dihitung?',
                answer: 'Insentif dihitung berdasarkan jumlah unit yang berhasil di-packing dibandingkan dengan target harian. Jika melebihi target, pegawai mendapat bonus tambahan.',
            },
        ],
    },

    // 🎁 BONUS CUSTOM
    {
        id: 'bonus-custom',
        title: 'Bonus Custom',
        description: 'Kelola bonus khusus di luar komponen gaji standar.',
        icon: '🎁',
        tier: 2,
        pathPattern: '/dashboard/bonus-custom',
        tourSteps: [
            {
                element: '[data-tour="bonus-header"]',
                popover: {
                    title: '🎁 Bonus Custom',
                    description: 'Halaman ini digunakan untuk memberikan bonus tambahan di luar gaji pokok dan tunjangan standar, seperti bonus Lebaran, bonus tahunan, atau reward khusus.',
                    side: 'bottom',
                    align: 'start',
                },
            },
        ],
        faqs: [
            {
                question: 'Apakah bonus custom masuk ke slip gaji?',
                answer: 'Ya, bonus custom yang sudah diinput akan otomatis muncul sebagai komponen tambahan di slip gaji bulan bersangkutan.',
            },
        ],
    },

    // -------------------------------------------------------
    // 📝 TIER 3: DESKRIPSI SINGKAT & HELP CENTER
    // -------------------------------------------------------

    // 🏢 DEPARTEMEN
    {
        id: 'departemen',
        title: 'Data Departemen',
        description: 'Kelola daftar departemen / divisi di perusahaan.',
        icon: '🏢',
        tier: 3,
        pathPattern: '/dashboard/departemen',
        tourSteps: [
            {
                element: '[data-tour="departemen-header"]',
                popover: {
                    title: '🏢 Data Departemen',
                    description: 'Halaman ini digunakan untuk mengelola daftar departemen perusahaan. Anda bisa menambah, mengubah, atau menghapus departemen.',
                    side: 'bottom',
                    align: 'start',
                },
            },
        ],
        faqs: [
            {
                question: 'Apakah menghapus departemen akan menghapus data pegawai di dalamnya?',
                answer: 'Tidak, menghapus departemen hanya menghapus data departemennya. Namun, pegawai yang terkait perlu dipindahkan ke departemen lain terlebih dahulu.',
            },
        ],
    },

    // 📋 JABATAN
    {
        id: 'jabatan',
        title: 'Data Jabatan',
        description: 'Kelola daftar jabatan dan struktur organisasi.',
        icon: '📋',
        tier: 3,
        pathPattern: '/dashboard/jabatan',
        tourSteps: [
            {
                element: '[data-tour="jabatan-header"]',
                popover: {
                    title: '📋 Data Jabatan',
                    description: 'Halaman ini digunakan untuk mengelola daftar jabatan di perusahaan. Setiap jabatan bisa dikaitkan dengan komponen gaji & tunjangan di menu "Gaji & Tunjangan".',
                    side: 'bottom',
                    align: 'start',
                },
            },
        ],
        faqs: [
            {
                question: 'Apa hubungan jabatan dengan gaji?',
                answer: 'Setiap jabatan bisa memiliki komponen gaji tersendiri (gaji pokok, tunjangan, dll). Atur komponen gaji per jabatan di menu "Gaji & Tunjangan > Master Jabatan".',
            },
        ],
    },

    // 👥 PEGAWAI
    {
        id: 'pegawai',
        title: 'Data Pegawai',
        description: 'Kelola data lengkap seluruh pegawai.',
        icon: '👥',
        tier: 3,
        pathPattern: '/dashboard/data-pegawai',
        tourSteps: [
            {
                element: '[data-tour="pegawai-header"]',
                popover: {
                    title: '👥 Data Pegawai',
                    description: 'Halaman ini berisi data seluruh pegawai perusahaan. Anda bisa menambah pegawai baru, mengedit data, melihat detail profil, atau menghapus data pegawai.',
                    side: 'bottom',
                    align: 'start',
                },
            },
        ],
        faqs: [
            {
                question: 'Bagaimana cara melihat detail lengkap pegawai?',
                answer: 'Klik pada baris pegawai di tabel atau klik ikon "Detail" untuk melihat profil lengkap, riwayat absensi, dan data gaji.',
            },
        ],
    },

    // 📊 DASHBOARD / MONITORING
    {
        id: 'dashboard',
        title: 'Dashboard Monitoring',
        description: 'Pantau ringkasan statistik absensi, kehadiran, dan produktivitas.',
        icon: '📊',
        tier: 3,
        pathPattern: '/dashboard$',
        tourSteps: [
            {
                element: '[data-tour="dashboard-header"]',
                popover: {
                    title: '📊 Dashboard Monitoring',
                    description: 'Dashboard ini menampilkan ringkasan statistik kehadiran, keterlambatan, dan produktivitas pegawai secara real-time.',
                    side: 'bottom',
                    align: 'start',
                },
            },
        ],
        faqs: [
            {
                question: 'Seberapa sering data dashboard diperbarui?',
                answer: 'Data dashboard diperbarui secara real-time setiap kali halaman dimuat ulang atau saat ada perubahan data absensi.',
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

# Sistem Absensi & HRIS Tiga Berlian (Frontend)

Sistem Absensi & HRIS adalah aplikasi web modern berbasis React 19 + TypeScript + Vite yang dirancang khusus untuk mengelola data SDM (Pegawai, Jabatan, Departemen), Rekapitulasi Absensi & Jadwal Shift, SPL Lembur, Target Packing, Kasbon, Bonus & Potongan Custom, hingga Pengaturan & Rekapitulasi Gaji secara *real-time*.

---

## 🛠 Teknologi Utama (Tech Stack)

Aplikasi ini mengadopsi ekosistem *frontend* modern dengan kinerja tinggi:

*   **Framework Inti:** React (v19.2)
*   **Build Tool:** Vite (v6.0) - Menjamin proses *build* dan *Hot Module Replacement* (HMR) yang sangat cepat.
*   **Bahasa Pemrograman:** TypeScript - Membantu menjaga stabilitas kode dengan *static typing*.
*   **Styling & UI:** Tailwind CSS (v4.2) - Utility-first styling modern & fleksibel.
*   **Komponen Tabel & Tanggal:** MUI DataGrid (v9.0) & MUI Date Pickers - Tabel interaktif kompleks dengan pagination & pemilah tanggal.
*   **State Management:** Zustand (v5.0) - Mengelola state global sesi autentikasi secara persisten (`sessionStorage`).
*   **Data Fetching & Caching:** TanStack React Query (v5.101) - Caching terpusat (`staleTime: 5 menit`) & otomatis invalidasi query.
*   **Routing:** React Router DOM (v7.1)
*   **Validasi Form:** React Hook Form + Zod - Pengelolaan input form & validasi schema terintegrasi.
*   **Format Mata Uang:** Utilitas Terpusat `formatCurrency.ts` (`formatRupiah`, `formatNumberInput`, `parseCurrencyToNumber`).

---

## 📂 Arsitektur Direktori (Feature-Sliced Folder Structure)

Struktur proyek disusun secara **Feature-Sliced Architecture** untuk memudahkan pemeliharaan kode (maintenance) dan skalabilitas aplikasi. Semua kode sumber berada di dalam direktori `src/`:

```text
src/
├── assets/          # Asset statis (gambar, ikon, logo)
├── components/      # Komponen UI global (Button, InputText, InputSelect, Notif, ConfirmPopUp, PeriodSwitcher)
│   └── layout/      # Tata letak utama (Sidebar, Header, AuthLayout, DashboardLayout)
├── features/        # Modul Fitur Aplikasi (Feature-Sliced Architecture)
│   ├── auth/            # Otentikasi Login & Logout
│   ├── bonusCustom/     # Pengaturan & Rekap Bonus Custom
│   ├── departemen/      # Manajemen Master Departemen
│   ├── gajiTunjangan/   # Master Gaji Jabatan & Rekapitulasi Gaji
│   ├── guidance/        # Tour/Guidance interaktif pengguna
│   ├── jabatan/         # Manajemen Master Jabatan
│   ├── jadwalShift/     # Pola Rotasi, Master Shift & Matrix Jadwal
│   ├── kasbon/          # Pengajuan & Riwayat Pembayaran Kasbon
│   ├── lembur/          # Surat Perintah Lembur (SPL)
│   ├── pegawai/         # Data Induk Pegawai
│   ├── potonganCustom/  # Pengaturan & Rekap Potongan Custom
│   └── targetPacking/   # Master Target & Matrix Pencapaian Target Packing
├── hooks/           # Custom Hooks global (useNotif, dll)
├── routes/          # Proteksi Rute (ProtectedRoute)
├── store/           # Global Store Zustand (useAuthStore)
├── types/           # Type definitions TypeScript terpusat
└── utils/           # Helper utilities (apiFetch, formatCurrency, formatMinutes, dateHelpers)
```

---

## 🔒 Alur Autentikasi & Otorisasi API

1. **Zustand & Session Storage:**
   Saat pengguna berhasil masuk (*login*), token JWT disimpan di *Zustand store* (`src/store/useAuthStore.ts`) yang terhubung ke `sessionStorage`. Token aman dari akses lintas-tab dan otomatis terhapus saat browser ditutup.
2. **Auto-Inject Authorization Header (`apiFetch`):**
   Fungsi `apiFetch` (`src/utils/apiFetch.ts`) secara otomatis menyuntikkan token JWT (`Authorization: Bearer <token>`) pada setiap request API ke *backend*. Jika backend merespons `401 Unauthorized`, sesi akan otomatis di-logout dan pengguna di-redirect ke halaman Login.

---

## 📦 Versi Release & Otomatisasi (Release Versioning)

Aplikasi dilengkapi dengan **Sistem Versi Otomatis**:
- **Versi Build & Tanggal Rilis:** Ditampilkan secara otomatis pada bagian paling bawah **Sidebar** (misal: `v1.0.0 (22.07.2026)`).
- **Auto-Bump Versi Saat Build:** Perintah `npm run build` secara otomatis menaikkan versi patch (`1.0.0` $\rightarrow$ `1.0.1`).
- **Panduan Lengkap Tim:** Lihat file **[PANDUAN_RELEASE_VERSION.md](./PANDUAN_RELEASE_VERSION.md)** untuk panduan rilis versi oleh tim pengembang.

---

## 🚀 Panduan Menjalankan Proyek

**1. Kloning & Instalasi Dependensi**
```bash
git clone <url-repositori-anda>
cd Sistem-absensi
npm install
```

**2. Konfigurasi Environment Variables (`.env`)**
Buat file `.env` di root proyek:
```env
VITE_API_BASE_URL=http://localhost:8000
```

**3. Menjalankan Mode Development**
```bash
npm run dev
```

**4. Perintah Tambahan (Scripts)**
- `npm run bump` : Menaikkan versi patch otomatis (`1.0.0` $\rightarrow$ `1.0.1`).
- `npm run bump:minor` : Menaikkan versi minor otomatis (`1.0.0` $\rightarrow$ `1.1.0`).
- `npm run bump:major` : Menaikkan versi major otomatis (`1.0.0` $\rightarrow$ `2.0.0`).
- `npm run build` : Melakukan kompilasi TypeScript & bundling rilis production (dengan auto version patch bump).

# Sistem Absensi & HRIS (Frontend)

Sistem Absensi & HRIS adalah aplikasi berbasis web yang dirancang khusus untuk mengelola data sumber daya manusia, kehadiran (absensi), jadwal shift, hingga rekapitulasi gaji karyawan secara *real-time*. Antarmuka pengguna (UI) dibangun dengan prinsip desain modern, responsif, dan mengedepankan pengalaman pengguna (UX) tingkat tinggi baik di perangkat *Desktop* maupun *Mobile*.

---

## 🛠 Teknologi Utama (Tech Stack)

Aplikasi ini mengadopsi ekosistem *frontend* modern dengan kinerja tinggi:

*   **Framework Inti:** React (v19.2)
*   **Build Tool:** Vite (v6.0) - Menjamin proses *build* dan *Hot Module Replacement* (HMR) yang sangat cepat.
*   **Bahasa Pemrograman:** TypeScript - Membantu menjaga stabilitas kode dengan *static typing*.
*   **Styling & UI:** Tailwind CSS (v4.2) untuk *utility-first styling*.
*   **Komponen Tabel:** MUI DataGrid (v9.0) - Digunakan untuk me-render tabel kompleks (pegawai, absensi, gaji) dengan fitur *pagination* dan visibilitas kolom yang responsif.
*   **State Management:** Zustand (v5.0) - Mengelola *state* global (khususnya sesi autentikasi) secara ringan dan persisten.
*   **Routing:** React Router DOM (v7.1)
*   **Validasi Form:** React Hook Form + Zod - Mengelola *input form* dan validasi *schema* dengan aman.

---

## 📂 Arsitektur Direktori (Folder Structure)

Struktur proyek dibuat sangat modular untuk memudahkan pemeliharaan kode (maintenance) seiring bertumbuhnya skala aplikasi. Semua kode sumber berada di dalam direktori `src/`:

```text
src/
├── assets/        # File statis seperti gambar, ikon, atau logo.
├── components/    # Komponen UI modular yang dapat digunakan ulang (reusable).
│   ├── ui/        # Elemen UI dasar (Button, Input, Notif).
│   └── tabel/     # Komponen spesifik tabel (TabelDashboard, TabelPegawai, dll).
├── config/        # Konfigurasi global aplikasi.
├── layouts/       # Komponen tata letak (AuthLayout, MainLayout/Sidebar).
├── pages/         # Representasi halaman dari setiap URL route.
│   ├── dashboard/ # Halaman utama (Pegawai, Jabatan, Departemen, Shift, Lembur, Gaji).
│   └── Login.tsx  # Halaman login otorisasi.
├── routes/        # Logika sistem routing dan proteksi halaman (ProtectedRoute).
├── store/         # Manajemen state global menggunakan Zustand (useAuthStore).
├── types/         # Definisi antarmuka TypeScript (Interfaces/Types) secara terpusat.
└── utils/         # Fungsi bantuan (helpers) seperti apiFetch dan errorHandler.
```

---

## 🔒 Alur Autentikasi & Keamanan (Authentication Flow)

Keamanan sesi adalah salah satu prioritas dalam aplikasi ini. Alur autentikasi telah di-hardening dengan beberapa lapis keamanan:

1.  **Zustand & Session Storage:**
    Saat pengguna berhasil masuk (*login*), token JWT dan nama pengguna disimpan di *Zustand store* (`src/store/useAuthStore.ts`). *Store* ini menggunakan `persist` yang dihubungkan ke `sessionStorage`. Ini memastikan token aman dari akses lintas-tab jika perangkat dibagikan, dan otomatis terhapus saat *browser* ditutup.
2.  **Pemantauan Rute (Protected Routes):**
    File `src/routes/ProtectedRoute.tsx` bertugas sebagai gerbang penjaga. Sebelum me-render halaman *Dashboard*, komponen ini akan memeriksa:
    *   Apakah *state* `isAuthenticated` bernilai *true*?
    *   Apakah token JWT masih *valid* (belum kadaluarsa) menggunakan `jwt-decode`?
    Jika salah satu syarat gagal, pengguna dilempar kembali ke `/login`.
3.  **Global API Fetch Interceptor (`apiFetch`):**
    Semua komunikasi data ke *backend* melewati fungsi *wrapper* `src/utils/apiFetch.ts`. Jika *backend* mengembalikan status `401 Unauthorized` (token kedaluwarsa atau ditarik), aplikasi secara otomatis memanggil fungsi `logout()` untuk membersihkan sesi dan melempar pengguna ke halaman login, mencegah kondisi "Sesi Zombie".

---

## 🚀 Panduan Instalasi & Menjalankan Proyek

Pastikan Anda telah menginstal **Node.js** di lingkungan lokal Anda.

**Langkah 1: Kloning & Instalasi Dependensi**
Buka terminal Anda dan jalankan perintah berikut:
```bash
git clone <url-repositori-anda>
cd Sistem-absensi
npm install
```

**Langkah 2: Konfigurasi Environment Variables**
Aplikasi ini membutuhkan URL *backend* untuk mengambil data. Buatlah file bernama `.env` di *root* proyek (sejajar dengan `package.json`), dan tambahkan konfigurasi berikut:
```env
VITE_API_BASE_URL=https://url-backend-anda.com
```
*(Catatan: File `.env` sudah masuk ke dalam `.gitignore` sehingga aman dan tidak akan terpublikasi ke GitHub).*

**Langkah 3: Jalankan Mode Development**
```bash
npm run dev
```
Aplikasi akan berjalan (biasanya di `http://localhost:5173`). Buka *browser* untuk mulai meninjau aplikasi.

---

## 💡 Panduan Penambahan Fitur (Contribution Guide)

Jika Anda atau anggota tim baru ingin menambahkan fitur, pastikan untuk mengikuti konvensi (*best practices*) berikut:

1.  **Membuat Halaman Baru:** 
    Buat folder fitur baru di dalam `src/pages/dashboard/` (misalnya `src/pages/dashboard/laporan/`). Buat komponen halaman di dalamnya (misal `LaporanIndex.tsx`).
2.  **Mendaftarkan Rute (Routes):** 
    Setelah halaman dibuat, tambahkan rute tersebut ke dalam konfigurasi React Router Anda di `src/App.tsx` atau file *routing* utama dengan melapisinya di bawah `<ProtectedRoute>`.
3.  **Membuat Komponen UI Berulang:** 
    Jika fitur Anda membutuhkan tabel khusus atau komponen *card*, letakkan logika tampilan tersebut di `src/components/ui/` agar halaman (`src/pages/`) tidak terlalu panjang dan tetap bersih.
4.  **Menarik Data (Fetching):** 
    SELALU gunakan import fungsi `apiFetch` dari `src/utils/apiFetch.ts` saat menembak URL API, bukan fungsi `fetch` bawaan. Ini menjamin keamanan sesi (auto-logout) tetap berjalan.
5.  **Menangani Error (Error Handling):** 
    SELALU gunakan fungsi `getSafeErrorMessage()` dari `src/utils/errorHandler.ts` jika Anda ingin menampilkan pesan kesalahan ke pengguna melalui `alert()` atau komponen `<Notif />`, untuk mencegah kebocoran log *database* ke antarmuka pengguna.

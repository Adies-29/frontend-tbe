# 📘 Panduan Manajemen Versi & Release Aplikasi (Team Guide)

Dokumen ini berisi panduan bagi tim pengembang untuk mengelola dan memperbarui versi rilis aplikasi **Sistem Absensi & Penggajian T-Be (Tiga Berlian)**.

---

## 🚀 Cara Kerja Otomatisasi Versi

Sistem versi aplikasi telah dirancang agar **otomatis** dan **mencegah adanya rilis tanpa pembaruan versi**:

1. **Otomatisasi Saat Build Production (`npm run build`)**
   - Setiap kali tim menjalankan perintah `npm run build`, sistem secara otomatis mengeksekusi script `prebuild` yang akan menaikkan nomor versi patch (misal: `1.0.0` $\rightarrow$ `1.0.1`).
   - Hasil rilis akhir akan menampilkan versi baru beserta tanggal build terkini di bagian bawah **Sidebar** aplikasi:
     > **Tampilan Sidebar:** `v1.0.1 (22.07.2026)`

2. **Gunakan Perintah Terminal (Manual / Custom Versioning)**
   Jika tim ingin menaikkan nomor versi sebelum melakukan commit / build tanpa mengedit file secara manual:

   - **Naikkan Versi Bugfix / Patch (1.0.0 $\rightarrow$ 1.0.1):**
     ```bash
     npm run bump
     ```
   - **Naikkan Versi Fitur Baru / Minor (1.0.0 $\rightarrow$ 1.1.0):**
     ```bash
     npm run bump:minor
     ```
   - **Naikkan Versi Rilis Besar / Major (1.0.0 $\rightarrow$ 2.0.0):**
     ```bash
     npm run bump:major
     ```

---

## 🛠️ Panduan Langkah Demi Langkah Rilis / Update Aplikasi

Setiap kali ada perubahan kode atau rilis fitur baru, ikuti alur standar berikut:

### 1. Pengembangan Fitur / Perbaikan Bug
Kerjakan tugas coding seperti biasa dan pastikan fitur berjalan lancar di mode development (`npm run dev`).

### 2. Jalankan Build Production
Saat siap dipublish / dideploy ke server:
```bash
npm run build
```
*Catatan: Perintah di atas akan otomatis menaikkan versi patch di `package.json` dan menyertakan tanggal build hari tersebut.*

### 3. Commit dan Push ke Repository
Commit perubahan kode beserta update `package.json`:
```bash
git add .
git commit -m "feat: rilis fitur baru - v1.0.1"
git push origin main
```

---

## ❓ FAQ & Troubleshooting

### Q: Mengapa versi di browser pengguna belum berubah setelah rilis?
1. **Cache Browser / PWA (Service Worker)**: Aplikasi ini menggunakan PWA (Progressive Web App). Pengguna bisa menekan `Ctrl + F5` (Hard Reload) atau menutup dan membuka kembali tab browser.
2. **Ketinggalan Commit `package.json`**: Pastikan file `package.json` ikut di-commit saat melakukan `git push`.

---

> **PENTING UNTUK TIM:** Jangan mengubah format properti `"version"` pada file `package.json` menjadi karakter non-standar agar parser tanggal otomatis Vite tetap berjalan normal.

# Fa-NumTX — Vehicle License Plate Detection Dashboard

Fa-NumTX adalah dashboard monitoring deteksi plat nomor kendaraan secara real-time. Sistem ini menampilkan data hasil pengenalan plat kendaraan dari kamera CCTV, lengkap dengan statistik wilayah, jenis kendaraan, dan riwayat deteksi.

## Fitur Utama

- **Dashboard** — Statistik real-time jumlah deteksi, distribusi wilayah (pie chart), dan jenis kendaraan
- **Live Camera** — Video player untuk monitoring kamera CCTV
- **Historical Report** — Riwayat deteksi dengan filter tanggal, pencarian, dan pagination
- **Export Report** — Ekspor laporan mingguan ke PDF
- **Autentikasi** — Login dengan kontrol akses pengguna

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (Database, Auth, Edge Functions)
- **Charts:** Recharts
- **PDF:** jsPDF + jspdf-autotable

## Instalasi

```bash
# Clone repository
git clone <YOUR_GIT_URL>
cd fa-numtx

# Install dependencies
npm install

# Buat file .env berdasarkan .env.example
cp .env.example .env
# Isi dengan kredensial Supabase Anda

# Jalankan development server
npm run dev
```

## Environment Variables

Buat file `.env` di root project dengan variabel berikut:

```
VITE_SUPABASE_PROJECT_ID=your_project_id
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_URL=https://your-project.supabase.co
```

> ⚠️ **Jangan commit file `.env` ke repository.** Pastikan `.env` sudah ada di `.gitignore`.

## Struktur Database (Supabase)

| Tabel | Deskripsi |
|---|---|
| `cameras` | Data kamera CCTV |
| `regions` | Daftar wilayah/daerah |
| `vehicle_detections` | Hasil deteksi plat kendaraan |
| `weekly_exports` | Log ekspor laporan mingguan |
| `users` | Data pengguna sistem |

## Lisensi

Private — Hak cipta dilindungi.

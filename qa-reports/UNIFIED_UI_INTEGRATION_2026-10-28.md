# Integrasi UI asli SortTrip — 28 Oktober 2026

Status: implemented locally, targeted tests passed; menunggu review owner. Tidak ada deploy, commit/push, SQL, perubahan database/credential, pembayaran, atau inferensi Meta berbayar.

## 1. UI asli

Entry tetap `index.html → main.jsx → AuthApp → TravelApp`, dengan header, navigasi, pencarian, footer, WorldPlanner, budget, peta, dan mekanisme Save asli. `index.html`, `main.jsx`, `vite.config.js`, dan `app/auth-app.tsx` tidak diubah pada tugas ini. Tidak ada redirect ke MVP atau editor kedua. Semua perubahan worktree sebelumnya dipertahankan.

## 2. Posisi unggah MP4

Tombol ringkas **Unggah video MP4/MOV/M4V** berada di **SortTrip Assistant → Lampiran opsional** pada formulir asli. Perintah perjalanan tetap dapat ditulis bersamaan dengan lampiran. Kontrol yang sama digunakan pada Assistant di editor. Tambahan **Buat itinerary manual** tersedia di Jelajah setelah memilih kota; tidak membuat harga/penerbangan fiktif.

## 3. Video ke WorldPlanner

Decoder browser menyiapkan frame lokal, kemudian pengguna meninjau tujuan sebelum melanjutkan ke WorldPlanner yang sama. Tanggal, durasi, traveler, budget, dan airport pilihan dipertahankan. Penambahan hasil video pada trip yang sama mempertahankan item lama, termasuk yang dibeli/dikunci, serta mencegah duplikat. Perbedaan tujuan harus ditinjau, bukan diam-diam menimpa trip.

URL TikTok tetap memakai alur referensi yang sudah ada. URL bukan bukti bahwa isi video berhasil dibaca. Uji redirect/caption menggunakan respons jaringan mock; akses TikTok aktual belum diuji pada tugas ini.

## 4. Tour Guide

Tour Guide dibuka dari detail tempat di itinerary, dalam dialog kontekstual. Narasi, Q&A, pilihan bahasa, peta, dan navigasi tempat tetap di pengalaman itinerary; menutup dialog tidak menghilangkan edit.

## 5. Jelajahi Sekitar

Bagian ini diringkas menjadi panel **Jelajahi Sekitar** yang dibuka di dalam Tour Guide. Kategori makanan, kuliner, oleh-oleh, dan wisata memakai data kurasi beratribusi; data harga, jam, jarak, atau halal yang tidak terbukti tidak dibuat-buat. GPS tetap opsional satu kali. Tambah tempat memakai hari/jam dan itinerary yang sama, dengan pencegahan duplikat.

## 6. Booking dan affiliate

Komponen dan parameter existing Travelpayouts/Aviasales, Nuitée/LiteAPI, 12Go, Viator, Trip.com/Klook, Trip Pass, dan pembayaran dipertahankan. Tidak ada perubahan ID affiliate atau konfigurasi produksi. Tes kontrak supplier/link lolos menggunakan fixture; tidak membuktikan stok, harga, booking, atau pembayaran live.

## 7. Hasil pengujian

- 82 tes terarah: unified UI, video, persistence, Local Discovery, Tour Guide, flight affiliate/API, hotel, transport, Viator, dan day settings: **PASS**.
- 14 tes tambahan untuk source selector, destination search, dan combined Assistant: **PASS**. Log accounting pada tes adalah mock, bukan panggilan Meta/ledger nyata.
- 7 tes URL TikTok dan referensi inspirasi: **PASS**, jaringan mock.
- Total **103 tes PASS**, tanpa menjalankan ulang full suite.
- `npm run build:owner-ui`: TypeScript dan build **PASS**; masih ada peringatan ukuran chunk non-fatal.
- Browser desktop 1280px dan mobile 390px: original homepage, unggah MP4 sintetis/frame decode, review tujuan, manual creation, editor, Save/reload fixture, Guide, Nearby, GPS ditolak, penambahan/duplikat, bahasa, dan peta: **PASS**. Tidak ada horizontal overflow atau page error; nol percobaan endpoint inferensi. Sepuluh tile peta menggunakan fixture gambar dalam tes.
- Pemeriksaan artifact build: penanda mock auth/database browser tidak ditemukan dalam bundle.
- GET terakhir: `5173` HTTP200 dengan entry asli; `5175` HTTP200 dengan demo terpisah.

Screenshot di `artifacts/unified-ui/`: `home-mp4-desktop.png`, `home-mp4-mobile.png`, `editor-desktop.png`, `editor-mobile.png`, `guide-desktop.png`, `guide-mobile.png`, `nearby-desktop.png`, `nearby-mobile.png`, dan `map-desktop.png`. Evidence mesin: `browser-results.json`, `targeted-tests.log`, dan `build.log`.

## 8. Data nyata versus fixture

| Bagian | Bukti pada tugas ini |
| --- | --- |
| React UI asli, editor, input, decoder video, review, panel peta | Kode aplikasi sebenarnya; video sintetis lokal benar-benar didekode |
| Pengenalan video pada profil owner-ui | Fixture Bangkok yang diberi label; bukan inferensi Meta |
| Save/MyTrips/reload dalam browser test | Mekanisme aplikasi asli dengan mock auth/client database yang hanya diinjeksi oleh test runner |
| Save guest pada URL owner-ui | Gate login asli dan session draft; tidak ada penyimpanan cloud |
| Local Discovery/Q&A | Data kurasi/fixture dan sumber tercantum; bukan rekomendasi AI live |
| Narasi/GPS | API suara dan penolakan GPS disimulasikan dalam tes; suara perangkat/lokasi fisik belum diverifikasi |
| Supplier, TikTok, payment, live Meta | Tidak dihubungi; tidak ada bukti transaksi, stok, atau harga live baru |

## 9. Batas dan file perubahan

Profil lokal `vite.owner-ui.config.js` tidak memuat env/credential, tidak mem-proxy Worker/Supabase, dan menolak API selain katalog lokasi lokal. Script pihak ketiga inline dinonaktifkan hanya pada profil ini; konfigurasi produksi tidak berubah. Peta memakai komponen asli; tile publik OpenStreetMap diizinkan untuk owner, sedangkan browser test menggantinya dengan gambar fixture. Widget live tidak tersedia dalam profil offline ini.

File utama: `app/assistant-source-picker.tsx`, `app/flight-search.tsx`, `app/destination-input.tsx`, `app/video-itinerary.tsx`, `app/travel-app.tsx`, `app/tour-guide.tsx`, CSS terkait, `app/world-planner.tsx`, `app/world-planner.css`, `app/i18n/locales/video.json`, `lib/manual-itinerary.*`, `lib/reviewed-trip.*`, `vite.owner-ui.config.js`, `package.json`, `.gitignore`, `checks/unified-ui.test.mjs`, `scripts/qa-unified-ui-browser.mjs`, dan selector regression `scripts/qa-local-discovery-browser.mjs`.

Blocker live: login/cloud Save, aktualisasi supplier, TikTok metadata aktual, dan Meta harus diuji terpisah pada environment terotorisasi. Tidak ada bypass Trip Pass/RLS atau perubahan ledger. Kesiapan produksi dan live end-to-end **belum diklaim**.

## 10. Cara owner mencoba

**UI asli terbaru: http://127.0.0.1:5173/** — server dibiarkan berjalan.

1. Buka Jelajah, pilih kota, lalu **Buat itinerary manual**; atau buka lampiran video pada SortTrip Assistant.
2. Unggah MP4 singkat, tinjau frame, lalu gunakan contoh pengenalan yang jelas berlabel demo pada profil ini. Tinjau tujuan/tanggal/traveler sebelum membuat itinerary.
3. Edit jadwal di WorldPlanner, buka detail tempat → Tour Guide → Jelajahi Sekitar. Tambahkan tempat dengan hari/jam; kembali ke itinerary.
4. Coba peta, budget, dan navigasi booking. Layanan online akan ditandai tidak tersedia dalam profil ini.
5. Save sebagai guest meminta login. Jangan menganggap profil offline ini dapat login atau menyimpan ke cloud. Browser test Save memakai fixture terpisah, bukan akun owner.

Jalankan ulang bila perlu: `npm run dev:owner-ui`. Demo lama tetap di http://127.0.0.1:5175/ sebagai referensi terpisah, bukan halaman utama. Berhenti setelah review lokal; release/integrasi live memerlukan instruksi owner berikutnya.

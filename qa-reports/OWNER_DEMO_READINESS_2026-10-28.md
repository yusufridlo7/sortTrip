# Demo lokal siap dicoba owner

**28 Oktober 2026,15:49:21 WIB — SERVER BERJALAN**  
URL: **http://127.0.0.1:5175/**, hanya pada laptop ini. GET terakhir HTTP200, entry MVP benar, listener127.0.0.1 PID17300. Sesi peluncur39392 dibiarkan aktif sesuai instruksi owner.

Working tree branch `codex/meta-hackathon-phase-2-2026` memiliki296entri perubahan sebelum pekerjaan; semuanya dipertahankan, termasuk penghapusan WORKFLOW.md yang sudah ada. Perbandingan hash224berkas source/script/config menunjukkan **0berubah**. Tidak ada fitur baru, build ulang atau full test suite.

## Cara mencoba

1. Buka URL di atas; pilih bahasa Indonesia/English pada dropdown.
2. Cara cepat: klik **Coba contoh demo lokal berlabel**. Untuk mencoba upload nyata, pilih video sintetis `artifacts/mvp-synthetic.mp4` atau MP4/MOV/M4V kompatibel milik sendiri (maksimal4MiB/60detik). Centang persetujuan, klik **Siapkan frame video secara lokal**, kemudian **Analisis contoh Bangkok — demo, tanpa AI langsung**.
3. Tinjau Wat Arun/Wat Pho, pilih/nonaktifkan, naik/turun atau koreksi tempat. Tentukan tanggal/hari/traveler, lalu **Buat itinerary baru yang bisa diedit**.
4. Ubah waktu/item pada editor. Klik **Simpan itinerary**, refresh halaman, lalu **Muat itinerary demo tersimpan**. Penyimpanan hanya pada browser/origin ini; tidak membutuhkan login dan tidak masuk akun Supabase.
5. Coba tombol pencarian pesawat, hotel, transportasi dan tiket wisata. Form memakai komponen existing dengan konteks itinerary; harga/availability nyata sengaja tidak tersedia di demo.
6. Pada kartu destinasi di bawah, klik **Jelajahi dengan AI Tour Guide**. Coba Dengarkan/Jeda/Lanjutkan/Hentikan, pertanyaan “Apa sejarah tempat ini?”, follow-up “Jelaskan lagi”, ganti bahasa, Maps dan destinasi berikutnya.

## Verifikasi ulang

Skenario browser existing dijalankan terhadap server yang tetap hidup, tanpa mengubah skrip di disk. Bukti baru terpisah: `artifacts/owner-demo/browser-results.json` dan screenshot desktop/mobile pada folder yang sama.

| Alur | Hasil |
|---|---|
| URL TikTok → upload alternatif | PASS; tidak mengambil video TikTok |
| MP4 sintetis nyata → tiga frame; corrupt/oversized | PASS lokal |
| Recognition/seleksi/koreksi/urut | PASS WITH FIXTURE Bangkok, bukan Meta |
| Editor native dan Save/full reload | PASS browser lokal, bukan Save database |
| Flight/hotel/transport/activity UI dan tanggal/traveler | PASS; offer supplier tidak diuji |
| Guide ID/EN, Q&A/follow-up/Maps/next | PASS WITH FIXTURE referensi |
| Narasi/controls dan fallback | PASS WITH FIXTURE speech API; audio fisik perlu dicoba owner |
| Jaringan/console |0request eksternal,0endpoint model/ledger/payment,0pageerror |

## Yang perlu diperhatikan

- Gambar/frame upload tidak dianalisis Meta dalam demo ini: pengenalan tetap fixture Bangkok yang diberi label. Q&A juga deterministik berbasis referensi, bukan AI generatif langsung.
- Suara Indonesia/Inggris bergantung voice yang tersedia pada browser/perangkat. Transkrip tetap tersedia jika suara tidak bekerja.
- Form booking yang tidak mengeluarkan harga nyata adalah batas demo terisolasi; semua `/api/` demo ditolak dengan unavailable. Tidak ada pembelian/checkout yang diuji.
- Peluncuran pertama di sandbox tidak terjangkau browser luar sandbox. Proses demo tersebut dihentikan dan diganti peluncur luar sandbox; akses terakhir berhasil dan server tetap aktif. Tidak memulai server QA8790/5174.

Untuk menghentikan demo nanti, gunakan Ctrl+C pada terminal **npm run dev:mvp-demo** yang benar; jangan menghentikan semua node/workerd. Perintah yang tersedia untuk peluncuran ulang adalah `npm run dev:mvp-demo`.

Hanya laporan/catatan progres dan artefak tes baru diperbarui. Tidak ada SQL, perubahan database/ledger, Meta berbayar, credential, transaksi, production, deploy, commit/push atau Phase3. Kesiapan ini hanya untuk **demo lokal**, bukan izin pemulihan ledger atau bukti live integrasi.

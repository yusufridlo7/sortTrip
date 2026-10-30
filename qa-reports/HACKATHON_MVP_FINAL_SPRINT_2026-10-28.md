# Hasil sprint MVP hackathon SortTrip

**Tanggal:** 28 Oktober 2026, Asia/Jakarta  
**Status:** implementasi lokal dan demo terintegrasi selesai pada lingkup yang dapat diuji; **live Meta, supplier dan Save ke Supabase tidak disertifikasi**. Tidak deploy/commit/push. Tidak ada SQL, pemulihan ledger, inferensi berbayar, pembelian atau perubahan production.

## A. Video-to-Itinerary

Memakai ulang komponen VideoItinerary, prepareVideo, adapter Meta2.000 token, editor WorldPlanner, databaseTrips dan komponen booking. [Baseline booking/celah](HACKATHON_MVP_BOOKING_BASELINE_2026-10-28.md) dicatat sebelum Tour Guide dikerjakan.

Perubahan nyata:

- URL TikTok vt/vm, canonical dan `/t/` diterima. Redirect metadata dibatasi host/path, tiga hop, timeout dan ukuran; host/IP arbitrary tidak menjadi proxy. Tidak menambah pengunduh video atau bypass proteksi. Caption bukan analisis video.
- Link tanpa konten menampilkan pesan **“Video TikTok tidak dapat diproses langsung. Silakan unggah video yang Anda miliki atau berhak gunakan.”** dan tombol upload. Pengambilan video TikTok live tetap **BLOCKED/UNVERIFIED**.
- MP4 serta MOV/M4V dengan container/codec kompatibel browser didukung. MIME/signature ISO-BMFF,4MiB,60detik, struktur berbahaya/eksternal dan resource decoder tetap dibatasi. WebM/codec lain tidak diklaim didukung. Tiga frame lokal, indikator proses, cancel dan cleanup objectURL dipakai ulang; video/audio tidak disimpan permanen.
- Review kini mendukung pilih/nonaktifkan, naik/turun, koreksi nama/kota/negara, tambah manual, tanggal/durasi/traveler. Lokasi tidak pasti memerlukan konfirmasi manual dan tidak mendapatkan koordinat palsu. Duplikat/kota-negara yang tidak konsisten ditolak saat membuat draft.
- Katalog Bangkok ditambah Wat Arun/Wat Pho dengan koordinat dari tautan Maps pada referensi pemerintah Thailand. Airport Bangkok memakai DMK sesuai katalog SortTrip existing; kota lain di luar pemetaan tetap tanpa kode rekaan.
- Demo Bangkok eksplisit pada entry lokal baru; frame diekstrak sungguhan tetapi pengenalan memakai fixture berlabel. MODEdemo tidak memanggil auth/model/ledger. Aplikasi biasa tetap memakai adapter/otorisasi existing; tidak diganti fixture.

Itinerary dapat diedit dengan editor native. Save/reload demo memakai localStorage terpisah berlabel; adapter databaseTrips juga diuji dengan client memori untuk save/update/reload, pembatasan identitas dan retensi metadata booking. **Bukan uji RLS atau penyimpanan Supabase nyata**. Jalur Save aplikasi biasa tidak diubah.

## B. AI Tour Guide

Tombol **Jelajahi dengan AI Tour Guide** tersedia pada detail item wisata melalui ItemBooking, termasuk planner native. Ada pengantar, sejarah, budaya, hal menarik, etika, tips, referensi, transkrip, peta, arah Google Maps, kembali dan destinasi berikutnya.

Konten faktual terkurasi saat ini mencakup Wat Arun dan Wat Pho di Bangkok. Destinasi lain menampilkan ketidaktersediaan informasi, bukan sejarah rekaan. Teks dan Q&A Indonesia/Inggris tersedia; penggantian bahasa/destinasi menghapus konteks percakapan lama dan menghentikan narasi.

Narasi memakai speechSynthesis browser: play/replay, pause, resume, stop dan fallback teks. Tidak memakai TTS berbayar. Kontrol dan cleanup diuji dengan stub API browser; **suara yang benar-benar terdengar dan ketersediaan voice pada perangkat owner belum diverifikasi**.

Q&A destination-specific memakai konteks referensi deterministik dengan label **demo, bukan AI langsung**. Follow-up mempertahankan topik; harga, jam buka, ketersediaan dan fakta di luar konteks ditandai belum terverifikasi. Belum ada endpoint generatif Tour Guide live; implementasi ini tidak menyamarkannya sebagai model bebas.

Referensi kurasi: [pemerintah Thailand—Wat Arun](https://www.am2026thailand.go.th/explore-bangkok/wat-arun), [pemerintah Thailand—Wat Pho](https://www.am2026thailand.go.th/explore-bangkok/wat-pho), [Wat Pho—sejarah resmi](https://www.watpho.org/en/history), [Tourism Authority of Thailand](https://www.tourismthailand.org/Promotions/65/wat-arun-or-temple-of-dawn-is-located-along-with-chao-phraya-river). Referensi tidak dipakai untuk mengklaim tarif/jam buka saat ini.

## C. Booking preservation

Tidak menghapus menu, komponen atau adapter booking; tidak mengubah ID affiliate/deep-link, autentikasi, formula anggaran, atau mengganti data aplikasi biasa dengan fixture. Perubahan ItemBooking hanya menambahkan entry Tour Guide; gate staging yang sudah ada tidak diperluas menjadi checkout. Demo memakai komponen pencarian existing dengan egress API dinonaktifkan khusus server demo.

| Provider | Status sprint | Bukti/batas |
|---|---|---|
| Travelpayouts/Aviasales | **LOCAL TEST PASS** | API fixture, round-trip/dates/travelers, affiliate/redirect dan itinerary regresi; tidak ada search live/commission/booking selesai |
| Nuitée/LiteAPI | **LOCAL TEST PASS** | Hotel search fixture; tanggal, tamu, budget/filter dan unavailable handling; checkout/pembayaran tidak dilakukan |
| 12Go | **LOCAL TEST PASS** | Route/date/traveler/affiliate serta transport-plan regresi; tanpa API inventori, tarif/jadwal tidak dibuat-buat |
| Viator | **LOCAL TEST PASS** | Adapter/availability-label/link lewat fixture; tidak ada inventori live atau transaksi |
| Trip.com | **UNKNOWN** untuk live | Komponen/menu/parameter affiliate existing dipertahankan; widget live tidak diuji sprint |
| Klook | **UNKNOWN** untuk live | Widget existing dipertahankan; tidak mengklaim API/komisi/inventori live |
| Agoda | **NOT CONFIGURED/UNVERIFIED** | Tidak menambah akses/API atau mengklaim approval yang belum terbukti |
| Booking.com | **UNKNOWN** | Referensi properti existing bukan bukti persetujuan affiliate/CJ/Demand API |
| Maps/transport lokal | **LOCAL TEST PASS** untuk arah | Context destination dan URL Maps diuji; tarif/jadwal dan transit real-time tidak diverifikasi |

Tidak ada provider diberi status LIVE VERIFIED berdasarkan tes sprint ini. Status historis partner pada register tidak diubah tanpa bukti baru.

## D. Demo end-to-end lokal

Jalankan dari repository:

```text
npm run dev:mvp-demo
```

Buka **http://127.0.0.1:5175/**. Server ini terpisah dari QA8790/5174, tidak memuat file environment, Supabase dinonaktifkan pada build demo, tidak memiliki Worker/proxy/backend bercredential. Semua `/api/` pada server demo mengembalikan unavailable; tanpa harga atau offer palsu. Untuk menghentikannya gunakan Ctrl+C pada terminal demo tersebut. Jangan deploy dist-mvp-demo sebagai aplikasi production.

Alur yang diuji: link TikTok → fallback upload → MP4 sintetis → tiga frame → fixture Wat Arun/Wat Pho → koreksi/seleksi/urut → tanggal/traveler → draft native → edit waktu → Simpan browser → full reload → muat demo → panel flight/hotel/transport/activity dengan parameter Bangkok yang sama → Wat Arun Tour Guide → narasi APIstub → pertanyaan sejarah/follow-up → English → Maps → Wat Pho → kembali.

Shortcut **Coba contoh demo lokal berlabel** tersedia tanpa file. Untuk jalur upload, gunakan video MP4/MOV/M4V kompatibel milik sendiri/berizin; fixture Bangkok tetap tidak mengklaim membaca isi video. Video sintetis pengujian: `artifacts/mvp-synthetic.mp4`.

## E. Bukti tes

| Pemeriksaan | Hasil dan jenis bukti |
|---|---|
| Tes integrasi video sebelum Tour Guide | 75 lulus; fixture model/network, validasi/frame/media nyata lokal |
| Tes akhir terarah, termasuk booking | **152 lulus,0gagal/skip**; `artifacts/mvp-sprint/final-targeted-tests.log` |
| Koreksi kurasi terakhir | **5 tes Guide lulus** setelah perbaikan alias katalog/foto tempat dan wording sekitar; subset terarah, bukan tambahan152tes unik. `artifacts/mvp-sprint/guide-final-tests.log` |
| TypeScript dan build demo akhir | **PASS**; `artifacts/mvp-sprint/build.log`, output `dist-mvp-demo/` |
| URL, redirect aman/inaccessible fallback | **PASS WITH FIXTURE**; live video TikTok **BLOCKED/UNVERIFIED** |
| Upload valid/corrupt/oversized, tiga frame | **PASS** browser lokal dengan MP4 sintetis; batas/format lain diuji unitfixture, MOV/Safari fisik belum diuji |
| Pengenalan/low confidence/manual/seleksi/urut | **PASS WITH FIXTURE**; koordinat tidak diambil dari klaim model |
| Editor native dan Save/reload browser | **PASS** lokal; persistensi database adapter **PASS WITH FIXTURE**, Supabase live **BLOCKED oleh scope** |
| Tour Guide ID/EN/Q&A/follow-up | **PASS WITH FIXTURE** pada browser dan unit |
| Play/pause/resume/stop/unsupported fallback | **PASS WITH FIXTURE** browser APIstub dan unit; audio fisik belum diverifikasi |
| Booking menu/search context/Maps | **PASS** UI/URL; offers dan completed booking tidak diverifikasi |
| Layout390px dan1280px | **PASS** browser; screenshot diperiksa. Perbaikan khusus modal menghapus clipping/transisi resize; tidak mengubah dialog lain |
| Isolasi | Browser mencatat0attempt request eksternal,0endpoint AI/ledger/payment,0pageerror. Build demo tidak memuat URL Supabase production/server-secret pattern yang diperiksa; SQL06 hash tetap |

Bukti browser: [hasil JSON](../artifacts/mvp-sprint/browser-results.json), [guide mobile](../artifacts/mvp-sprint/guide-mobile.png), [guide desktop](../artifacts/mvp-sprint/guide-desktop.png), [itinerary mobile](../artifacts/mvp-sprint/itinerary-mobile.png). Skrip browser selalu menutup browser dan server demo pada finally; tidak memulai ulang QA8790/5174.

Browser Chromium biasa gagal launch; Chromium headless lokal berhasil. Tes browser sempat menemukan salah penggunaan API skrip dan modal terpotong saat resize; keduanya diperbaiki dan alur akhir diulang hingga lulus. Fixture, simulasi API suara, dan adapter memori tidak diklaim sebagai Meta/supplier/RLS E2E nyata.

## F. Berkas yang berubah dalam sprint

| Berkas | Tujuan |
|---|---|
| app/video-itinerary.tsx | Demo gate lokal, upload alternatif, seleksi/urut/koreksi/konfirmasi |
| lib/video-itinerary.mjs dan .d.mts | Container kompatibel, katalog Bangkok, manualreview tanpa fakegeo, pemetaan airport/demo |
| worker/tiktok-reference.js | Redirect shortlink `/t/` dengan pembatas existing; source lokal saja |
| app/tour-guide.tsx, .css; lib/tour-guide.mjs, .d.mts | Konten referensi, Q&A, narasi, navigasi, modal responsif |
| app/item-booking.tsx | Entry Guide tanpa menghapus aksi booking |
| app/i18n/locales/video.json | Microcopy baru dua bahasa dan label format upload |
| app/mvp-demo.tsx, .css; mvp-demo.html; vite.mvp-demo.config.js | Demo terisolasi, native editor/search, Save browser berlabel |
| checks/mvp-video.test.mjs, mvp-persistence.test.mjs, tour-guide.test.mjs | Regresi fitur dan persistensi/auth memori |
| scripts/qa-mvp-browser.mjs | Acceptance lokal, network guard, screenshot desktop/mobile |
| package.json; .gitignore | Perintah demo/build/tes terarah; abaikan output build demo |
| Laporan baseline/akhir; docs/PROJECT_PROGRESS.md, NEXT_ACTIONS.md, DECISIONS.md, ARCHITECTURE.md | Hasil, batas bukti dan keputusan lokal |

Perubahan lama pada working tree tetap dipertahankan; daftar ini tidak mengklaim seluruh dirty tree dibuat sprint ini.

## G. Blocker material

- Ledger Meta tetap blocked; tidak direcover. Real recognition/discovery memerlukan penyelesaian gate keselamatan dan izin inferensi terpisah.
- Save akun/RLS dan supplier nyata belum diuji kembali; scope melarang perubahan Supabase/transaksi. Demo browser bukan pengganti verifikasi ini.
- Tour Guide generatif live dan voice fisik/perangkat lain belum diverifikasi; kurasi faktual saat ini hanya dua lokasi Bangkok.
- TikTok direct-video masih bergantung akses platform; jalur upload merupakan alternatif yang bekerja. Tidak ada bypass/download otomatis.
- Tidak ada deployment, commit/push atau submission hackathon dalam otorisasi sprint ini.

## H. Satu tindakan berikutnya

**Owner menjalankan `npm run dev:mvp-demo` dan meninjau alur Bangkok di port5175.** Setelah review, keputusan akses nyata Meta/QA dibuat terpisah; laporan ini tidak memberi izin pemulihan ledger atau inferensi.

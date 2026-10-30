# Laporan pekerjaan Tahap 2, Tahap 2B, dan penggunaan API

Tanggal: 27 Oktober 2026 · Asia/Jakarta  
Branch: `codex/meta-hackathon-phase-2-2026`  
Baseline commit: `737fbc5636145fc27a0bf4ac41be831835dfbd44`

## Ringkasan untuk owner

SortTrip Assistant sudah diperluas secara lokal agar perintah perjalanan, caption, preferensi, dan lampiran dapat digunakan bersamaan. Tahap 2B menambahkan pemrosesan frame video lokal, adapter Meta, pengamanan anggaran, dan lingkungan QA terpisah.

**Tahap 2 dan 2B belum selesai secara end-to-end.** Login QA dan akses metadata model Meta nyata berhasil; pengujian database anggaran beserta pemulihan saldo juga berhasil berdasarkan screenshot owner. Belum ada inferensi Meta nyata, hasil Meta yang disimpan sebagai itinerary, atau pengujian isolasi itinerary dua akun. Integrasi baru ini belum dirilis ke website production.

Dokumen ini menjadi ringkasan terbaru dan memperbarui keterangan historis pada laporan sebelumnya tentang environment yang belum tersedia, batas USD5, serta belum adanya akses Meta sama sekali. Laporan lama tetap menjadi catatan checkpoint.

## 1. Pekerjaan Tahap 2

| Pekerjaan | Hasil | Batas verifikasi |
|---|---|---|
| Assistant terpadu | Perintah utama, caption/preferensi, dan sumber lampiran dapat digunakan bersama | Implementasi dan QA lokal; bukan bukti hasil model nyata |
| Input sumber | URL sosial, video MP4 lokal, dan transkrip pengguna disiapkan dalam alur Assistant | URL sosial belum diunduh atau dianalisis |
| Penjelasan lampiran | Keterangan melalui ikon informasi dan panel pop-up | Tidak membuka deretan kolom tambahan |
| Panel informasi umum | Komponen informasi dan penjelasan Trip Pass diselaraskan ke panel | Interaksi terkait sudah diuji pada checkpoint UI; seluruh fitur production tidak diuji ulang |
| Kandidat destinasi | Schema, validasi, bukti sumber, dan peninjauan sebelum dipakai | AI tidak dianggap sumber harga/koordinat terverifikasi |
| Draft itinerary | Konversi kandidat yang ditinjau menjadi draft yang dapat diedit tersedia di source/fixture | Rantai Meta nyata → draft → Save belum teruji |
| Bahasa | Dukungan ID/EN dan microcopy terkait lampiran | Scanner bukan bukti seluruh terjemahan dinamis selalu benar |

## 2. Pekerjaan Tahap 2B

### Pemrosesan video

- Browser benar-benar menghasilkan tiga frame JPEG dari klip QA sintetis pada sampel 15%, 50%, dan 85% durasi.
- Batas input video: maksimal 4 MiB dan 60 detik; validasi durasi/dimensi, timeout, pembatalan, dan pembersihan resource tersedia.
- Frame diperkecil hingga sisi maksimal 320 px dan dibatasi ukurannya. Server memeriksa format, jumlah, ukuran, dimensi header, serta timestamp.
- Helper FFmpeg offline berhasil mengekstrak frame dan audio dari fixture. Audio tersebut belum dihubungkan ke aplikasi/Meta dan bukan ASR otomatis.
- Adapter frame hanya mengirim gambar pilihan dan teks yang diberikan pengguna. Tidak mengklaim memahami seluruh video atau mendengar audio.
- Raw MP4 tidak diteruskan ke Meta melalui jalur aplikasi saat ini. Unduhan TikTok/Reels/Shorts dan analisis audio/video penuh belum diimplementasikan.

### Destinasi dan itinerary

Katalog mencakup lima identitas lokasi dengan snapshot sumber publik: dua museum Kuala Lumpur, Hoan Kiem di Hanoi, Merlion di Singapura, dan Borobudur di Magelang. Pencocokan memakai nama/kota/negara dan alias yang tidak ambigu. Koordinat diambil dari katalog, bukan diterima sebagai fakta dari model.

Snapshot identitas tidak membuktikan tarif masuk, jam buka, kondisi rute, atau ketersediaan reservasi. Harga komersial harus tetap berasal dari sumber mitra yang sesuai. Alur review dan konversi draft telah diuji dengan fixture; bukti Meta nyata dan database Save masih diperlukan.

### Lingkungan QA terpisah

| Komponen | Konfigurasi yang disiapkan |
|---|---|
| Frontend QA | `http://127.0.0.1:5174`, konfigurasi Vite tersendiri |
| Worker QA | `http://127.0.0.1:8790`, localhost saja |
| Supabase QA | Proyek `aytrcvfncsklhqozreyk`, terpisah dari pelanggan production |
| Login | Owner login sendiri; status login diperiksa melalui UI dan reload |
| Secret | Dipasang privat oleh owner; nilai tidak dibaca atau dicatat agent |
| Isolasi endpoint | Entry QA tidak menyediakan endpoint booking, pembayaran, atau planner umum |
| Aktivasi inferensi | Flag analisis, frame, dan budget readiness masih `false` pada konfigurasi terakhir |

Environment QA tidak menggantikan website online. Tidak ada perubahan credential atau pengaturan pembayaran production untuk pekerjaan ini.

## 3. Penggunaan API Meta: aktual versus yang disiapkan

| API/alur | Penggunaan aktual | Status |
|---|---|---|
| Supabase Auth QA | Login owner dan pemeriksaan user oleh backend | Berhasil; tidak ada nilai session/credential dicatat |
| Meta `GET /v1/models/muse-spark-1.3` | Request metadata autentikasi melalui backend QA | HTTP200 dan model sesuai, terverifikasi melalui UI |
| Meta `POST /v1/responses/input_tokens` | Belum dipanggil nyata | Implementasi dan mock tersedia |
| Meta `POST /v1/responses` | Belum dipanggil nyata | Belum ada output inferensi atau usage aktual |
| Meta Files/upload media remote | Tidak digunakan | Belum ada lifecycle upload/delete remote |
| SQL reserve/settle budget | Owner menjalankan probe langsung di SQL Editor QA | Sembilan pemeriksaan lulus; bukan bukti RPC runtime Worker |
| Save itinerary dan RLS dua akun | Belum diuji nyata untuk fitur ini | Masih terbuka |

Model target adalah `muse-spark-1.3`; bukan varian `-contributor`. Akses metadata tidak menjamin entitlement inferensi, hasil model, atau ketentuan privasi akun. Jumlah total request metadata selama diagnosis tidak dihitung dalam laporan ini; tidak diklaim hanya satu request.

### Kredit dan privasi

Screenshot owner menunjukkan **free credits USD150 aktif**, outstanding balance **Rp0**. Layar yang sama menyatakan konten selama memakai kredit gratis dapat digunakan untuk peningkatan produk. Karena itu, nama model Standard saja belum membuktikan ketentuan tanpa penggunaan data untuk akun kredit tersebut.

Uji awal harus memakai teks sintetis tanpa data pelanggan. Tidak ada perubahan pilihan kredit, billing, atau persetujuan privasi dilakukan agent. Kredit USD150 bukan izin menghabiskan seluruhnya dan bukan pembatas biaya teknis aplikasi.

### Tarif dan batas request

Dokumentasi [pricing resmi Meta](https://dev.meta.ai/docs/pricing-rate-limits) yang diperiksa pada 27 Oktober 2026 mencantumkan Spark Standard USD1,25 per satu juta input token dan USD4,25 per satu juta output token. Adapter memakai nilai ini untuk perkiraan, bukan laporan tagihan aktual.

Adapter membatasi maksimal 20.000 input token dan 2.000 output token; perkiraan batas inferensi pada tarif tersebut adalah USD0,0335, sebelum ketidakpastian biaya endpoint lain. Alokasi konservatif per request USD0,05 dipertahankan. Biaya serta perilaku token-count nyata pada akun masih perlu diverifikasi sebelum aktivasi. Tidak ada tool web search, retry otomatis, atau fallback provider pada adapter ini.

**Penggunaan token dan biaya inferensi aktual belum ada**, karena belum ada generasi Meta yang dijalankan. Saldo ledger USD0 adalah alokasi aplikasi, bukan rekonsiliasi tagihan seluruh akun Meta.

## 4. Pengamanan budget dan bukti database

Owner mengizinkan **maksimum kumulatif pengujian USD10**, menggantikan batas awal USD5. Setiap request mengalokasikan USD0,05 sebelum keluar ke provider; alokasi tidak dikembalikan jika timeout atau usage belum pasti. Maksimal sepuluh alokasi per user dan penolakan request aktif kedua tersedia. Ledger memakai row lock global; usage di atas batas rencana menghentikan reservasi berikutnya.

Owner menerapkan SQL pada Supabase QA dan mengirim bukti RLS/privilege: anon/authenticated tidak dapat membaca ledger atau mengeksekusi reserve/settle; service role dapat mengeksekusi fungsi. Ini berbeda dari RLS itinerary dua akun yang masih belum diuji.

Seluruh hasil probe owner berikut bernilai **true**:

1. `database_constraint_denies_above_10`
2. `exhausted_budget_denied`
3. `last_allocation_reaches_10`
4. `reservation_allowed`
5. `reservation_function_contains_row_lock`
6. `second_active_request_denied`
7. `settlement_does_not_refund`
8. `single_allocation_is_005_usd`
9. `unexpected_usage_halts_requests`

Pemeriksaan setelah rollback menunjukkan allocated **0.000000**, remaining **10.000000**, blocked **false**. Dengan demikian perubahan sementara probe berhasil dipulihkan berdasarkan bukti owner.

Probe bersifat sequential. Pemeriksaan row lock membaca definisi fungsi; belum membuktikan dua sesi paralel sungguhan. Cap hanya mengendalikan jalur adapter SortTrip ini, bukan penggunaan key oleh aplikasi lain atau seluruh akun Meta.

## 5. Masalah yang diperbaiki

Runtime Cloudflare menolak opsi fetch `redirect: 'error'`, sehingga pemeriksaan pertama gagal sebelum autentikasi QA keluar dari Worker. Fetch terkait Meta, auth QA, dan RPC budget diubah ke `redirect: 'manual'`, tetap menolak respons non-2xx dan tidak mengikuti redirect. Regresi redirect ditambahkan untuk memastikan credential tidak diteruskan ke tujuan lain.

Setelah perbaikan, metadata Meta berhasil diakses. Masalah tersebut merupakan kompatibilitas runtime, bukan bukti API key owner salah. Tidak perlu membuat ulang proyek atau mengganti key akibat kegagalan itu.

## 6. Hasil QA terakhir yang tercatat

| Pemeriksaan | Hasil |
|---|---|
| Suite penuh | 407 lulus, 0 gagal, 0 dilewati |
| TypeScript dan Vite build | Lulus; peringatan bundle >500 kB masih ada |
| Scanner lokalisasi | 1.603 key, 0 error, 0 literal JSX belum diterjemahkan yang terdeteksi |
| Browser pemrosesan frame | Berhasil dari klip sintetis lokal; ID/EN dan tampilan ponsel diperiksa pada checkpoint terkait |
| Login QA dan metadata Meta | Berhasil pada UI aktual |
| Probe budget dan rollback | Lulus berdasarkan screenshot owner |
| Inferensi nyata dan Save/RLS | Belum diuji |

Angka tersebut berasal dari log pengujian terakhir sebelum laporan ini; suite tidak dijalankan ulang untuk perubahan dokumentasi saja.

Bukti lokal:

- `qa-reports/meta-budget-10/full-tests.log`
- `qa-reports/meta-budget-10/access-build.log`
- `qa-reports/meta-budget-10/access-i18n.json`
- `qa-reports/meta-budget-10/qa-model-access-success.png`
- `docs/hackathon-2026/phase-2/evidence/phase-2b/` untuk media dan browser pada checkpoint sebelumnya.
- Screenshot owner di percakapan untuk billing, sembilan hasil SQL, dan pemulihan saldo; tidak diklaim sebagai pengujian database yang dijalankan agent.

## 7. Pekerjaan yang belum tuntas

1. Verifikasi concurrency dua sesi database dan pemanggilan ledger melalui runtime Worker QA.
2. Selesaikan verifikasi biaya token-count, lalu jalankan satu inferensi teks sintetis terbatas dan periksa output, latensi, usage serta settlement. Jangan melakukan retry otomatis pada kegagalan yang mungkin sudah ditagih.
3. Uji frame berizin dengan bukti visual yang jujur; audio dan video penuh tetap pekerjaan terpisah.
4. Lengkapi dan uji rantai hasil Meta → review → draft itinerary editable. Entry QA saat ini tidak mengekspos planner umum, sehingga rantai live belum tersedia penuh.
5. Uji Save/reload dengan dua akun QA dan penolakan SELECT/UPDATE/DELETE lintas akun serta guest.
6. QA ulang interaksi fitur terkait pada environment yang sudah lengkap, termasuk keadaan loading, pembatalan, error, dan bahasa.
7. Setelah acceptance terpenuhi, siapkan review rilis tersendiri. Demo end-to-end dan Phase 3 belum siap.

## 8. Status rilis

**Status keseluruhan: PARTIAL / pengembangan dan QA lokal.** Akses API metadata nyata sudah tersambung; analisis Meta belum aktif untuk pengguna website production. Perubahan Tahap 2/2B tetap belum di-commit, di-push, atau di-deploy. Laporan ini tidak mengaktifkan inferensi, mengubah secret/billing, atau melakukan pembayaran/booking.

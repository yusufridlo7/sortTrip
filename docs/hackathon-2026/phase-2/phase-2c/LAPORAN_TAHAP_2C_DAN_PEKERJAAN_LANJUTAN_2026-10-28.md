# Laporan Tahap 2C dan Pekerjaan Lanjutan SortTrip

**Proyek:** SortTrip AI Travel Agent 2.0  
**Periode:** 27–28 Oktober 2026, Asia/Jakarta  
**Tanggal laporan:** 28 Oktober 2026  
**Lingkungan utama:** lokal nonproduction dan Supabase QA terpisah  
**Status:** implementasi dan pengujian sebagian telah selesai; belum dinyatakan siap production secara menyeluruh.

Laporan ini menggabungkan hasil Tahap 2C, perbaikan video/link, pencarian tujuan, pengaturan budget, serta alur Assistant terbaru. Catatan pengujian lama dipertahankan sebagai bukti historis, bukan dianggap sebagai kondisi runtime terkini.

## 1. Ringkasan pekerjaan

Tahap 2C membuktikan alur **referensi teks → Meta → review tempat → draft itinerary → edit → Save → reload** pada database QA. Pengujian dua akun juga membuktikan isolasi data itinerary melalui RLS. Analisis frame sintetis berhasil diproses Meta dengan hasil kosong yang sesuai isi gambar.

Pekerjaan setelahnya memperbaiki error 413 pada upload frame, menerima format link vt, menyederhanakan lampiran, memperbaiki autocomplete dan pencarian Hanoi, serta mengubah default budget dan durasi menjadi bebas. Alur terbaru memisahkan prompt AI dari pencarian tiket biasa dan menyiapkan pilihan tujuan/budget yang dapat dibuka menjadi itinerary editable.

**Verifikasi kode terakhir:** 454 tes lulus, tanpa gagal atau skip; TypeScript/build berhasil; pemeriksaan lokalisasi otomatis mencakup 1.669 kunci tanpa error atau literal JSX tak diterjemahkan yang terdeteksi. Jumlah ini adalah satu suite terakhir, bukan penjumlahan seluruh checkpoint tes.

**Batas penting:** pengujian terbaru belum membuktikan keberhasilan nyata alur prompt → Meta → itinerary dengan harga lengkap. Percobaan terakhir menerima429. Owner meminta pengaturan kuota ditunda; batas tidak diubah dan saldo tidak direset. Tidak ada commit, push, deployment, perubahan credential, booking atau pembayaran untuk rangkaian pekerjaan yang dirangkum di sini.

## 2. Hasil Tahap 2C

| Bagian | Pekerjaan dan hasil | Jenis bukti |
|---|---|---|
| HTTP 403 database anggaran | Didiagnosis sebagai masalah izin baca. Owner menerapkan SELECT khusus server; pembacaan Worker kemudian berhasil. | Respons aktual QA setelah perubahan owner |
| Konkurensi anggaran | Skrip dua sesi diperbaiki agar membuktikan eksekusi bersamaan dan penguncian baris. Hasil awal B=false tidak dihitung lulus; versi perbaikan dilaporkan true oleh owner. | Hasil SQL owner |
| Reserve/settle | Diagnostik Worker memperoleh alokasiUSD 0,05 dan mencatat penyelesaian tanpa inferensi. | Runtime dan ledger QA |
| Inferensi teks | Meta `muse-spark-1.3` menghasilkan kandidat Muzium Negara dan Islamic Arts Museum Malaysia. | HTTP 200 nyata |
| Integrasi itinerary | Kandidat yang ditinjau memakai struktur Trip dan editor yang sudah ada, bukan sistem penyimpanan kedua. | Browser nyata QA |
| Save dan reload | Setelah owner membuat tabel trips yang sebelumnya belum ada, draft dapat diedit, disimpan, dimuat ulang dan dibuka dari daftar perjalanan. | Browser dan pengambilan data QA |
| Isolasi pengguna | Pengujian langsung akun A/B/anonim membuktikan perlindungan data trips. | Permintaan API pengguna biasa |
| Frame video | Tiga frame sintetis diterima model; nol kandidat merupakan hasil benar untuk media tanpa destinasi. | HTTP 200 nyata; bukan uji positif pengenalan tempat |

Draft yang tersimpan mempertahankan preferensi perjalanan, termasuk permintaan hotel. Penyimpanan preferensi **tidak membuktikan** hotel, tarif, jadwal atau seluruh koneksi transportasinya sudah ditemukan dan memenuhi permintaan.

### RLS dua akun

RLS atau **Row Level Security** membatasi baris database yang boleh diakses setiap pengguna. Pengujian dilakukan pada data uji, dengan dua sesi pengguna berbeda, menargetkan ID data langsung tanpa filter pemilik tambahan yang dapat menyamarkan kegagalan keamanan.

- Kedua pemilik berhasil membuat, membaca dan memperbarui data sendiri.
- Pembacaan anonim ditolak.
- Pembacaan dan pembaruan silang A↔B tidak mengembalikan atau mengubah baris.
- Insert dengan pemilik akun lain ditolak.
- Percobaan DELETE ditolak oleh izin tabel; ini bukan bukti policy DELETE tersendiri.
- Kedua data pemilik tetap utuh setelah percobaan.

Kegagalan pembanding awal akibat urutan kunci objek `jsonb` diperbaiki pada alat uji, kemudian pengujian aktual diulang. Tidak ditemukan akses lintas akun yang berhasil. Hasil ini berlaku untuk tabel trips di QA saat diuji, bukan sertifikasi seluruh database atau production.

## 3. Pekerjaan setelah Tahap 2C

### A. Upload video dan error HTTP 413/503

Penyebab yang dapat direproduksi adalah batas JSON16KB ketika frame nonaktif, padahal tiga JPEG yang valid dapat melampauinya. Batas transport dipisahkan dari flag aktivasi menjadi240.000 byte. Batas isi media tetap berlaku: MP4 maksimal 4MiB/60 detik, tiga frame JPEG kecil, dan teks/perintah yang dibatasi.

Payload terlalu besar tetap ditolak413; model/frame nonaktif kini ditolak503 dengan kategori yang sesuai. Klien memeriksa ukuran sebelum mengirim dan menangani respons proxy non-JSON secara aman. Batas file tidak dinaikkan untuk menyembunyikan masalah.

Kontrol reasoning rendah ditambahkan untuk ekstraksi singkat, dengan token-count sebelum inferensi dan tanpa retry otomatis. Diagnostik QA dibatasi pada kode/tahap validasi dan penggunaan token; tidak menampilkan credential atau teks respons model mentah.

### B. Link vt dan alur lampiran

Format pendek `vt.tiktok.com`/`vm.tiktok.com` diterima dengan validasi host/path dan penghapusan query pelacakan. Pengguna dapat memakai link sebagai inspirasi bersama perintah, tanpa harus mengunduh video terlebih dahulu. Caption/transkrip tambahan tetap tersedia sebagai opsi.

Handoff mempertahankan perintah, budget, durasi dan jumlah pelancong. Referensi identik tidak ditambahkan berulang, dan teks yang terlalu panjang tidak dipotong diam-diam. Menambahkan link pada itinerary lama tidak langsung mengganti item perjalanan.

Pada pengembangan awal, teks link hanya diteruskan sebagai referensi. Pengembangan terbaru menambahkan pembacaan metadata publik oEmbed yang dibatasi host, redirect, waktu dan ukuran respons. Ini **bukan pengunduhan atau pembacaan video/audio**.

Uji link owner terbaru menghasilkan redirect301 dan respons oEmbed200, tetapi **tanpa title/caption yang bisa dipakai**. Jika tujuan disebut dalam perintah, tujuan itu dapat menjadi dasar perencanaan; link tanpa informasi tujuan yang terbaca masih memerlukan klarifikasi. Tidak memakai bypass login/CAPTCHA, cookie pengguna, scraping HTML sebagai cadangan, atau proxy media pihak ketiga.

### C. Tujuan kosong dan pencarian Hanoi

Worker QA semula tidak menyediakan endpoint autocomplete maupun pencarian tiket. Katalog lokasi yang sudah ada dipakai bersama oleh Worker utama dan QA. Resolver teks dibatasi agar tidak menganggap URL, kota asal, negasi sederhana, atau kata umum seperti “malam” sebagai tujuan.

QA mendapat jalur baca-saja ke endpoint tiket publik SortTrip yang tetap. Hanya parameter pencarian yang diizinkan diteruskan; tidak meneruskan credential, header akun, cookie atau prompt ke production. Ini bukan proxy umum ke booking/pembayaran.

Uji nyata berhasil menampilkan autocomplete Hanoi/HAN dan hasil **CGK–HAN pulang-pergi,7–11November2026,5 hari/4 malam, Rp 5.314.916 per dewasa** pada saat diuji. Harga indikatif tersebut tidak dianggap paket lengkap, jaminan tersedia, atau memenuhi budget contohRp 4.500.000.

Resolver katalog ini adalah tahap perbaikan pencarian, bukan bukti pemahaman AI. Keputusan produk terbaru menempatkan prompt pada alur Assistant tersendiri.

### D. Budget dan durasi bebas

- Default budget menjadi **Berapa pun · bebas**, tanpa nominal contoh yang diwajibkan.
- Opsi **Tentukan batas** menerima nominal positif tanpa kelipatanRp 50.000, tetap dengan batas validasi numerik.
- Default durasi menjadi bebas; pilihan eksplisit/preset tetap dipertahankan.
- Nilai internal0 berarti tidak ada batas maksimum, bukan perjalanan gratis.
- Hasil pencarian kembali diurutkan berdasarkan harga tiket termurah yang tersedia. Filter kesesuaian budget tidak ditampilkan jika tidak ada batas.
- Biaya yang belum diketahui tetap belum diketahui; tidak dihitung sebagai bukti perjalanan lengkap termurah.

Uji nyata pencarian bebas menampilkan delapan negara: Indonesia, Malaysia, Singapura, Brunei, Vietnam, Thailand, Filipina dan Kamboja. Holiday estimate lama tetap tersedia jika komponen datanya ada; jika tidak, ketidaklengkapan biaya ditampilkan.

### E. Prompt → pilihan tujuan/budget → itinerary

Perubahan lokal terbaru memisahkan dua jalur:

| Input | Perilaku yang diimplementasikan |
|---|---|
| Tanpa prompt | Pencarian tiket publik; pilihan negara → kota/tanggal → penerbangan, dengan estimasi liburan yang tersedia |
| Ada prompt | Pemeriksaan akses Assistant, perencanaan Meta, pengambilan harga tersedia, lalu kartu pilihan itinerary |
| AI meminta klarifikasi/gagal | Tidak diam-diam kembali ke hasil semua negara |
| Pilihan itinerary diklik | Membuka draft editable yang sudah dibentuk, tanpa panggilan model kedua |

Kontrak model mendukung permintaan tingkat negara seperti Vietnam, hingga dua pilihan, validasi bandara dari katalog, nama kota beraksen, serta kewajiban cakupan hari dan malam. Harga, hotel spesifik, ketersediaan dan koordinat tidak boleh dibuat-buat oleh model.

Status proses mencerminkan pemeriksaan akses, penyusunan itinerary dan pemeriksaan harga. Harga tiket diambil melalui jalur yang sudah ada. Referensi minimum hotel kota terbaru dapat digunakan untuk seluruh malam dengan asumsi dua dewasa per kamar; referensi Hanoi tidak dipakai untuk mengisi malam di Sapa. Harga tidak tersedia, kedaluwarsa atau tidak sebanding tetap ditandai belum diketahui.

Untuk peta tanpa koordinat, tampilan dunia kosong diganti keterangan pemeriksaan rute. Tautan lokasi/koneksi Google Maps tetap tersedia dan nama kota tidak ditambahkan dua kali.

**Status penerimaan:** alur komponen dan perhitungan telah diuji dengan simulasi berlabel. Keberhasilan baru melalui model nyata dan harga perjalanan lengkap belum terbukti.

## 4. Penggunaan API dan bukti inferensi

| Pengujian | Hasil | Input/output token | Estimasi penggunaan model |
|---|---|---:|---:|
| Teks dua museum Kuala Lumpur, Tahap 2C | HTTP 200 | 405 /1.341 | USD 0,00620550 |
| Tiga frame sintetis, Tahap 2C | HTTP 200; nol destinasi sesuai media | 685 /767 | USD 0,00411600 |
| Caption vt, percobaan awal lanjutan | HTTP 502; output tidak tervalidasi | Tidak terekam pada UI | Tidak disimpulkan dari token yang tidak tersedia |
| Caption vt setelah perbaikan kontrol request | HTTP 200; Sapa/Hanoi dari teks yang diberikan | 401 /1.151 | USD 0,00539300 |
| MP4 sintetis, frame hasil upload lanjutan | HTTP 200; nol destinasi sesuai media | 673 /386 | USD 0,00248175 |
| Discovery itinerary terbaru | Belum berhasil diverifikasi; percobaan terakhir429 `BUDGET_EXHAUSTED` | Tidak tersedia untuk hasil berhasil | Tidak menyatakan biaya akhir atau saldo terkini |

Caption pada pengujian berhasil diberikan sebagai teks; hasil tersebut tidak membuktikan backend membaca isi video TikTok. Kandidat Sapa/Hanoi pada ekstraktor lama belum memenuhi syarat verifikasi tempat/satu kota, sehingga tidak dipaksakan menjadi itinerary.

Selain inferensi, terdapat panggilan autentikasi, metadata model, token-count dan ledger. Jumlah request ledger tidak sama dengan jumlah seluruh HTTP call.

### Checkpoint anggaran

Batas kumulatif uji Meta yang disetujui owner adalah **USD 10**. Reservasi konservatifUSD 0,05 per request berbeda dari biaya model yang diperkirakan dan tagihan final provider.

| Checkpoint owner | Alokasi | Sisa alokasi | Request settled/unsettled | Penggunaan model diketahui, estimasi |
|---|---:|---:|---:|---:|
| Setelah teks/diagnostik awal | USD 0,10 | USD 9,90 | 2 /0 | USD 0,00620550 |
| Setelah frame Tahap 2C | USD 0,15 | USD 9,85 | 3 /0 | USD 0,01032150 |
| Setelah rangkaian caption/upload lanjutan | USD 0,30 | USD 9,70 | 6 /0 | USD 0,02719750 |

**USD 9,70 adalah checkpoint terakhir yang dikonfirmasi owner, bukan saldo terkini setelah semua percobaan berikutnya.** Selisih estimasi pada request gagal berasal dari agregat ledger, bukan rekaman token UI request tersebut. HTTP 429 terbaru tidak membuktikan bahwa seluruh USD 10 telah habis; pembatas yang tepat dan saldo final belum direkonsiliasi. Tidak ada reset/refund alokasi atau peningkatan batas dalam pekerjaan ini.

Pada akhir uji tertentu flag QA sempat dikembalikan nonaktif. Instruksi owner berikutnya mengaktifkan kembali penggunaan QA interaktif. Catatan pemulihan flag lama tidak boleh dibaca sebagai status terbaru; tidak dilakukan aktivasi Meta production.

## 5. QA dan konsistensi budget

| Checkpoint | Jumlah tes lulus | Cakupan utama |
|---|---:|---|
| Tahap 2C | 419 | Meta teks/frame, draft, Save/reload, RLS |
| Upload dan link vt | 425 | Batas payload, URL, consent, diagnostik |
| Inspirasi link | 429 | Preservasi perintah dan handoff lampiran |
| Tujuan/pencarian | 434 | Autocomplete, resolver dan jalur tiket publik |
| Budget bebas | 435 | Validasi budget dan kebijakan biaya tidak diketahui |
| Discovery terbaru | **454** | Tambahan19 tes discovery, akses produk, isolasi QA dan metadata TikTok |

Seluruh checkpoint di atas mencatat nol gagal/skip. Build dan pemeriksaan bahasa berhasil pada checkpoint masing-masing. Scanner terakhir1.669 kunci tidak menyertifikasi kualitas semua teks AI dinamis atau seluruh perangkat mobile.

Pengujian browser terbaru memakai komponen asli FlightSearch, AssistantDiscovery dan WorldPlanner pada halaman **SIMULATED QA** yang terpisah dari build production:

- Satu prompt menghasilkan kartu Hanoi; tombol pembuka menampilkan itinerary editable. Counter simulasi tetap satu analisis dan satu pencarian tiket setelah pilihan dibuka.
- **Satu orang:** tiket simulasiRp 2.500.000 + Rp 300.000 ×4 malam = subtotalRp 3.700.000. Kartu dan itinerary konsisten.
- **Tiga orang:** tiketRp 7.500.000 + dua kamar ×Rp 300.000 ×4 malam = totalRp 9.900.000, atauRp 3.300.000 per orang.
- Empat interval tanggal menginap muncul; asumsi dua dewasa per kamar dijelaskan dan bukan bukti kapasitas kamar supplier.
- Panel rute dan detail koneksi dapat dibuka; URL Google Maps diperiksa tanpa memanggil pencarian rute berbayar atau melakukan transaksi.
- Mode Indonesia/Inggris diperiksa dan tidak ditemukan overflow horizontal pada viewport desktop yang digunakan.

Harga simulasi tersebut bukan penawaran supplier. Pengujian tiket tanpa prompt secara terpisah menggunakan respons publik nyata dan menghasilkan delapan negara. Tidak ada Save, booking atau pembayaran pada rangkaian simulasi terbaru.

## 6. Pekerjaan tertunda dan batas kesiapan

| Bagian | Status akhir laporan |
|---|---|
| Teks → Meta → review → Save/reload | Terverifikasi nyata pada Tahap 2C di QA |
| RLS trips dua akun/anonim | Terverifikasi nyata pada konfigurasi QA saat diuji |
| Ekstraksi frame sintetis | Terverifikasi nyata; bukan bukti identifikasi tempat perjalanan |
| Upload413, autocomplete, budget/durasi bebas | Diperbaiki lokal dan diuji |
| Pencarian tiket tanpa prompt | Respons publik nyata diverifikasi |
| Kartu tujuan/budget → itinerary | Implementasi lokal dan simulasi UI lolos |
| Prompt baru → Meta → itinerary berharga lengkap | Belum lolos penerimaan nyata; terakhir429 |
| Membaca isi video otomatis dari link TikTok | Belum tersedia; oEmbed aktual tidak memberi caption yang dapat dipakai |
| Pengenalan tempat positif dari video perjalanan berizin | Belum terbukti pada pengujian ini |
| Video penuh/ASR audio otomatis | Belum diimplementasikan dalam alur ini |
| Tarif hotel sesuai tanggal dan semua koneksi/tiket wisata | Belum terverifikasi menyeluruh untuk hasil discovery terbaru |
| Langganan/kuota QA | Lima komponen database yang diperiksa owner belum ada; pengaturan ditunda atas instruksi owner |
| Production, mobile menyeluruh dan kesiapan Tahap 3 | Belum disertifikasi oleh laporan ini |

Lima komponen yang belum ada di QA adalah tabel trip_passes, tabel ai_request_reservations, reserve_ai_request, finish_ai_request dan reserve_paid_ai_request. Ini **bukan bukti langganan production owner hilang**. Database dan identitas QA tidak otomatis memakai hak langganan production.

Skrip kesiapan/setup/test-pass telah disiapkan sebagai sumber, tetapi tidak diterapkan. Owner meminta kuota ditinggalkan dahulu; laporan ini tidak meminta pemasangan schema, pembuatan langganan baru, pembelian ulang atau peningkatan batas.

Alat preview discovery QA dibatasi localhost, proyek QA tetap, autentikasi, rate limit dan ledger Meta yang sudah ada. Alat ini berlabel QA dan tidak menjadi fallback otomatis untuk melewati langganan pada jalur produk. Ekstraksi Meta tetap dibatasi nonproduction. Jalur tiket publik baca-saja tidak membuka akses transaksi production.

## 7. Artefak dan referensi

Laporan detail:

- [Laporan Tahap 2C sebelumnya](LAPORAN_PEKERJAAN_TAHAP_2C.md).
- [RLS dua akun](SUPABASE_RLS_QA.md), [inferensi teks](META_LIVE_INFERENCE.md), [frame](VIDEO_FRAME_ANALYSIS.md), [Save/reload](ITINERARY_END_TO_END.md).
- [Perbaikan upload dan vt](../../../../qa-reports/VIDEO_UPLOAD_VT_FIX_2026-10-28.md).
- [Riset akses TikTok](../../../../qa-reports/TIKTOK_ACCESS_RESEARCH_2026-10-28.md).
- [Alur inspirasi link](../../../../qa-reports/LINK_INSPIRATION_UX_2026-10-28.md).
- [Tujuan dan pencarian Hanoi](../../../../qa-reports/DESTINATION_SEARCH_FIX_2026-10-28.md).
- [Budget bebas](../../../../qa-reports/FREE_BUDGET_QA_2026-10-28.md).
- [Discovery dan QA terbaru](../../../../qa-reports/ASSISTANT_PROMPT_DISCOVERY_QA_2026-10-28.md).

Bukti utama:

- [RLS nyata](evidence/rls-two-accounts-live.json), [hasil Meta teks](evidence/meta-text-live-result.json), [hasil frame](evidence/meta-frames-live-result.json).
- [Checkpoint ledger owner](../../../../artifacts/video-fix-ledger-owner.json), [metadata TikTok aktual](../../../../artifacts/assistant-tiktok-public-check.json).
- [Regresi454 tes](../../../../artifacts/assistant-discovery-full-tests.log), [build](../../../../artifacts/assistant-discovery-build.log), [pemeriksaan bahasa](../../../../artifacts/assistant-discovery-i18n.json).
- [Pencarian tiket nyata tanpa prompt](../../../../artifacts/assistant-discovery-free-search-live.json).
- [Screenshot kartu—simulasi](../../../../artifacts/assistant-discovery-cards-simulated.png), [screenshot rute—simulasi](../../../../artifacts/assistant-discovery-route-simulated.png).

## 8. Urutan kelanjutan ketika lingkup dibuka kembali

1. Pertahankan keputusan owner untuk menunda kuota; jangan mengubah credential, grant atau alokasi hanya demi memperoleh hasil tes lulus.
2. Ketika uji Meta nyata diizinkan dan pembatasnya memungkinkan, verifikasi prompt → tujuan yang relevan → pilihan budget → itinerary, termasuk permintaan multikota, kelengkapan biaya dan konsistensi tanggal.
3. Uji video perjalanan berizin sebagai kasus positif, dengan bukti tempat yang bisa ditinjau. Bedakan hasil visual, caption dan teks pengguna.
4. Verifikasi tarif hotel per tanggal, sambungan transportasi dan admission; jangan mengganti unknown dengan angka tebakan.
5. Lengkapi penerimaan mobile dan rencana rilis tersendiri sebelum menyatakan production-ready. Commit/push/deploy memerlukan instruksi owner sesuai aturan proyek.

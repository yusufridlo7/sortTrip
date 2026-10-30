# Laporan Pekerjaan Tahap 2C dan Verifikasi Terbaru

**Laporan gabungan terbaru,28Oktober2026:** lihat [Tahap2C dan pekerjaan lanjutan](LAPORAN_TAHAP_2C_DAN_PEKERJAAN_LANJUTAN_2026-10-28.md). Dokumen di bawah menyimpan checkpoint historis; angka saldoUSD9,70 bukan saldo terkini setelah percobaan discovery berikutnya. Suite terakhir454tes lulus; pengaturan kuota ditunda owner dan uji discovery nyata terakhir429.

**Pembaruan 28 Oktober 2026:** perbaikan413/tautan vt dan tiga percobaan Meta tambahan dijelaskan pada `qa-reports/VIDEO_UPLOAD_VT_FIX_2026-10-28.md` di root repository. Checkpoint terbaru:425tes lulus; alokasiUSD0,30/sisaUSD9,70;6settled/0unsettled; estimasi penggunaan kumulatifUSD0,02719750. Angka27Oktober di bawah tetap merupakan checkpoint historis. Penerimaan tautan pendek bukan analisis video URL otomatis.

**Proyek:** SortTrip AI Travel Agent 2.0  
**Tanggal:** 27 Oktober 2026, Asia/Jakarta  
**Lingkungan pengujian:** lokal nonproduction, database QA Supabase `aytrcvfncsklhqozreyk`  
**Status keseluruhan:** sebagian selesai; hasil yang sudah terbukti dan pekerjaan tersisa dirinci di bawah.

## 1. Ringkasan hasil

Tahap 2C telah membuktikan bahwa integrasi Meta dapat menerima referensi teks, menghasilkan kandidat tempat yang ditinjau pengguna, membuat draft itinerary biasa yang bisa diedit, lalu menyimpannya ke database QA dan membukanya kembali setelah aplikasi dimuat ulang.

Pekerjaan terbaru menambahkan bukti isolasi data dua akun melalui RLS serta satu analisis gambar hasil ekstraksi video yang benar-benar diproses Meta. Pengujian frame menggunakan video sintetis tanpa destinasi wisata. Model mengembalikan daftar tujuan kosong, sesuai isi video, sehingga pengujian ini tidak membuktikan akurasi pengenalan lokasi pada video perjalanan nyata.

Seluruh **419 tes regresi lulus**, pemeriksaan TypeScript/build lulus, dan audit otomatis lokalisasi mencakup **1.621 kunci tanpa error**. Tidak dilakukan commit, push, deployment, perubahan credential, booking, atau pembayaran dalam pekerjaan ini.

## 2. Pekerjaan Tahap 2C

| Pekerjaan | Hasil dan bukti |
|---|---|
| Diagnosis HTTP403 pembacaan anggaran | Penyebab diklasifikasikan sebagai izin database, bukan otomatis dianggap API key salah. Owner menerapkan patch SELECT khusus `service_role`; pembacaan aktual Worker kemudian berhasil. |
| Pengujian konkurensi anggaran | Skrip dua sesi diperbaiki agar membuktikan sesi benar-benar tumpang tindih dan menguji penguncian baris anggaran. Owner melaporkan kedua hasil versi baru `true`. Hasil awal B yang `false` tidak dianggap lulus. |
| Reservasi dan settlement diagnostik | Satu pengujian Worker berhasil mengalokasikan USD0,05 dan mencatat penyelesaian tanpa memanggil model Meta. Alokasi tidak dikembalikan atau direset. |
| Inferensi Meta dari teks | Satu request nyata HTTP200 melalui `muse-spark-1.3`; hasil berisi Muzium Negara dan Islamic Arts Museum Malaysia. Bukti teks diperiksa dan identitas dicocokkan dengan katalog tempat yang tersedia. |
| Review menjadi itinerary | Tempat hasil review dikonversi ke struktur Trip yang sudah digunakan SortTrip. Tidak membuat sistem itinerary atau penyimpanan kedua. |
| Edit dan Save/reload | Budget Rp4.500.000, asal CGK, dua museum, waktu edit 10:01, preferensi transportasi hemat, dan perintah hotel tetap tersimpan. Diverifikasi dengan reload penuh, pengambilan daftar perjalanan dari database, lalu membuka kembali perjalanan. |
| Perbaikan kegagalan Save | Pemeriksaan owner menemukan tabel `trips` belum tersedia di QA. Setelah owner menerapkan schema yang sudah ada, Save dan reload berhasil. Tidak melemahkan RLS. |
| Diagnostik QA dan lokalisasi | Menambahkan status akses model/anggaran, pesan error yang disanitasi, metrik request QA, serta perbaikan tampilan dialog dan bahasa status. |

Draft hasil pengujian ini masih berupa rencana aktivitas yang dapat diedit. Preferensi hotel di dalam perintah tersimpan, tetapi bukan bukti hotel, harga, transportasi penghubung, atau jam operasional telah diteliti dan terpenuhi.

## 3. Pekerjaan terbaru: RLS dua akun

**RLS (Row Level Security)** adalah aturan di database yang membatasi baris data yang boleh dibaca atau diubah setiap pengguna. Menyembunyikan data di antarmuka saja tidak cukup; pembatasan harus tetap berlaku ketika akses dicoba langsung melalui API.

Owner masuk dengan dua akun QA berbeda secara mandiri. Akun A menggunakan `127.0.0.1:5174`, sedangkan B menggunakan `localhost:5174`, sehingga penyimpanan login browser terpisah berdasarkan origin.

Pengujian menggunakan data uji sekali pakai, bukan itinerary perjalanan yang telah disimpan. Permintaan langsung menargetkan ID data tanpa menambahkan filter pemilik di klien yang dapat menutupi kegagalan RLS. Klien menggunakan akses pengguna biasa dan publishable key; tidak menggunakan credential server untuk membuktikan isolasi pengguna.

| Skenario | Hasil |
|---|---|
| Pemilik membuat, mengubah, dan membaca datanya sendiri | Lulus pada kedua akun |
| Pengguna anonim membaca data uji | Ditolak |
| A membaca data B, dan B membaca data A | Tidak ada baris yang dikembalikan |
| A mengubah data B, dan B mengubah data A | Tidak ada baris yang berubah |
| Menghapus data akun lain | Ditolak oleh izin tabel |
| Membuat data dengan ID pemilik akun lain | Ditolak |
| Membaca ulang data pemilik setelah seluruh percobaan | Kedua data tetap utuh |

Catatan: schema tidak memberi hak DELETE kepada pengguna terautentikasi. Karena itu, penolakan DELETE membuktikan perlindungan izin tabel, bukan pengujian policy DELETE tersendiri. Hasil ini berlaku untuk konfigurasi tabel `trips` di QA saat diuji; tidak otomatis membuktikan konfigurasi production atau tabel lain.

Satu pemeriksaan awal sempat gagal palsu karena `jsonb` PostgreSQL mengubah urutan kunci objek. Pembanding dalam alat uji diperbaiki agar mengabaikan urutan kunci objek, tetap mempertahankan urutan array, dan membandingkan seluruh isi data. Tes regresi ditambahkan dan pembacaan aktual diulang hingga lulus. Tidak ditemukan akses lintas akun yang berhasil.

## 4. Pekerjaan terbaru: analisis frame Meta

Video sintetis QA berdurasi tiga detik didekode di browser menjadi tiga gambar pada detik **0,45; 1,50; dan 2,55**. Preview diperiksa sebelum analisis. Transkrip opsional dikosongkan; perintah meminta model tidak menebak lokasi atau mengambil tempat dari itinerary sebelumnya.

| Parameter | Hasil aktual |
|---|---|
| Input | Tiga frame sintetis dan perintah teks |
| Model | `muse-spark-1.3` |
| HTTP | 200 |
| Waktu request | 6.951 ms |
| Token input / output | 685 / 767 |
| Perkiraan biaya | USD0,004116 |
| Kandidat tujuan | 0, sesuai video yang tidak berisi tempat wisata |
| Pembuatan draft dari hasil kosong | Dinonaktifkan |

Ini adalah analisis gambar yang diambil dari video. Audio tidak ditranskripsikan; tidak ada klaim analisis video penuh atau ASR. Tidak ada retry otomatis, unggahan video jarak jauh melalui Files, atau penggunaan konten pelanggan. Setelah pengujian, ketiga flag analisis/readiness QA dikembalikan ke `false` dan diverifikasi pada runtime.

## 5. Penggunaan API dan anggaran

Batas kumulatif yang disetujui owner adalah **USD10**. Setiap request yang memperoleh reservasi menggunakan alokasi konservatif USD0,05; angka alokasi bukan biaya tagihan aktual.

| Pengujian | Alokasi ledger | Perkiraan penggunaan model |
|---|---:|---:|
| Diagnostik reserve/settle tanpa Meta | USD0,05 | Tidak ada inferensi |
| Inferensi teks: 405 input / 1.341 output token | USD0,05 | USD0,00620550 |
| Inferensi frame: 685 input / 767 output token | USD0,05 | USD0,00411600 |
| **Total** | **USD0,15** | **USD0,01032150** |

Hasil SQL baca-saja terakhir yang dijalankan owner mengonfirmasi:

- Alokasi USD0,15; sisa USD9,85; `blocked=false`.
- Tiga request ledger, seluruhnya settled; tidak ada request unsettled.
- Total penggunaan model yang diketahui diperkirakan USD0,01032150.
- Tabel `trips` tersedia, RLS aktif, dan authenticated INSERT diizinkan.

Tiga request ledger mencakup satu diagnostik tanpa inferensi dan dua inferensi nyata. Ini tidak menyatakan hanya ada tiga HTTP call: pemeriksaan metadata, token-count, autentikasi, dan pembacaan status merupakan operasi terpisah. Settlement ledger juga bukan rekonsiliasi tagihan final pada akun Meta.

## 6. Verifikasi dan perubahan kode

- **419/419 tes lulus**, tanpa gagal atau skip.
- TypeScript dan Vite build lulus; peringatan ukuran bundle yang sudah ada masih tercatat.
- Scanner lokalisasi: 1.621 kunci, tanpa error atau literal JSX belum diterjemahkan yang terdeteksi. Ini bukan sertifikasi kualitas seluruh bahasa hasil AI.
- Pemeriksaan whitespace diff lulus.
- Panel RLS dibatasi pada mode `meta-qa` dan URL proyek QA tetap.
- Error JWT kedaluwarsa, jaringan, atau schema tidak dianggap sebagai bukti RLS berhasil.
- Tidak membaca atau mendokumentasikan password, token login, API key, atau isi file environment.

Komponen utama pekerjaan mencakup `lib/reviewed-trip.mjs`, `worker/meta-qa-budget.js`, `app/meta-qa-rls.tsx`, `lib/qa-rls-probe.mjs`, integrasi mode QA pada TravelApp, konfigurasi origin lokal terkontrol, serta tes Phase2C/RLS. Data perjalanan biasa tetap memakai jalur penyimpanan Supabase yang sudah ada.

## 7. Batas hasil dan pekerjaan tersisa

| Bagian | Status |
|---|---|
| Teks referensi → Meta → review → edit → Save/reload | Terverifikasi nyata di QA |
| Isolasi trips dua akun dan anonim | Terverifikasi nyata di QA |
| Penerimaan frame oleh Meta dan hasil kosong yang jujur | Terverifikasi nyata di QA |
| Identifikasi destinasi dari video perjalanan nyata berizin | Belum terverifikasi |
| Analisis video penuh dan transkripsi audio otomatis | Belum diimplementasikan pada alur ini |
| Kelengkapan hotel, tarif, tiket, dan koneksi transportasi hasil video | Belum dibuktikan oleh pengujian ini |
| QA menyeluruh mobile, Trip Pass, dan Price Watch nonproduction | Belum tersertifikasi oleh pekerjaan ini |
| Kesiapan production dan tahap 3 | Belum dinyatakan siap; memerlukan lingkup dan persetujuan berikutnya |

Langkah berikutnya adalah pengujian positif dengan video perjalanan milik owner atau berizin, mengukur ketepatan kandidat dan bukti lokasi, lalu melengkapi penerimaan UI dan demo sesuai lingkup. Tidak perlu membuat ulang key, proyek, akun QA, schema, grant, atau mereset alokasi yang sudah diverifikasi.

## 8. Referensi bukti

Semua path berikut relatif terhadap folder laporan ini:

- `SUPABASE_RLS_QA.md` dan `evidence/rls-two-accounts-live.json`: hasil akses dua akun dan anonim.
- `META_LIVE_INFERENCE.md` serta `evidence/meta-text-live-result.json`: inferensi teks nyata.
- `VIDEO_FRAME_ANALYSIS.md` serta `evidence/meta-frames-live-result.json` dan `.png`: analisis frame nyata.
- `ITINERARY_END_TO_END.md` serta `evidence/meta-draft-saved-reloaded.png`: Save/reload draft.
- `evidence/ledger-after-frames-owner.json` dan `evidence/budget-after-frames.png`: konfirmasi ledger terakhir.
- `REGRESSION_RESULTS.md`, `evidence/rls-full-tests.log`, `evidence/rls-final-build.log`, dan `evidence/rls-i18n.json`: verifikasi regresi/build/lokalisasi.

Laporan ini merangkum status terbaru dan menggantikan catatan lama yang masih menyebut RLS dua akun atau analisis frame sebagai terblokir. Catatan historis dipertahankan sebagai riwayat diagnosis, bukan status saat ini.

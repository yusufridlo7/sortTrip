# Perbaikan upload video dan referensi vt — 28 Oktober 2026

## Lingkup dan status

Perbaikan lokal pada branch QA yang sudah digunakan. Tidak ada commit, push, deployment, perubahan credential, atau perubahan kebijakan database. Analisis Meta nyata dijalankan setelah owner mengizinkan pemakaian kuota, dalam batas kumulatif USD10.

Error413 yang dilaporkan memiliki jalur reproduksi jelas di kode: server membatasi JSON menjadi16KB ketika flag frame nonaktif, sementara payload tiga JPEG dapat lebih besar. Screenshot saja tidak membuktikan ukuran request asli atau flag pada saat kejadian; diagnosis dibuktikan lewat pengujian payload yang valid dan melewati16KB.

## Perubahan

- JSON frame kini memakai batas transport tetap240.000byte, terpisah dari aktivasi model. Angka ini mencakup tiga JPEG base64 serta escaping JSON untuk transkrip/perintah yang diizinkan; batas isi per JPEG/transkrip/model tetap berlaku.
- Frame yang dinonaktifkan memberi `MODEL_UNAVAILABLE`/503, bukan413 palsu akibat batas teks. Oversize transport memberi `REQUEST_TOO_LARGE`/413 dan pesan berbeda dari batas file4MiB.
- Klien memeriksa ukuran payload sebelum request dan menangani respons413 non-JSON dari proxy secara aman.
- Tautan pendek `vt.tiktok.com` dan `vm.tiktok.com` dengan pola path terbatas kini diterima. Query pelacakan dibuang; tidak mengikuti redirect atau mengambil URL arbitrer dari backend.
- Tautan dapat disertai caption/deskripsi/transkrip yang diberikan pengguna. Jalur `linked-transcript` memakai autentikasi, consent, budget, token-count, model dan validasi yang sama dengan ekstraksi teks. URL tidak dikirim sebagai bukti model membaca video; respons menyatakan `videoAccessed:false`.
- UI ID/EN menjelaskan bahwa link belum dibaca sebagai video, menyediakan kolom teks dan consent, serta mengarahkan pengguna tanpa teks ke langkah berikutnya tanpa panggilan Meta.
- Kontrol `reasoning.effort=low` ditambahkan untuk ekstraksi singkat, dengan cap output2.000token dan reservasiUSD0,05 tetap. Token-count dan inferensi menggunakan payload sama. Dokumentasi resmi: https://dev.meta.ai/docs/reasoning . Reasoning berbagi batas output; pengaturan ini mengurangi ketergantungan pada kedalaman default model, bukan menaikkan batas biaya.
- Diagnostik kegagalan QA hanya mengeluarkan kategori tahap validasi tetap dan jumlah penggunaan. Tidak mengeluarkan teks respons model, prompt, identitas akun, credential, atau pesan error upstream mentah.

## Pemeriksaan tautan owner

Tautan pendek yang diberikan owner berhasil dibuka lewat browser resmi dan beralih ke video publik `@tarnandoete/video/7501291015462980871`, bertema itinerary Sapa–Hanoi. Tampilan player menunjukkan durasi sekitar70detik. Ini lebih panjang dari batas upload MP4 saat ini60detik. Tidak ada video sosial diunduh atau klaim izin media disimpulkan dari akses publik tersebut.

Caption yang terlihat diberikan secara eksplisit sebagai teks dalam uji Meta. Pembacaan browser manual ini tidak membuktikan bahwa backend SortTrip sudah dapat mengunduh atau menganalisis video dari link.

## Uji Meta aktual

| Percobaan | Hasil | Batas interpretasi |
|---|---|---|
| Caption vt, konfigurasi awal | HTTP502,10.126ms, hasil model tidak tervalidasi | Tidak dihitung berhasil; itinerary tidak berubah. Tahap validasi tepat belum terekam pada percobaan ini. |
| Caption vt setelah kontrol reasoning/diagnostik | HTTP200,6.832ms,401input/1.151outputtoken, estimasiUSD0,005393 | Meta mengembalikan Sapa dan Hanoi dari teks yang diberikan; bukan pembacaan isi video. |
| Upload MP4 sintetis QA, tiga frame | HTTP200,5.373ms,673input/386outputtoken, estimasiUSD0,00248175 | Transkrip kosong, tidak ada destinasi pada frame; hasil kosong benar. Bukan pembuktian pengenalan video perjalanan nyata. |

Sapa/Hanoi tetap ditandai belum terverifikasi. Pembuatan draft dinonaktifkan karena jalur MVP mengharuskan identitas tempat terverifikasi dan satu kota. Sistem tidak memalsukan hotel, objek wisata, koordinat, harga atau itinerary multikota untuk melewati batas ini.

Percobaan kedua dilakukan manual setelah membaca alokasi yang tertahan dan mengubah kontrol request; tidak ada retry otomatis. Keberhasilan setelah perubahan tidak membuktikan penyebab pasti kegagalan502 pertama. Diagnostik baru disiapkan untuk membedakan respons tidak selesai, JSON, model dan schema bila kejadian terulang.

## Anggaran dan settlement

Pembacaan aktual Worker sebelum pengujian: alokasiUSD0,15/sisaUSD9,85/blockedfalse. Sesudahnya: alokasiUSD0,30/sisaUSD9,70/blockedfalse.

Owner menjalankan SQL baca-saja dan mengonfirmasi6request ledger,6settled,0unsettled, known estimated usageUSD0,02719750; trips present/RLS enabled/authenticated INSERT semuanya true. Selisih alokasiUSD0,15 mencakup satu percobaan gagal dan dua berhasil. Dua yang berhasil mempunyai estimasi gabunganUSD0,00787475. Selisih estimasi ledger dari checkpoint sebelumnya, setelah mengurangi dua keberhasilan, adalahUSD0,00900125 untuk percobaan gagal; angka ini diturunkan dari agregat, bukan metrik token yang direkam pada UI percobaan pertama.

Alokasi konservatif bukan biaya tagihan final. Tidak dilakukan reset/refund alokasi. Semua flag QA analisis/readiness dikembalikanfalse setelah tes dan diverifikasi pada `/api/meta-qa/status`. Penggunaan interaktif berikutnya memerlukan aktivasi sesi QA yang sesuai, bukan deployment production otomatis.

## Verifikasi

- 425tes regresi lulus;0gagal/0skip.
- TypeScript/Vite build lulus; peringatan ukuran bundle yang sudah ada tetap tercatat.
- i18n1.626kunci,0error dan0literal JSX belum diterjemahkan yang terdeteksi.
- Tes baru meliputi payload frame valid di atas16KB saat aktif/nonaktif, overflow transport, URL pendek dan host palsu, consent/batas transkrip, tidak ada fetch TikTok dari backend, serta sanitasi diagnostik.
- UI aktual ID/EN: link owner diterima, pesan yang sudah tampil berubah bahasa, kolom teks/consent tersedia. Uji upload browser melalui file chooser resmi menghasilkan preview dan inferensi nyata200.
- Tidak menguji ulang file video asli owner karena file MP4 tersebut tidak tersedia sebagai path dalam task ini; hanya screenshot error yang diberikan. Batas4MiB/60detik belum dinaikkan.

## Bukti

Di folder `artifacts/` repository:

- `video-upload-link-full-tests-final.log`, `video-upload-link-build-final.log`, `video-upload-link-i18n-final.json`.
- `video-linked-caption-live.json` dan `.png`.
- `video-upload-meta-live.json` dan `.png`.
- `video-link-id.png`, `video-fix-ledger-owner.json`.

## Yang belum selesai

Analisis otomatis konten video langsung dari URL, ASR/audio dan video penuh belum diimplementasikan. Saat ini jalur link memakai teks yang disediakan, sedangkan upload memakai frame. Itinerary Sapa–Hanoi multikota langsung dari video tersebut belum dihasilkan atau dinyatakan lolos. Pengembangan akses media dan verifikasi lokasi yang lebih luas tetap pekerjaan berikutnya; jangan menyebut penerimaan format vt sebagai analisis video otomatis atau production-ready.

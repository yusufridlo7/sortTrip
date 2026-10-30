# Riset akses resmi TikTok untuk SortTrip

Tanggal: 28 Oktober 2026. Lingkup: riset dokumentasi publik resmi; tidak mendaftarkan aplikasi, menerima persetujuan, membaca credential, mengunduh video, atau mengubah integrasi.

## Hasil utama

Tidak ditemukan jalur resmi umum dalam dokumentasi yang diperiksa untuk mengubah sembarang tautan publik TikTok menjadi file video/transkrip yang bisa langsung dikirim ke Meta. Ini adalah batas temuan riset, bukan pernyataan bahwa tidak ada kerja sama khusus yang mungkin disetujui TikTok. Akses browser yang pernah berhasil untuk tautan owner tidak membuktikan hak atau ketersediaan akses media dari backend.

## Pilihan resmi

| Jalur | Kemampuan terdokumentasi | Batas untuk SortTrip |
|---|---|---|
| Embed Player | Menampilkan post dengan iframe; kontrol play/pause/seek, deskripsi dan closed-caption di player | Tidak mendokumentasikan API untuk mengekspor MP4, frame, audio atau transkrip ke aplikasi host. Menampilkan caption bukan memperoleh teks transkrip untuk Meta. |
| oEmbed | Mengubah URL video menjadi markup embed dan informasi embed | Contoh respons terbaru tidak menjamin field caption/transkrip. Dokumentasi kini menyarankan Embed Player untuk integrasi baru. Tidak boleh dijanjikan sebagai API unduh/analisis video. |
| Login Kit + Display API | Metadata video akun yang mengotorisasi aplikasi, seperti title, video_description, duration, cover_image_url dan embed_link | Perlu developer account, approval produk dan scope, serta otorisasi pengguna. Bukan akses umum ke semua video kreator lain dari link. Daftar field video tidak menyediakan MP4/transkrip. |
| Research Tools | Dataset publik untuk proyek penelitian yang memenuhi syarat dan disetujui | FAQ resmi menyatakan pengguna komersial tidak memenuhi syarat. Tidak dipilih untuk aplikasi travel komersial SortTrip. |

## Implikasi produk

1. Untuk preview video dari tautan publik, gunakan Embed Player resmi dengan atribusi dan status video tidak tersedia. Ini meningkatkan pengalaman melihat referensi, bukan kemampuan Meta menonton isi videonya.
2. Jika ingin menghubungkan akun kreator yang bekerja sama, ajukan Login Kit/Display API sesuai use case dan dapatkan otorisasi kreator. Persetujuan API, akses akun, dan pemanfaatan data untuk analisis harus ditinjau tersendiri; metadata API bukan bukti izin pemrosesan seluruh video oleh AI.
3. Untuk analisis visual/audio lengkap, jalur praktis saat ini tetap file milik pengguna atau berizin, atau konten yang disediakan kreator secara sah. SortTrip sudah mempunyai jalur sampled-frame MP4; audio/full-video masih belum diimplementasikan.
4. Jika tuntutannya tetap sembarang link menjadi analisis penuh tanpa upload, perlu akses media yang secara eksplisit diizinkan TikTok/pemilik konten. Jangan menjanjikan bebas pembatasan hanya dengan membuat developer account atau memasang API key.
5. Saat integrasi API diterapkan, ikuti izin dan batas request yang berlaku, minimalkan scope, tangani penolakan dengan pesan/fallback yang jelas dan hindari retry agresif. Ini meningkatkan kepatuhan dan keandalan; tidak menjamin TikTok tidak pernah membatasi akses.

## Pemeriksaan aktual pada riset ini

Dokumentasi resmi berhasil dibaca. Satu percobaan membaca endpoint oEmbed untuk canonical URL video owner melalui alat web tidak dapat diakses oleh alat tersebut. Ini bukan bukti responsHTTP403 dari TikTok, bukan bukti endpoint mati, dan bukan sertifikasi akses dari Cloudflare Worker. Tidak dilakukan percobaan berulang, penggantian IP, login, atau pengambilan cookie.

## Sumber resmi

- Embed Player: https://developers.tiktok.com/docs/en/embed-player (halaman menyebut pembaruan22Oktober2026).
- Embed Videos/oEmbed: https://developers.tiktok.com/docs/en/embed-videos (pembaruan23Oktober2026; menganjurkan Embed Player untuk integrasi baru).
- Display API overview: https://developers.tiktok.com/docs/en/display-api-overview .
- Display API prerequisites/authorization: https://developers.tiktok.com/docs/en/display-api-get-started .
- Field Video Object: https://developers.tiktok.com/docs/en/tiktok-api-v2-video-object .
- Research API FAQ/eligibility: https://developers.tiktok.com/docs/en/research-api-faq .

Status SortTrip: dokumentasi jalur resmi diteliti; developer approval/creator authorization/access media khusus tetap UNVERIFIED. Tidak ada fitur baru, biaya layanan, partner approval, deployment atau peningkatan akses yang dinyatakan terjadi dari riset ini.

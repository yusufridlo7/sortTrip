# Perbaikan tujuan kosong dan pencarian dari perintah

28 Oktober 2026. Perubahan lokal; belum commit/push/deploy.

## Penyebab

1. Worker meta-qa tidak menyediakan `/api/locations`, sehingga komponen autocomplete yang sama dengan aplikasi biasa tidak bisa menampilkan kota.
2. Alur inspirasi sebelumnya langsung menghentikan pencarian dan meminta tujuan manual, tanpa memeriksa apakah kota sudah disebut dalam teks pengguna.
3. Setelah tujuan dipilih, Worker QA juga tidak menyediakan pencarian tiket. Perbaikan autocomplete saja akan memindahkan error ke langkah berikutnya.

Screenshot saja tidak membuktikan endpoint atau teks yang diketik; diagnosis berasal dari pemeriksaan route, kode komponen, dan uji aktual berikut.

## Perubahan

- Mengekstrak pencarian katalog yang sudah ada ke `worker/location-search.js`, digunakan oleh Worker biasa dan QA. Data tetap berasal dari `worker/locations.json`; tidak ada daftar bandara palsu atau credential baru.
- Menambahkan resolver teks yang dibatasi ukurannya pada `/api/locations/resolve`. Resolver memakai teks perintah, mengecualikan URL, kota asal, negasi sederhana, dan kata perjalanan umum. Ini pencocokan katalog deterministik, bukan pembacaan video atau model AI.
- Saat link disertai satu kota bandara yang cocok, tombol Cari perjalanan langsung memakai kode tersebut dan menyinkronkan label kolom Tujuan. Jika beberapa kota cocok, tersedia pilihan kota kedatangan; kota lain tetap ada dalam perintah. Jika tidak ada tujuan yang dapat dikenali, kolom Tujuan tetap diperlukan dan kini berfungsi.
- Saat membuat resolver, uji menemukan tempat kecil bernama “Malam” dalam katalog. Kata “per malam” tidak boleh dianggap destinasi kedua. Ditambahkan penyaringan kata umum dan tes regresi untuk kasus Hanoi–Sapa + hotel per malam.
- Mencegah respons resolver lama diterapkan ketika teks/form telah berubah. Pilihan rekomendasi baru menghapus state resolusi lama.
- QA mengizinkan pencarian tiket baca-saja melalui URL publik tetap `https://sorttrip.yusufridlo7.workers.dev/api/flights`. Query divalidasi dan dibentuk ulang dari field yang diizinkan. Header Authorization/Cookie, prompt, credential, ID akun dan URL arbitrer tidak diteruskan. GET saja, redirect tidak diikuti, timeout dan ukuran respons dibatasi.
- Booking, pembayaran dan `/api/itinerary` umum tetap tidak tersedia melalui Worker QA ini. Tidak ada proxy umum ke production atau perubahan izin akun/database.

## Verifikasi aktual browser

- Ketik Hanoi → opsi **Hanoi HAN · Vietnam · Noi Bai International Airport** tampil dan dapat dipilih.
- Setelah tujuan dibersihkan, masukkan link vt dan perintah “Hanoi dan Sapa selama5hari, hotel di bawah500000 per malam, transportasi hemat”, lalu Gunakan sebagai inspirasi → Cari perjalanan.
- Sistem memilih **Hanoi (HAN)** dari teks tanpa mengetik ulang kolom Tujuan dan meneruskan pencarian.
- Hasil aktual: **CGK ⇄ HAN,7–11November2026,5hari/4malam**, tarif indikatif **Rp5.314.916 per dewasa** dari jalur publik SortTrip/Aviasales Data API.
- Tarif tersebut melebihi budget contohRp4.500.000. Hotel/transportasi belum mempunyai harga pada hasil ini. Tidak dinyatakan sebagai paket lengkap sesuai budget, harga terkunci, atau booking terkonfirmasi.
- Tidak memanggil Meta, membuat booking, melakukan pembayaran, atau menyimpan itinerary dalam pengujian ini.

## Tes dan batas

434tes lulus,0gagal/skip; TypeScript/Vite build lulus dengan peringatan ukuran bundle yang sudah ada. i18n1.637kunci,0error/literal belum diterjemahkan terdeteksi.

Tes baru mencakup autocomplete QA tanpa credential, intent Hanoi/kata malam/asal/negasi/URL/multikota, batas payload resolver, validasi pilihan klien, serta isolasi GET publik tanpa forwarding credential/prompt dan tanpa redirect.

Resolver adalah pencocokan nama, bukan pemahaman bahasa penuh. Permintaan ambigu masih membutuhkan konfirmasi. Link tanpa kota atau konten yang dapat diakses tetap tidak bisa menentukan tujuan sendiri. Analisis isi TikTok dari URL dan penyusunan itinerary lengkap melalui QA belum dibuktikan oleh uji pencarian ini. Flag Meta QA interaktif tidak diubah.

## Bukti

- `artifacts/destination-hanoi-autocomplete.png`
- `artifacts/destination-hanoi-search-live.png`
- `artifacts/destination-search-live.json`
- `artifacts/destination-search-fix-full-tests.log`
- `artifacts/destination-search-fix-build.log`
- `artifacts/destination-search-fix-i18n.json`

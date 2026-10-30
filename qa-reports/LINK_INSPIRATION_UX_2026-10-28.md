# Alur inspirasi link — 28 Oktober 2026

## Perubahan yang diterapkan

Alur utama lampiran URL kini: tempel link → **Gunakan sebagai inspirasi perjalanan** → konfirmasi tujuan yang belum dipilih → lanjutkan pencarian biasa atau perbarui itinerary yang sudah ada. Pengguna tidak wajib mengunduh video, mengunggah ulang, menyediakan transkrip, atau memanggil model ekstraksi untuk memakai link sebagai inspirasi.

Ini bukan pembacaan otomatis isi video. Keterangan bahwa video belum dianalisis tetap disertakan. Tidak ditambahkan fetch media TikTok, metadata otomatis, embed, ASR, endpoint model, atau jalur booking baru.

## Perilaku

- Input link dan dua aksi ringkas menjadi tampilan utama. Kolom caption/transkrip serta consent pemrosesan model tersembunyi sampai pengguna membuka opsi tambahan. Jalur ekstraksi teks/frame yang sudah ada tetap tersedia.
- Handoff memvalidasi format URL melalui validator yang sudah ada, membuang query pelacakan, lalu menambahkan referensi berlabel pada perintah yang ada. Tidak membaca video atau mengklaim tempat dalam video sudah diketahui.
- Teks permintaan asli dipertahankan. Jika penambahan referensi melewati batas perintah, muncul pesan agar pengguna memendekkan teks; tidak melakukan pemotongan diam-diam. Referensi identik tidak ditambahkan berulang.
- Di Jelajahi/Pesawat, mode kembali ke perintah biasa sehingga tombol pencarian normal tersedia. Jika tujuan belum valid, Assistant bertanya tujuan utama melalui pesan singkat dan memfokuskan kolom Tujuan yang sudah ada. Tidak menambah formulir tujuan kedua atau diam-diam melakukan pencarian semua kota.
- Budget, jumlah orang, durasi dan pilihan tanggal tidak diubah oleh handoff.
- Di itinerary yang sudah ada, link ditambahkan ke perintah editable dan mode kembali ke Assistant biasa. Item itinerary tidak diganti oleh aksi menambahkan link; generate tetap harus diklik pengguna melalui alur normal. Pembatasan booked/locked dan validasi planner tetap berlaku.
- Link bukan bukti destinasi, koordinat, hotel atau harga. Pengguna mengonfirmasi tujuan; perencanaan biasa meneliti detail berdasarkan sumber yang tersedia.

## Implementasi

`lib/link-inspiration.mjs` menangani penggabungan perintah yang dibatasi ukurannya. Callback `onUseReference` melewati MediaInputOptions/TravelApp ke FlightSearch dan AIPlanner. DestinationInput menerima permintaan fokus saja. Tidak membuat duplikat sistem itinerary/database atau melewati catalog review dengan kandidat model palsu.

## Verifikasi

- 429 tes lulus, tanpa gagal/skip: `artifacts/link-inspiration-full-tests-final.log`.
- TypeScript/Vite build lulus: `artifacts/link-inspiration-build-final.log`; peringatan ukuran bundle yang sudah ada tetap tercatat.
- i18n1.633kunci,0error/literal JSX belum diterjemahkan terdeteksi: `artifacts/link-inspiration-i18n-final.json`.
- Tes mencakup URL tidak aman, preservasi perintah, batas panjang tanpa truncation, referensi identik, callback ke pencarian/planner yang ada, dan tampilan ringkas ID/EN tanpa field ekstraksi wajib.
- Browser aktual: opsi caption bisa dibuka/ditutup; handoff link berhasil; fokus ke Tujuan; tombol pencarian biasa kembali; permintaan Vietnam/Hanoi/Sapa dan durasi5hari tetap utuh; link hanya muncul sekali setelah diulangi; pesan berubah ID/EN. Pencarian tanpa tujuan tidak diteruskan dan tidak menggandakan pesan error.
- Bukti screenshot: `artifacts/link-inspiration-handoff-id.png`.

## Batas verifikasi dan rilis

Tidak ada request Meta, pemakaian kuota, booking, pembayaran atau Save itinerary dalam QA ini. Worker meta-qa terisolasi memang tidak menyediakan API pencarian/planner umum; karena itu hasil flight/live itinerary lewat handoff ini belum diuji end-to-end. Pengujian browser dilakukan pada viewport desktop yang tersedia; sertifikasi perangkat mobile terpisah belum dilakukan.

Meta QA interaktif tetap aktif sesuai instruksi owner sebelumnya; tidak dinonaktifkan oleh pekerjaan ini. Perubahan masih lokal, belum commit/push/deploy. Pengguna tidak perlu upload untuk menyampaikan inspirasi dan tujuannya, tetapi fitur meniru seluruh detail dari isi video URL secara otomatis tetap belum tersedia.

# Penyesuaian proporsi lanjutan — 10 November 2026

Owner meminta menyamakan jarak, ukuran elemen dan kepadatan terhadap tiga board. Pekerjaan ini hanya mengubah tujuh stylesheet dalam `app/ui-alignment/boards/`: shell, discovery, planner, flights, partners, account-support, checkout. Token warna dan Guide tidak berubah.

## Perubahan konkret

- Kontainer desktop 1240 → 1360px; margin luar 32px pada viewport 1440px.
- Utility dan pemberitahuan harga berada pada satu baris desktop lebar, tetap dapat diklik dan dibaca. Pada desktop sempit kembali mengalir biasa.
- Formulir Jelajah dibatasi 1040px, terpusat di atas foto hero 475px; textarea 44px. Pada 1000–1199px formulir menggunakan ruang tersedia agar kontrol tidak terpotong.
- Foto rekomendasi memakai rasio 2,04:1; foto Perjalanan Saya 1,53:1 sesuai proporsi board. Kartu memiliki tinggi seragam mengikuti konten, tanpa memotong judul atau subtotal.
- Editor: tiga preferensi pada satu baris; media/prompt dan dua tombol AI berdampingan pada >=1200px. Kuota, proteksi item, bukti harga dan referensi tetap terlihat. Jadwal pesawat diringkas menjadi dua kolom; timeline dipadatkan.
- Sidebar budget 320px; sidebar hasil penerbangan 270px. Jarak kartu 12–24px menurut komponennya.
- Hero mitra 280px dengan widget overlap110px, bantuan hero300px dengan panel overlap64px; checkout memakai rasio kolom 1,55:1. Isi iframe/SDK tidak diubah.

## Bukti browser saat ini

1440×1000: kontainer1360px, formulir1040px. Tiga kartu tersimpan pertama437×598px, foto285px. Editor, Saved, Hotel, Transport dan Help tidak overflow horizontal. Help memiliki dua kolom590/678px.

1024×900: formulir873px, kamera tersedia, tidak overflow. 390×844: kamera tersedia, tidak overflow; aturan mobile sebelumnya dipertahankan.

Screenshot folder `spacing/`; sebelum tahap ini tersedia di `after/`. `SPACING_COMPARE.html` menampilkan keduanya.

## Pemeriksaan

- Delapan suite terarah: **60 PASS, 0 FAIL, 0 skipped**, log `spacing-tests.txt`.
- TypeScript/Vite: **PASS**, 2085 modul, log `spacing-build.txt`; warning ukuran bundle masih ada.
- AST kontrak presentasi: PASS, handler submit/change enam komponen dan props AIPlanner identik baseline.
- Tidak meminta generasi AI, mengubah itinerary/Save, booking, pembayaran, database, secret, commit, push atau deploy.

Tidak ada pengukuran pixel-diff yang membuktikan identitas100%. Board berupa raster komposit dan berisi data/kontrol contoh yang berbeda dari aplikasi. Ukuran dan rasio telah disesuaikan; perbedaan konten aktual, warning, quota, tombol tambahan existing dan iframe supplier dipertahankan agar fungsi tidak hilang.

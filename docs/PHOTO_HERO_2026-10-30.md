# Foto destinasi asli — 30 Oktober 2026

Ilustrasi pada hero diganti dengan foto Marina Bay, Singapura, dari aset existing `public/singapore.jpg`. Lapisan biru transparan dan fade menjaga teks putih tetap terbaca. Hanya `app/brand-theme.css` berubah; tidak mengubah foto sumber, tata letak, shadow kartu, handler atau fitur. SVG sebelumnya tidak lagi dipakai pada hero.

TypeScript/Vite QA build PASS (`artifacts/photo-hero-build-2026-10-30.log`), diff-check PASS. Browser 1280px dan 390px tanpa overflow; background terverifikasi memakai foto JPG, bukan SVG. Screenshot `artifacts/photo-hero-desktop-2026-10-30.png` dan `photo-hero-mobile-2026-10-30.png`.

Tidak ada AI/API supplier, SQL, pembayaran atau perubahan data. Belum commit/push/deploy. Tinjau di `http://127.0.0.1:5176/`.

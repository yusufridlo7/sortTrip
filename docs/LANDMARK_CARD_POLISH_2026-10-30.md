# Landmark lembut dan kartu timbul

30 Oktober 2026 — selesai lokal, belum commit/push/deploy.

**Perubahan:** `public/branding/travel-skyline.svg` menambahkan ilustrasi dekoratif kota/wisata Asia Tenggara, menara kembar, pagoda, jembatan, roda observasi dan pesawat. Garis putih transparan menjaga kontras rendah di atas hero biru. SVG lokal tidak memakai script, font, gambar eksternal atau API. `app/brand-theme.css` memberi bayangan dua lapis dan border/hover pada kartu beranda, hasil penerbangan/tanggal, serta Perjalanan saya. Reduced-motion dihormati. Dasar putih, posisi kontrol, handler dan fitur dipertahankan; tidak ada perubahan React/Worker.

**Verifikasi:** TypeScript/Vite QA build PASS; SVG XML valid; diff-check PASS. Browser nyata menunjukkan ilustrasi dan shadow kartu beranda/My Trips. Desktop 1280px, My Trips/editor 390px dan beranda 320px tanpa overflow horizontal. Kartu tersimpan masih membuka itinerary sepuluh item; tidak mengedit atau Save ulang.

Style hasil penerbangan terverifikasi dalam stylesheet browser (normal/hover); tidak melakukan pencarian supplier baru atau mengklaim uji quote live. Tidak ada inferensi Meta, SQL, booking atau pembayaran.

Bukti `artifacts/landmark-hero-2026-10-30.png`, `landmark-my-trips-2026-10-30.png`, `landmark-mobile-2026-10-30.png`; build log `artifacts/landmark-cards-build-2026-10-30.log`. Tinjau di `http://127.0.0.1:5176/`. Production tidak diubah.

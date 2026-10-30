# Kesiapan demo Tahap 2B

27 Oktober 2026. **Demo readiness: NOT READY. Phase 3 readiness: NOT READY.**

Yang dapat didemokan jujur sekarang: input perintah + lampiran, validasi URL, tiga frame aktual dari MP4 sintetis lokal, penjelasan audio belum dianalisis, serta review/draft contoh yang berlabel fixture. Itu bukan demo AI membaca video wisata nyata.

Owner belum memberikan MP4 wisata berizin; hanya menanyakan apakah URL bisa. URL sosial dapat dipasang sebagai referensi, tetapi saat ini tidak diunduh/dianalisis. Jangan memakai konten pihak ketiga atau caption sebagai pengganti visual lalu mengklaim analisis video.

## Skenario reproduksi lokal saat ini

1. Jalankan frontend lokal dengan konfigurasi yang sudah ada; tidak menyalin credential produksi.
2. Di SortTrip Assistant pilih Unggah video. Pilih `evidence/phase-2b/synthetic-qa.mp4` dari folder laporan ini; itu gambar berlabel QA dan nada sintetis.
3. Centang persetujuan untuk fixture tersebut, klik **Siapkan frame video secara lokal**.
4. Verifikasi tiga preview 0,45/1,5/2,55 detik. Pesan menyatakan belum ada panggilan model/audio transkripsi.
5. Jangan menekan analisis jika ledger/model test belum diverifikasi. Jangan menampilkan contoh lokal berlabel sebagai hasil Meta.

Pengujian offline tambahan: `node scripts/prepare-video-local.mjs docs/hackathon-2026/phase-2/evidence/phase-2b/synthetic-qa.mp4`. Helper mencetak metadata, tanpa model/upload, dan menghapus media sementara.

## Skenario demo sebenarnya — belum dijalankan

Setelah gate owner lolos, gunakan MP4 wisata asli milik owner/berizin dan non-sensitive (≤4MiB/60detik), misalnya lokasi yang ada pada katalog. Pengguna menulis kebutuhan perjalanan, menyiapkan/memeriksa frame, lalu secara eksplisit memilih analisis Meta. Rekam model/usage aktual yang disanitasi, kandidat dan label inferred, pencocokan identitas, review, draft editable, Save, lalu reload dari akun uji. Jika memakai frame fallback, narasi harus menyebut **analisis frame pilihan dan transkrip pengguna**, bukan seluruh video/audio. Jangan menjanjikan harga atau jam buka dari model.

Demo tidak boleh direkam sebagai end-to-end selesai sebelum ada bukti Meta serta Save/RLS. Penulisan transkrip sendiri sah sebagai fallback tetapi harus disebut transkrip yang disediakan pengguna, bukan ASR otomatis.

## Penelitian URL sosial

[TikTok embed/oEmbed](https://developers.tiktok.com/doc/embed-videos/) menyediakan embed/metadata, bukan bukti hak mengunduh atau menganalisis media. Dokumentasi juga menyatakan Embed Videos akan deprecated; tidak menambah integrasi baru ke jalur itu. [YouTube developer policies](https://developers.google.com/youtube/terms/developer-policies) perlu ditinjau untuk akses resmi; tidak ada downloader. Halaman resmi Instagram oEmbed memberikan HTTP429 saat diperiksa, sehingga ketentuan/entitlement terkininya belum dapat dikonfirmasi. Tidak ada bypass/login/DRM atau upaya mengambil video tersembunyi.

Next step: panduan OWNER_ACTION_REQUIRED.md, bukan Phase3 atau rilis produksi.

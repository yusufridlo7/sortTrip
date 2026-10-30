# Pemrosesan video Tahap 2B

27 Oktober 2026. **Decoder/frame lokal: VERIFIED LIVE (runtime lokal). Adapter frame Meta: VERIFIED WITH MOCKS. Analisis video/audio penuh aplikasi: NOT IMPLEMENTED.**

## Jalur aplikasi yang bekerja secara lokal

1. Pengguna memilih MP4 milik sendiri/berizin; maksimal 4 MiB dan 60 detik.
2. Signature/container diperiksa sebelum decoder browser. Metadata video harus finite dan dimensi tidak melebihi 4096×2160.
3. Decoder bawaan browser melakukan seek pada 15%, 50%, dan 85% durasi. Canvas mengekstrak maksimal tiga JPEG, sisi maksimal 320 px, masing-masing maksimal 32 KiB.
4. Pengguna melihat preview dan keterangan bahwa **audio belum dianalisis**. Transkrip opsional dapat ditambahkan bersama caption/preferences.
5. Baru klik analisis melakukan request terautentikasi ke Worker. Worker membatasi JSON 160.000 byte saat frame diaktifkan, memeriksa data URI JPEG/timestamp/dimensi, lalu mengikuti gate budget/Meta. Video asli tidak dikirim.
6. Tidak ada media yang disimpan dalam itinerary. Object URL dilepas dan decoder/canvas dibersihkan dalam `finally`; preview berada di memori komponen dan dihapus ketika sumber diganti/unmount. Ini pelepasan resource, bukan klaim secure memory erasure.

Persiapan lokal memiliki timeout 20 detik dan cancel. Browser/codec yang tidak mendukung input memberikan error dan menawarkan transkrip. Frame adalah sampel; model tidak melihat seluruh video. Header validation Worker bukan antivirus atau validasi codec lengkap. Client-supplied gambar/timestamp juga bukan bukti forensik autentisitas.

## Helper offline

`node scripts/prepare-video-local.mjs <authorized-mp4>` memakai FFmpeg 7.1 yang sudah tersedia dari tooling tutorial. Tidak ada paket/infrastruktur baru. Proses memakai argumen terpisah tanpa shell, protokol file/pipe, format terbatas, timeout, thread/buffer/allocation limit; bukan sandbox codec produksi.

Helper benar-benar mendekode tiga JPEG dan audio mono PCM16 16 kHz bila tersedia. Data decode berada di direktori sementara khusus workspace; absolute path diverifikasi sebelum penghapusan rekursif. Helper tidak terhubung ke Worker atau mengirim audio ke Meta. Binary lama belum diaudit sebagai layanan publik dan tidak boleh dipublikasikan sebagai decoder server yang aman tanpa penguatan terpisah.

## Bukti aktual

Klip **sintetis QA**, bukan wisata: `evidence/phase-2b/synthetic-qa.mp4`, 3 detik, gambar berlabel SYNTHETIC QA dan nada 440 Hz. Dibuat lokal, tanpa orang/data pelanggan.

- CLI: tiga frame 320×180, masing-masing 2.434 byte; audio WAV 96.674 byte; cleanup berhasil. Bukti `evidence/phase-2b/local-media.json`.
- Browser: tiga gambar termuat dengan natural dimensions 320×180 pada 0,45/1,5/2,55 detik. ID/EN dan ponsel diverifikasi; tidak menekan analisis Meta.
- Source, malformed frame, ukuran, timestamp, auth, biaya dan schema diuji dalam suite 398 tes.

## Retensi dan kekurangan

Klip/thumbnail sintetis QA sengaja dipertahankan sebagai fixture bukti; file audio/frame sementara helper dihapus. Media pengguna tidak dipersistenkan oleh alur ini. Jika kelak memakai Files API, perlu lifecycle remote delete/retry yang belum dibuat. Saat ini **tidak ada file Meta yang diunggah**, sehingga tidak ada remote file untuk dihapus.

ASR, pengiriman audio, analisis MP4 native Meta dan demo video wisata nyata masih terbuka. Fallback yang bekerja adalah frame visual + transkrip dari pengguna. Jangan menyebut hasil fallback sebagai pemahaman video/audio penuh.

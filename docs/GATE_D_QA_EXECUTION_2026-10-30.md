# Gate D — Aktivasi QA aktual

Tanggal: 30 Oktober 2026, WIB. Status: aktivasi database selesai; inferensi terhenti pada verifikasi billing/login Meta.

## Lingkup dan hasil nyata

Owner mengizinkan SQL08, SQL02, grant owner-test satu hasil/satu jam, postflight, dan paling banyak satu inferensi setelah seluruh pengaman billing lolos. Target yang diperiksa di dashboard dan digunakan hanya QA `aytrcvfncsklhqozreyk`. Production tidak diakses atau diubah dalam eksekusi ini.

1. Preflight QA PostgreSQL 17.11 cocok dengan snapshot dan fingerprint baseline. Tidak ada pending request, query aktif lain atau write lock yang teramati. Port lokal QA yang dikenal tidak listening. Owner sebelumnya mengonfirmasi tidak ada Worker QA/staging atau mesin lain; ini tetap bukan bukti pemantauan semua proses remote secara kontinu.
2. SQL08 diterapkan melalui SQL Editor dengan attestation QA, guard baseline/fingerprint/owner/ACL/search_path, timeout dan locking. SQL09/read-only postflight lulus: hash ledger dan seluruh riwayat sama sebelum/sesudah migrasi.
3. SQL02 minimum membuat trip_passes, ai_request_reservations, reserve_paid_ai_request dan finish_ai_request. RLS aktif; akses client ke tabel entitlement dan RPC ditolak. service_role memiliki EXECUTE pada kedua RPC dan SELECT trip_passes. Policy trips milik pengguna dipertahankan.
4. Identitas owner dicocokkan ke konfigurasi QA yang sudah direview, menggunakan pasangan ID/email terkonfirmasi; tidak memilih akun arbitrer. Identitas privat tidak dicatat di laporan. Grant minimum berhasil: trip_key account, request_limit 1, requests 0, masa berlaku satu jam, referensi owner-test staging, tanpa transaksi pembayaran.
5. Query agregat sesudah grant: owner_pass_count=1, limit_one=true, allocated=0.35, blocked=false, requests=7, unsettled=0. Expiry `2026-10-29T23:23:16.836808+00:00` = **30 Oktober 2026 06:23:16 WIB**. Ini snapshot saat verifikasi, bukan klaim grant tetap aktif setelah waktu tersebut. Jangan memperpanjang/regrant otomatis.

## Bukti migrasi

| Pemeriksaan | Hasil aktual QA |
|---|---|
| Ledger hash sebelum/sesudah SQL08 | ced9a3856f4820ba506306beb1967107, tidak berubah |
| History hash sebelum/sesudah SQL08 | 76be9babe2d2e1d4be868ffba169f5c6, tidak berubah |
| reserve_meta_video_test baru | 8f29245d1218375afd6f41f958265aa4 |
| settle_meta_video_test baru | 4f8b0935318aec03c4ee94538ab193be |
| meta_video_test_safety_status baru | 9bcc59e6aa797dbe9b5224cb1ee60a5c |
| Ketiga fungsi ledger | owner postgres; SECURITY DEFINER; public, pg_temp; service EXECUTE; anon/authenticated ditolak |
| RLS budget/requests/entitlement/trips | aktif |
| SQL02 RPC | service EXECUTE; anon/authenticated ditolak |
| Batas/alokasi/remaining | USD10 / USD0.35 / USD9.65, tidak diubah |

Screenshot agregat: `../artifacts/gate-d-qa-activation-2026-10-30.png`.

File proposal asli tetap memiliki gate tertutup dan penanda review historis. Jangan menjalankan ulang SQL08/02/03 karena file masih bertuliskan proposal: database telah berubah sesuai hasil aktual di atas. Eksekusi memakai salinan yang disetujui di SQL Editor; tidak mengubah gate file review atau manifest lama.

## Verifikasi dan keterbatasan

- SQL08/02/grant dan SELECT postflight merupakan operasi QA nyata, bukan fixture. Pemeriksaan permission di sini berupa metadata/ACL/RLS; uji HTTP otorisasi normal discovery belum dilakukan setelah aktivasi.
- Bukti sebelumnya digunakan kembali: 130 checks offline PASS, 55 checks PostgreSQL disposable PASS, build normal dan demo PASS, 6 browser fixture checks PASS. Tidak mengulang suite karena tidak ada perubahan kode aplikasi pada langkah ini. Fixture bukan bukti live end-to-end.
- **Inferensi baru: 0.** Tidak ada reserve/settle baru, request supplier, SQL06, reset, perubahan billing/credential, deploy, commit atau push.
- Normal UI → Meta → edit → Save/My Trips → reload belum dibuktikan dengan inferensi baru. Backend profil demo sebelumnya masih tertutup; belum diklaim terhubung live.
- AI Guide yang diminta setelah keberhasilan live belum dikerjakan; tidak mengklaim fixture/fitur lama sebagai AI Guide live.

## Blocker dan tindakan owner

Akses `https://dev.meta.ai/billing` dialihkan ke homepage dengan tombol Login. Tidak ada sesi dashboard billing yang dapat diperiksa saat ini. Sesuai AGENTS.md, login/OTP/otorisasi ditangani owner; agent tidak mencari credential.

Owner perlu login sendiri ke akun/proyek Meta Hackathon yang benar pada tab Meta. Jangan kirim key, OTP, atau token. Setelah login, perlu bukti provider tentang saldo kredit eligible untuk model yang digunakan, masa berlaku bila tersedia, prioritas kredit, dan perlindungan agar satu request tidak membebankan metode pembayaran pribadi di luar izin. Asal kredit Hackathon sudah dikonfirmasi owner; tidak perlu dikonfirmasi ulang.

Saldo historis USD149.96 dan informasi bahwa saldo tagihan tidak bertambah saat free credit aktif bukan bukti kondisi saat ini atau hard spending stop. Notifikasi email budget bukan hard cap. Tidak mengubah billing untuk menyelesaikan blocker ini.

**NO-GO untuk inferensi saat ini.** Setelah billing terbukti aman, lanjut wiring QA yang terisolasi, cek entitlement belum kedaluwarsa serta akses owner-only, kemudian satu aksi eksplisit dengan prompt owner, tanpa retry. Jika grant sudah kedaluwarsa, laporkan dan minta otorisasi regrant; jangan membuatnya sendiri. Setelah live itinerary benar-benar berhasil barulah lanjut AI Guide dan rekaman/submission.

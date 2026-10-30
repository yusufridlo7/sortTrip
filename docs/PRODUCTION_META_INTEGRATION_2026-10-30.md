# Integrasi production — 30 Oktober 2026

Status: IMPLEMENTED LOCALLY, belum deploy; schema proposal belum dieksekusi/diuji PostgreSQL.

Bukti read-only production: artifacts/production-meta-compatibility-2026-10-30.json. PostgreSQL 17.6; trips, trip_passes, ai_request_reservations dan RLS tersedia. reserve_paid_ai_request dan ledger Meta belum tersedia. Tabel riwayat supabase_migrations.schema_migrations tidak ditemukan; ini bukan bukti tidak pernah ada migrasi.

Perubahan lokal: worker/meta-environment.js, worker/meta-video-budget.js, worker/video-itinerary.js; produksi memakai RPC ledger tersendiri dan hanya normal discovery berlangganan. Tidak memakai injected QA ledger. Kedua config Wrangler production menetapkan cutoff 2026-11-04T17:00:00Z dengan aktivasi Meta/budget false. UI polish brand-theme tetap masuk build dist. Tidak memasukkan Access/staging auth.

Validasi: 30/30 tests PASS, 0 FAIL (artifacts/production-meta-focused.tap). TypeScript + Vite production build PASS (artifacts/production-build-2026-10-30.log). Ini pengujian lokal/offline, bukan bukti deployment atau inferensi production.

Proposal SQL: production-proposal/01_PAID_DISCOVERY.sql menambah wrapper paid discovery dan SELECT service_role dengan guard fingerprint produksi. 02_META_LEDGER.sql membuat ledger kosong, RLS aktif tanpa akses klien, RPC service-only dengan global pending lock, duplicate protection, settlement idempotent, unknown usage blocked, output 2000/input20000, reservasi permanen USD0.05. Default biaya 0 dan blocked=true; tidak menyalin saldo/grant QA. Keduanya approval gate false dan belum dijalankan. SQL baru perlu rehearsal terarah sebelum penerapan; bukti rehearsal QA lama tidak mencakup SQL baru ini.

Blocker: persetujuan perubahan izin/schema production dan batas biaya production, verifikasi binding credential Meta production secara privat oleh owner, serta rehearsal SQL production. Jangan menyalin credential QA. Tidak membuat entitlement; gunakan Trip Pass sah yang ada. Tidak ada inferensi/deploy/commit/push atau perubahan database.

Langkah owner: tinjau dua SQL, setujui penambahan schema/ACL server-only dan tentukan cap production (maksimal USD10; alokasi QA sebelumnya tidak direset). Setelah persetujuan: rehearsal SQL, konfigurasi credential oleh owner bila belum ada, aktivasi budget dengan SQL terpisah yang ditinjau, validasi binding produksi, baru deployment Worker existing. Cutoff tidak boleh diperpanjang. Setelah deploy uji web/login/manual edit/save/My Trips tanpa inferensi otomatis. Rollback aplikasi ke versi terdahulu/disable Meta; jangan hapus ledger atau history. AI Guide/submission menunggu alur production terbukti.

## Persetujuan owner — batas production USD100
Owner menyetujui schema/izin server-only yang diajukan dan mengganti batas production menjadi USD100. Deadline tetap 2026-11-04T17:00:00Z (5 November 2026 00.00 WIB). Persetujuan ini menggantikan permintaan persetujuan cap USD10 di atas. Adapter lokal dan constraint proposal telah disesuaikan; QA tetap USD10, reservasi per request tetap USD0.05. Tests terarah terbaru 31 PASS/0 FAIL. Belum ada aktivasi database/deploy atau perubahan billing provider. Rehearsal dan pemeriksaan deployment masih diperlukan; jangan meminta ulang persetujuan yang sudah diberikan. Cap ledger membatasi alokasi aplikasi ini, bukan seluruh pemakaian akun Meta oleh aplikasi lain.

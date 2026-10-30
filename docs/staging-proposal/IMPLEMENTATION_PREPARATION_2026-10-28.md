# Persiapan Implementasi Staging SortTrip

**28 Oktober 2026 · Working tree lokal · Belum deploy/SQL/inferensi nyata**

Persiapan kode mengikuti arsitektur audit yang disetujui. URL tujuan tetap usulan `https://sorttrip-staging.yusufridlo7.workers.dev/`; belum dibuat atau diuji sebagai layanan online. Generasi Meta dan kesiapan anggarannya **nonaktif** di konfigurasi staging. Tidak ada key, billing, quota, alokasi atau blocked yang diubah.

## 1. Implementasi yang disiapkan

| Berkas | Fungsi |
|---|---|
| [wrangler.staging.jsonc](../../wrangler.staging.jsonc) | Worker independen, ASSETS dist-staging, semua request Worker-first; tanpa KV/browser/cron production; preview URL nonaktif; identitas Access/owner UNCONFIGURED. |
| [vite.staging.config.js](../../vite.staging.config.js), [staging.html](../../staging.html) | Build terpisah tanpa root environment/public directory/skrip tracking production. URL QA tetap; hanya binding publishable QA yang sudah tersedia di qa-config/meta atau input publik staging eksplisit. Environment Supabase umum dari proses ditolak. |
| [worker/staging-access.js](../../worker/staging-access.js) | Verifikasi kriptografi JWT Access RS256 dengan JWKS dari issuer yang diizinkan. Periksa signature, issuer, audience, expiry, iat/nbf, email owner dan host. Header jku/jwk/x5u tidak diterima. |
| [worker/staging.js](../../worker/staging.js) | Routing deny-by-default; aset juga membutuhkan Access. API memverifikasi UUID/email/session owner terhadap Auth QA sebelum supplier/AI. Tidak menerima preview bypass, payment, booking, support, atau AI lama. |
| [app/staging-entry.tsx](../../app/staging-entry.tsx) | Shell owner: bootstrap proyek QA → login → verifikasi owner → pencarian/prompt → editor WorldPlanner → Save/Perjalanan saya memakai databaseTrips/RLS yang sudah ada. Banner STAGING/QA permanen. |
| [app/api-fetch.ts](../../app/api-fetch.ts) | Menambahkan session hanya pada API origin staging; URL luar/non-API ditolak. Perilaku produksi tetap fetch biasa. |
| [scripts/staging-verify.mjs](../../scripts/staging-verify.mjs) | Memeriksa build/config terpisah, flag AI nonaktif, URL proyek, larangan URL production/server-key/fixture, dan entry index. Nilai credential tidak ditampilkan. |
| [scripts/staging-smoke.mjs](../../scripts/staging-smoke.mjs) | Smoke negatif untuk URL staging setelah deployment/izin terpisah. Tanpa flag remote-approved tidak mengirim request. Tidak login, reservasi, inferensi atau transaksi. |

Model discovery sekarang memakai batas **2.000 output token yang sama dengan ekstraksi dan guard SQL**, bukan4.000. Instruksi meminta hasil lengkap yang ringkas, dengan preferensi satu opsi. Output yang tidak lengkap tetap gagal validasi; tidak ada retry otomatis atau kenaikan batas. SQL ledger lama tidak diubah.

Account-pass staging memakai `/api/assistant/access`, tetap reservasi melalui `reserve_paid_ai_request` dan penyelesaian melalui `finish_ai_request`. Tidak ada pemberian hak dari browser. Hak yang belum tersedia tidak mengarahkan owner membeli ulang. Checkout dan aksi supplier transaksional tidak tersedia; Google Maps eksternal tetap dapat digunakan, pencarian Google Routes berbayar dinonaktifkan pada UI staging dan ditolak router.

Adapter supplier yang disiapkan adalah fungsi Travelpayouts/Aviasales Data API yang sudah ada, dipanggil langsung oleh Worker staging melalui endpoint baca tetap, redirect manual, pembatasan respons dan timeout. Tidak ada proxy ke Worker production atau cache/KV production. **Tidak ada credential supplier yang dipasang/dipindahkan**; jika binding staging tidak tersedia, respons SUPPLIER_UNAVAILABLE dan harga tidak dibuat-buat. Hotel/Viator belum diaktifkan pada lingkup staging ini.

## 2. Hasil verifikasi lokal

- **477 tes regresi lulus**, 0 gagal/skip, termasuk 23 tes staging.
- TypeScript, bundling Worker lokal dan build staging lulus; verifikasi build menyatakan qaProjectOnly=true dan generationDisabled=true.
- Build aplikasi biasa juga lulus, tanpa deployment. Peringatan ukuran bundle yang sudah ada tetap muncul.
- Pemeriksaan bahasa:1.680 kunci,0error dan0literal JSX tak diterjemahkan yang terdeteksi.
- Uji staging menggunakan kunci RSA sementara dan respons jaringan **fixture**, bukan Access/Supabase/Meta/supplier nyata. Tercakup: signature palsu, issuer/audience/email/waktu salah, JWKS redirect/outage, pengguna lain/wrong-project, origin asing, jalur terlarang, AI nonaktif sebelum reservasi, paid gate, header supplier, pembatasan auth klien dan batas token2.000.
- Perbandingan source menunjukkan tidak ada perubahan pada wrangler.jsonc, wrangler.meta-qa.jsonc, vite.config.js, vite.meta-qa.config.js atau supabase/meta-video-budget.sql dalam pekerjaan persiapan ini.

Bukti di artifacts/: staging-tests.log, staging-full-tests.log, staging-typecheck.log, staging-build.log, staging-production-build.log, staging-worker-build.log, staging-i18n.json. Persiapan ini **bukan** bukti penerimaan browser staging atau Meta→supplier→Save/reload nyata. Jangan memakai477 tes sebagai pengganti uji tersebut.

Perintah lokal tanpa deployment:

```powershell
npm run test:staging
npm run build:staging
npm run verify:staging
npm run build:staging-worker
```

Build frontend menghasilkan dist-staging; bundling Worker menghasilkan artifacts/staging-worker.mjs. Keduanya diabaikan Git. Bundling esbuild lokal bukan validasi deployment Cloudflare atau izin memublikasikan. Belum ada perintah deploy otomatis di npm scripts.

## 3. SQL QA: urutan dan instruksi owner

**Tidak ada SQL yang dijalankan oleh agent.** Seluruh file berada di folder dokumen usulan, bukan jalur migrasi otomatis. Langkah2/3 di bawah merupakan perubahan database dan membutuhkan persetujuan owner tersendiri.

### Langkah1 — diagnosis baca-saja HTTP 429

1. Buka dashboard Supabase sendiri dan pilih proyek QA **aytrcvfncsklhqozreyk**. Cocokkan URL proyek, jangan pilih production tznxfgosmjcmwoszvkdk.
2. Buka Auth → Users. Ambil UUID akun owner QA yang **sudah ada** secara privat, bukan production UUID. Jangan kirim UUID, key, password atau token ke chat.
3. Buka [01_READ_ONLY_DIAGNOSTIC.sql](sql/01_READ_ONLY_DIAGNOSTIC.sql). Pada salinan di SQL Editor, ganti `REPLACE_WITH_EXISTING_OWNER_QA_UUID` dengan UUID tersebut. Jangan mengubah file credential.
4. Setelah review/izin owner, jalankan seluruh skrip termasuk BEGIN READ ONLY dan COMMIT. Tidak memanggil Meta, membuat reservasi atau menulis ledger.
5. Bagikan hanya hasil agregat/boolean: schema presence, selected_owner_found, allocated/remaining, blocked, jumlah alokasi/pending/unsettled, output di atas2.000, kondisi penolakan dan sidik fungsi. Tidak perlu identitas akun.
6. Jika owner tidak ditemukan, berhenti dan periksa pilihan akun. Jika ledger/tabel dasar hilang, berhenti; jangan membuat ulang/reset. Jika blocked, kapasitas tidak cukup atau ada unsettled, jangan lanjut ke pemberian pass/inferensi. Snapshot menjelaskan keadaan saat dibaca, belum tentu insiden lama.

**Tidak boleh** mengganti langkah ini dengan meta-video-budget-probe.sql atau skrip konkurensi historis: skrip tersebut melakukan write sementara.

### Langkah2 — schema entitlement minimum, setelah izin perubahan database

Tinjau [02_MINIMUM_QA_ENTITLEMENT_SCHEMA_PROPOSED.sql](sql/02_MINIMUM_QA_ENTITLEMENT_SCHEMA_PROPOSED.sql). Proposal dua tabel dan dua RPC ini hanya untuk discovery staging, bukan seluruh schema produk lama. Schema trips/RLS dan ledger dollar tetap.

Skrip berhenti bila objek sudah ada. Jika diagnosis menunjukkan schema telah berubah sejak audit, minta penyesuaian delta; jangan drop objek atau mengulang bundle lama untuk memaksa lulus. Periksa lagi proyek QA sebelum owner menjalankan SQL. Sesudah perubahan yang disetujui, gunakan [04_READ_ONLY_POST_SCHEMA_VERIFICATION.sql](sql/04_READ_ONLY_POST_SCHEMA_VERIFICATION.sql) untuk memeriksa privilege/RLS. Harapan: RLS aktif; tabel entitlement tidak terbaca oleh anon/authenticated; RPC server-only; tiga policy own-user trips tetap. Ini bukan pengganti uji negatif dua akun. SQL belum diuji dengan server Postgres dalam tugas ini.

### Langkah3 — hak uji owner, setelah izin pemberian entitlement

Tinjau [03_OWNER_TEST_ENTITLEMENT_PROPOSED.sql](sql/03_OWNER_TEST_ENTITLEMENT_PROPOSED.sql). Ganti placeholder UUID secara privat pada SQL Editor QA. Proposal memberi **dua hasil berhasil/24 jam**, bertanda owner-test:staging:, bukan pembayaran palsu atau salinan langganan production.

Skrip menolak pass yang sudah ada, email belum terkonfirmasi, blocked/unsettled, atau sisa kapasitas tidak cukup untuk dua percobaan. Tidak ada reset/grant ulang/rotasi akun. Hak hasil AI ini tidak menambahUSD10 global, USD 0,05/request atau10 alokasi/user. Jika salah satu guard menolak, laporkan hasil dan berhenti untuk keputusan terpisah.

## 4. Konfigurasi privat dan akses — belum dilakukan

Owner perlu mengonfirmasi host, identitas Cloudflare Access dan UUID/email QA secara privat. Setelah persetujuan, isi binding server staging saja:

- STAGING_OWNER_QA_USER_ID, STAGING_OWNER_EMAIL.
- CF_ACCESS_ISSUER berupa issuer team resmi HTTPS *.cloudflareaccess.com, tanpa slash akhir, dan CF_ACCESS_AUD sesuai aplikasi Access.
- QA SUPABASE_PUBLISHABLE_KEY dan SUPABASE_SECRET_KEY. Jangan menggunakan SUPABASE_SERVICE_ROLE_KEY production; staging menolaknya.
- META_MODEL_API_KEY untuk pengujian QA dan TRAVELPAYOUTS_API_TOKEN baca hanya bila pemakaiannya pada staging telah disetujui owner/partner. Jangan menyalin .dev.vars/.env production atau membuat key baru dalam tugas ini.

Frontend menggunakan publishable key QA yang sudah disediakan owner pada qa-config/meta; alternatif CI adalah STAGING_PUBLIC_PUBLISHABLE_KEY yang eksplisit. Key server/Meta tidak boleh berada di frontend. Root environment tidak dimuat; VITE_SUPABASE_URL/VITE_SUPABASE_PUBLISHABLE_KEY dari process environment ditolak untuk mencegah pewarisan keliru.

Atur Access deny-by-default untuk host staging; hanya owner. Tetap validasi assertion dalam Worker. Konfigurasikan Site URL dan redirect Auth **QA saja** ke origin staging; tinjau signup QA. UI staging tidak menyediakan signup, tetapi pembatasan UI bukan pembatasan Auth server.

Jangan mengubah konfigurasi production. Semua resource runtime/metode auth masih perlu diverifikasi setelah konfigurasi owner; tidak ada jaminan Access sudah tersedia hanya karena kode siap.

## 5. Checklist deployment — izin terpisah, belum dijalankan

- [ ] Hasil diagnosis429 ditinjau; tidak ada unblock/reset/kenaikan limit otomatis.
- [ ] Host/akun Cloudflare benar, owner Access/QA cocok, schema dan pass diverifikasi owner.
- [ ] Access mencakup semua asset/API; preview/host alternatif tidak memberi jalan masuk.
- [ ] Jika Access baru dapat dikaitkan setelah Worker ada, versi awal harus tetap UNCONFIGURED dan mengembalikan503 untuk semua request. Jangan membuka konfigurasi akses sebelum Access siap.
- [ ] Build/scan staging lulus; dist-staging tidak mengandung URL production, secret atau fixture. Cocokkan identity runtime dengan frontend sebelum login/Save.
- [ ] Tidak ada production KV/browser/cron, pembayaran/booking, outbox, webhook atau fallback production.
- [ ] STAGING_GENERATION_ENABLED, META_VIDEO_TEXT_ENABLED, META_VIDEO_FRAMES_ENABLED dan META_VIDEO_BUDGET_READY tetap false.
- [ ] Owner secara terpisah menyetujui deploy staging. Jangan memakai config/name production.

Contoh perintah untuk **tahap deploy yang belum diizinkan**, bukan perintah untuk dijalankan sekarang:

```powershell
npx wrangler deploy --config wrangler.staging.jsonc --keep-vars
```

`--keep-vars` hanya untuk mempertahankan konfigurasi **Worker staging** yang ditinjau owner, bukan membawa variable production. Pada deploy pertama, placeholder memang harus gagal tertutup. Nomor namespace limiter baru901028 belum diprovisikan/diverifikasi pada akun Cloudflare; pastikan terpisah dan tetap5/60 detik.

Setelah izin deployment dan URL benar-benar ada, smoke negatif dapat dijalankan dengan izin owner:

```powershell
node scripts/staging-smoke.mjs --remote-approved
```

Tanpa flag itu tidak ada request. Smoke hanya memeriksa penolakan tanpa login dan menolak redirect ke production. Smoke negatif tidak membuktikan alur authenticated berhasil.

## 6. Uji nyata yang masih membutuhkan izin

Setelah diagnosis, schema, Access, deployment dan izin pemakaian Meta lengkap: owner login QA → prompt ringkas Hanoi/Vietnam lima hari → **satu inferensi Meta nyata** → minimal satu hasil tiket supplier nyata atau kasus kosong yang dinyatakan belum memenuhi penerimaan harga → buka pilihan tanpa panggilan AI kedua → edit → Save → reload → buka Perjalanan saya.

Cocokkan tanggal, seluruh malam, jumlah pelancong/asumsi kamar, subtotal dan label harga tidak tersedia. Hotel/transportasi/wisata tidak boleh dianggap gratis. Verifikasi penolakan identitas lain serta trips RLS, bahasa ID/EN dan layout browser. Save memakai session pengguna, bukan server key.

Semua flag generasi tetap false sekarang. Pengaktifan di kemudian hari memerlukan izin tersendiri; jangan menaikkan batas atau mengulang otomatis jika request gagal. LedgerUSD10 hanya membatasi adapter ini, bukan seluruh aktivitas lain yang mungkin memakai akun/API provider sama.

## 7. Rollback dan blocker

Rollback dimulai dengan menutup Access/nonaktifkan generasi staging; nonaktifkan route atau pulihkan versi Worker/asset staging terkunci. Pertahankan trips, ledger dan counter. Rollback kode tidak membalikkan perubahan database. Pengakhiran pass/pencabutan grant adalah tindakan owner tersendiri; jangan drop tabel/reset alokasi/clear blocked. Periksa production tetap pada host/proyek/versi yang sama tanpa inferensi atau write production.

**Blocker yang tersisa:** hasil diagnosis429 aktual; keputusan jika kapasitas habis/blocked; verifikasi SQL pada QA; identitas Access/owner; scope credential supplier; proteksi dan deployment staging; serta penerimaan browser/Meta/supplier/Save nyata. Frame/video dan editor AI OpenAI lama belum dibuka pada staging. Alur Phase2C lokal yang sudah ada dipertahankan dan regresinya lulus.

**Status akhir:** hanya persiapan lokal. Tidak ada SQL, database permission, credential, billing, quota/ledger, blocked, deployment, commit/push, inferensi nyata, Tahap3 atau fitur native yang diubah/dijalankan. Menunggu persetujuan sebelum tindakan owner/database, deployment dan inferensi berbayar.

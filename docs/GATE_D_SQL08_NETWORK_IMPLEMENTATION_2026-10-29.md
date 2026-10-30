# Gate D — SQL08 hardening dan isolasi demo QA

29 Oktober 2026. Implementasi lokal selesai; **live Meta dan QA migration tetap NO-GO**. Tidak SQL, API live, billing, deployment, commit/push. Recovery tidak diulang. Ledger terakhir0,35/9,65/false/7/0 tidak disentuh.

## Berkas yang berubah

- SQL08 proposal: `docs/staging-proposal/sql/08_PROPOSED_GLOBAL_META_GUARD.sql`; tambah SQL09 read-only postflight dan `docs/staging-proposal/rehearsal/{README.md,02_assertions.sql,03_connection_a.sql,04_connection_b.sql}`.
- `scripts/prepare-gate-d-rehearsal.mjs`: generator file sintetis saja, tanpa koneksi database.
- `lib/gate-d-network.mjs` dan deklarasi `.d.mts`: keputusan profil dan allowlist fetch QA.
- `vite.gate-d-demo.config.js`, `main.jsx`, `app/assistant-discovery.tsx`, `package.json`: profil eksplisit, instalasi fetch guard, skip pricing dan banner unavailable.
- `checks/gate-d-isolation.test.mjs`, `checks/gate-d-safety.test.mjs`, `scripts/qa-gate-d-browser.mjs`: tes tambahan/penyesuaian pemeriksaan statis guard agar tidak menganggap baseline0,35 sebagai reset0.
- Laporan ini serta catatan Gate D/progress/next actions/decisions. Semua pekerjaan lama dipertahankan.

## SQL08

Table lock EXCLUSIVE NOWAIT sekarang sebelum seluruh preflight; lock_timeout2s dan statement_timeout10s. Attestation project UNVERIFIED tetap fail-closed. Bila setting app.settings.supabase_url tersedia, mismatch juga membatalkan; identitas proyek tidak bisa dijamin dari setting PostgreSQL yang dapat diedit admin, sehingga owner tetap memverifikasi dashboard.

Preflight pin snapshot recovered0,35/false/7/0, satuoveroutput/max2305/nootheroverrun; fungsi lama dan absence statusv2 dipin; unexpected trigger ditolak. Owner fungsi/current_user harus postgres, SECURITY DEFINER, search_path public,pg_temp, service EXECUTE, ACL hanya owner/service dan tanpa service grant option. Actual owner berbeda => STOP, bukan reassignment. Guard harus direview dengan metadata aktual sebelum apply.

Postflight sebelum COMMIT membandingkan hash seluruh data request dan ledger; verifikasi ulang owner/search_path/ACL/service/anon/auth pada ketiga fungsi. Migration tidak memanggil reserve/settle atau mengubah records. Tidak menaikkan10USD/0,05/10user/20kinput/2koutput. Penolakan pending global dan unknown usage tetap tanpa expiry/refund; worker baru gagal sebelum reserve bila status belum ada. Fingerprint berubah setelah migrasi dan SQL06 lama tidak boleh diulang.

Rehearsal positif, negatif, concurrency dua koneksi, expected result, stop conditions dan rollback ada di README rehearsal. **Disiapkan, tidak dieksekusi.** Kesiapan: proposal lebih kuat dan siap direview/rehearsal; belum terverifikasi syntax/runtime PostgreSQL sehingga belum siap QA deploy.

## Isolasi UI QA

Mode `qa-preparation` + flag compile VITE_GATE_D_DEMO=true + URL QA persis wajib bersamaan. Production/staging/wrong project/flagfalse tidak mengaktifkan guard. Config tidak membaca env rahasia, tidak memasang inference proxy atau supplier adapter. Backend persiapan tetap deny-by-default503.

Discovery normal tetap access+discover dengan sesi, tanpa preview; pricing recommendations dan fetchFlights dilewati seluruhnya. Harga selalu unavailable, diberi banner ID/EN. Tidak mencampur cache C2 bertanggal berbeda menjadi paket. Fetch guard menolak endpoint supplier, OpenAI/Meta langsung, preview, video legacy, /api/itinerary dan semua origin selain allowlist; auth QA dan REST trips tetap tersedia agar mekanisme Save/My Trips normal tidak diubah. Ini containment fetch aplikasi, bukan jaminan terhadap browser extension atau kode berbahaya yang mengganti guard. CSP QA dan router off tetap berlaku. Tidak ada perubahan entitlement/RLS.

## Hasil tes aktual

- `npm run test:gate-d`: **130 PASS / 0 FAIL / 0 SKIP** — `artifacts/gate-d-hardened-tests.tap`.
- `npm run build:gate-d-demo`: **PASS** TypeScript/Vite — `artifacts/gate-d-isolation-build.log`.
- `npm run build`: **PASS** TypeScript/Vite normal — `artifacts/gate-d-hardened-build.log`. Warning dynamic-import/plugin-timing existing, bukan kegagalan.
- Browser asli UI, Chrome headless, enam pemeriksaan **PASS**: normal route fixture; satu discovery; nol pricing/generator kedua; edit; Save/My Trips/full reload; mobile390 tanpa overflow. API teramati: session, access, discover, session setelah reload. **External0 / pageErrors0 / supplier0 / model tambahan0**. Artifact `artifacts/gate-d-isolation/browser-results.json`, `editor.png`, `editor-mobile.png`.

Browser auth/entitlement/model/database seluruhnya fixture eksplisit. Ini membuktikan alur UI dan network isolation offline, bukan live entitlement/Meta/Save-RLS. Peluncuran Chromium awal gagal; Chrome terpasang berhasil setelah server dan browser tes dijalankan pada lingkungan localhost yang sama. Tidak ada provider API yang diizinkan oleh script test. Browser ditutup setelah tes; server pengujian dihentikan setelah verifikasi.

## Readiness dan approval berikut

- Offline demo UI **READY untuk review**; alur live tetap tertutup. Perintah profil tersedia `npm run dev:gate-d-demo`, namun server tidak mengaktifkan Meta.
- SQL08 **READY untuk review/rehearsal, NOT READY untuk QA apply** sampai PostgreSQL rehearsal dan metadata ownership/search_path aktual terbukti.
- Entitlement QA masih belum ada berdasarkan diagnosis sebelumnya; tidak dibuat ulang/fake pada pekerjaan ini. Schema/owner-test entitlement memerlukan review/approval terpisah; jangan memakai preview sebagai bypass.
- Provider grant coverage/model/expiry/credit priority/hard paid-spill controls belum dibuktikan lengkap. Konfirmasi asal Hackathon owner tetap diterima; tidak mengubah billing.
- Approval yang diperlukan: menjalankan SQL pada **cluster disposable lokal** untuk rehearsal; sesudah lolos, versi final SQL08 di QA serta perubahan schema/owner-test entitlement yang disetujui; terakhir aktivasi backend QA dan satu aksi Meta live setelah seluruh safety gates lolos. Tidak perlu izin recovery lagi dan jangan SQL06.

Rekomendasi: review SQL08 beserta file rehearsal, lalu izinkan rehearsal disposable saja terlebih dahulu. Submission boleh menyebut offline demo teruji; belum boleh mengklaim live Meta E2E, partner refresh atau PostgreSQL concurrency nyata berhasil. Gate E tidak dimulai.

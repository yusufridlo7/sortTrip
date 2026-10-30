# Gate A — Implementasi konfigurasi QA

**28 Oktober 2026 · Selesai secara lokal; aktivasi environment nyata NO-GO.**

## Hasil

Konfigurasi eksplisit telah disiapkan untuk UI asli **index.html → main.jsx → AuthApp → TravelApp**. Tidak membuat shell/demo/editor baru. Port5176 tetap profil QA;5173/5175 dan production tidak diubah.

Loader hanya membaca file owner-managed `.sorttrip-qa/public-connection.local.json`, bukan root env atau process credential. File belum ada ketika diperiksa; tidak dibuat/diisi oleh agent. Config dibatasi ukuran/schema, symlink/path redirect ditolak, exception tidak menampilkan isi file. Folder diabaikan Git dan diblokir dari Vite file serving. Tidak ada key/identitas privat dibaca, ditampilkan, dipindahkan atau ditulis pada tugas ini.

Evaluator menggunakan validator Sprint2 dan menolak URL selain QA exact, key kosong/malformed/secret/service-role atau legacy wrong-project, owner/redirect/resource proof yang belum lengkap. Modern publishable key membutuhkan verifikasi asal proyek oleh owner; review diikat ke SHA256 key yang diperiksa, bukan dianggap terbukti dari prefix. Ini adalah attestation lokal, bukan cryptographic authentication atau bukti dashboard aktif.

## Activation gate

| Kondisi | Pengaman | Bukti sekarang |
|---|---|---|
| QA project exact | URL `https://aytrcvfncsklhqozreyk.supabase.co`, origin lokal/staging exact | Source/mock/build PASS |
| Public key milik QA | Validator + `publicKeyProjectVerified` + digest cocok | Key aktual belum tersedia; **UNVERIFIED** |
| Identitas owner | Format UUID/email + review eksplisit; Worker tetap Auth QA owner check | Identitas aktual **UNVERIFIED** |
| Remote Access | Review issuer/audience/owner sesuai target; Worker signature/JWKS actual tetap otoritatif | Dashboard **UNVERIFIED** |
| Redirect/Auth config | Site/redirect exact target, tanpa wildcard/production/alternate host | Dashboard **UNVERIFIED** |
| Tanpa production inheritance | No env fallback, fixed file/schema/project, resource review dan existing staging guards | Source/mock verified; resource remote belum diverifikasi |
| Izin berikutnya | `nextStepAuthorization=GATE_B_QA_AUTH` **dan** independent compile authorization | Tidak diberikan/diaktifkan pada Gate A |

Keluaran eligibility dapat true pada fixture yang lengkap, tetapi `authEnabled=false` pada default. Kedua profil Vite tetap memakai default `allowAuthentication=false`; API paid/supplier/booking tidak dibuka. Lokal offline tidak dituntut mempunyai token Access, sedangkan remote staging wajib menjalani proteksi nyata. Localhost bukan bukti remote Access aman.

## Berkas berubah

- Baru: `qa-config/gate-a.mjs`, `qa-config/gate-a.example.json`, `scripts/qa-config-status.mjs`, `checks/gate-a.test.mjs`.
- Wiring: `qa-config/original-ui.mjs`, `vite.staging.config.js`, `.gitignore`, `package.json` (`qa:config:check`).
- Panduan: [GATE_A_OWNER_SETUP_2026-10-28.md](GATE_A_OWNER_SETUP_2026-10-28.md), laporan ini dan project-memory update.
- `app/supabase.ts`, AuthApp, databaseTrips, Worker Access validator, schema/RLS, provider routes dan paid limits tidak diubah lagi pada Gate A. Seluruh worktree lama dipertahankan; tidak ada commit/push/deploy.

## Verifikasi

**50 PASS, 0 FAIL, 0 SKIP**, targeted local tests pada Gate A + QA config/routes + existing staging security. Dua belas tes Gate A baru mencakup config valid, empty/malformed/server/service-role key, production/wrong URL, stale key attestation, owner belum verified, remote Access hilang, redirect salah, resource/authorization gate false, invalid JSON/oversize/schema dan perlindungan ignored file. Kontrak staging existing menguji signature/host/origin/non-owner, supplier off/missing, AI flags accidental true, dan booking/payment denial. Semua layanan/network/database/ledger adalah mock; tidak ada panggilan nyata.

- `npm run build:qa-preparation`: **PASS** (TypeScript/Vite).
- `npm run build:staging`: **PASS**;49file scan, QA-only dan generation disabled true. Warning chunk/dynamic import nonfatal existing tetap ada.
- `npm run qa:config:check`: `CONFIG_MISSING`, `publicBindingPresent=false`, `eligibleForNextReview=false`, `authenticationEnabled=false`, `remoteAccessActuallyVerified=false`. `qaProjectOnly=false` di output ini berarti **config owner belum ada**, bukan frontend beralih production; define frontend tetap QA.
- Source Access existing: `worker/staging-access.js` masih memeriksa RS256/JWKS, issuer/audience/expiry, owner email/QA UUID dan exact hostname; `worker/staging.js` menjaga asset/API/foreign Origin. Settings cloud tidak diperiksa/dimodifikasi.

Bukti: [targeted tests](../artifacts/gate-a/targeted-tests.log), [build QA](../artifacts/gate-a/build-qa.log), [build staging](../artifacts/gate-a/build-staging.log). [Browser QA desktop1280/mobile390](../artifacts/gate-a/browser-results.json) **PASS**,0externalrequests/0pageerrors: UI asli, manual draft, pratinjau MP4 dan auth/Save/Guide/Nearby fixtures. Bukan login, database atau dashboard nyata.

## Redirect dan langkah owner

Panduan owner mencantumkan dashboard QA exact, public-key category, config file, fingerprint/check command, serta target:

- Lokal: Site URL/redirect `http://127.0.0.1:5176/`.
- Staging nanti: Site URL/redirect `https://sorttrip-staging.yusufridlo7.workers.dev/`.

Satu Site URL Supabase dipilih untuk snapshot lingkungan yang ditinjau, bukan dua sekaligus. Password login existing tidak menambahkan OAuth callback baru. Settings Auth/Access hanya ditinjau owner; perubahan dashboard tidak diotorisasi oleh implementasi kode ini. Penjelasan didasarkan pada [dokumentasi API keys Supabase](https://supabase.com/docs/guides/getting-started/api-keys), [redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls), dan [validasi JWT Access](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/), bukan pembacaan dashboard owner.

## GO / NO-GO dan Gate B

**GO untuk review mekanisme lokal Gate A. NO-GO untuk menyatakan Gate A environment lengkap atau mengaktifkan Auth.** Yang belum ada: public binding yang diverifikasi owner, owner identity, review Auth redirect/resources dan Access remote. Jika public key tidak dapat dipastikan berasal dari QA, berhenti meminta owner memverifikasi, bukan mencoba key ke API.

Langkah berikut yang tepat: owner mengikuti panduan secara privat dan melaporkan status verifikasinya saja, tanpa key/UUID/token. Setelah semua Gate A terbukti, minta **persetujuan Gate B khusus login dan disposable QA Save/reload/update/RLS**, sekaligus meninjau wiring aktivasi compile/backend/CSP. Jangan menyalakan Auth dari key saja; jangan merestart QA backend lama yang memiliki flags Meta true. Remote staging memerlukan izin deployment Gate E tersendiri sebelum pembuktian online bila belum ada environment owner-only.

Tidak ada real authentication, account/DB writes, SQL, Meta inference, ledger recovery, supplier API, payment, booking, production/dashboard changes atau deployment. Berhenti setelah Gate A preparation; Gate B tidak dimulai.

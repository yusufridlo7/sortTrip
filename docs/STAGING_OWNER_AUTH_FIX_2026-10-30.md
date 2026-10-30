# Perbaikan akses owner staging

**Status: kode siap konfigurasi; deployment NOT READY.**

Berkas: `qa-config/gate-a.mjs`, `original-ui.mjs`, `staging-connection.example.json`; `vite.staging.config.js`; `worker/staging.js`, `qa-read-routes.js`; `scripts/staging-verify.mjs`; dua berkas tes autentikasi.

Login tetap AuthApp/Supabase QA existing. Konfigurasi remote terpisah, tanpa promosi persetujuan localhost. Server tetap memvalidasi signature/issuer/audience/expiry JWT Access, email owner, serta UUID/email terkonfirmasi melalui QA Auth. Anonymous/non-owner ditolak. Build guard menolak auth-off atau mismatch konfigurasi frontend/Worker. Meta/supplier tetap tertutup; cutoff/entitlement/ledger/SQL/UI/production tidak diubah.

**Owner:**

1. Buat aplikasi Cloudflare Access untuk seluruh host `sorttrip-staging.yusufridlo7.workers.dev`; Allow hanya email owner, tanpa Bypass/Everyone. Ambil team issuer dan AUD resmi, jangan menebak.
2. Pada QA Authentication URL Configuration, tinjau Site URL dan redirect tepat `https://sorttrip-staging.yusufridlo7.workers.dev/`; jangan mengubah production.
3. Isi `.sorttrip-qa/staging-connection.local.json` dari template, memakai identitas/publishable key QA yang sudah diverifikasi; jangan menyalin URL localhost. Lengkapi fingerprint/review setelah verifikasi nyata.
4. Cocokkan empat binding owner/Access di `wrangler.staging.jsonc` dengan file privat. Pasang `SUPABASE_PUBLISHABLE_KEY` QA pada Worker staging secara privat. Tidak perlu service-role atau Meta key untuk login. Jangan kirim key/token melalui chat.

Tes terarah: 25 PASS; pemeriksaan akhir auth/local regression 12 PASS. TypeScript/Vite compile dan Worker bundle PASS; release verification **BLOCKED** `STAGING_OWNER_AUTH_NOT_CONFIGURED` karena file remote belum ada.

Berikutnya: owner menyelesaikan konfigurasi, lalu verifikasi ulang sebelum approval deploy. Tidak deploy/commit/push atau panggilan API nyata.

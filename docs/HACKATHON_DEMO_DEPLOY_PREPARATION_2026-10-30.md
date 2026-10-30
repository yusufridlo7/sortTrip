# Persiapan deployment demo QA

**Status: NOT READY untuk deploy.**

Target existing: Worker `sorttrip-staging`, entry `worker/staging.js`, frontend `dist-staging` melalui binding ASSETS; URL `https://sorttrip-staging.yusufridlo7.workers.dev`. Tidak memakai Pages atau Worker production.

Build frontend/Worker PASS; 50 file QA-only, generation disabled, tanpa URL production/secret terdeteksi. UI polish/foto tercakup. Binding/secrets remote belum diverifikasi.

Blocker: owner UUID/email, Access issuer/audience masih `UNCONFIGURED`; kebijakan Access remote belum terbukti; login frontend staging disabled; access/discovery staging tertutup; adapter Gate D hanya localhost. Perlu konfigurasi owner/Access dan wiring login remote sebelum demo akun dapat direkam. Jangan menyalin profil localhost ke remote atau membuka preview bypass.

Cutoff pusat semua egress Meta terverifikasi pada source: `2026-11-04T17:00:00Z`, konfigurasi wajib, tanpa retry/fallback. Enforcement remote belum dibuktikan. Pertahankan SQL08/entitlement/ledger; snapshot terakhir USD0,40, 8 request, pending=0, satu hasil owner terpakai. Tidak diperbarui. Minimum rekaman tanpa inferensi baru: buka/edit/simpan itinerary Meta existing.

**Perintah setelah blocker selesai dan approval deploy diberikan:**

```powershell
npm run build:staging
npm run build:staging-worker
npx wrangler deploy --config wrangler.staging.jsonc
```

Smoke: anonim/non-owner ditolak; owner login QA → My Trips → itinerary Meta existing → edit/Save/reload. Pastikan identity QA, AI/supplier tertutup dan ledger tidak bertambah. Jangan klik Generate. Gunakan bukti inferensi Gate D sebelumnya.

Tidak deploy, SQL, inference, billing, commit/push atau perubahan production.

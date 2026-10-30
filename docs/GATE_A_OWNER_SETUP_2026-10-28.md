# Gate A — Panduan owner konfigurasi QA

**28 Oktober 2026. Konfigurasi saja; belum izin login, Save/database write, API supplier, Meta atau deployment.**

## 1. Pastikan proyek yang benar

Buka sendiri [dashboard Supabase QA aytrcvfncsklhqozreyk](https://supabase.com/dashboard/project/aytrcvfncsklhqozreyk). Cocokkan project ref pada URL dan Project URL:

`https://aytrcvfncsklhqozreyk.supabase.co`

Jangan pilih production `tznxfgosmjcmwoszvkdk`. Pada Connect dialog atau Settings → API Keys, temukan **publishable key existing** dari proyek QA tersebut. Pilih `sb_publishable_…`, bukan `sb_secret_…`, service-role, server key, password atau token session. Jangan membuat/rotate key atau mengirim nilai key ke chat. Supabase membedakan API key aplikasi dari identitas pengguna; publishable key bukan izin melewati RLS. [Dokumentasi API keys](https://supabase.com/docs/guides/getting-started/api-keys).

Key modern tidak mengandung identitas project yang bisa diverifikasi offline. Karena itu Anda harus memverifikasi asal key langsung pada proyek QA; kode tidak mengklaim bisa menebaknya dari prefix. Bila tidak yakin, **berhenti, jangan centang verifikasi**.

## 2. Siapkan konfigurasi lokal, bukan root env

Anda sendiri dapat menyalin template `qa-config/gate-a.example.json` menjadi:

`.sorttrip-qa/public-connection.local.json`

Folder `.sorttrip-qa/` sudah diabaikan Git dan diblokir dari Vite raw-file serving. Tidak dibuat otomatis dalam pekerjaan Gate A. Jangan menaruh key pada template tracked, root `.env`, source React, chat atau laporan. File ini hanya untuk public binding dan metadata review; **tidak menerima server secret**.

Isi secara privat:

- `supabaseURL`: URL QA persis di atas, tanpa `/rest/v1/` atau slash tambahan.
- `publishableKey`: key publik QA yang baru Anda cocokkan sendiri.
- `targetOrigin`: `http://127.0.0.1:5176` untuk profil lokal, atau `https://sorttrip-staging.yusufridlo7.workers.dev` untuk snapshot staging yang nanti disetujui. Kedua profil tidak boleh menukar snapshot origin secara diam-diam.
- `owner.email` dan `owner.qaUserId`: identitas **akun QA existing**, bukan identitas production. Periksa secara privat pada Authentication → Users; tidak perlu membuat akun/login baru untuk Gate A.

Jalankan pemeriksaan non-network pada terminal sendiri:

```powershell
npm run qa:config:check
```

Output hanya kategori/boolean, bukan key atau identitas owner. Untuk mengikat review ke public key yang persis Anda periksa, jalankan sendiri:

```powershell
node scripts/qa-config-status.mjs --fingerprint
```

Salin **digest SHA256** yang keluar ke `review.publicKeySHA256` secara lokal. Command membaca file lokal, tidak menghubungi Supabase atau mengubah key. Digest bukan verifikasi partner/server; hanya mencegah review lama tetap berlaku setelah key diganti. Jangan kirim file konfigurasi atau key ke chat.

Isi `qaProjectVerified`, `publicKeyProjectVerified`, `ownerIdentityVerified` dan `noProductionResourcesVerified` menjadi true **hanya setelah memeriksa hal tersebut**. Field yang belum terbukti tetap false. Jangan memasukkan field credential tambahan; schema config menolaknya.

## 3. Review Auth URL QA — jangan mengubah production

Pada dashboard proyek QA, buka **Authentication → URL Configuration**. Gate A hanya menyiapkan instruksi; penyimpanan perubahan dashboard membutuhkan persetujuan owner tersendiri dan Anda operasikan sendiri.

| Target | Site URL untuk snapshot target | Redirect URL exact yang ditinjau |
|---|---|---|
| Lokal QA | `http://127.0.0.1:5176/` | `http://127.0.0.1:5176/` |
| Staging owner-only, belum deploy | `https://sorttrip-staging.yusufridlo7.workers.dev/` | `https://sorttrip-staging.yusufridlo7.workers.dev/` |

Supabase hanya mempunyai satu Site URL pada satu waktu. Jangan menganggap dua baris di atas berarti ada dua Site URL sekaligus. Pilih snapshot lingkungan yang sedang ditinjau. Dashboard dapat menyimpan kedua redirect exact yang disetujui; config review di file ini mencatat **satu redirect target efektif** sesuai `targetOrigin`, dan Site URL snapshot harus cocok. Jika setting aktual belum cocok atau ada wildcard/host production yang belum dijelaskan, jangan tandai `redirectsVerified=true`.

Kode saat ini memakai password sign-in dan signup QA dinonaktifkan; tidak ada callback OAuth baru. Jangan menambah `/auth/callback` yang tidak ada di aplikasi. Port5173/5175 dan `localhost:5176` bukan redirect yang disetujui profil ini. Tidak perlu mengubah setting sekarang hanya untuk memakai UI offline. [Dokumentasi Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

Setelah owner memverifikasi konfigurasi target, isi `review.siteURL`, `review.redirectURLs` dan `redirectsVerified` sesuai bukti sebenarnya. Semua itu adalah attestation owner, bukan hasil pembacaan dashboard otomatis.

## 4. Review Cloudflare Access

Buka Cloudflare Zero Trust → Access → Applications sendiri, tanpa mengubah policy/deploy pada pekerjaan ini. Untuk **staging remote** yang nanti disetujui:

1. Pastikan aplikasi mencakup hostname exact `sorttrip-staging.yusufridlo7.workers.dev`, seluruh asset dan `/api/*`.
2. Pastikan policy Allow hanya identitas owner, default deny, tanpa policy Bypass/Everyone atau host preview alternatif. Jika hostname tersebut belum dapat dilindungi pada akun Anda, berhenti untuk review; jangan memilih hostname alternatif tanpa penyesuaian allowlist yang disetujui.
3. Cocokkan issuer team `https://<team>.cloudflareaccess.com`, audience aplikasi, email Access dan identitas akun QA yang dimaksud. Jangan salin JWT, cookie atau token ke file ini.
4. Isi `review.accessIssuer`, `accessAudience`, `accessOwnerEmail`, `accessOwnerQAUserId` hanya dari konfigurasi yang Anda periksa. `accessVerified=true` membutuhkan bukti konfigurasi nyata, bukan hasil tes mock.

Worker existing memverifikasi signature RS256/JWKS, issuer/audience/expiry, owner email, staging hostname, QA Auth identity dan origin. Header email mentah tidak cukup. [Dokumentasi validasi JWT Access](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/).

**Lokal offline berbeda:** build/dev hanya bind127.0.0.1:5176; tidak meminta token Access untuk membaca UI lokal. `accessVerified` boleh tetap false pada review lokal, tetapi ini tidak membuktikan remote aman. Live lokal masih belum aktif dan backend owner verification lokal belum disediakan oleh profil persiapan.

## 5. Aktivasi tidak otomatis

Ada **dua pengaman terpisah**:

1. Review config harus lulus project/key provenance/owner/redirect/resource isolation dan, untuk staging, Access remote. `review.nextStepAuthorization` harus tetap kosong sampai owner **secara eksplisit menyetujui Gate B**; baru kemudian dapat memakai nilai exact `GATE_B_QA_AUTH`.
2. Profil Vite yang disiapkan sekarang memanggil evaluator dengan `allowAuthentication=false`. Walaupun config lengkap, **Auth tetap off**. Pemberian key, menyalin file, mengubah checklist atau restart saja tidak mengaktifkan login.

Setelah Gate A benar-benar verified, minta review Gate B. Tahap berikut membutuhkan patch aktivasi compile yang disetujui, konektivitas backend/owner gate dan CSP yang sesuai; bukan sekadar mengganti satu flag. File owner tetap lokal, hanya public binding tervalidasi yang kelak boleh masuk bundle; identitas owner dan detail Access tidak ditanam di frontend. Jangan mengizinkan real login/database writes sebelum persetujuan Gate B. Meta, supplier dan deployment tetap gate lain.

Untuk melihat snapshot staging tanpa koneksi jaringan:

```powershell
npm run qa:config:check -- --staging
```

`eligibleForNextReview` adalah hasil checklist lokal; `remoteAccessActuallyVerified=false` pada output CLI sengaja tidak mengklaim verifikasi remote. Agent belum membuka dashboard Access/Auth atau memverifikasi key nyata pada pekerjaan ini.

## 6. Rollback lokal

Owner dapat memindahkan/rename file lokal tersebut secara privat menjadi backup di folder ignored yang sama, lalu restart profil QA; loader kembali `CONFIG_MISSING`, public binding kosong, Auth false. Jangan menghapus ledger/trips/akun atau mengubah key. Tidak ada dashboard/DB/deployment yang perlu di-rollback dari pekerjaan Gate A ini. Menutup/mereset konfigurasi lokal bukan cara memulihkan perubahan cloud yang kelak disetujui secara terpisah.

**Status saat laporan dibuat:** file owner belum ada; key/owner/Access/redirect aktual belum diverifikasi. Jangan melanjutkan Gate B otomatis.

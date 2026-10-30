# Gate B — Login owner dan Save/reload QA nyata

**29 Oktober 2026 · Selesai untuk alur satu akun/satu itinerary uji.** Owner secara eksplisit menyetujui Gate B pada chat, kemudian melakukan login sendiri. Tidak ada izin supplier, Meta, recovery ledger, payment, deployment atau production yang ditambahkan.

## Hasil nyata

**LIVE VERIFIED pada Supabase QA `aytrcvfncsklhqozreyk`:**

1. Owner mengisi login sendiri pada UI asli di **http://127.0.0.1:5176/**. Agent tidak membaca password, OTP, token, cookie, auth storage atau isi private configuration.
2. Sesudah login, aplikasi melewati pemeriksaan UUID/email owner dan email-confirmed melalui fixed QA Auth endpoint. UI signed-in tampil; sesi kembali terverifikasi setelah reload penuh.
3. Dibuat satu itinerary manual Kuala Lumpur/KUL, **10–12 November 2026,3hari,1traveler**, tanpa flight/hotel search atau AI. Ditambahkan satu item `QA Gate B — item uji, bukan rekomendasi`, jam10:00 dan angka budget manual12345.
4. Klik Save menghasilkan notifikasi tersimpan dan status Saved. Sesudah reload penuh, **My Trips melakukan pembacaan database** dan menampilkan itinerary ini, satu item dan subtotal12345. Dibuka kembali melalui kartu My Trips, bukan hanya Continue/session draft.
5. Pada itinerary yang sama, jam diubah menjadi **11:15** dan budget manual **23456**, lalu Save berhasil. Reload penuh kedua → My Trips → buka kembali mempertahankan tanggal, jumlah traveler, nama item,11:15 dan23456.

Angka budget adalah **data uji manual**, bukan harga wisata/supplier atau transaksi. Satu itinerary baru dibuat dan record yang sama diperbarui; tidak ada penghapusan atau perubahan itinerary QA lama. Tidak menyalin data pelanggan production. Identitas akun/rowID sengaja tidak dicantumkan.

## Wiring yang ditambahkan

- **`vite.qa-gate-b.config.js` / `npm run dev:qa-gate-b`:** profil lokal terpisah pada5176, masih `index.html → main.jsx → AuthApp → TravelApp`. Menyatakan otorisasi Gate B dari owner tanggal29Okt2026; tidak mengubah credential atau field di private config. Profil `dev:qa-preparation` dan staging default tetap Auth off.
- **`qa-config/original-ui.mjs`:** Gate B memerlukan izin compile eksplisit, origin/port lokal yang benar dan seluruh proof Gate A yang sudah dilengkapi owner. Nilai next-step approval dioverlay **di memori** dari izin chat, bukan menulis ulang file berisi key. Staging tidak dapat memakai izin lokal ini. CSP hanya menambahkan origin Supabase QA yang tepat ketika gate lolos; console forwarding dimatikan.
- **`qa-config/gate-b-session.mjs`:** endpoint `/api/staging/session` hanya menerima POST dari host/origin127.0.0.1:5176 dan peer loopback. Verifikasi memakai `verifyQAOwner` existing dengan publishable key QA, fixed GET `/auth/v1/user`, UUID/email terkonfirmasi sesuai config. Tidak menggunakan server/service-role secret atau menyatakan Cloudflare Access sudah aktif. Error generik tidak mengeluarkan pesan upstream/sesi.
- **`lib/qa-gate-b-network.mjs` / `.d.mts`, `app/bounded-fetch.ts`:** request SDK QA dibatasi ke password/refresh-token Auth, GET user, logout, dan GET/POST/PATCH `rest/v1/trips`. Signup, update akun, table lain, RPC, DELETE, production dan provider origin ditolak. Ini lapisan klien; RLS server tetap otoritatif, bukan pengganti policy.
- **`app/supabase.ts`:** reuse client existing dengan fetch guard; session storage key QA terpisah dan `detectSessionInUrl=false`, tanpa memeriksa/mengekspor isi session. Agent tidak mengisi credential login.
- **`app/auth-app.tsx`, `app/i18n/locales/video.json`:** banner Gate B ID/EN membedakan Auth/Save QA yang diizinkan dari AI/supplier/payment yang masih off.
- **`package.json`, `checks/gate-b.test.mjs`:** launch script dan delapan targeted contract/security tests baru. `databaseTrips`, trips schema/RLS, payment handlers, affiliate IDs serta konfigurasi deployment production tidak diubah.

Profil5176 yang sebelumnya dimulai agent dihentikan melalui Ctrl+C pada handle terminalnya sendiri, lalu diganti profil Gate B pada port yang sama. Tidak memakai PID historis atau menghentikan node/workerd secara luas. Port5173/5175, QA backend lama8790/5174 dan production tidak ditargetkan. Server Gate B tetap berjalan untuk review owner.

## Tes lokal dan bukti

| Pemeriksaan | Hasil / jenis bukti |
|---|---|
| Gate B + Gate A + config/router/staging-security + persistence tests | **59 PASS,0FAIL,0SKIP**; model/supplier/database pada suite ini mock saja |
| `npm run build:qa-preparation` | **PASS**, TypeScript/Vite lokal; warning bundle/dynamic import nonfatal existing |
| Missing proof/approval, wrong origin/host/peer, non-owner/email-unconfirmed | Ditolak pada mock sebelum akses yang tidak sah |
| SDK other table/RPC/signup/account-write/delete/production/provider | Ditolak pada mock; hanya allowlist Auth/trips |
| Login owner + Save/list/reload/edit/update/reload | **PASS LIVE**, normal UI dengan Auth dan database QA sebenarnya; tidak ada interception/mock pada tab ini |
| RLS negatif dua akun | **Tidak diulang live** dalam Gate B ini. Expected-user contract diuji mock; bukti RLS historis tidak disamakan dengan pemeriksaan baru seluruh policy |

Bukti: [targeted tests](../artifacts/gate-b/targeted-tests.log), [build QA](../artifacts/gate-b/build-qa.log), [screenshot hasil reload/update](../artifacts/gate-b/qa-save-reload-update.png). Snapshot UI native pada sesi browser membuktikan notifikasi Saved, kartu My Trips dan nilai11:15/23456 setelah reload kedua. Tidak menyimpan network trace yang dapat memuat credential, key, session atau private rowID.

## Batas dan pesan unavailable yang memang diharapkan

- Meta, supplier, checkout, prebook, payment, booking evidence, Price Watch dan request AI lain tetap ditolak oleh middleware QA. Tidak ada request supplier/model/ledger yang dijalankan untuk pengujian ini. UI dapat menampilkan **purchase status could not be verified** atau harga rekomendasi unavailable; itu konsekuensi rute yang sengaja nonaktif, bukan kegagalan Save.
- SDK memakai izin pengguna normal dan trips RLS existing, bukan service-role. Tidak ada SQL, grant/schema, entitlement, ledger, billing, key/account setting, data production atau deployment yang diubah.
- Cloudflare Access remote masih **UNVERIFIED**. Local loopback owner validation bukan bukti staging sudah terproteksi atau sudah di-deploy.
- Standard `qa:config:check` memeriksa config Gate A tanpa otorisasi compile khusus Gate B, sehingga tetap dapat melaporkan next-step approval required. Gate B aktual mengambil izin eksplisit chat melalui profil tersendiri. File private dan `nextStepAuthorization` tidak ditulis ulang oleh agent.
- Alur ini membuktikan Auth/own-trip Save/update, bukan seluruh fitur platform, negative-RLS dua akun terbaru, video Meta→supplier end-to-end atau kesiapan release production.

## Cara menjalankan dan kembali ke offline

Aktif lokal sesuai otorisasi Gate B:

```powershell
npm run dev:qa-gate-b
```

Untuk kembali ke persiapan offline, hentikan terminal Gate B dengan Ctrl+C lalu jalankan `npm run dev:qa-preparation`. Tidak perlu mengubah key atau private file. Session SDK tetap milik owner; logout bila owner menghendaki. Jangan menghapus record QA/schema/ledger sebagai rollback otomatis.

**Status akhir: Gate B satu akun/satu itinerary PASS LIVE.** Langkah berikut yang dapat diusulkan adalah Gate C untuk supplier read-only, dengan izin terpisah atas scope/jumlah upstream. Tidak menyalakan supplier, AI, recovery atau deployment secara otomatis. Tidak ada commit/push.

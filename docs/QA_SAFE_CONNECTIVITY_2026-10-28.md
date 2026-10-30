# Sprint 2 — Konfigurasi QA dan konektivitas aman

**28 Oktober 2026 · `codex/meta-hackathon-phase-2-2026` · Verifikasi lokal selesai; live tetap dinonaktifkan.**

## Ringkasan pekerjaan

Memakai ulang hasil [Sprint1](QA_INTEGRATION_PREPARATION_2026-10-28.md), tanpa audit menyeluruh atau redesign baru. Entry tetap **index.html → main.jsx → AuthApp → TravelApp**. URL review tetap **http://127.0.0.1:5176/** (`npm run dev:qa-preparation`). Port5173/5175 dan konfigurasi production tidak diubah.

Satu pengaman konfigurasi ditambahkan: klien QA menolak server-secret, legacy service-role JWT, legacy anon key dari proyek lain, URL selain QA persis, binding kosong, dan aktivasi yang belum disetujui. Tidak ada key nyata dibaca/diisi, koneksi live diaktifkan, atau akun/database diakses.

## Berkas berubah pada Sprint2

- `lib/qa-client-config.mjs` dan `.d.mts`: validasi binding publik QA sebelum SDK client dibuat.
- `app/supabase.ts`: memakai validator tersebut **khusus** mode QA-preparation/staging; jalur normal tetap existing.
- `checks/qa-safe-connectivity.test.mjs`: enam tes baru, termasuk modul Supabase sebenarnya dengan SDK/network stub.
- `checks/staging.test.mjs`: memperbarui rujukan tes statis setelah validasi dipindah ke helper; kontrak keamanan tidak dilonggarkan.
- `scripts/qa-integration-preparation-browser.mjs`: argumen output opsional agar bukti Sprint2 tidak menimpa Sprint1.
- Laporan ini, evidence `artifacts/qa-safe-connectivity/`, dan catatan progress/next actions. Tidak membangun ulang handler/UI yang sudah memenuhi Sprint1.

## Kesiapan konfigurasi QA

| Komponen | Bukti saat ini | Status |
|---|---|---|
| Proyek frontend | `qa-config/original-ui.mjs`: URL tetap `https://aytrcvfncsklhqozreyk.supabase.co`, envDir false, tanpa root env/process-key fallback | **Source/build verified** |
| Publishable binding | Profil persiapan secara eksplisit memakai string kosong; `VITE_QA_AUTH_READY=false` | **Missing pada profil ini, sengaja**; isi file privat lama tidak diperiksa |
| SDK Supabase | `qaClientReady` dievaluasi sebelum `createClient`; binding tidak aman menghasilkan client null | **Mock verified**, bukan autentikasi nyata |
| QA owner/Access | Konfigurasi staging masih placeholder; `verifyStagingAccess`/`verifyQAOwner` menjaga host, JWT signature/issuer/audience/waktu, UUID/email terkonfirmasi | **Mock verified; konfigurasi remote UNVERIFIED** |
| Auth Site URL/redirect/signup | Dashboard QA tidak dibuka; signup UI QA off, bukan bukti setting Auth server off | **UNVERIFIED**; owner harus meninjau QA saja |
| Resource Worker | `wrangler.staging.jsonc`: proyek QA, tanpa cron/browser/KV production, preview URLs off; semua gate generasi/supplier false | **Static/build verified**, belum deploy |
| Secret server/supplier | Nama binding diketahui; nilainya maupun keberadaan aktual di dashboard/private env tidak dibaca | **UNVERIFIED**, bukan dianggap valid |

Modern `sb_publishable_…` diterima hanya secara sintaks; project asal key opaque tidak dapat dibuktikan offline. Legacy JWT diperiksa role=anon dan ref QA untuk mencegah salah binding, **bukan** verifikasi signature atau session. Owner tetap harus mengambil public binding dari proyek QA yang benar; session akhirnya diverifikasi oleh Auth QA dan owner gate server. Validator bukan scanner yang dapat mencegah semua cara orang memasukkan secret ke source/build.

Tidak ada loader credential live baru. Config factory masih memaksa key kosong/auth false. Mengisi root `.env` tidak mengaktifkan QA. Pemasangan binding publik QA dan perubahan wiring aktivasi perlu review/izin Gate A, sementara real login/write memerlukan Gate B. Jangan menaruh server key di `VITE_*` atau menyalin production env.

## Auth, Save dan entitlement

Alur struktural existing tetap: SDK session → `AuthApp` → pemeriksaan owner QA → `TravelApp` → `databaseTrips` → trips dengan session/RLS pengguna → My Trips → reload → UPDATE. Tidak ada server-role Save, fake login atau entitlement di aplikasi. Auto-update metadata bahasa akun dimatikan khusus QA/staging; JSONB, policy RLS dan schema tidak diubah.

Tes memory dan browser memastikan tanggal/traveler, video-derived destinations, item edit/Nearby serta parameter booking tetap tersimpan lewat adapter existing. SDK yang memakai binding salah tidak dibuat; expected-user mismatch tidak menulis fixture. **Ini bukan Save/RLS live baru.** Bukti RLS QA dua akun historis tetap rujukan pada audit [baseline](LIVE_INTEGRATION_READINESS_2026-10-28.md); tidak diulang di database.

| Dependency | Pemakai source | Bukti QA sekarang |
|---|---|---|
| `trip_passes` | Discovery access, pemilihan pass oleh RPC, payment access dan ringkasan Trip Pass | Historis pernah dilaporkan tidak ada; keadaan deployed saat ini **UNVERIFIED** |
| `ai_request_reservations` | RPC reservasi/finish, pending/in-flight accounting hasil AI | **UNVERIFIED**; tidak dibaca/dibuat |
| `reserve_paid_ai_request(uuid,uuid)` | `worker/assistant-discovery.js` sebelum model pada jalur produk | **UNVERIFIED**; tidak dipanggil |
| `finish_ai_request(uuid,uuid,boolean)` | Discovery success/failure cleanup; source SQL kuota | **UNVERIFIED**; tidak dipanggil |

Referensi: `worker/assistant-discovery.js:36,45,58,64`, `supabase/assistant-paid-discovery.sql`, `supabase/ai-quota-v2.sql`, dan proposal `docs/staging-proposal/sql/02_MINIMUM_QA_ENTITLEMENT_SCHEMA_PROPOSED.sql`. File SQL adalah source/proposal, bukan bukti terpasang. QA router mempertahankan `QA_ENTITLEMENT_UNVERIFIED`/`QA_AI_DISABLED` dan tidak memberi pass palsu atau menyuruh membeli ulang. Save manual tidak memerlukan pass; missing entitlement menghentikan jalur AI, bukan alasan melemahkan RLS.

## Kontrak supplier

Adapter Sprint1 dipakai ulang; seluruh hasil berikut **mock**, tanpa credential/panggilan supplier nyata.

| Bagian | Yang diperiksa | Batas live |
|---|---|---|
| Flights | Fixed `api.travelpayouts.com/aviasales/v3/prices_for_dates` GET; server `TRAVELPAYOUTS_API_TOKEN` hanya header; tanggal pergi/pulang/filter/IDR; data kosong dan error tidak menjadi fixture harga; provider affiliate link existing | Binding QA belum diverifikasi; `QA_SUPPLIER_READS_ENABLED=false`. Quote tetap satu dewasa dan return fare satu kombinasi. Tidak membuktikan seats/harga grup |
| Hotels rates | LiteAPI v3 `hotels/rates` POST baca; check-in/out;3guest→2occupancy; full-stay IDR; metadata fallback fixed GET; tidak membuat White-label/checkout link dari adapter read | Butuh `LITEAPI_API_KEY`, `LITEAPI_ENABLED`, limiter dan supplier-read approval; belum live |
| Hotel content | Fixed GET `data/hotel`, `data/reviews`, validated hotel ID; upstream failure unavailable | Bukan booking/availability guarantee |
| Security | URL/method allowlist, manual redirect, timeout/size cap, tidak meneruskan cookie/Authorization user; provider error disanitasi | Tidak menganggap API gratis/berizin hanya karena endpoint bernama read |

Normalisasi detail tanggal/return/one-adult sebelumnya juga dibuktikan tes terarah Sprint1; tidak mengulang seluruh flight suite. Tests sekarang menjalankan kontrak staging supplier, hotel dan affiliate existing. ID affiliate, checkout/payment, Tour Guide dan Nearby tidak diubah.

## Hasil tes fail-closed

| Skenario | Hasil lokal | Efek teramati |
|---|---|---|
| Binding QA kosong | PASS | SDK tidak dibuat; protected API unavailable |
| Konfigurasi/URL salah | PASS | Ditolak sebelum SDK/egress |
| Production project dimasukkan ke QA | PASS | URL production/legacy wrong-ref ditolak; tidak ada request production |
| Access hilang/palsu/tidak dapat diverifikasi | PASS | Asset/API tidak dilayani; tidak ada supplier/model |
| Session non-owner/email belum terkonfirmasi | PASS | Server menolak; browser fixture tidak me-mount signed-in TravelApp |
| Origin asing | PASS |403; tanpa wildcard CORS/fallback |
| Flag Meta tidak sengaja true | PASS |503 terminal guard; tidak ada delegasi paid handler/RPC |
| Supplier-read false | PASS |503 sebelum adapter/egress |
| Key supplier absen | PASS |Unavailable, tidak memakai production fallback |
| Payment/prebook/Book/checkout/probe | PASS |404 pada Worker allowlist;5176 menolak live API503 |

**47 PASS, 0 FAIL, 0 SKIP** pada enam file test relevan. Ada enam test baru Sprint2; tidak menjalankan full suite. Log accounting yang muncul pada tes staging berasal dari Meta/ledger mock existing, bukan reserve/settle atau inference nyata. Satu assertion source lama disesuaikan karena URL QA kini berada di helper; final rerun lulus.

- `npm run build:qa-preparation`: **PASS** (TypeScript+Vite).
- `npm run build:staging`: **PASS**; verifier49file, QA-only dan generation-disabled true. Peringatan bundle besar/dynamic import nonfatal tetap ada.
- Browser original QA5176 desktop1280/mobile390: **PASS**, manual itinerary, local MP4 decode, guest auth gate, non-owner denied, Save/My Trips/reload/update + Guide/Nearby dengan auth/owner/database **fixture test-only**. **0 external requests, 0 page errors** pada alur tersebut. Tidak membuktikan login/RLS/layanan live.

Bukti: [tes](../artifacts/qa-safe-connectivity/targeted-tests.log), [browser](../artifacts/qa-safe-connectivity/browser-results.json), [build QA](../artifacts/qa-safe-connectivity/build-qa.log), [build staging](../artifacts/qa-safe-connectivity/build-staging.log), [desktop](../artifacts/qa-safe-connectivity/qa-home-desktop.png), [mobile](../artifacts/qa-safe-connectivity/qa-home-mobile.png). Evidence Sprint1 tidak ditimpa. Tidak ada SQL execution, account/session/database creation, real supplier call, paid AI, ledger recovery, payment, deploy, commit/push atau destructive Git.

## Checklist owner: persetujuan terpisah

Tindakan di bawah **belum dijalankan dan bukan izin tersirat**. Jangan kirim key, password, OTP, session, UUID privat atau raw log ke chat.

### Gate A — Konfigurasi privat QA

- [ ] Setujui review/pemasangan konfigurasi QA saja. Pilih dashboard project **aytrcvfncsklhqozreyk**, bukan production.
- [ ] Owner memverifikasi public publishable binding existing dari proyek QA. Jangan menggunakan secret/service-role di browser, mengganti key, atau membuat credential baru tanpa izin terpisah.
- [ ] Owner memeriksa identitas akun QA existing, email terkonfirmasi dan allowlist server secara privat. Tidak perlu membuat akun kedua lagi hanya karena laporan lama menyebut belum ada.
- [ ] Tinjau Cloudflare Access issuer/audience dan policy allow owner-only, catch-all deny, semua asset/API dan tanpa preview/alternate host bypass. Nilai sebenarnya belum diverifikasi.
- [ ] Pada Auth **QA saja**, tinjau Site URL dan redirect origin yang tepat untuk environment terpilih; batasi signup QA menurut kebutuhan owner. Jangan mengubah Auth production.
- [ ] Setujui patch wiring binding publik QA/config aktivasi yang terpisah dari profil credential-free ini. Jangan mengaktifkan Auth lewat root env atau flag tanpa verifikasi Access/runtime identity.

**GO untuk review konfigurasi oleh owner; NO-GO untuk aktivasi koneksi saat ini.** Key kosong, Access/owner/redirect dan binding aktual belum terbukti. Modern public-key provenance tetap perlu bukti owner.

### Gate B — Auth/Save/RLS QA nyata

- [ ] Persetujuan eksplisit owner login dan disposable trip INSERT/UPDATE QA; ini berbeda dari konfigurasi Gate A.
- [ ] Pastikan identity runtime/frontend menunjuk QA dan owner gate lolos sebelum login/Save.
- [ ] Owner login sendiri; lakukan create→Save→My Trips→reload→edit→update. Cek tanggal, traveler, metadata video/Nearby dan booking links.
- [ ] Bila perlu, setujui ulang tes negatif RLS dua akun dengan disposable fixtures. Bila schema/izin gagal, stop; perubahan schema/grant perlu review terpisah.

**NO-GO sekarang:** belum ada izin login/write dan konfigurasi live belum siap. Tidak perlu membeli Trip Pass hanya untuk menguji Save manual.

### Gate C — Supplier baca nyata

- [ ] Persetujuan satu request Aviasales dan satu LiteAPI rates, berikut scope credential QA yang sah; tanpa menyalin secret production.
- [ ] Tentukan tanggal/rute/guest/kamar dan batas jumlah upstream sebelum aktivasi. Default hotel adapter dapat membuat **dua rates calls dan satu metadata fallback**; “satu pencarian UI” tidak otomatis “satu request supplier”. Jika izin hanya satu rates call, pilih tier budget dan hentikan setelah call tersebut atau tinjau pembatasan baru terlebih dahulu.
- [ ] Verifikasi harga indikatif/one-adult, total seluruh malam/rooms, missing prices dan sumber; tidak membuka prebook/Book/checkout/payment.

**NO-GO sekarang:** supplier flag off, key/scope aktual unverified dan real request belum diizinkan.

### Gate D — Meta

Pembaruan 29 Oktober: rencana bersyarat kredit Hackathon ada di [laporan Gate D](GATE_D_META_LIVE_TEST_2026-10-29.md). Usulan maksimum USD10/20 percobaan/3 per skenario/1 inferensi global; semua batas existing yang lebih ketat tetap berlaku. Kredit, proteksi paid-spill dan ledger/entitlement belum terverifikasi: **NO-GO**, nol inferensi baru. Ini bukan aktivasi atau izin recovery.

- [ ] Persetujuan review keselamatan ledger/entitlement secara terpisah; latest known ledger blocked, keadaan sekarang tidak diperiksa.
- [ ] Jika dibutuhkan, owner terlebih dahulu menyetujui diagnostic QA read-only existing. **Tidak ada SQL yang dijalankan sprint ini**, termasuk SQL06/07.
- [ ] Recovery memerlukan verifikasi writer/deployed functions/snapshot dan izin atas versi recovery final tersendiri. Tidak otomatis menaikkan/reset budget atau unblock.
- [ ] Bounded inference memerlukan izin tersendiri setelah recovery/entitlement/Access/runtime lulus. Pertahankan limit2.000output, USD10global/USD0,05request dan tanpa retry otomatis.

**NO-GO sekarang:** blocked/unverified dependencies dan generation route tetap hard-disabled. Gate A/B/C bukan izin Meta.

### Gate E — Staging

- [ ] Persetujuan deployment khusus staging; QA-only resources, Access owner-only, original UI build tervalidasi, tanpa production cron/KV/browser/payment.
- [ ] Pertahankan AI dan supplier off pada deploy awal; jika Access belum siap, placeholder harus membuat seluruh layanan gagal tertutup.
- [ ] Setujui smoke negatif terpisah, lalu pemeriksaan identity dan owner Access; baru uji B/C sesuai izin masing-masing.
- [ ] Rollback hanya tutup ingress/generation atau pulihkan versi staging terkunci; jangan menyentuh production/ledger atau menghapus data QA.

**NO-GO sekarang:** Access/runtime/private binding dan approval deploy belum lengkap. Build PASS bukan izin atau bukti deployment.

## Langkah berikut yang disarankan

Mulai dengan **Gate A saja**: review konfigurasi QA/Access oleh owner dan keputusan wiring publik yang aman. Bila perlu satu URL online untuk pembuktian Access, Gate E deployment terkunci harus disetujui tersendiri **sebelum** B/C live; urutan label A–E bukan izin berantai. Selesaikan Gate B, lalu C setelah environment aman. Gate D tetap terpisah dan tertahan. Tidak memulai sprint aktivasi, Guide2.0, SQL atau pemanggilan nyata secara otomatis.

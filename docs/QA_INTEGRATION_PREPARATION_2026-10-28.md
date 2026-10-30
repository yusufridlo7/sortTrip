# Sprint 1 — Persiapan integrasi QA

**28 Oktober 2026 · branch `codex/meta-hackathon-phase-2-2026` · Selesai untuk persiapan lokal, belum integrasi live.**

## Hasil dan cara mencoba

**URL baru: http://127.0.0.1:5176/**. Jalankan ulang dengan `npm run dev:qa-preparation`. Server dibiarkan berjalan untuk review owner.

Alur tetap **index.html → main.jsx → AuthApp → TravelApp**. Tidak ada editor kedua, redesign, atau pengalihan ke MVP. Upload MP4/MOV/M4V, review tujuan, pembuatan manual, WorldPlanner, budget, maps, menu booking/affiliate, Trip Pass, My Trips, Guide dan Nearby memakai komponen lama. Port5173/offline owner UI dan5175/MVP tidak diganti atau dihentikan.

Profil baru **tidak memuat credential**, tidak punya proxy ke backend/production, dan hanya melayani katalog lokasi lokal. Banner Indonesia/Inggris menjelaskan Access owner, Auth, cloud Save, supplier dan AI belum tersedia. Manual draft dan decoding/pratinjau video lokal tetap bisa digunakan. Tidak ada pengenalan demo otomatis atau fallback fixture setelah kegagalan AI; tombol demo pengenalan tidak ditawarkan pada QA/staging ini.

Untuk review: buka5176 → pilih kota → Buat itinerary manual; atau Lampiran opsional → unggah video kompatibel≤4MiB/60detik → pratinjau frame. Cloud Save meminta autentikasi existing, tetapi konfigurasi live memang belum dibuka. Jangan memasukkan credential untuk mencoba mengatasi banner ini. Guide/Nearby dapat digunakan dari item wisata yang ditambahkan pada itinerary; data kurasi tetap berlabel.

## Arsitektur yang disiapkan

- `qa-config/original-ui.mjs` dipakai oleh Vite QA-preparation dan staging; root environment dan process public-key fallback tidak dibaca. URL QA tetap `aytrcvfncsklhqozreyk`; publishable key kosong dan `VITE_QA_AUTH_READY=false`. Kehadiran URL bukan bukti koneksi atau akses yang sah.
- Supabase client tidak dibuat pada kedua profil ini sampai konfigurasi QA eksplisit disetujui. Tidak ada fallback ke production `tznxfgosmjcmwoszvkdk`.
- `AuthApp` tetap menangani session existing. Untuk session QA yang kelak diaktifkan, rendering signed-in TravelApp membutuhkan `/api/staging/session` yang menyatakan owner terverifikasi; penolakan menahan aplikasi. Sinkronisasi metadata bahasa akun otomatis dan signup UI dinonaktifkan khusus QA/staging. Proteksi backend tetap otoritatif.
- `databaseTrips`/save queue/My Trips tidak diganti. Penyimpanan tetap direct Supabase dengan session pengguna, expected-user check dan trips RLS, bukan server-role Save. Format JSONB menyimpan metadata video/manual/Nearby dan parameter booking tanpa adapter database kedua. Batas existing300item/200KB tidak diubah.
- Staging build sekarang memakai index/main/AuthApp/TravelApp asli dan aset publiknya, bukan shell lama. `app/staging-entry.tsx` hanya menjadi compatibility import ke main. Konfigurasi deploy/resource production tidak disentuh.
- `worker/staging.js` tetap memverifikasi host, konfigurasi QA, Access JWT kriptografis, origin, lalu QA owner sebelum API. Asset juga dilindungi Access. `worker/qa-read-routes.js` berisi allowlist baca dan terminal error untuk AI/entitlement yang belum siap.
- Adapter tiket memakai `searchFlights` existing. Adapter hotel memakai `handleHotelSearch`/`discoverHotelRates` dan `handleHotelContent` existing melalui injected bounded fetch. Penambahan parameter fetcher opsional pada hotel handler mempertahankan default produksi.

**Penting:** pada5176, Access tidak dinyatakan lolos atau disimulasikan aplikasi. Identity lokal menyatakan `ownerAccessVerified=false`, `authReady=false`, `generationEnabled=false`, `supplierReadsEnabled=false`. Semua rute live503. Katalog lokal tanpa session hanya berisi data publik statis dan tidak mem-proxy layanan. Worker staging belum dijalankan/deploy; konfigurasi owner/Access masih placeholder.

## Matriks kesiapan rute

Semua rute backend di bawah memerlukan **Cloudflare Access owner + session Supabase QA owner**, kecuali identity/asset yang memerlukan Access saja. Rute yang tidak terdaftar ditolak404; metode salah405; origin asing403; konfigurasi/Access tidak dapat diverifikasi gagal tertutup. Pada Vite5176, hanya identity/katalog lokal tersedia; rute live lain503.

| Rute | Handler / binding tambahan | Efek dan biaya | Status persiapan / error |
|---|---|---|---|
| GET `/api/staging/identity` | staging worker; Access/config QA | Baca metadata, tanpa model | Metadata gate; generasi/Auth selalu false pada persiapan |
| POST `/api/staging/session` | `verifyQAOwner`; `SUPABASE_PUBLISHABLE_KEY` | GET identitas QA; tanpa perubahan akun | Disiapkan, belum uji live;401/403/503 bila tidak sah |
| Save/My Trips/reload/update | `databaseTrips` langsung ke `trips`, session pengguna | SELECT/INSERT/UPDATE QA; **state-changing untuk Save** | **Live disabled**, client belum dibuat; kontrak diuji fixture. `/api/trips` Worker404, bukan server-role pengganti RLS |
| POST `/api/assistant/access`, `/api/payments/access` | Terminal guard; nantinya komponen Trip Pass/RPC QA perlu diverifikasi | Tidak membaca/memberi entitlement dalam sprint |503 `QA_ENTITLEMENT_UNVERIFIED`; tidak mengajak membeli ulang |
| POST `/api/assistant/discover` | Terminal guard; future existing discovery handler belum didelegasikan | Berpotensi paid inference + ledger jika kelak disetujui |503 `QA_AI_DISABLED`, termasuk bila flag lama true |
| POST `/api/video-itinerary` | Terminal guard; browser decoder/review tetap ada | Potensial paid Meta/ledger, raw media tidak diteruskan |503 `QA_AI_DISABLED`; tidak memanggil extractor/reserve/settle |
| POST `/api/itinerary`, `/api/itinerary/translate` | Terminal guard; editor manual tidak membutuhkan endpoint | Potensial OpenAI berbayar/kuota |503 `QA_AI_DISABLED`; tidak ada auto replan berbayar |
| GET `/api/flights` | `parseQuery/searchFlights`; `TRAVELPAYOUTS_API_TOKEN`, `AI_LIMITER`, `QA_SUPPLIER_READS_ENABLED` | Supplier GET read-only; bukan booking; biaya/izin akun tidak diasumsikan | Flag false →503 `QA_SUPPLIER_DISABLED`; key absen→503 `SUPPLIER_UNAVAILABLE` |
| POST `/api/hotels/search` | Hotel handler; `LITEAPI_API_KEY`, `LITEAPI_ENABLED`, limiter/read flag | Rates POST semantik **baca**, tidak prebook | Flag/key absen503; invalid400; upstream502; hasil kosong tetap kosong |
| GET `/api/hotels/content` | `handleHotelContent`; binding hotel yang sama | GET data hotel/reviews saja | Flag/key absen503; invalid400; upstream502 |
| GET `/api/locations`; POST `/api/locations/resolve` | Katalog `searchLocations/resolveLocations` | Lokal statis, tanpa model/supplier | Disiapkan;5176 tersedia loopback, input dibatasi |
| GET `/api/recommendations` | `recommendationResponse(request,{})` | Referensi bundled, tanpa production KV/job | Disiapkan di Worker;5176 menolak karena bukan katalog lokal. Bukan quote live |
| Guide / Nearby / Maps links | Komponen existing + kurasi + browser one-shot GPS | Tidak model; GPS tidak dipersist; link eksternal atas aksi user | Lokal tersedia; bukan Places/Guide AI live |
| Payments/status/webhook, checkout/rooms/prebook/Book, booking evidence, support/outbox, Routes API, QA budget probes | Tidak di-allowlist | State-changing/berpotensi berbayar atau bukan lingkup |404; tidak ada delegasi production atau probe |

Binding dasar Worker tetap `APP_ENV`, `STAGING_ORIGIN`, `SUPABASE_URL`, `STAGING_OWNER_QA_USER_ID`, `STAGING_OWNER_EMAIL`, `CF_ACCESS_ISSUER`, `CF_ACCESS_AUD`, dan publishable QA untuk pemeriksaan session. Nilai privat tidak dibaca/dipindahkan. Secret Meta dan server Supabase **tidak dibutuhkan** untuk menguji rute yang tetap ditolak dalam sprint ini.

## Harga, supplier dan fitur yang dipertahankan

- Aviasales tetap **harga indikatif/cache satu dewasa**; return fare satu kombinasi, bukan otomatis dikali dua. Tanggal/pagination/filter/currency/link existing dipertahankan; jumlah traveler tidak membuktikan inventory grup.
- LiteAPI memakai check-in/out, total seluruh malam IDR, semua guest dan `ceil(people/2)` kamar. Tes tiga guest memeriksa dua occupancy dan total stay, bukan satu malam. Harga kosong/error tidak berubah menjadi nol/fixture.
- Egress supplier dibatasi origin+path+method: Travelpayouts `prices_for_dates` GET; LiteAPI `hotels/rates` POST serta `data/hotels`, `data/hotel`, `data/reviews` GET. Redirect manual, ukuran/timeout dibatasi, cookie/Authorization pengguna dilarang diteruskan. Provider error disanitasi. Tidak ada real supplier call pada sprint ini.
- Hotel read adapter membuang binding checkout/payment/White-label; tidak membuat booking link fiktif. UI native/affiliate existing tetap ada, tetapi operasi checkout ditolak.
- ID affiliate, 12Go, Viator, Trip.com/Klook, Trip Pass dan Price Watch tidak diganti atau diberi hak palsu. Integrasi tersebut tidak diaktifkan otomatis pada QA. Tour Guide/Nearby kurasi tidak berubah menjadi klaim AI atau Places live; workflow Finalized/H-3 tidak dibuat.

## Berkas yang berubah

| Kelompok | Berkas |
|---|---|
| Profil baru | `qa-config/original-ui.mjs`, `vite.qa-preparation.config.js`, `package.json`, `.gitignore` |
| Staging asli dan routing | `vite.staging.config.js`, `app/staging-entry.tsx`, `worker/staging.js`, `worker/qa-read-routes.js`, `wrangler.staging.jsonc`, `scripts/staging-verify.mjs` |
| Guard Auth dan pemanggilan baca | `app/supabase.ts`, `app/auth-app.tsx`, `app/auth-panel.tsx`, `app/api-fetch.ts`, `app/api-flights.ts`, `app/hotel-search.tsx`, `app/hotel-details.tsx`, `worker/hotel-search.js` |
| Isolasi fixture/tautan dan bahasa | `app/video-itinerary.tsx`, `app/support-center.tsx`, `app/i18n/index.ts`, `app/i18n/locales/video.json` |
| Tes/bukti | `checks/qa-integration-preparation.test.mjs`, penyesuaian `checks/staging.test.mjs`, `scripts/qa-integration-preparation-browser.mjs`, `artifacts/qa-integration-preparation/` |
| Dokumentasi | Laporan ini serta pembaruan progress/architecture/decisions/next actions |

`index.html`, `main.jsx`, `vite.config.js`, `wrangler.jsonc`, profil5173/5175, SQL ledger/schema dan adapter pembayaran tidak diedit sprint ini. Shared component memiliki guard khusus mode QA/staging; profil owner-ui/MVP tidak diubah menjadi QA. Seluruh perubahan lama, termasuk file lain yang dirty/deleted, dipertahankan; tidak ada reset/staging Git.

## Pengujian dan bukti

| Pemeriksaan | Hasil | Jenis bukti |
|---|---|---|
| Targeted Node tests: QA routes, staging JWT/owner/egress, persistence, video/review, native UI, Guide/Nearby, flights/hotels, affiliate | **91 PASS, 0 FAIL, 0 SKIP** | Mock/fixture lokal; tidak mengakses layanan nyata |
| `npm run build:qa-preparation` | **PASS**, TypeScript + Vite | Build nyata lokal |
| `npm run build:staging` | **PASS**,49 scanned files, QA-only/generation-disabled true | Build/static scan, bukan runtime Access/Supabase live |
| `npm run build:staging-worker` | **PASS** | esbuild lokal, tanpa Wrangler/deploy |
| Browser QA original UI desktop1280/mobile390 | **PASS** | Guest real UI; MP4 sintetis benar-benar didekode; cloud/model/supplier bukan live |
| Owner session denied / manual creation / guest Save gate | **PASS** | Mock owner verification; katalog lokal; auth asli tetap diminta |
| Edit→Save→My Trips→reload→Guide/Nearby→add→update | **PASS** | Auth/session/owner/DB **diintersep hanya oleh test runner**, baris di browser fixture; bukan Supabase write |
| Jaringan browser / page errors | **0 external requests; 0 page errors** | Konteks browser bersih; bukan audit semua kemungkinan klik/partner |

Bukti: [hasil browser](../artifacts/qa-integration-preparation/browser-results.json), [tes](../artifacts/qa-integration-preparation/targeted-tests.log), [build QA](../artifacts/qa-integration-preparation/build-qa.log), [build staging](../artifacts/qa-integration-preparation/build-staging.log). Screenshot: [desktop](../artifacts/qa-integration-preparation/qa-home-desktop.png), [mobile](../artifacts/qa-integration-preparation/qa-home-mobile.png), [Nearby](../artifacts/qa-integration-preparation/qa-nearby-desktop.png), [Guide mobile](../artifacts/qa-integration-preparation/qa-guide-mobile.png).

Iterasi verifikasi memperbaiki import API helper yang belum lengkap dan selector tes yang semula mengedit nama alih-alih waktu. Pemeriksaan staging sempat menolak build karena URL QA di-tree-shake saat auth disabled; metadata project QA eksplisit kini tersedia tanpa credential. Semua rerun terdampak di atas lulus. Peringatan bundle>500KB dan dynamic/static import tetap nonfatal; tidak melakukan refactor performa di luar lingkup. Log accounting dalam tes staging berasal dari ledger/model mock, bukan reserve/settle nyata.

## Batas keamanan dan blocker

- Tidak ada env privat/secret dibaca, credential diganti, root env diwarisi atau resource production dipakai. Local CSP menahan script/widget/connect eksternal; no wildcard CORS. Access nyata belum diverifikasi sehingga live QA tetap off.
- Tidak ada akun/session/record Supabase dibuat. Browser fixtures tidak dikirim/shipping sebagai client auth atau entitlement. RLS, RPC, JSONB schema dan payment logic tidak diubah.
- Meta/paid AI tidak sekadar flag false: registered route berakhir error tanpa delegasi walaupun flags lama true. Source output limit/cap, SQL06/07, budget, blocked dan riwayat tidak disentuh. Keadaan ledger sekarang tidak diperiksa ulang; bukti terakhir blocked tetap blocker.
- Endpoint supplier baca disiapkan tetapi `QA_SUPPLIER_READS_ENABLED=false`, tanpa key; request nyata belum diizinkan. Credential scope/partner approval tidak disimpulkan dari code atau fixture.
- QA entitlement table/RPC dan owner-test pass belum terbukti tersedia; tidak membuat fake paid pass, tidak membuka production auth, tidak memaksa user membeli ulang. Klien session persistence/Save siap secara kontrak, bukan bukti login/Save QA terbaru.
- Live staging tetap **NO-GO**: owner Access/QA binding, Auth redirects, live dependency verification dan izin deploy terpisah belum ada. Source UI telah disejajarkan, tetapi build sukses tidak berarti environment online siap.

## Persetujuan owner yang masih terpisah

1. **Konfigurasi privat QA/identitas owner/Access:** owner sendiri memeriksa host/proyek/publishable binding/allowlist dan QA Auth redirects. Tidak mengirim nilai credential ke chat.
2. **Inspeksi SQL QA read-only:** otorisasi tersendiri untuk diagnostic existing yang sesuai. Sprint ini tidak menjalankan SQL apa pun, termasuk SQL06/07.
3. **Login dan database writes QA:** izin uji session/Save dengan disposable trip pada akun QA existing; owner menangani login. Jika schema/entitlement hilang, hentikan jalur itu dan tinjau delta SQL, jangan bypass RLS/Trip Pass.
4. **Supplier requests:** izin khusus flight+hotel read-only dan scope binding QA yang sah. Jangan menyalin production secret atau membuka prebook/checkout.
5. **Ledger recovery:** review keselamatan/remote writer/deployed function dan persetujuan versi final recovery tersendiri. Tidak otomatis diberikan oleh Sprint1.
6. **Paid Meta inference:** setelah ledger/entitlement/access/runtime siap, izin satu bounded test terpisah. Registration route sekarang tetap disabled; perlu perubahan yang ditinjau sebelum live.
7. **Deployment staging:** setelah private configuration dan checks siap, izin deploy terkunci dengan generation/supplier off; lalu smoke/aktivasi kemampuan yang disetujui. Tidak mencakup production, commit atau push.

**Langkah berikut yang disarankan:** owner review UI5176 dan matriks ini, lalu tentukan otorisasi konfigurasi QA/Access dan pemeriksaan dependency read-only. Jangan langsung menyalakan Meta atau mengeksekusi recovery. Tidak memulai Tour Guide2.0 atau fase fitur berikutnya.

**Publikasi/tindakan sensitif:** tidak ada SQL, database write, pembuatan akun, API supplier nyata, Meta inference, recovery/kuota/billing, prebook/booking/payment, deploy, commit atau push. Berhenti untuk review owner.

# Audit kesiapan integrasi live SortTrip

**28 Oktober 2026 · `codex/meta-hackathon-phase-2-2026` · READ-ONLY**

## Ringkasan

**Demo lokal siap direview; alur live terpadu dan deployment staging belum siap.** Integrasi tiket, hotel, Viator, Google Routes, serta Auth/Save QA memiliki bukti layanan nyata historis. Namun, bukti itu tidak membuktikan konfigurasi sekarang, harga terkini, atau keberhasilan perjalanan lengkap dari prompt/video sampai Save.

Tiga penghambat utama: ledger Meta terakhir **blocked**, entitlement discovery QA belum terbukti tersedia, dan staging yang disiapkan belum mencakup UI asli beserta rute video/hotel. Jangan mengulang pendaftaran partner atau mengganti credential hanya karena profil lokal offline.

Audit ini membaca source/config non-secret dan bukti terdahulu. Tidak membaca file environment privat, mengakses akun/database, menjalankan SQL, model, supplier, transaksi, build atau full test suite. Hanya laporan ini ditambahkan; worktree lama dipertahankan. Tidak ada deploy, commit/push, reset, atau perubahan UI.

## 1. Matriks status integrasi

**LIVE VERIFIED** di bawah berarti pernah dibuktikan pada tanggal/lingkup yang disebut, **bukan pemeriksaan live baru pada audit ini**. Status runtime sekarang ditulis terpisah bila belum diketahui.

| Integrasi | Klasifikasi dan bukti | Batas / blocker sekarang |
|---|---|---|
| UI asli, editor, video→review→WorldPlanner | **MOCK VERIFIED** untuk alur terpadu: 103 tes terarah/build dan browser 1280/390 dari pekerjaan sebelumnya [1] | Decoder MP4 benar-benar berjalan pada video sintetis; pengenalan Bangkok, auth/DB, suara/GPS dan tile dalam browser test memakai fixture |
| Supabase Auth + trips + Save/reload/RLS QA | **LIVE VERIFIED, 27 Okt**: own Save/reload dan A/B/guest negative tests [2] | Belum diuji ulang setelah integrasi UI terbaru; bukan bukti RLS production. URL 5173 sekarang memang tanpa Supabase |
| Meta transcript dan sampled frames | **LIVE VERIFIED historis**, 27–28 Okt [3]; **BLOCKED** untuk uji berikutnya menurut snapshot ledger terakhir [4] | Teks/caption dan synthetic-frame acceptance terbukti; pengenalan positif video perjalanan nyata melalui UI terbaru belum terbukti |
| Meta prompt→pilihan perjalanan | **MOCK VERIFIED / BLOCKED**: kontrak/UI ada [5]; percobaan nyata terakhir ditolak ledger | Bukan E2E Meta→supplier→Save. Entitlement QA juga belum terbukti lengkap |
| TikTok/vt | **BLOCKED** untuk membaca video otomatis; adapter metadata **LIVE VERIFIED terbatas** [5] | Short-link→oEmbed pernah 200 tetapi tanpa caption berguna. Tidak ada download video/ASR; URL saja tidak cukup memahami isi |
| AI editor itinerary lama | **CONFIGURED / UNVERIFIED** pada runtime saat ini | `worker/itinerary.js` memakai OpenAI, bukan Meta; belum disediakan router staging. Riwayat sukses lama tidak membuktikan build terbaru |
| Tour Guide Q&A/narasi | **MOCK VERIFIED** untuk UI; **NOT CONFIGURED** untuk Q&A model live | `guideAnswer` berbasis kurasi, speech memakai browser; bukan endpoint Meta [6] |
| Nearby / Local Discovery | **MOCK VERIFIED** untuk alur dan GPS fallback; **NOT CONFIGURED** untuk Places live | Katalog referensi/fixture berlabel; bukan pencarian restoran real-time [6] |
| Travelpayouts/Aviasales | **LIVE VERIFIED historis**, contoh CGK⇄HAN 24 Okt [7] | Data API cache/indikatif, bukan harga terkunci. Akses credential staging **UNKNOWN**; asal hanya CGK/SUB/DPS |
| Nuitée/LiteAPI hotel | **LIVE VERIFIED historis**, KL 23 hotel budget dan Sepang 24 Okt [7] | Staging belum membuka hotel. Akses credential kini **UNKNOWN**; bukti inventory bukan booking/payout |
| Nuitée payment portal | **LIVE VERIFIED sampai portal saja**, 22/24 Okt [7] | Pembayaran/Book/settlement dan tanggung jawab tagihan LAS-3185 belum tuntas. White-label tidak dipakai sebagai syarat produk |
| 12Go | **LIVE VERIFIED historis terbatas**, backend browser KL–Melaka 23/24 Okt [7] | Tanpa API inventory; parser browser satu dewasa saja. Multi-orang, route lain dan akses browser staging belum terbukti |
| Viator | **LIVE VERIFIED historis**, production Singapore dua produk 24 Okt [7] | Basic search/from-price, bukan tarif pasti tanggal/opsi/kuota tiket. Binding staging belum disediakan |
| Trip.com | **LIVE VERIFIED terbatas** untuk render form widget 22 Okt [7] | API hotel dan cloud quote automation tidak terbukti; redirect login pernah menghambat. Click-out/komisi belum terbukti |
| Klook | **CONFIGURED / UNVERIFIED** [7] | Widget owner tersedia dalam kode, bukan bukti inventory/API/checkout live |
| Agoda / Booking.com | **NOT CONFIGURED** untuk API operasional; approval **UNKNOWN** [7] | Agoda approval tidak terbukti; CJ account bukan approval Booking.com Demand API. Jangan anggap URL referensi sebagai affiliate aktif |
| Midtrans / Trip Pass | **CONFIGURED / UNVERIFIED** untuk lifecycle pembayaran live [7] | Owner pernah melaporkan mode/key production. Tidak ada bukti baru provider authentication, transaksi atau settlement; QA discovery schema terpisah |
| Google Routes / Maps | **LIVE VERIFIED historis** WALK production 22 Okt; UI peta terbaru **MOCK VERIFIED** [1,7] | TRANSIT/fare/DRIVE production tidak tersertifikasi. Staging menolak API Routes; Google Maps link tidak memerlukan klaim tarif |
| Price Watch / support / email | **CONFIGURED / UNVERIFIED** saat ini | Source cron/outbox/entitlement ada; chat online pernah dikonfirmasi owner. Delivery, renewal/expiry dan email end-to-end belum diaudit live sekarang |

## 2. Environment, routing dan konfigurasi

| Lingkungan | Source dan resource | Status / pemisahan |
|---|---|---|
| Production | `wrangler.jsonc` → `worker/index.js`, assets `dist`; domain `sorttrip.yusufridlo7.workers.dev`; Supabase yang dikenal `tznxfgosmjcmwoszvkdk` | Worker memiliki browser, recommendation KV dan cron. Binding Supabase/secret dashboard tidak dibaca; kesesuaian runtime **UNKNOWN** dalam audit ini. Jangan memakai resource tersebut untuk QA |
| Dev normal | `vite.config.js`: `/api`→127.0.0.1:8787; `app/supabase.ts`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | Normal dev dapat memuat root env. Bukan profil QA aman otomatis; audit tidak membaca nilainya |
| Owner UI sekarang | `vite.owner-ui.config.js`, 127.0.0.1:5173, entry asli AuthApp→TravelApp | `envDir:false`, key/URL kosong, hanya katalog lokal; API lain 503. Tidak dapat login/cloud Save/live AI. GET200 sebelumnya [1], tidak diperiksa ulang audit ini |
| MVP terpisah | `vite.mvp-demo.config.js`, 127.0.0.1:5175 | Fixture dan browser persistence berlabel; bukan aplikasi utama atau bukti live |
| QA Meta lokal | `vite.meta-qa.config.js` 5174→8790; `wrangler.meta-qa.jsonc`→`worker/meta-qa.js`; proyek `aytrcvfncsklhqozreyk` | Bukti penghentian 28 Okt [8]. Status proses sekarang tidak diperiksa ulang. **File config masih berisi flag text/frame/budget true**: restart bukan langkah aman otomatis |
| Staging usulan | `vite.staging.config.js`→`staging.html`→`app/staging-entry.tsx`; `wrangler.staging.jsonc`→`worker/staging.js`; proyek QA saja | Belum deploy menurut catatan. Host usulan `sorttrip-staging.yusufridlo7.workers.dev`; Access/owner placeholder, generation flags false; tanpa cron/KV/browser production [9] |

**Celah staging saat ini:** shell staging memakai komponen WorldPlanner/FlightSearch, tetapi bukan entry TravelApp asli dan tidak memasok `mediaInput`. Router allowlist hanya identity/session, assistant access/discover, flights, locations dan recommendations; video/frame, hotel, Viator, pembayaran, Routes dan AI editor lama ditolak. Build juga `publicDir:false` dan hanya memancarkan brand CSS: aset foto/logo yang dirujuk perlu diverifikasi/disertakan secara terpilih sebelum review visual online. Persiapan staging belum otomatis mewarisi integrasi UI terbaru.

**Nama binding yang perlu diverifikasi owner secara privat, bukan nilainya:**

- Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`; build staging menerima QA public binding dari direktori `qa-config/meta` atau `STAGING_PUBLIC_PUBLISHABLE_KEY`.
- Server QA: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`; adapter lama tertentu masih memakai `SUPABASE_SERVICE_ROLE_KEY`. Staging sengaja menolak binding legacy service-role tersebut dan `OPENAI_API_KEY`/payment/production resource tertentu.
- Meta: `META_MODEL_API_KEY`, `META_VIDEO_NONPRODUCTION`, `META_VIDEO_TEXT_ENABLED`, `META_VIDEO_FRAMES_ENABLED`, `META_VIDEO_BUDGET_READY`, `AI_LIMITER`; staging juga `STAGING_GENERATION_ENABLED`.
- Access: `APP_ENV`, `STAGING_ORIGIN`, `STAGING_OWNER_QA_USER_ID`, `STAGING_OWNER_EMAIL`, `CF_ACCESS_ISSUER`, `CF_ACCESS_AUD`.
- Supplier: `TRAVELPAYOUTS_API_TOKEN`, `TRAVELPAYOUTS_MARKER`; `LITEAPI_API_KEY`, `LITEAPI_ENABLED`; `VIATOR_API_KEY`, `VIATOR_ENVIRONMENT`; `HOTEL_BROWSER`/`HOTEL_BROWSER_ENABLED` untuk browser provider. Keberadaan nama tidak membuktikan credential sah/berizin.
- Transaksi: `MIDTRANS_SERVER_KEY`, `MIDTRANS_ENV`, `PAYMENTS_ENABLED`; `LITEAPI_CHECKOUT_ENABLED`, `LITEAPI_CHECKOUT_MODE`, `LITEAPI_BOOKING_LIVE_APPROVED`. Tidak dibutuhkan pada sprint staging read-only.
- Fitur tambahan: `GOOGLE_MAPS_API_KEY` sesuai source Google Routes; `RESEND_API_KEY`, `PRICE_WATCH_FROM`; `SUPPORT_TELEGRAM_BOT_TOKEN`, `SUPPORT_TELEGRAM_CHAT_ID`, `SUPPORT_TELEGRAM_WEBHOOK_SECRET`. Jangan menyalin credential production ke QA.

API frontend umumnya relatif `/api`; Vite normal menerjemahkan Origin hanya dari origin lokal tepercaya. Handler sensitif memeriksa same-origin; tidak ada alasan menambah wildcard CORS. Staging memeriksa host, Access JWT signature/issuer/audience/waktu/email, session Supabase QA dan UUID owner sebelum akses API. Semua asset juga Worker-first. Konfigurasi Access nyata dan Auth Site URL/redirect/signup QA **belum diverifikasi**.

Release scripts tersedia: `build`, `build:staging`, `verify:staging`, `build:staging-worker`, serta smoke yang memerlukan flag remote-approved. `deploy:check` tetap menjalankan Wrangler dry-run, sehingga tidak dijalankan audit ini. Build/config lokal bukan bukti deployment. `scripts/staging-verify.mjs` memeriksa pemisahan host/proyek/flag/pola secret; bukan scanner keamanan lengkap atau bukti artifact sama dengan deployed runtime.

## 3. Auth, penyimpanan dan entitlement

`app/supabase.ts` memakai `createClient` dengan bounded fetch dan default session persistence SDK; `app/auth-app.tsx` memakai `getSession` + `onAuthStateChange`, remount TravelApp per user dan local sign-out. Credential browser tidak diperiksa audit ini.

`app/database-trips.ts` melakukan `getUser`, mencocokkan expected user, SELECT milik user, INSERT `user_id`, serta UPDATE dengan filter id+user. `TravelApp.persistTrip` memakai save queue/reconciliation; My Trips membaca database, session draft bukan cloud Save. Trip disimpan sebagai JSONB sehingga metadata video dan item Nearby ikut tersimpan; ada batas 300 item klien dan 200KB database. RLS source `supabase/schema.sql` mewajibkan `auth.uid()=user_id` untuk SELECT/INSERT/UPDATE, tanpa DELETE. Hasil nyata dua akun [2] kuat untuk schema QA saat diuji; jangan menjalankan CREATE TABLE ulang atau menganggap policy deployed belum berubah.

**Mengapa owner tidak bisa menyelesaikan alur sekarang:** 5173 sengaja tidak terhubung Auth/database; QA lokal lama dihentikan; identitas/langganan production tidak berlaku pada QA; diagnosis owner pernah menunjukkan tabel/RPC Trip Pass QA tidak ada. Usulan schema/hak uji [9] belum terbukti diterapkan. Discovery membutuhkan `trip_passes`, `ai_request_reservations`, `reserve_paid_ai_request`, `finish_ai_request`; sukses Auth saja tidak menyelesaikan gate ini. Save manual sendiri tidak perlu pembelian pass; jangan menambahkan paywall pada Save untuk menutupi masalah konfigurasi.

## 4. Meta, TikTok dan ledger

`worker/video-itinerary.js:extractMetaText` menetapkan **muse-spark-1.3**, endpoint tetap `https://api.meta.ai/v1/responses` dan `/input_tokens`, server key saja. Semua jalur Meta pada source ini berbagi output **2.000**, input terhitung ≤20.000, satu inference tanpa retry/tools, timeout maksimal30detik. Tarif estimasi hardcoded source bukan validasi billing/rate provider terkini. Budget global USD10, reservasi USD0,05, maksimum10 alokasi/user pada SQL; kegagalan/usage tidak diketahui tidak mengembalikan alokasi otomatis.

Browser mendekode MP4/MOV/M4V kompatibel, ≤4MiB/60detik, mengambil maksimal3 JPEG ≤320px/32KiB; body frame ≤240.000byte. Raw video backend ditolak sebagai `MEDIA_PROCESSOR_REQUIRED`, bukan diam-diam diteruskan. Tidak ada audio/ASR. Respons harus completed, model sesuai, JSON/schema valid, evidence divalidasi dan identitas tempat dicocokkan katalog; user tetap meninjau/koreksi. Katalog terbatas berarti tempat sah yang belum dikenal dapat gagal resolusi.

Dua alur URL berbeda: `tiktokReference` pada discovery mengambil metadata oEmbed dengan bounded redirect/host; `linked-transcript` pada ekstraksi hanya mengirim teks yang disediakan user, bukan video. Sumber publik yang kosong meminta klarifikasi. TikTok owner sebelumnya sekitar70detik, melebihi batas upload60detik [3]; jangan menjanjikan link apa pun langsung menjadi itinerary.

**Ledger: BLOCKED menurut bukti terakhir, kondisi live sekarang UNKNOWN.** Owner terakhir melaporkan alokasi USD0,35, sisaUSD9,65, tujuh request, nol unsettled, satu output2.305; bukan kekurangan saldo atau bukti billing Meta bermasalah [4]. Discovery historis sempat meminta4.000, bertentangan dengan guard2.000. Source telah diturunkan; kecocokan runtime deployed belum terbukti. HTTP429 juga dapat berasal dari limiter atau reservasi pass sibuk, sehingga periksa code, jangan menebak dari HTTP saja.

Settlement source memblokir saat biaya>0,05/input>20.000/output>2.000 **sebelum** memeriksa keberadaan/status request; duplicate/delayed settlement over-limit dapat reblock. Fingerprint yang pernah dilaporkan tidak membuktikan body/ACL/triggers/jobs sekarang. Remote writer masih UNKNOWN; bukti stop lokal [8] bukan drain global. SQL06/07 tetap tidak dijalankan; usulan recovery tetap NOT APPROVED. Audit ini tidak menyatakan ledger sudah pulih atau siap dipulihkan.

## 5. Detail supplier, harga dan pembayaran

- **Flights:** `worker/index.js:parseQuery/searchFlights/normalize` memakai Aviasales `prices_for_dates`, header server `X-Access-Token`, IDR, filter tanggal/durasi/region/domestic dan return versus one-way. Worldwide dibatasi katalog/coverage supplier; asal CGK/SUB/DPS. Return fare satu kombinasi, jangan dikali dua. `app/api-flights.ts` menyatakan **satu dewasa**, link pun satu dewasa; traveler lain memengaruhi anggaran, bukan jaminan inventory grup. Affiliate provider link dibatasi origin Aviasales; booking evidence menambahkan marker publik existing. Timeout12detik, pagination/partial hasil perlu ditampilkan; kosong bukan bukti tidak ada penerbangan.
- **Hotel:** `worker/hotel-search.js`, `hotel-discovery.js`, `lite-hotel.js` memakai LiteAPI v3 rates, kota/negara/area, tanggal, full-stay total IDR/tax breakdown dan default `ceil(people/2)` kamar. Budget per-room-night tidak boleh dihitung hanya satu malam. Hotel images lewat `hotel-content.js` membatasi HTTPS/format, tanpa membuktikan semua foto representatif. Native checkout memakai auth/ownership/explicit consent, prebook lalu payment lalu Book; redirect bukan booking terkonfirmasi. Markup5% historis [7], bukan earnings/payout. White-label masih ada sebagai konfigurasi/helper legacy, tetapi owner sudah mengeluarkannya dari alur aktif: country403 White-label bukan blocker search API.
- **12Go:** `app/transport-affiliate.mjs` memakai alias route terbatas, tanggal/pax1–8 dan ID publik existing; browser quote `worker/transport-browser.js:datedTransportUrl` sengaja hanya people=1. Terminal/route tak didukung harus unavailable. Bukan API partner atau harga pasti kursi.
- **Viator:** `worker/viator.js` memilih sandbox/production, fixed search/freetext, IDR/fromPrice, provider-generated productUrl/attribution dan city resolution. Basic search bukan availability/booking API; parameter tanggal/pax tidak membuktikan exact quote.
- **Widgets:** Trip.com/Klook/12Go tetap embed/affiliate, bukan API backend. Review iframe sandbox dan message source checks sudah ada; widget loader tidak membuktikan pencarian selesai atau tracking/commission berhasil.
- **Midtrans:** `worker/payments.js` memilih host dari `MIDTRANS_ENV` (fallback sandbox); production butuh `PAYMENTS_ENABLED`, checkout terkait saved trip dan server price Rp30.000. Tidak memakai client key dalam alur hosted Snap ini. Webhook SHA512 diperiksa, lalu status diambil lagi server-to-server, order/amount/currency dicocokkan. `supabase/payments.sql` memakai row lock, unique pending dan reference idempoten; legacy Rp15.000 dipertahankan. Validasi source bukan bukti deployed schema/notification URL/settlement. Price Watch memakai pass dan job/outbox tersendiri, email butuh Resend; bukan otomatis teruji oleh pass display.

## 6. Temuan keamanan dan privasi

**Kontrol yang terlihat:** server-only supplier/Meta keys; QA/staging fixed host; JWT Access diverifikasi kriptografis; RLS user; URL TikTok canonical/allowlist tanpa arbitrary redirect/media fetch; explicit media consent; GPS satu kali di memori, tanpa watchPosition/background; cleanup object URL/video; model evidence dipisah dari perintah; output tidak boleh membuat harga/booking/koordinat; affiliate HTTPS/host validation; signed webhook dan status reconciliation; fixtures video owner-only mode dan label curated/demo pada Nearby. Tidak ditemukan fallback diam-diam dari error AI ke fixture pada source normal yang ditinjau.

**Wajib diselesaikan sebelum live luas:**

1. `/api/video-itinerary` memeriksa auth+limiter+nonproduction+ledger, tetapi **tidak memakai paid Trip Pass RPC** seperti discovery. Pertahankan sebagai QA-only atau samakan entitlement sebelum membukanya pada produk. Ini bukan izin bypass.
2. Gate `META_VIDEO_NONPRODUCTION=true` di extractor bukan pemeriksaan URL proyek; router QA/staging yang memberi isolasi lebih kuat. Worker generik juga memuat route Meta: deployed binding/flag tidak boleh diasumsikan aman dari source.
3. Ledger hard cap hanya mencakup adapter Meta tersebut; OpenAI editor, browser supplier, Routes dan pemakaian akun provider di luar app tidak tercakup USD10 ini. Data rate/Standard/privacy account perlu owner tinjau sebelum inference.
4. Prompt injection tetap mungkin dalam metadata/model; instruksi dan schema mengurangi dampak, bukan bukti kebal. Pertahankan review dan no financial tools; hasil model bukan sumber kebenaran komersial.
5. Pemeriksaan hotel image/URL source bukan SSRF/DNS audit menyeluruh; jangan perluas arbitrary server fetch. Browser affiliate API approval/terms dan keamanan third-party script tetap perlu scope review. Tidak dilakukan penetration test.
6. Kontrol source, build fixture scan dan bukti RLS terdahulu tidak membuktikan secret bebas bocor di seluruh artifact/deployment sekarang. Audit tidak membaca private env/log/session atau mengekspor bundle key. Pemeriksaan dependency/advisory historis bukan vulnerability scan terkini.

Untuk Places live, siapkan adapter server read-only dengan interface `{id,name,category,location,sources,checkedAt,price?,hours?,halalEvidence?}`. Kandidat arsitektur: Google Places dengan persetujuan biaya/terms, atau katalog OSM/kurasi berlisensi dengan aturan layanan yang ditinjau. Tidak ada akun/provider baru yang dipilih/dibeli; Google Routes existing **bukan bukti Places sudah aktif**. Unknown tetap unknown, terutama halal/harga/jam.

## 7. Roadmap terkecil menuju submission

Kompleksitas: K=kecil, S=sedang, B=besar; perkiraan relatif, bukan janji jadwal. Deadline5Nov mengikuti brief owner, belum diverifikasi sebagai aturan resmi kompetisi.

| Urutan / prioritas | Status → blocker | Tindakan minimum | Approval owner | Kompleksitas / dependensi |
|---|---|---|---|---|
| 1 / P0 | BLOCKED Meta → snapshot lama/remote writers dan deployed functions belum terbukti | Review bukti drain, cap runtime, fungsi/ACL dan snapshot QA hanya-baca yang sudah disiapkan; keputusan recovery terpisah, jangan reset | Ya untuk akses privat/SQL; recovery izin tersendiri | S; sebelum inference |
| 2 / P0 | Auth/Save historis live, owner UI offline; QA pass belum terbukti | Pilih QA owner identity existing, tinjau schema minimum dan owner-test entitlement existing; jangan membeli ulang/mengimpor pass production | Ya untuk SQL/access, owner login sendiri | S; setelah validasi QA/ledger |
| 3 / P0 | Staging source lokal → shell/allowlist/assets belum sesuai UI baru | Satukan entry UI asli pada isolasi staging; QA-only auth/Save; allowlist video read-only dan supplier hotel yang disetujui, tanpa payment/cron | Ya, implementasi berikutnya; deploy terpisah | S; bergantung1–2 untuk live |
| 4 / P0 | Flights/hotel historis live → akses staging sah belum terbukti | Existing Aviasales read adapter + LiteAPI rates/content read-only dengan izin credential staging; supplier kosong ditampilkan unknown | Ya untuk private binding dan uji baca; tidak booking | S; 3, owner scope supplier |
| 5 / P0 | Recognition+Save E2E belum terbukti | Satu video berizin≤60detik/4MiB → real Meta → review → native itinerary → quote tiket/hotel → edit → QA Save/reload; verifikasi accounting, tanpa retry otomatis | Ya untuk inference, DB test rows, owner login | S; 1–4 |
| 6 / P0 | Editor/redirect fixture/historis → parameter grup dan UI baru belum diterima live | Cek tanggal malam/pax/kamar, harga unknown, Maps dan link affiliate tanpa checkout/booking; tetapkan apakah replanning OpenAI termasuk demo atau gunakan edit manual | Ya untuk live read; model lain izin terpisah | K–S; 4–5 |
| 7 / P1 | Staging belum online | Access owner-only, QA redirects/resource isolation, deploy terkunci, negative smoke, baru bounded inference bila diizinkan; rollback staging saja | Ya deploy/setting, terpisah dari kode | S; 3 dan review keamanan |
| 8 / P1 | Guide curated / Places absent | Tambahkan Q&A model dan Places adapter hanya bila waktu cukup; consent/cost/source enforcement. Untuk submission awal tetap jujur curated | Ya untuk kode/API/biaya | S–B; setelah P0 |
| 9 / P1 | 12Go/Viator live historis parsial | Verifikasi satu route/date/pax dan satu attraction from-price; jangan membangun booking/payment baru | Ya uji supplier, bukan transaksi | S; supplier scope |
| 10 / P2 | Belum dikembangkan | Advanced GPS, personalization real-time, supplier coverage, voice/replanning lanjutan | Brief dan approval baru | B; di luar sprint deadline |

**Sprint berikutnya yang direkomendasikan:** “QA asli satu URL, satu perjalanan, read-only supplier”. Prioritaskan Auth/Save + satu video Meta + satu flight + satu hotel + edit/Maps/link. TikTok fallback transparan, Q&A/nearby kurasi tetap berlabel. Jangan memperluas ke pembayaran, ASR/full-video, native mobile atau companion background sebelum P0 lulus.

## 8. Persetujuan dan prosedur penerimaan

Ini daftar keputusan, **bukan instruksi menjalankan perubahan sekarang**:

1. Setujui lingkup implementasi sprint dan keputusan memakai UI asli pada staging, bukan shell lama.
2. Owner meninjau secara privat project QA, Auth redirects/identity, Cloudflare Access dan scope existing credential. Jangan kirim key/UUID/session ke chat.
3. Setujui pemeriksaan QA read-only existing SQL secara terpisah. Recovery SQL06 tetap tertahan sampai semua safety gate terpenuhi; bila ada drift/unknown, stop. Persetujuan recovery harus menunjuk versi final file; bukan izin inference.
4. Tinjau `docs/staging-proposal/sql/02_MINIMUM_QA_ENTITLEMENT_SCHEMA_PROPOSED.sql` dan `03_OWNER_TEST_ENTITLEMENT_PROPOSED.sql` sebagai proposal, bukan executed migration. Owner sendiri menjalankan hanya delta yang disetujui; jangan lemahkan RLS/grant klien. Test pass dua hasil/24jam bukan pembayaran palsu atau kenaikan budget.
5. Approval deploy staging awal dengan generasi off dan Access terkunci, kemudian smoke negatif. Tidak mencakup production.
6. Approval uji login/Save QA dan supplier baca dengan fixture perjalanan non-sensitive. Akun kedua sudah pernah ada [2]; tidak perlu membuat ulang tanpa alasan.
7. Setelah ledger/entitlement/runtime siap, approval **satu** inference Meta bounded dengan video owner berizin. Bila gagal/time-out, periksa hasil/accounting sebelum meminta retry; jangan menaikkan cap. Tidak ada kartu, Pay, Book, prebook atau webhook live dalam acceptance ini.

Penerimaan nyata harus mencatat build/runtime, QA host, identity gate, relevansi tujuan/prompt, full days/nights, quote supplier nyata (cache diberi label), pax/rooms, missing prices, edit yang bertahan pada reload/My Trips, penolakan non-owner serta accounting sebelum/sesudah. Pengujian A/B RLS memakai disposable QA trip setelah izin write. HTTP200 kosong, label demo atau mock client tidak memenuhi E2E nyata.

Rollback kelak: tutup Access/ingress dan generasi **staging saja**, pulihkan versi Worker/assets staging terkunci. Jangan menghapus trips/ledger atau membalik DB tanpa persetujuan owner. Rollback kode tidak mengembalikan biaya/alokasi; production tidak disentuh.

## 9. GO / NO-GO

| Target | Keputusan sekarang | Syarat / batas |
|---|---|---|
| Local demo | **GO terbatas** | UI asli di http://127.0.0.1:5173/; 5175 hanya referensi MVP. Berdasarkan bukti pengujian sebelumnya [1], bukan cek proses baru; live auth/AI/supplier tidak aktif |
| Real QA integration testing | **NO-GO** untuk perjalanan penuh/inference | Boleh diajukan langkah read-only terotorisasi; belum izin login/write/model. Ledger, entitlement dan runtime gates belum lulus |
| Staging deployment | **NO-GO** | Access placeholder, UI/rute/assets belum selaras, QA resource verification dan release approval belum lengkap |
| Production release | **NO-GO** untuk paket hackathon terbaru | Tidak menilai production lama harus dimatikan; perubahan terbaru belum mendapat live acceptance/release approval |
| Hackathon submission | **NO-GO** sebagai produk live end-to-end | Demo berlabel ada, tetapi P0 belum tuntas; eligibility/rules/submission terms juga belum dibuktikan dalam audit ini |

## Referensi bukti

1. [UI terpadu, tes dan fixture](../qa-reports/UNIFIED_UI_INTEGRATION_2026-10-28.md); [browser results](../artifacts/unified-ui/browser-results.json).
2. [Supabase QA dua akun dan Save](hackathon-2026/phase-2/phase-2c/SUPABASE_RLS_QA.md). Catatan “negative pending” di paragraf awal laporan lama sudah disupersede tabel PASS dan kesimpulan lanjutannya; tidak digunakan sebagai bukti kegagalan sekarang.
3. [Meta upload/vt aktual dan batas interpretasi](../qa-reports/VIDEO_UPLOAD_VT_FIX_2026-10-28.md); [frame analysis](hackathon-2026/phase-2/phase-2c/VIDEO_FRAME_ANALYSIS.md).
4. [Ledger root cause](../qa-reports/META_QA_LEDGER_ROOT_CAUSE_AUDIT_2026-10-28.md); [safety verification](../qa-reports/META_QA_FINAL_SAFETY_VERIFICATION_2026-10-28.md); [proposal recovery, tidak dieksekusi](staging-proposal/sql/06_PROPOSED_SAFE_LEDGER_RECOVERY.sql).
5. [Prompt discovery dan TikTok check](../qa-reports/ASSISTANT_PROMPT_DISCOVERY_QA_2026-10-28.md); `worker/assistant-discovery.js`, `worker/assistant-discovery-contract.js`, `worker/tiktok-reference.js`.
6. `app/tour-guide.tsx`, `lib/tour-guide.mjs`, `app/local-discovery.tsx`, `lib/local-discovery.mjs`; [Local Discovery report](../qa-reports/LOCAL_DISCOVERY_MVP_2026-10-28.md).
7. [Register partner dan kronologi terverifikasi](PARTNERS.md); [QA live24Okt](../qa-reports/2026-10-24-full/QA_REPORT.md); [release24Okt](../qa-reports/RELEASE_QA_BRANDING_2026-10-24.md); [baseline supplier MVP](../qa-reports/HACKATHON_MVP_BOOKING_BASELINE_2026-10-28.md).
8. [QA lokal dihentikan; writer remote belum terverifikasi](../qa-reports/META_QA_LOCAL_SERVERS_SHUTDOWN_2026-10-28.md).
9. [Persiapan staging, tes fixture dan SQL proposal](staging-proposal/IMPLEMENTATION_PREPARATION_2026-10-28.md); `worker/staging.js`, `worker/staging-access.js`, `app/staging-entry.tsx`, `vite.staging.config.js`, `wrangler.staging.jsonc`.

**Audit selesai. Menunggu persetujuan owner; tidak memulai sprint berikutnya.**

# SortTrip QA Audit

## Production Tested

- Tanggal: 2 Oktober 2026 (Asia/Jakarta). Audit production dimulai pada sesi sebelumnya sekitar 05:40 WIB; dilanjutkan dengan regression lokal pada hari yang sama. Ini satu audit berkelanjutan, bukan audit ulang dari awal.
- Production: https://sorttrip.yusufridlo7.workers.dev/
- Lokal: Vite http://127.0.0.1:5173/ dan Worker http://127.0.0.1:8787/ di terminal terpisah.
- Browser: official Codex In-app Browser. Login production dan lokal dilakukan owner, kemudian diverifikasi melalui state UI. Tidak membaca credential, storage autentikasi, atau nilai environment.
- Status laporan: **LOCAL REPAIR / CORE REGRESSION COMPLETE; LIVE AI AND EXTERNAL CONFIGURATION HOLD**. Browser sempat terputus, lalu pulih dan checklist browser yang tertunda dilanjutkan pada sesi yang sama. Keterbatasan live AI, auth dua akun, payment dan partner tetap berlaku.
- Tidak commit, push, deploy, mengubah secret production, membeli produk, atau menerima agreement partner.

## Working Features

- Homepage, navigasi internal, CTA pencarian, autocomplete, pemilihan negara/kota/tanggal/penerbangan, dan tombol Susun itinerary bekerja dalam alur yang diuji.
- Query Jakarta, Bangkok, Kuala Lumpur, Tokyo, Singapore, Bali berhasil. Query tidak dikenal dan query kosong menghasilkan empty state tanpa inventory buatan.
- **Aviasales memiliki inventory nyata**: production CGK–KUL PP 8–11 Oktober 2026 menampilkan harga indikatif Rp2.017.193 per dewasa. Lokal setelah perbaikan scope: CGK–DPS PP 1–4 Desember 2026 menampilkan Rp2.809.416 per dewasa. Harga berdasarkan data pencarian sebelumnya; bukan jaminan ketersediaan atau harga checkout.
- Create itinerary manual, edit aktivitas dan biaya, save ke akun, buka ulang, serta persistence setelah reload terverifikasi. Sesi login lokal juga bertahan setelah reload.
- Trip QA Kuala Lumpur 8–11 Oktober 2026 dibuat saat production QA. Aktivitas `QA AUDIT 2026-10-02 — aktivitas uji` awalnya Rp12.345; regression lokal mengubahnya ke Rp23.456. Total berubah dari Rp4.239.538 menjadi Rp4.250.649 (selisih Rp11.111), lalu nilai baru terverifikasi di daftar trip setelah reload.
- Trip Singapura milik owner yang sudah ada tidak diubah. Trip QA masih tersimpan; tidak dilakukan penghapusan permanen.
- Peta Leaflet memuat tile OpenStreetMap dan marker. Garis rute dijelaskan sebagai urutan titik, bukan jalur jalan terverifikasi.
- Hotel dan transport memiliki label contoh/estimasi serta tautan pencarian eksternal; tidak dibuktikan sebagai inventory live.
- Validasi API menolak input penerbangan invalid, metode AI salah, request AI tanpa auth, serta origin asing.

## Broken Features

16 temuan kode ditangani: **0 Critical, 5 High, 9 Medium, 2 Low**. Tabel membedakan bukti browser dari temuan source dan tes sintetis. Penyelesaian kode tidak berarti seluruh verifikasi browser selesai.

| Severity | Feature | Symptom | Root Cause | Fix | Test |
|----------|---------|---------|------------|-----|------|
| HIGH | Penerbangan domestik | Tujuan domestik eksplisit tersaring | Frontend selalu memakai scope international | Scope all untuk tujuan spesifik/menu Pesawat; discovery umum tetap international | Tes API + browser lokal CGK–DPS menghasilkan inventory |
| HIGH | Jadwal lintas tengah malam | Jam hotel 01:55 ditempatkan di hari kedatangan; aktivitas dapat mendahului kedatangan/terlalu dekat pulang | Arrival day offset tidak dihitung dan template belum dibatasi waktu aktual | Hitung offset tanggal zona tujuan, jadwalkan hotel pada hari tepat, filter aktivitas dengan buffer | Tes overnight/late arrival/early return lulus; trip lama tidak ditulis ulang otomatis |
| HIGH | Regenerasi itinerary lama | Regenerasi legacy dapat menimpa item paid | Tidak ada guard booking pada tombol template lama | Tombol disabled dan handler menolak bila ada paid item | Source review + build; konflik locked AI juga diuji; jalur legacy UI belum diuji akhir |
| HIGH | Save saat masih diedit | Save pertama dapat kehilangan id bila user mengedit saat request berjalan; save berikutnya berpotensi insert duplikat | Respons hanya diterapkan jika object snapshot masih sama | Rekonsiliasi snapshot mempertahankan edit dan id; identitas draft dan lock request melindungi task berbeda | Tes concurrent edit/different draft lulus; edit/save/reload biasa terverifikasi browser |
| HIGH | Proxy POST development | AI/status Trip Pass lokal mendapat 403 sebelum logika fitur | Origin frontend 5173 berbeda dari Worker 8787 | Proxy menerjemahkan origin hanya untuk pasangan Host/Origin lokal tepat; Worker tetap memvalidasi origin | Browser AI sekarang 503 configuration, bukan 403; origin asing tetap 403 |
| MEDIUM | Itinerary mobile | Lebar konten 609 px pada viewport 375/390 | Grid child mengikuti min-content width | min-width:0, pembungkusan teks jadwal, batas banner/tabs | Browser: tidak overflow pada 375,390,768,1440; tile map tetap termuat |
| MEDIUM | Draft belum disimpan | Keluar ke pencarian membersihkan dirty flag; reload tanpa peringatan | State dirty dibuang pada navigasi | Pertahankan dirty flag; beforeunload ketika draft kotor | Reload melalui browser mempertahankan planner dan dirty draft; API dialog tidak mengembalikan dialog, jadi teks prompt native tidak diklaim terverifikasi |
| MEDIUM | Request tanpa deadline | Loading bisa bertahan pada network yang tidak selesai | Fetch frontend dan koneksi Supabase tanpa batas waktu | Deadline autocomplete 10s, flight 20s, AI 115s, database/status payment 20s; pertahankan cancel signal | Unit cancellation lulus; timeout nyata browser belum diinjeksi |
| MEDIUM | Perbandingan hotel | Harga berbeda per platform dan label termurah berasal dari offset buatan | hotelPlatforms membuat pseudo-offer | Hapus offset/termurah; provider menyatakan harga belum tersedia; biaya hanya estimasi anggaran dan CTA cek penyedia | Browser expanded provider lulus: tarif belum tersedia dan estimasi bukan penawaran |
| MEDIUM | Error penyedia AI | Satu pesan mencampurkan quota habis dan rate limit | Semua upstream 429 dipetakan sama | Code allowlist AI_PROVIDER_QUOTA / RATE_LIMIT / UNAVAILABLE, pesan aman tanpa body upstream | Tes 429 quota,429 rate,401 provider lulus termasuk larangan refleksi detail sensitif |
| MEDIUM | Status Trip Pass | Kegagalan status otomatis terlihat seperti konfigurasi/pembayaran belum tersedia | Catch kosong dan status non-OK diabaikan | Pesan gagal muat eksplisit + deadline; tombol cek ulang tetap tersedia | Source/build; tidak melakukan checkout atau grant owner-test |
| MEDIUM | Budget WorldPlanner | Edit inline menerima nilai di atas batas maksimum | Handler hanya memeriksa finite dan >=0 | Terapkan batas 1 miliar juga pada handler tambah/edit | Browser menolak 1000000001 saat tambah dan edit inline; 12345 diterima |
| MEDIUM | Autocomplete Bali | DPS kalah urutan dari lokasi bernama Bali lain | Hasil filter tidak merangking intent populer | Ranking exact code, alias, exact city, prefix | Tes API dan browser menunjukkan DPS urutan pertama |
| MEDIUM | Console development | Error send berulang ketika koneksi HMR belum siap | Vite forward-console meneruskan error melalui WebSocket yang belum ada | server.forwardConsole:false; console asli browser tetap tersedia | Setelah reload tidak ada pengulangan error Vite; build dan 76 tes lulus |
| LOW | Judul production | Tab menampilkan versi lokal | Title statis dan override main | Title netral produk | Browser lokal dan build |
| LOW | Asset Leaflet | Build memperingatkan image CSS tidak resolved | Import CSS Leaflet di dalam pipeline CSS | Import leaflet.css langsung di entry JS | Build tidak lagi memperingatkan image Leaflet; tile/marker browser teramati |

## Partner Blocked

- **Viator**: bukti sebelumnya (1 Oktober) Full Access/Enabled di dashboard tetapi sandbox POST 401. Inquiry support sudah terkirim. Tidak mengulang request/bypass restriction. Adapter hanya lokal; production `/api/activities/health` 404. Tidak ada live activities UI yang bisa disahkan dari audit ini.
- **Agoda**: application/approval UNVERIFIED, dashboard terakhir meminta login. Hotel UI contoh bukan bukti koneksi Agoda.
- **Booking.com/CJ**: owner melaporkan akun CJ sudah ada; penyelesaian payout terkait Payoneer under review. Approval Booking.com dan Demand API tidak terbukti.
- **Klook/GetYourGuide**: inquiry terkirim, menunggu respons; bukan approval API.
- **tiket.com**: form terakhir memerlukan login owner. **12Go**: pembatasan akses sebelumnya tetap dihormati.
- **Aviasales tidak PARTNER_BLOCKED dalam pengujian ini.** Positive inventory terverifikasi, tetapi komisi/tracking sampai checkout tidak diuji.
- Tidak membuat fake booking atau response partner untuk meluluskan pengujian.

## Owner Action Required

1. AI production: request UI nyata sebelumnya mendapat pesan quota/rate. Source production lama memetakan upstream 429 ke pesan tersebut. Belum ada bukti apakah insufficient quota atau rate limit sementara; owner perlu memeriksa status/kuota penyedia tanpa mengirim secret. Tidak dilakukan payment/billing oleh agent.
2. AI lokal: health `aiConfigured:false`, POST browser setelah proxy diperbaiki HTTP 503 dengan pesan konfigurasi belum lengkap. Owner mengatur konfigurasi secara lokal bila ingin live AI regression. Tidak ada nilai secret yang dibaca.
3. Browser sudah pulih dan regression tertunda selesai. Verifikasi konfigurasi/domain Travelpayouts Drive melalui dashboard owner bila ingin validasi tracking: script emrld.ltd pada localhost mengeluarkan config is not valid. Jangan mengganti token Data API yang terbukti bekerja.
4. Status partner dan financial onboarding tetap ditangani menurut PARTNERS.md. Jangan melakukan signup ulang Aviasales/CJ.
5. Approval deployment belum diminta: regression wajib masih sebagian tertahan. Production tidak berubah.

## Responsive Issues

- Production homepage/results diperiksa pada 375x667,390x844,768x1024,desktop; tidak ditemukan overflow pada tampilan tersebut.
- Regression itinerary lokal menemukan overflow nyata hingga 609 px pada viewport 375/390. Perbaikan CSS menghasilkan scrollWidth 360,375,753,1425 pada viewport 375,390,768,1440 (ruang scrollbar diperhitungkan), semuanya tanpa overflow horizontal.
- Map tiles tetap loaded saat resize empat viewport.
- Dialog aktivitas production sebelumnya muat pada viewport 375x667 (343x600). Dialog hotel lokal terakhir terlihat scrollable dan berada dalam viewport 375x667; pemeriksaan provider expanded dan screenshot final kemudian berhasil setelah browser pulih.
- Tidak mengklaim semua kombinasi modal, orientasi, keyboard virtual, dan perangkat fisik sudah diuji.

## Console Errors

- Pemeriksaan console production pada titik pemeriksaan map tidak menemukan error/warning.
- Lokal: kegagalan POST AI 403 direproduksi melalui UI dan diperbaiki pada proxy; setelah itu error konfigurasi AI 503 ditampilkan eksplisit.
- Tidak ada rekaman HAR/network penuh. Hasil ini tidak membuktikan seluruh request di semua halaman bebas error. Console akhir berhasil diperiksa: error berulang berasal dari Vite forward-console sebelum fix. Setelah fix, tersisa config is not valid dari dua chunk emrld.ltd pada localhost. Akar konfigurasi partner/domain belum terbukti; jangan menyimpulkan production tracking gagal dari ini.

## API Issues

Probe aman hanya mencetak status, shape/non-sensitive message, dan latency. Tidak memakai atau mengekstrak session browser.

| Endpoint / kasus | Production | Lokal melalui Vite | Keterangan |
|---|---|---|---|
| GET /api/health | 200, AI true, flights true; 456–854 ms | 200, AI false, flights true; 145 ms | Configured bukan bukti request partner selalu berhasil |
| GET /api/locations | Bali 200, sekitar 271 ms | Enam kota 200,22–50 ms; invalid/kosong count0 | DPS diprioritaskan lokal |
| GET /api/flights invalid origin | 400,60 ms | 400,23 ms | Pesan parameter invalid |
| Pencarian flight valid | Inventory CGK–KUL terlihat | Inventory CGK–DPS terlihat | Harga indikatif dan provider link; tidak checkout |
| GET /api/itinerary | Tidak diprobe ulang | 405,18 ms | POST required |
| POST /api/itinerary tanpa auth | 401,309 ms | 503 configuration,21 ms | Lokal config guard lebih dahulu |
| POST /api/itinerary origin asing | 403,58 ms | 403,20 ms | Tidak melemahkan boundary origin |
| POST /api/itinerary browser lokal | N/A | Awal403, setelah fix503 config | Proxy regression terverifikasi |
| GET /api/activities/health | 404,76–192 ms | 200,20 ms, configured true | Source-only adapter belum deployed, bukan bukti Viator API sukses |
| GET endpoint tidak dikenal | Tidak diprobe ulang | 404,19 ms | JSON error aman |

API yang diprobe memakai application/json. Tidak ada Access-Control-Allow-Origin untuk arbitrary origin; frontend memakai same-origin proxy. Supabase dipanggil langsung oleh frontend; save/load autentik terverifikasi melalui UI, bukan melalui pembacaan token.

## Fixes Applied

File source QA: `app/ai-planner.tsx`, `app/api-flights.ts`, `app/bounded-fetch.ts` (baru), `app/destination-input.tsx`, `app/direct-search.tsx`, `app/flight-search.tsx`, `app/globals.css`, `app/hotel-planner.tsx`, `app/supabase.ts`, `app/travel-app.tsx`, `app/travel-data.ts`, `app/trip-pass.tsx`, `app/trip-save.ts` (baru), `app/world-planner.tsx`, `index.html`, `main.jsx`, `vite.config.js`, `worker/index.js`, `worker/itinerary.js`.

Tests: `checks/ai-itinerary.test.mjs`, `checks/flight-itinerary.test.mjs`, `checks/flights-api.test.mjs`.

Memory/report: `docs/QA_AUDIT.md`, `docs/PROJECT_PROGRESS.md`, `docs/NEXT_ACTIONS.md`, `docs/PARTNERS.md`.

Working tree juga memiliki perubahan sebelumnya: `.gitignore`, `package.json`, penghapusan `WORKFLOW.md`, file Telegram/Viator/docs dan file untracked tidak lazim. Itu tidak dianggap hasil repair QA ini dan tidak dibersihkan/di-commit.

## Regression Results

- `npm.cmd run build`: **PASS**, TypeScript + Vite. Bundle utama 804.43 kB (gzip244.20 kB); warning chunk >500 kB masih merupakan catatan performa non-blocking, bukan bukti crash. Warning image Leaflet sudah hilang.
- `node --test checks/*.test.mjs`: **76 passed,0 failed,0 skipped**. Mencakup AI validation/source/locked items, flight API, itinerary/budget, cancellation, concurrent save, payment handlers, price-watch, transport affiliate, Telegram dan Viator. Tests memakai fixture sintetis, bukan bukti live partner/payment/AI sukses.
- `git diff --check`: **PASS**.
- Browser: homepage → search → pilih flight → itinerary telah diuji production; domestik lokal sampai detail flight lulus; local saved QA → edit → save → reload → re-open lulus.
- Browser map/resize, error AI lokal, autocomplete Bali, data QA budget lulus pada cakupan yang dicatat.
- AI nyata **BLOCKED**, bukan PASS: production provider429, lokal503 configuration.
- Guest login gate teramati; login manual dan session persistence lulus. Register, invalid credentials, logout terakhir, dan ownership dua akun belum diuji. RLS SQL/source reviewed tetapi bukan cross-account penetration test.
- Fitur delete saved trip tidak ada di UI maupun grant database; ditandai belum diimplementasikan, bukan tombol rusak. Menghapus akun/data owner tidak dilakukan.

## Remaining Issues

- Browser blockage RESOLVED. Expanded provider hotel, screenshot, console, WorldPlanner boundary dan create/save/reload itinerary baru sudah diuji. Reload dirty mempertahankan draft; dialog native tidak tersedia melalui API sehingga teks prompt tidak terverifikasi.
- **OWNER_ACTION_REQUIRED**: live AI generation/edit AI draft/save/reload belum bisa diluluskan sampai layanan AI berhasil. Jangan menggantinya dengan mock.
- **PARTNER_BLOCKED/UNVERIFIED**: inventory hotel/activities dan tracking/approval partner sebagaimana di atas.
- Trip tersimpan sebelum fix tidak dimigrasikan otomatis; jam/aktivitas lama tetap utuh untuk menghindari menimpa edit/booking owner. Jadwal baru diperbaiki pada pembuatan itinerary.
- Full checkout, payment, live Price Watch scheduler/email delivery dan RLS dua akun belum diverifikasi; tidak boleh mengklaim production-ready untuk bagian tersebut.
- Screenshot bukti: qa-saved-trips.png pada folder visualizations sesi ini. Dua trip QA kini tersimpan (Kuala Lumpur dan Denpasar); trip Singapore owner tidak diubah.
- External script emrld.ltd pada localhost mengeluarkan config is not valid. Perlu verifikasi konfigurasi/domain affiliate, terpisah dari Data API flight. Tidak mengubah script atau akun partner berdasarkan asumsi.

## Production Readiness

**HOLD untuk klaim full production-ready.** Repair kode lokal dan checklist core regression yang tertunda telah selesai; build dan 76 tes lulus. Live AI masih memerlukan tindakan owner dan suksesnya request nyata; partner/payment/tracking belum certified. Patch lokal siap direview, tetapi bukan bukti seluruh produk siap production. Production tetap versi lama. Deployment hanya setelah approval eksplisit; tidak commit/push/deploy otomatis.

## Continuation evidence — 2 Oktober 2026

- Kedua server lokal kembali aktif; health200 di5173/8787, flightsConfigured true, aiConfigured false.
- Hotel expanded provider menampilkan tarif belum tersedia, estimasi anggaran bukan penawaran, dan tautan cek penyedia.
- WorldPlanner: input tambah1000000001 ditolak rangeOverflow; edit inline1000000001 mempertahankan12345.
- Journey baru lokal: Bali search → pilih CGK–DPS 1–4 Des2026 → Susun itinerary → tambah aktivitas QA12345 → save → reload → Perjalanan saya. Subtotal Rp2.821.761 (fare Rp2.809.416 + aktivitas Rp12.345) terverifikasi. Tidak ada booking sungguhan.
- Budget Kuala Lumpur dikembalikan ke4500000 sesudah probe dirty reload; total item tetap Rp4.250.649.
- Vite console forwarding dimatikan untuk menghentikan loop error development, bukan menyembunyikan error browser. Console asli mengidentifikasi error konfigurasi script emrld.ltd; belum terbukti root cause partner/domain.
- Build terakhir PASS;76/76 tests PASS. Main bundle804.43kB; warning ukuran non-blocking tetap ada.

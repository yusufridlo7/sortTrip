# SERAH TERIMA AKTIF — SortTrip ke Muse Code

Tanggal checkpoint: 30 Oktober 2026. Bahasa kerja: Indonesia. Dokumen ini memperbarui status laporan Muse 29 Oktober; laporan lama tetap historis dan jangan dianggap status terbaru.

## 1. Mulai di sini
Workspace Windows: `C:\Yusuf Ridlo\belajar koding\Platform Itinerary\sortTrip_VSCode_Local\sortTrip-local`.
Repository: https://github.com/yusufridlo7/sortTrip
Branch saat diperiksa: `codex/meta-hackathon-phase-2-2026`; HEAD `737fbc5`.
Working tree sangat banyak perubahan tracked/untracked dari beberapa sprint. Semua perlu dipertahankan, termasuk perubahan sebelum sesi ini. Jangan reset/clean/checkout ulang, menghapus untracked, atau menganggap HEAD mencerminkan kode yang sudah deploy. Deployment dilakukan dari working tree; belum commit/push.

Baca berurutan: AGENTS.md; docs/PROJECT_CONTEXT.md; PRODUCT_VISION.md; PARTNERS.md; ARCHITECTURE.md; DECISIONS.md; PROJECT_PROGRESS.md; NEXT_ACTIONS.md. Kemudian docs/PRODUCTION_DEPLOYMENT_2026-10-30.md dan PRODUCTION_SECURITY_GATE_2026-10-30.md. Laporan ini adalah checkpoint, bukan pengganti source code. Dokumen lama dapat memuat pembatasan staging/QA yang telah diganti keputusan owner terbaru.

## 2. Produk dan prioritas
SortTrip membantu traveler pemula/budget: prompt atau inspirasi → pilihan tujuan/budget → itinerary editable → supplier/booking. Fokus Indonesia dan Asia Tenggara termasuk Vietnam. ID/EN, IDR. Harga/jadwal/ketersediaan harus bersumber; unknown jangan diubah menjadi harga0 atau diklaim gratis. Tiket pesawat indikatif tidak menjamin availability.
Prompt AI dan pencarian tiket biasa adalah jalur berbeda. Prompt memerlukan login+Trip Pass/kuota; pencarian tiket tanpa prompt tetap bisa gratis. Lampiran link/video/transkrip melengkapi perintah dalam Assistant yang sama. Default budget bebas/kosong, durasi bebas. User bisa mengunci item; purchased/locked tidak boleh diganti AI. Pergantian hotel harus konsisten dengan transfer, peta, malam menginap dan hotel tiap hari.
Owner membatalkan prioritas infrastruktur staging terpisah karena aplikasi belum diluncurkan. Gunakan deployment dan database production existing, jangan membuat login, Worker, domain atau DB baru. Kode staging lama dipertahankan tetapi tidak dipakai di production.

## 3. Platform dan arsitektur
- React/Vite/TypeScript, frontend index.html → main.jsx → app/auth-app.tsx → app/travel-app.tsx. Form utama app/flight-search.tsx; Assistant app/assistant-discovery.tsx; itinerary/local-global planner, editor, Save/MyTrips melalui mekanisme native.
- Cloudflare Worker `sorttrip`, entry worker/index.js; assets `dist` melalui ASSETS; config wrangler.jsonc. Profil wrangler.hotel-browser.jsonc juga production; jangan memakai wrangler.staging.jsonc untuk rilis ini. KV RECOMMENDATION_BUDGETS, Browser Rendering HOTEL_BROWSER, AI_LIMITER dan VIATOR_LIMITER, cron existing tetap dipertahankan.
- Supabase production `tznxfgosmjcmwoszvkdk`, URL https://tznxfgosmjcmwoszvkdk.supabase.co; PostgreSQL17.6. Auth existing, trips JSONB dengan RLS, Trip Pass, reservasi kuota, pembayaran/support. QA terpisah `aytrcvfncsklhqozreyk`; jangan campur akun/key/ledger.
- Node node:test, TypeScript, Vite build; checks/, scripts/, artifacts/. PostgreSQL portable18.6 digunakan untuk rehearsal lokal sintetis, bukan aplikasi. Perbedaan dengan production dicatat.
- Telegram bot dukungan dan runner owner adalah dua konteks. AGENTS/TELEGRAM.md mengatur allowlist, auth owner, single-writer queue; tidak ada bukti bridge Telegram ke Desktop otomatis siap.

## 4. API, pemasok dan batas klaim
| Integrasi | Kegunaan / batas |
|---|---|
| Meta Model API | Muse Spark `muse-spark-1.3`; itinerary discovery structured JSON; ekstraksi teks/frame QA. Egress https://api.meta.ai/v1 melalui worker/meta-request.js. Bukan bukti full-video/ASR otomatis. |
| OpenAI | Jalur AI legacy existing worker/ai-draft.js, worker/itinerary.js. Tidak boleh jadi fallback otomatis Meta setelah cutoff. Pilihan model/default lihat source terkini, jangan mengubah hanya berdasarkan laporan historis. |
| Travelpayouts / Aviasales | Data API pencarian pesawat indikatif, affiliate click-out; marker publik782849. Statistik pembelian punya integrasi terpisah. Click-out bukan bukti pembelian/komisi. |
| Nuitée / LiteAPI | Harga/content hotel, native itinerary hotel dan Payment SDK checkout. Margin default5% sesuai keputusan owner; biaya seluruh malam/room/traveler harus konsisten. API production pernah diuji, pembayaran sampai halaman portal diuji; siklus booking/payment/payout lengkap tidak terbukti. White-label tidak dipakai produk aktif meskipun var historis URL masih ada. |
| Trip.com | Widget/searchbox affiliate menu Hotel; jangan klaim booking API atau callback pasti tersedia. |
| Viator | Produk wisata/starting prices dan affiliate ticket link; API production read-only pernah berhasil. Jangan klaim native booking/dated availability/payout. |
| 12Go | Widget/deep-link affiliate transport, BUKAN API berlisensi milik SortTrip. Tidak mengarang harga real-time atau menandai pembelian otomatis. |
| Google Maps Routes | Rute dan petunjuk koneksi; jalur WALK pernah diuji production. Tarif transit/semua mode tidak otomatis terverifikasi. Link Google Maps directions tetap penting. |
| Midtrans | Trip Pass via Snap dan webhook; konfigurasi production dilaporkan owner. Jangan melakukan pembayaran atau mengubah key/billing. |
| Telegram | Support user melalui aplikasi dan pesan tim; runner owner terpisah. Jangan mengirim rahasia/log sensitif. |
| Klook | Affiliate widget historis; scope API/inventory/payout tidak boleh disimpulkan. |
| TikTok | Official public redirect/oEmbed adapter; akses caption sering tidak tersedia. Arbitrary vt link tidak membuktikan video telah dibaca. Upload lokal sampled frames/transkrip adalah fallback eksplisit. Jangan bypass CAPTCHA/restriksi atau scraping tak berizin. |

Register otoritatif partner: docs/PARTNERS.md, baca entri terbaru dan bukti tanggal; label APPROVED/API_CONNECTED/TESTED/PRODUCTION_READY berbeda. Agoda/Hotellook/partner lain yang hanya dibahas jangan dipromosikan sebagai integrasi aktif. API key tidak disimpan dalam laporan ini.

## 5. Status deployment TERBARU
Existing https://sorttrip.yusufridlo7.workers.dev sudah dideploy.
Cloudflare version `b24bc674-7451-4052-a87f-5d63603218f5`.
UI polish app/brand-theme.css termasuk font/spasi, kartu timbul, putih, warna navy/teal dan foto destinasi Singapore dengan overlay biru. Owner menolak ilustrasi; SVG skyline historis tidak dipakai hero. Jangan desain ulang UX, tombol atau payment.

SQL production yang SUDAH diterapkan dengan persetujuan owner:
1. docs/production-proposal/EXECUTE_01_PAID_DISCOVERY.sql: reserve_paid_ai_request, wrapper ke existing reserve/finish; paid entitlement wajib; service-only.
2. EXECUTE_02_META_LEDGER.sql: meta_ai_budget/meta_ai_requests, RPC safety/reserve/settle. Awal terverifikasi kosong/0/blockedtrue.
3. EXECUTE_03_ACTIVATE_APPROVED_CAP.sql: aktivasi USD100. Hasil terakhir alokasi0, cap100, blockedfalse, requests0.
JANGAN replay ketiganya. Proposal asli tetap gatefalse sebagai arsip. Tidak ada entitlement QA, saldo QA atau data user yang disalin. Existing reserve/finish fingerprint tetap cocok; RLS dan RPC owner/ACL/search_path postflight PASS.

Worker flags production META_ITINERARY_ENABLED=true, META_AI_BUDGET_READY=true; secret META_MODEL_API_KEY tersedia. Keberadaan nama binding Supabase verified; kecocokan project/key dikonfirmasi owner secara privat, nilainya tidak dibaca agent.

## 6. Guard Meta wajib dipertahankan
- Cutoff MUTLAK `2026-11-04T17:00:00Z` = 5 November2026 00.00 WIB. Ini berbeda dari deadline submission yang pernah disebut09.00 WIB. Jangan memperpanjang.
- worker/meta-request.js memeriksa konfigurasi valid dan hard deadline sebelum tiap egress, abort signal sampai deadline, recheck setelah await, manual redirects, tanpa retry/fallback.
- Production capUSD100; QA tetapUSD10. worker/meta-environment.js memisahkan URL/flags dan batas. Ledger production baru, QA meta_video_test_* tidak digunakan.
- Reservasi konservatifUSD0.05/request tidak direfund, input≤20000, output≤2000, satu global pending, duplicate UUID ditolak, stale pending tidak otomatis dibersihkan. Unknown usage memblokir; tidak reset/unblock otomatis.
- Alokasi ledger adalah plafon aplikasi, bukan hardcap seluruh akun Meta atau aplikasi lain. Estimasi token bukan invoice provider.
- Production Meta hanya lewat normal authenticated paid discovery; direct video/frame extraction production belum diaktifkan demi mencegah bypass entitlement. Jangan menganggap seluruh fitur video QA tersedia live.
- Auth, Trip Pass reserve/finish, global ledger, ratelimit tetap wajib. Jangan grant ulang kuota sebagai jalan pintas.
- Setelah cutoff return META_AI_EXPIRED; trip lama/manual edit/save/supplier tetap operasional. Legacy OpenAI explicit existing feature dipertahankan, bukan fallback otomatis.

## 7. Bukti nyata dan yang BELUM terbukti
QA lokal Gate D: satu inferensi nyata MuseSpark berhasil; prompt Kuala Lumpur3hari1orang museum/transporthemat/unknown prices. 516input/1497output, estimasiUSD0.00700725. Native edit/Save/MyTrips/reload terbukti. QA ledger terakhir0.40/9.60/blockedfalse/8requests/0pending; owner-test grant one-use telah habis. Jangan renew atau hapus .sorttrip-qa/gate-d-one-request.claim.
Production terbaru: SQL/postflight berhasil, build PASS,31 targeted tests PASS, rehearsal46PASS0FAIL (PG18.6 sintetis), homepageHTTP200, anonymous discoveryPOST401, authenticated browser session MyTrips memuat perjalanan existing. AccessGET405 adalah method restriction, bukan bukti auth.
BELUM: inferensi Meta production setelah deployment; production edit→Save→reload setelah deployment; AI Guide live model; lifecycle booking/payment/payout; seluruh partner attribution. Jangan menyamakan fixtures, QA evidence dan production E2E.
Artifacts: production-deploy.log, production-final-build.log, production-final-tests.tap, production-postflight.png, production-my-trips.png; production-activation-rehearsal/results.json. Referensi QA gate-d-live-meta-2026-10-30.json dan gate-d-live-meta-saved-2026-10-30.png.

## 8. Berikutnya, jangan mulai audit ulang
1. Baca checkpoint/source relevan; inventaris git status tanpa menghapus apa pun.
2. Gunakan website existing; verifikasi authenticated edit→Save→MyTrips→reload pada itinerary uji yang jelas. Jangan sembarang mengganti trip existing owner.
3. Laporkan hasil nyata. Jangan mengulang inferensi hanya untuk render halaman. Uji Meta production hanya dengan aksi eksplisit owner dan semua guard sehat; tanpa retry otomatis.
4. Evaluasi AI Guide existing app/tour-guide.tsx dan lib/tour-guide.mjs: ada fitur narasi/Q&A/demo lokal, tetapi jangan mengklaim live backend sebelum dibuktikan. Jika perlu tambahan inference, minta scope eksplisit dan pertahankan kuota/cutoff.
5. Siapkan rekaman demo3menit, script, deskripsi integrasi Meta, checklist submission; jangan klaim fixture sebagai AI live. Public repo/commit/push butuh instruksi owner terpisah.
6. Setelah setiap pekerjaan berarti perbarui laporan dan PROJECT_PROGRESS; gunakan source/status terbaru untuk mengoreksi catatan lama, bukan menghapus sejarah.

## 9. Keamanan dan operasional
Jangan membaca .env* atau file secret untuk diagnosis; jangan menampilkan secret/token/session/cookie/OTP/email akun privat dalam laporan. Login/OTP/CAPTCHA/credential/billing ditangani owner sesuai AGENTS.md. Owner telah login Wrangler dan memasang secret langsung. Jangan mengganti credential atau mengambil token browser. Konfirmasi binding owner sudah ada, tidak perlu ditanya ulang tanpa bukti drift.
Owner mengizinkan integrasi production, SQL01/02/03, cap100 dan deployment existing yang kini selesai. Ini bukan izin reset, hapusdata, membeli/membayar, deploy fitur baru tanpa review, atau commit/push. Tidak perlu minta ulang izin pekerjaan yang sudah tuntas. Perubahan izin sensitif berikutnya ikuti ketentuan tools pada saat aksi.
Rollback: disable flags Meta atau pulihkan versi Worker sebelumnya; pertahankan ledger/history dan trips. Jangan drop ledger, reset usage atau replay recoverySQL06. Semua fitur non-Meta harus terus berjalan.
Local runtimes/port lama5175demo/5176QA/8790QA adalah historis; periksa status sebelum mulai/stop, jangan hentikan semua node/workerd. PostgreSQL rehearsal saat terakhir selesai sudah STOPPED. Jangan sambungkan data nyata ke cluster trust sintetis.

## 10. Perintah kerja lazim (tanpa secret)
`git status --short`, `npm run build`.
Focused tests: `node --test checks/production-meta.test.mjs checks/meta-cutoff.test.mjs checks/assistant-discovery.test.mjs`.
Deploy production menggunakan `npx.cmd wrangler deploy --config wrangler.jsonc` hanya bila scope owner mengizinkan perubahan berikutnya dan checks lulus. PowerShell memblokir npx.ps1: gunakan npx.cmd; jangan ubah Execution Policy global.
Jangan menjalankan scripts rehearsal lagi tanpa kebutuhan/perubahan. Semua angka PASS di atas adalah bukti checkpoint, bukan jaminan kondisi sekarang.

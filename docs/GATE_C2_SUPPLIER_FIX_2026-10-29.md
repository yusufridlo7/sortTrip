# Gate C.2 — Perbaikan pencarian supplier sampai harga terverifikasi

**29 Oktober 2026 · QA lokal · hasil akhir: LIVE PASS untuk kedua provider.**

## Hasil utama

| Provider | Status | Harga nyata yang diverifikasi di UI asli |
|---|---|---|
| Aviasales/Travelpayouts | **LIVE PASS** | CGK–KUL pulang-pergi, 6–8November2026, QZ204, 1dewasa: **Rp1.885.702**. Harga indikatif dari cache provider, bukan jaminan kursi/checkout. |
| LiteAPI | **LIVE PASS untuk pencarian/read-only rate** | Kingston Hotel4–Hulo Bukit Bintang, Deluxe Queen, 24–26November2026, 2malam/1kamar/1dewasa: tarif kamar **Rp990.994,37** + biaya di hotel **Rp89.035,10**. Total seluruh masa inap dengan biaya yang tercantum **Rp1.080.029,47**. UI membulatkan tampilan rupiah tanpa mengubah nilai sumber. |

Entry tetap **index.html → main.jsx → AuthApp → TravelApp**. Harga diperoleh lewat backend QA dan ditampilkan di komponen pencarian existing pada sesi owner sebenarnya. Tidak membuat aplikasi demo pengganti. Hasil hotel QA ditandai read-only; booking, details-fetch dan menyimpan pilihan tersebut dinonaktifkan. Tidak mengklaim checkout atau reservasi berhasil.

Bukti angka aman: [verified-prices.json](../artifacts/gate-c2/verified-prices.json). Bukti UI owner: [flight](../artifacts/gate-c2/flight-live-en.png), [hotel](../artifacts/gate-c2/hotel-live-en.png). Screenshot native bisa terpotong oleh lebar panel aplikasi; nilai/tanggal/pax juga diperiksa melalui accessibility UI. Bukti layout utuh di bawah secara eksplisit merupakan replay hasil nyata dengan auth fixture.

## Akar masalah dan koreksi

### Hotel

1. Request awal GateC.2 mengulang hotel/tanggal GateC: HTTP200, application/json, envelopeobject berisi error, tanpa data array. Adapter lama menganggap bentuk itu selalu kegagalan teknis502. Dokumentasi LiteAPI menjelaskan **error.code2001/no availability** dapat memakai HTTP200. Pada tanggal alternatif, kategori itu terbukti langsung dari respons nyata. Helper baru mengubah hanya code2001 menjadi daftar kosong; error lain, sandbox, currency/occupancy/total yang tidak sah tetap ditolak.
2. Raw response GateC historis tidak disimpan, sehingga kode persis dari respons lama tidak bisa dibuktikan ulang secara retrospektif. Pola error200/tanpa data berhasil direproduksi; jangan menyatakan semua502 berasal dari key atau billing.
3. Kingston Hotel1 tidak memberikan rates terverifikasi pada dua kombinasi tanggal. Sesuai bukti itu, digunakan Kingston Hotel4/Hulo, ID **lp656f7c12**, dari metadata nyata GateC sebelumnya. Tidak membutuhkan discovery baru.
4. Hulo memberikan6offers/3standard dalamIDR, tetapi tiga rates standar ditolak karena memiliki **pay-at-property fees**. Penolakan ini dibuktikan diagnostics tax-array/excludedFeeCount, bukan asumsi. Normalizer kini memiliki opsi khusus QA baca untuk menerima biaya tersebut hanya ketika amount/currency lengkap dan valid. Tarif kamar dan biaya tambahan ditampilkan terpisah; total gabungan hanya dihitung jika seluruh tambahan memakaiIDR. Tidak mengarang kurs atau menggabungkan mata uang berbeda.
5. Pemeriksaan kontrak juga menemukan literal **taxesAndFees:null** didokumentasikan sebagai semua pajak/biaya termasuk. Validator diperbaiki untuk null eksplisit; field hilang/objek tidak sah tetap ditolak. Respons Hulo aktual memakai array dan biaya excluded, sehingga koreksi null ini **bukan** akar penolakan Hulo yang terbukti.

Default normalizer untuk pencarian/checkout existing tetap menolak excluded fees. Opsi allowPayAtProperty diaktifkan hanya pada GateC.2 dan menghasilkan readOnlyQuote. RateType standard, jumlah kamar/tamu, childCount0, IDR, harga positif, SSP publik, cancellation tag dan identitas hotel tetap diwajibkan. Tidak melemahkan validasi pembayaran.

### Flight

- Request awal10–12November2026 mengembalikan success=true, currencyIDR, **dataCount0 sebelum normalisasi**. Ini membuktikan cache provider kosong untuk kombinasi tersebut pada waktu uji, bukan data valid dibuang oleh normalizer.
- Variasi rentang pergi/pulang **1–30November2026**, durasi fleksibel, menghasilkan12rows; semuanya diterima normalizer. UI menampilkan pasangan tanggal dan tarif nyata, termasuk6–8November/Rp1.885.702.
- Adapter existing sudah memakai departure month untuk rentang dalam satu bulan, tetapi menghilangkan return_at bila tanggal pulang berupa rentang. Ditambahkan return month bila kedua batas pulang berada dalam bulan sama, sesuai kontrak endpoint. Filter lokal tetap memeriksa tanggal/durasi sebenarnya; tidak mengubah permintaan tanggal pasti menjadi fleksibel diam-diam.
- Link provider Aviasales tetap mempertahankan rute/tanggal/query aslinya dan melewati validasi origin/path existing. UI purchase options dibuka hanya untuk pemeriksaan tautan; tidak klik keluar. Marker/affiliate ID existing tidak diubah, dan tidak mengklaim tracking komisi atau konversi terverifikasi. Backend booking-context/tracking yang berada di luar scope tetap nonaktif.

## Request nyata dan iterasi

Budget baru berada pada **.sorttrip-qa/gate-c2-2026-10-29**, terpisah dari seluruh claim GateC. Tidak ada reset/delete/overwrite claim lama.

| Urutan | Query | HTTP | Diagnostik / keputusan |
|---|---|---|---|
| Hotel1 | Kingston1,10–12Nov | 200 | Error envelope tanpa data; no quotes. Tambah klasifikasi error resmi. |
| Hotel2 | Kingston1,17–19Nov | 200 | NO_AVAILABILITY/code2001; UI daftar kosong. Beralih ke hotel yang ID-nya sudah terverifikasi. |
| Hotel3 | Hulo,10–12Nov | 200 | 6offers/3standard; 3standard ditolak taxes. Periksa kontrak tax treatment. |
| Hotel4 | Hulo,17–19Nov | 200 | 6offers,6taxarrays,3excludedfees,0null; penolakan taxes terkonfirmasi. Persiapkan harga read-only dengan rincian biaya. |
| Hotel5 | Hulo,24–26Nov | 200 | 3valid public quotes; harga/tanggal/occupancy/biaya ditampilkan. Provider ditutup. |
| Flight1 | CGK–KUL10–12Nov | 200 | success/IDR/data0; tidak ada harga palsu. |
| Flight2 | CGK–KUL rentangNov | 200 | data12/accepted12; harga nyata tampil. Provider ditutup. |

**Aktual GateC.2: flight2/5, rates5/5, metadata0/2.** Gagal/empty tetap menghabiskan slot. Tidak ada retry otomatis, request burst paralel, pagination atau proxy production. Metadata GateC lama2request tidak dihitung sebagai request baru C.2 dan tetap dicatat pada laporan lamanya. Setelah provider sukses, request baru ke provider tersebut dihentikan; tampilan ulang mengambil respons normalisasi tersimpan dan tidak menggunakan upstream.

Diagnostics hanya berisi status, content-type, tipe envelope, counts, currency/sandbox flags, kategori error/validator, dan parameter pencarian publik. Tidak menyimpan raw body, error text provider, offerId/rateId, credential, guest identity, session, cookie atau authorization header dalam laporan/log. [hotel1](../artifacts/gate-c2/hotel-1.diagnostic.json), [hotel2](../artifacts/gate-c2/hotel-2.diagnostic.json), [hotel3](../artifacts/gate-c2/hotel-3.diagnostic.json), [hotel4](../artifacts/gate-c2/hotel-4.diagnostic.json), [hotel5](../artifacts/gate-c2/hotel-5.diagnostic.json), [flight1](../artifacts/gate-c2/flight-1.diagnostic.json), [flight2](../artifacts/gate-c2/flight-2.diagnostic.json).

## Perubahan berkas

- **qa-config/gate-c2-budget.mjs**: budget persistent5flight/5rates/2metadata, atomic claim sebelum egress, lock global untuk mencegah paralel, crash/busy fail-closed, dan success/closed flags. Claim lama tidak disentuh.
- **qa-config/gate-c2-diagnostics.mjs, gate-c2-live.mjs; vite.qa-gate-c2.config.js**: reuse owner verification, shared adapters/normalizer dan server-only binding existing; fixed provider endpoints, query guard, maximum satu fetch per reservation, manual redirects, timeout, sanitized diagnostics, cache replay dan penghentian otomatis provider sukses. HTTP401/403/429 serta kategori quota/auth menutup provider. Metadata C.2 tidak diperlukan/dijalankan.
- **scripts/run-gate-c.mjs**: argumen --c2 memilih config baru, tetap native env-file loader untuk file owner yang spesifik; tidak menyalin secret atau memakai environment production fallback.
- **worker/liteapi-rates-response.js; worker/hotel-discovery.js; worker/lite-hotel.js**: error-envelope handling; null tax contract; opsi property-fee read-only yang tidak dipakai checkout default. Seluruh perubahan source lokal, belum production.
- **worker/index.js**: return month untuk rentang bulan yang didukung, tanpa mengubah filter/price/link normalization lainnya.
- **app/hotel-search.tsx, travel-data.ts, auth-app.tsx, i18n/locales/video.json; qa-config/original-ui.mjs**: noticeC.2, tipe field fees/readOnly, tax labelsID/EN, total gabungan sumberIDR, suppress booking/details/save pada read-only quote. Wiring entry asli dan flags default tetap dipertahankan.
- **app/travel-discovery.css**: wrapping kartu flight/controls pada tablet dan layar sempit agar nominal tidak terdorong keluar layout; tidak mengganti desain.
- **checks/gate-c2.test.mjs; checks/flights-api.test.mjs; checks/lite-hotel.test.mjs** dan **scripts/qa-gate-c2-render.mjs**: kontrak budget/security/error, bulan pulang, pajak/fees dan rendering replay terisolasi.

Daftar ini khusus pekerjaanC.2; working tree berisi banyak perubahan terdahulu yang dipertahankan. Git diff terhadap HEAD mencampurkan pekerjaan lama, sehingga bukan daftar perubahan C.2 murni. Tidak stage/reset/cleanup.

## Verifikasi

- **78 targeted tests PASS,0FAIL,0SKIP**: GateC.2, flightAPI, hotel search/normalization, checkout guard, GateB dan QA security. Network/payment/DB dalam tests tersebut fixture/mock; tidak ada prebook atau pembayaran nyata. [Log](../artifacts/gate-c2/targeted-tests.log).
- **Build QA PASS**: TypeScript dan Vite, advisory existing bundle besar/dynamic import nonfatal. [Log](../artifacts/gate-c2/build-qa.log). Tidak mengulang full suite atau build/deploy production.
- **Live UI owner PASS**: actual SupabaseQA session→server owner verification→supplier request→harga flight/hotel→rincian tanggal/tamu. Tidak ada interception di tab live. Tidak membuat/mengubah itinerary QA, tidak mengulang GateA/B atau audit ledger.
- **Rendering replay PASS**,1280pxEN,390pxEN,390pxID. Memakai harga actual normalized response yang tersimpan, tetapi **auth/session/database fixture dan API interception**, bukan E2E live tambahan. Zero external requests/pageerrors; tidak menggunakan budget supplier. Diperiksa tidak ada horizontal overflow, total hotel+fees/interpolasi benar, dan checkout/save tidak muncul untuk quoteQA. [Hasil](../artifacts/gate-c2/render-results.json), [hotel desktopEN](../artifacts/gate-c2/hotel-render-en-1280.png), [hotel mobileID](../artifacts/gate-c2/hotel-render-id-390.png), [flight desktopEN](../artifacts/gate-c2/flight-render-en-1280.png), [flight mobileID](../artifacts/gate-c2/flight-render-id-390.png).
- Launcher browser bundled tidak memiliki executable versi yang diharapkan; rendering berhasil memakai Chrome existing dalam profil headless terpisah. Selector harness diperbaiki untuk DOM existing; tidak ada instalasi browser baru atau penggunaan sesi owner dari CLI.

## Keamanan, biaya dan status akhir

QA tetap **aytrcvfncsklhqozreyk**. Auth, RLS dan owner allowlist tidak dilemahkan. Binding supplier dimuat server-only dari file yang dipasang owner; tidak di-reveal atau diubah. envDir/envPrefix frontend tetap nonaktif, private .dev.vars dan .sorttrip-qa ditolak Vite. Nama binding dapat muncul sebagai teks bantuan i18n; itu tidak dianggap sebagai bukti nilai secret terekspos. Factory supplier tidak memasukkan nilai secret ke client define.

Dokumentasi resmi menyatakan core hotel rates gratis dalam ToS/reasonable use; task hanya menggunakan core rates dan existing DataAPI access yang diotorisasi owner. Tidak menggunakan price index/Places berbayar, fiturAI premium, upgrade plan atau komitmen finansial baru. Tarif komersial khusus akun tidak diperiksa/diganti; bukan jaminan biaya universal. Tidak ada respons quota/billing/auth yang memerlukan perluasan izin pada tujuh request ini.

Budget C.2 sudah diberi closed flag; seluruh claim/result/diagnostic dipertahankan. Profil C.2 dihentikan dan **dev:qa-gate-b** kembali berjalan di **http://127.0.0.1:5176/**. [Identity akhir](../artifacts/gate-c2/final-identity.json) memverifikasi authReady=true, generationEnabled=false, supplierReadsEnabled=false, QAURL tepat. Cloudflare Access remote tetap belum diverifikasi; ini lingkungan loopback owner-only.

**Tidak ada SQL, DB/schema/RLS writes, Meta inference/recovery, credential/billing/kuota perubahan, prebook/checkout/booking/payment, production modification, deployment, commit/push atau GateD/E.** Source perbaikan masih lokal. Harga berlaku pada waktu pengujian, bukan jaminan harga saat pemesanan. Owner dapat meninjau package/report; aktivasi/deployment atau request baru setelah closed membutuhkan instruksi berikutnya. Jangan menghapus claim untuk menjalankan ulang.

## Referensi resmi yang diperiksa

- [LiteAPI rates](https://docs.liteapi.travel/reference/post_hotels-rates): request, occupancy, IDR dan pencarian hotelID.
- [LiteAPI error codes](https://docs.liteapi.travel/reference/api-errors-for-hotel-booking-workflow): HTTP200/code2001 berarti no availability.
- [LiteAPI rates response](https://docs.liteapi.travel/docs/hotel-rates-api-json-data-structure): total, SSP, pajak termasuk/null dan biaya payable at property.
- [LiteAPI pricing](https://docs.liteapi.travel/reference/api-pricing-usage-costs): core rates gratis dengan ToS/fair use; premium endpoints berbeda.
- [Aviasales Data API](https://support.travelpayouts.com/hc/en-us/articles/203956163-Aviasales-Data-API): cache-based prices, one_way=false, month/date parameters dan provider link.

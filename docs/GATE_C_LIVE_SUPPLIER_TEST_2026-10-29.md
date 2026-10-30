# Gate C — Live Flight & Hotel API Testing

**29 Oktober 2026 · pengujian terbatas selesai; hasil keseluruhan PARTIAL.**

## Hasil nyata

| Pemeriksaan | Status | Request upstream aktual | HTTP upstream | Hasil UI |
|---|---|---:|---|---|
| Aviasales CGK–KUL, 10–12 November2026, 1dewasa, IDR | LIVE PASS untuk konektivitas dan hasil kosong; harga belum terbukti | 1 | 200 | No matching data; tidak ada harga/flight buatan |
| LiteAPI rates, Kingston Hotel1, tanggal sama, 1kamar/1dewasa, IDR | LIVE FAIL pada verifikasi respons | 1 | 200 | Hotel search is unavailable; respons aplikasi502 |
| Metadata Kingstone di Kuala Lumpur | LIVE PASS, hasil kosong | 1 | 200 | Metadata server-only, tidak ada ID dipilih |
| Metadata Kingston di Kuala Lumpur | LIVE PASS, 15hasil | 1 | 200 | ID/nama/alamat publik tersedia untuk memilih hotel uji |
| Metadata fallback setelah rates | Tidak dilakukan | 0 | — | — |
| Meta/payment/prebook/booking | Tidak dilakukan | 0 | — | — |

Hitungan hanya tindakan Gate C ini, bukan audit traffic semua proses/host. Tidak ada retry otomatis, pagination atau pemanggilan proxy production. Hasil mock tidak disajikan sebagai live. Harga nyata belum berhasil muncul: flight kosong dan rates belum terverifikasi. HTTP200 sendiri tidak membuktikan harga atau availability dapat dipakai.

## Otorisasi dan hotel terpilih

Brief awal mengizinkan satu upstream flight dan satu rates; metadata awalnya0. Owner kemudian menyetujui penggunaan credential existing yang sah untuk QA dan memasangnya sendiri pada `.dev.vars.gate-c`. Setelah hotel ID belum tersedia, owner mengizinkan satu metadata lookup Kingstone. Hasilnya200/empty. Owner selanjutnya mengatakan “cari sampai ketemu contoh saya ijinkan” dan “tidak harus kingstone”; satu pencarian variasi **Kingston** menghasilkan15hotel Kuala Lumpur, lalu discovery dihentikan. Total metadata2, bukan klaim mematuhi batas metadata0 lama.

Hotel contoh: **Kingston Hotel1 – Bukit Bintang**, LiteAPI ID **lp65706cc6**, alamat **74–76 Jalan Bukit Bintang**, Kuala Lumpur/MY, koordinat3.145779,101.70981. Identitas berasal dari respons API29Okt2026, bukan fixture atau tebakan. Dipilih sebagai contoh sesuai klarifikasi owner, bukan klaim hotel termurah/terbaik. Metadata tidak membuktikan rates/booking. Bukti [Kingstone kosong](../artifacts/gate-c/kingstone-metadata.json) dan [Kingston15hasil](../artifacts/gate-c/kingston-metadata.json).

Parameter metadata mengacu dokumentasi resmi [Retrieve a list of hotels](https://docs.liteapi.travel/reference/get_data-hotels): countryCode=MY, cityName=Kuala Lumpur, hotelName, limit25/offset0. Parameter hotelName mendukung loose match; karena itu kecocokan identitas tetap diperiksa dari ID/nama/kota/alamat.

## Pelaksanaan dan batas hasil

- Sesi owner terlihat signed-in pada UI asli. Setelah pergantian profil, server kembali memverifikasi akun QA existing; agent tidak membaca auth storage, cookie, bearer token, key atau isi private config. Supplier endpoint memverifikasi owner lagi melalui fixed QA Auth GET sebelum request; menggunakan user session normal, bukan service-role.
- Entry tetap index.html → main.jsx → AuthApp → TravelApp. Untuk Gate C saja, menu hotel memakai komponen HotelSearch existing dengan tanggal uji. Menu normal di Gate B/production tetap Trip.com; tidak mengubah affiliate IDs atau desain aplikasi.
- Flight dikirim melalui form asli: CGK→KUL, pergi10/pulang12November2026, durasi3hari,1orang, tanpa promptAI. Adapter searchFlights existing menerima200, mengembalikan flights=[]/oneAdult=true/IDR/partial=false. Tidak menyatakan sold out; ini ketiadaan hasil cocok pada respons adapter untuk pencarian tersebut. Tidak memperluas tanggal karena batas satu request. Harga Data API tetap indikatif/cache, bukan seat/checkout quote. Tidak ada flight/link live yang dapat diperiksa. Normalisasi affiliate URL existing tetap dipakai dan preservasi marker dibuktikan mock, bukan konversi nyata.
- Hotel dikirim melalui HotelSearch existing: Kuala Lumpur/MY, check-in10/check-out12November2026,1dewasa/1kamar. Upstream POST rates memakai hanya hotelIds terverifikasi, occupancies1adult, IDR, guestNationalityID. Tidak mengirim city-discovery, metadata fallback, prebook atau checkout. Normalizer checkedLiteOffer existing mensyaratkan public standard rate, occupancy, tax breakdown dan full-stay total; total dua malam tidak dibagi menjadi satu malam sebagai harga stay.
- Rates upstream200, tetapi tahap parse/validasi tidak menghasilkan respons terverifikasi; aplikasi mengembalikan502 generik. UI error diverifikasi langsung. **Penyebab rinci belum dapat ditentukan**: raw response dan exception detail tidak disimpan, sehingga tidak ada bukti membedakan bentuk envelope, penolakan sandbox, parsing/stream, atau data provider lain. Jangan mengklaim key production valid, hotel sold out, provider down, atau saldo kurang dari hasil ini. Tidak ada percobaan rates kedua.
- Tidak membuka tombol hotel details, checkout, affiliate flight booking, payment atau Save hotel ke itinerary. Record Gate B tidak diubah oleh task ini; hanya My Trips dibaca untuk membuka perjalanan uji.

## Perubahan lokal

- `qa-config/gate-c-budget.mjs`: claim eksklusif durable sebelum egress, satu flight/satu rates, kegagalan tetap memakai allowance, endpoint/method allowlist, timeout/manual redirects, metadata terpisah sesuai tambahan izin owner. State task berada pada folder ignored `.sorttrip-qa/gate-c-2026-10-29`; jangan menghapus claim untuk retry. Ini bukan ledger Meta/Supabase.
- `qa-config/gate-c-metadata.mjs`, `scripts/qa-gate-c-metadata.mjs`, `scripts/qa-gate-c-metadata-child.mjs`: lookup fixed query tanpa pagination/retry; hanya metadata publik whitelist tersimpan. Child Node native env-file loader memakai file owner yang spesifik; parent tidak meneruskan credential process/root env dan tidak mencetak stderr/secret.
- `scripts/qa-gate-c-status.mjs`: pemeriksaan boolean binding saja. Kedua binding terdeteksi; ini bukan verifikasi validitas. Owner memasang credential; agent tidak menyalin/mengubahnya.
- `qa-config/gate-c-live.mjs`, `vite.qa-gate-c.config.js`, `scripts/run-gate-c.mjs`: profil lokal terpisah, QA owner/loopback/origin gate, fixed query, adapter searchFlights dan checkedLiteOffer existing, hasil normalisasi tersimpan untuk tampilan ulang tanpa upstream. Seluruh rute lain tetap terminal unavailable. Supplier tertutup otomatis setelah kedua allowance dipakai.
- `qa-config/original-ui.mjs`: factory supplier opt-in hanya ketika Gate B lokal lolos; profil default/staging tidak mengaktifkannya. Tambahan fs.deny menutup `.dev.vars*` agar tidak dilayani Vite, selain private QA folder/env yang sudah ditolak. Secret supplier hanya server-side, tidak dimasukkan ke client define; envDir/envPrefix tetap off.
- `app/auth-app.tsx`, `app/i18n/locales/video.json`: notice Gate C ID/EN sesuai scope aktual. `app/direct-search.tsx`: wiring HotelSearch existing khusus compile flag Gate C/local QA, tanpa mengganti menu hotel production.
- `checks/gate-c-budget.test.mjs`, `checks/gate-c-metadata.test.mjs`, `checks/gate-c-live.test.mjs`: fixture tests request limits, error/empty results, owner/query/route guard, tax/full-stay normalization, affiliate URL preservation, automatic close/cache replay. Dokumen memory/report diperbarui; seluruh dirty changes existing dipertahankan.

## Verifikasi

**38 PASS /0FAIL /0SKIP**, targeted Gate C budget/metadata/live + Gate A/B/QA security contracts. Semua network pada suite tersebut mock; tidak ada DB/model/supplier live dari tests. [Log](../artifacts/gate-c/targeted-tests.log).

`npm run build:qa-preparation`: **PASS**, TypeScript/Vite. Advisory existing bundle besar/dynamic import nonfatal. [Log build](../artifacts/gate-c/build-qa.log). Tidak menjalankan full suite, rebuild production atau deployment.

Bukti UI asli: [flight hasil kosong](../artifacts/gate-c/flights-empty.png), [hotel unavailable](../artifacts/gate-c/hotel-unavailable.png). Screenshot tidak memuat credential/token/identitas akun. Tidak ada screenshot harga sukses karena memang belum ada harga terverifikasi.

Claim flight/rates masing-masing satu, HTTP200 masing-masing tercatat. Pengaman menolak request tambahan sebelum fetch dan hasil UI ulang mengambil respons normalisasi yang sama, bukan fixture. Tidak menghapus/reset state task. Seluruh metadata/rates response raw tidak ditaruh di log; hanya whitelist publik/result adapter/HTTP status.

## Status akhir dan rollback

Setelah kedua request, identity aktual menunjukkan supplierReadsEnabled=false/generationEnabled=false. Profil Gate C kemudian dihentikan melalui Ctrl+C pada terminal yang dibuat task ini, dan **dev:qa-gate-b** dijalankan kembali pada **http://127.0.0.1:5176/**. [Identity akhir](../artifacts/gate-c/final-identity.json) memverifikasi QA project aytrcvfncsklhqozreyk, Auth ready, supplier false, generation false. Cloudflare Access remote tetap belum diverifikasi; local owner gate tidak membuktikan Access remote. Port8790/5174 tidak dinyalakan dan production tidak ditargetkan.

Satu tab sempat menampilkan connection-refused saat Vite restart; dibuka tab baru pada browser/origin yang sama dan owner session kembali terverifikasi tanpa memasukkan credential. Ini bukan kegagalan supplier atau alasan retry upstream.

Tidak ada SQL/schema/RLS/ledger allocation/blocked update, credential/billing/quota change, Meta inference, booking/payment, production modification, deployment, commit/push atau Gate D/E. Server Gate B dibiarkan berjalan untuk owner. Jangan menjalankan ulang launcher Gate C untuk memperbarui harga; allowance flight/rates sudah terpakai dan claim dipertahankan.

## Tindak lanjut yang membutuhkan keputusan

1. Rates hotel memerlukan satu uji tambahan yang disetujui terpisah, dengan pencatatan diagnostik aman **sebelum** request: status, jenis envelope, jumlah array dan kategori penolakan validator, tanpa raw body/secret. Baru setelah itu tentukan perbaikan adapter atau konfigurasi. Izin “cari sampai ketemu” dipakai untuk identitas hotel; tidak ditafsirkan menaikkan batas rates/flight awal.
2. Untuk membuktikan harga flight tampil, perlukan pencarian tambahan dengan tanggal/rentang yang disetujui, karena satu query awal kosong. Tidak perlu mengganti credential berdasarkan200 kosong.
3. Review lokal package Gate C dan bukti sebelum aktivasi berikutnya. Tidak otomatis lanjut Meta/recovery/deployment. Statusnya konektivitas read-only sebagian, bukan supplier E2E/production-ready.

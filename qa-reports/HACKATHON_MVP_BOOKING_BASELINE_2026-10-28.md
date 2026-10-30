# Baseline singkat booking dan celah MVP

28 Oktober 2026. Inspeksi source lokal; tidak ada panggilan supplier/pembelian. Status bukan bukti live saat ini.

| Fitur/provider | Baseline | Jalur yang dipertahankan |
|---|---|---|
| Travelpayouts/Aviasales | PARTIAL: adapter/redirect ada, akses live tidak diuji sprint | worker/index.js, app/flight-search.tsx, flight-booking.tsx, flight-affiliate.ts |
| Nuitée/LiteAPI | PARTIAL: pencarian/prebook/checkout ada; tidak dipanggil | worker/hotel-search.js, app/hotel-search.tsx, item-booking.tsx |
| Trip.com | PARTIAL: widget/deep-link terpasang, inventori live tidak diuji | menu hotel/partner yang sudah ada |
| 12Go | PARTIAL: affiliate route/search; tanpa API inventori | app/transport-affiliate.mjs, transport-booking.tsx; z tetap17068680 |
| Viator | PARTIAL: API aktivitas/affiliate ada, live tidak diuji | app/activity-tickets.tsx dan adapter worker |
| Klook | PARTIAL: widget terpasang; API belum terbukti | widget/provider existing |
| Agoda | UNKNOWN: persetujuan/API belum terbukti | jangan membuat klaim akses atau link affiliate baru |
| Booking.com | BLOCKED/UNKNOWN: CJ/program/API belum terbukti | URL properti referensi bukan bukti affiliate disetujui |
| Anggaran/rute lokal | PARTIAL: kalkulasi/connection/maps ada; sebagian tarif tidak tersedia | costs, itinerary-connections, GoogleRouteCheck, RouteMap |

Tidak mengganti ID affiliate, otorisasi atau jalur booking dengan fixture. Demo terisolasi akan memakai harga tidak tersedia dan label fixture; komponen booking asli tetap digunakan aplikasi biasa. Tidak ada pembelian yang diuji.

| Video-to-itinerary | Awal sprint | Pekerjaan lokal |
|---|---|---|
| URL TikTok | validasi/metadata aman ada; bukan pembacaan video | fallback upload yang jelas |
| Upload/frame | MP4 4MB/60detik, tiga frame/cancel/cleanup ada | tambah MOV/M4V yang kompatibel dan uji batas/corrupt |
| Recognize/review | adapter Meta2000 ada; ledger diblokir | demo Bangkok eksplisit; pilih/urut/koreksi/konfirmasi manual |
| Editor/save | editor native, auth/RLS databaseTrips sudah ada | pakai ulang; demo localStorage terpisah berlabel, tanpa DB write |
| Tour Guide | belum ada | mulai hanya setelah tes integrasi video lokal lulus |

# Gate D — review aktivasi QA terkontrol

29 Oktober 2026. **NO-GO untuk migrasi maupun live demo saat ini.** Hanya review, SELECT dalam transaksi READ ONLY, tes offline dan build. Tidak mengeksekusi reserve/settle, SQL08, SQL06, inference, supplier, billing, deployment, commit/push. Source aplikasi dan SQL08 tidak diubah pada review ini.

## Bukti QA saat review

Dashboard yang diperiksa: **sorttrip QA / aytrcvfncsklhqozreyk**, bukan production tznxfgosmjcmwoszvkdk. SELECT katalog berhasil melalui SQL Editor; tidak mengambil identifier pengguna, credential atau body fungsi sensitif.

| Komponen | Hasil aktual |
| --- | --- |
| reserve_meta_video_test fingerprint | 2f5b3af8ada27fe6076cea1e91a7ee33 |
| settle_meta_video_test fingerprint | 32847c39624929a29a3db9db0947b713 |
| Kedua RPC SECURITY DEFINER | true |
| EXECUTE anon / authenticated | false / false untuk kedua RPC |
| EXECUTE service_role | true untuk kedua RPC |
| meta_video_test_safety_status() | Tidak ada |
| trip_passes / ai_request_reservations | Tidak ada / tidak ada |
| reserve_paid_ai_request / finish_ai_request | Tidak ada / tidak ada |
| reserve_ai_request legacy | Tidak ada |

Fingerprint deployed tetap cocok dengan bukti recovery; perbandingan perilaku menggunakan source/audit lama yang sudah direview, bukan klaim body deployed diunduh ulang. Snapshot recovery terakhir 0,35 allocated / 9,65 remaining / blocked=false / 7 request / 0 unsettled tetap bukti historis terbaru; tidak reserve/settle untuk mengeceknya. Current writer/drain perlu diperiksa lagi saat eksekusi nanti.

## Penilaian SQL08

Perubahan yang dimaksud tepat: signature reserve/settle tetap, row-lock ledger yang sama, global pending semua akun tanpa expiry, duplicate UUID sebelum alokasi, guard10USD/0,05/10request per-user, settlement memeriksa pending sebelum anomaly block. Rekaman lama yang sudah settled tidak diubah; historical2305 tetap tersimpan dan tidak memblokir sendiri. Pending lama/unknown menjadi stop global permanen sampai ditinjau owner. SQL08 tidak menyelesaikan entitlement yang hilang.

Risiko yang perlu ditutup sebelum disetujui:

1. **Target dan baseline:** SQL08 hanya komentar QA, belum gate otomatis project/snapshot/fingerprint. Harus verifikasi project secara manual serta hash di atas tepat sebelum eksekusi. Jika beda, STOP, jangan replace fungsi secara buta. Perlu versi final dengan preflight drift guard dan statement_timeout eksplisit sebelum approval eksekusi.
2. **Permissions:** CREATE OR REPLACE mempertahankan ownership/ACL fungsi lama bila signature cocok. ACL service/anon/auth saat ini sesuai. Proposal mengecek anon/auth, tetapi belum memeriksa owner, semua role/grant option/default privileges serta service EXECUTE setelah perubahan. Fungsi status baru menambah akses server-only; perlu persetujuan DB/permission spesifik, bukan izin recovery lama. Review semua ACL dan search_path setelah migrasi. RLS tabel tidak boleh berubah.
3. **Lock:** EXCLUSIVE NOWAIT dapat gagal pada aktivitas lain; lock_timeout2s berlaku, tetapi belum ada statement_timeout eksplisit pada migration. Stop writers sebelum deployment. Jangan retry otomatis saat lock gagal. PERFORM FOR UPDATE di reserve/settle mengurutkan request global, bukan mutex tiap isolate.
4. **Capability bukan fingerprint:** safety_status mengembalikan marker konstan; jika fungsi diganti lagi sementara marker tertinggal, marker tidak membuktikan definisi aman. Pin/review fingerprint pascamigrasi dan bekukan perubahan admin selama demo. Jangan mengklaim marker sebagai attestation kriptografis.
5. **Compatibility:** worker lama dapat tetap memanggil RPC lama dengan signature sama; drain semua writer wajib. Worker baru memerlukan status-v2 sehingga gagal sebelum alokasi pada DB sekarang. Unknown usage sekarang tetap pending/okfalse; probe lama allocate-005-no-refund tidak kompatibel dan dilarang digunakan. Null usage lama yang sudah settled tetap utuh.
6. **Rollback:** sebelum COMMIT error berarti transaksi abort, lakukan ROLLBACK. Sesudah COMMIT gunakan transaksi terpisah untuk mengembalikan definisi dan ACL yang disalin privat sebelum migrasi, hanya setelah approval. Jangan langsung mengaktifkan worker lama dengan kelemahan concurrency. Status capability harus konsisten dengan fungsi yang direstore; pertahankan inference off. Jangan reset ledger/unblock/delete pending sebagai rollback.

Kesimpulan: arah desain SQL08 sesuai kebutuhan, tetapi **belum layak langsung dieksekusi** sebelum hardening preflight/timeout dan rehearsal PostgreSQL. Tidak ada bukti syntax/locking nyata dari tes fixture.

## Entitlement QA

**NOT READY, terbukti lewat SELECT.** Semua komponen yang dibutuhkan discovery normal belum ada. Login dan Save trips tidak membuktikan hak AI. Proposal existing SQL02 membuat schema minimum, SQL03 memberi hak owner-test terbatas dua hasil/24jam dengan penanda nonpayment. Keduanya belum dijalankan dan perlu review/approval terpisah; ini bukan pass berbayar palsu. Jangan memasukkan UUID production, mengganti akun untuk menghindari cap10, atau memakai preview sebagai bypass. Pemeriksaan keberadaan saja juga belum membuktikan owner punya hak, saldo hasil atau ACL/RLS benar setelah schema dibuat.

Owner actions untuk entitlement: review SQL02/03/04 existing, putuskan apakah owner-test entitlement sah digunakan untuk demo normal; sesudah approval dan apply QA, periksa role tests/own-user RLS serta access endpoint normal pada akun QA terverifikasi. Legacy reserve_ai_request memang tidak dibuat SQL02; generator legacy harus tetap diblokir, bukan diaktifkan supaya indikator readiness menjadi true.

## UI demo Kuala Lumpur

Source `app/assistant-discovery.tsx`: start normal meminta session QA, `/api/assistant/access`, lalu **`/api/assistant/discover`**. Preview hanya mode meta-qa, bukan jalur yang dipilih untuk demo. Backend normal reserve_paid sebelum model dan finish_ai_request sesudah model. Tidak ada OpenAI langsung pada komponen discovery.

**Blocker nyata:** setelah hasil Meta, UI otomatis GET `/api/recommendations`, lalu `fetchFlights` untuk setiap opsi. Ini dapat meminta supplier; tanpa network guard teruji, alur tidak memenuhi batas nol supplier tambahan. Jangan menganggap cached karena nama recommendations. Perlu perubahan QA-only eksplisit untuk melewati pricing/enrichment dan memakai cache QA berlabel atau unavailable, lalu network assertion browser sebelum live. Perubahan itu belum dibuat pada review ini.

`FlightSearch` meneruskan onChoose ke chooseTrip; `chooseTrip(t,requestAI=false)` tidak menyalakan autoFlightAI pada pemilihan biasa. Jadi tidak ditemukan generator kedua otomatis pada pemilihan kartu ini. Namun `AIPlanner` memiliki autoRequest effect dan `/api/itinerary` di jalur lain: jangan menekan generate/regenerate legacy atau memasok requestAI=true. Perlu browser network acceptance untuk membuktikan perilaku runtime, termasuk efek map/detail/save. Saat ini **UI NOT READY** untuk live terbatas, walaupun routing normal ditemukan di source.

## Fakta billing yang harus dipastikan owner/provider

Konfirmasi owner bahwa kredit berasal dari Hackathon diterima; jangan meminta ulang asal kredit. Tampilan terdahulu menunjukkan free credits149,96USD, outstandingRp0 dan emailalerts; bukan bukti hard-stop. Sebelum inference perlu:

- Proyek/credential yang dipakai benar-benar membebankan penggunaan ke grant Hackathon tersebut, tanpa reveal key.
- Saldo eligible terbaru, kedaluwarsa/timezone dan sisa masa grant pada waktu tes.
- Model **muse-spark-1.3 Standard**, modality teks serta endpoint token-count tercakup; tarif dan seluruh biaya yang mungkin berlaku.
- Urutan grant: kredit Hackathon sebelum kredit non-Hackathon/paid balance; aturan bila grant habis/expired saat request berlangsung.
- Hard control yang benar-benar menolak paid spillover, scope team/project dan keterlambatan penegakan; emailalert bukan hard limit. Jika tidak tersedia, STOP, jangan menganggap persetujuan owner membolehkan biaya pribadi.
- Cara membaca usage/cost per request dan delay billing (UI menyebut sampai1jam), perlakuan gagal/timeout/preflight. Jika biaya aktual belum terlihat, pertahankan reservasi0,05 dan stop sampai dapat direkonsiliasi.

Tidak menambah kartu, mengganti billing, atau membeli plan untuk menyelesaikan poin ini.

## Rencana penerapan QA minimum — belum diizinkan/dijalankan

1. Review versi final SQL08 dengan guards tambahan di atas; rehearsal pada PostgreSQL disposable menggunakan data sintetis, tanpa copy user/credential. Jangan menjalankan SQL06 atau migration budget lama.
2. Persetujuan terpisah atas versi final SQL08 dan uji SQL transaksional; project QA harus tampak di dashboard. Matikan/drain writer, pastikan0unsettled dan hash/snapshot/ACL sesuai; simpan definisi+ACL privat untuk rollback, tidak ke chat.
3. Jalankan sekali transaksi SQL08 final, timeout pendek, NOWAIT. Error/drift/lock conflict: ROLLBACK dan STOP. Tidak retry atau reset. Setelah COMMIT SELECT status/fingerprint/ACL/RLS/history hash dan jumlah/alokasi; harus identik selain definisi/capability. Snapshot0,35/9,65/false/7/0 diharapkan jika tidak ada perubahan sejak recovery.
4. Tanpa inference, jalankan uji concurrency PostgreSQL di bawah hanya setelah scope temporary writes/rollback disetujui. Tidak memakai probe lama. Tidak aktifkan Worker sampai seluruh hasil lolos.

### Rencana uji PostgreSQL nyata

Gunakan dua koneksi independen QA dan dua akun QA terverifikasi yang sudah ada; UUID ditangani privat. Set timeout transaksi/lock dan tandai semua request test secara privat. **Setiap perubahan test wajib ROLLBACK**, tidak COMMIT. Jika fasilitas SQL Editor tidak mempertahankan transaksi sesuai kebutuhan, gunakan runner PostgreSQL terotorisasi owner atau disposable Postgres; jangan menebak sesi.

| Kasus | Langkah terkontrol | Hasil yang diharapkan |
| --- | --- | --- |
| Lock lintas koneksi | A BEGIN, reserve akunA lalu tahan transaksi20detik; B BEGIN dengan lock_timeout1s, reserve akunB ketika A memegang lock; A dan B ROLLBACK | B lock-timeout, bukan second allocation; bukti overlap harus dicatat |
| Pending global | Dalam A setelah satu reserve, panggil reserve baru akunB sebelum settlement | allowed=false walaupun akun berbeda |
| Stale pending | Dalam transaksi test ubah created_at request test menjadi >2menit lama; reserve akunB | tetap allowed=false |
| Duplicate | Reserve ID sama sebelum dan setelah settle dengan usage sintetis yang diketahui | allowed=false, alokasi transient hanya sekali |
| Unknown settle | settle request test dengan NULL usage, lalu reserve akunB | okfalse dan pending tetap menolak |
| Replay anomaly | settle test normal lalu settle lagi dengan output2305; juga request tidak ada | okfalse; blocked tidak berubah |
| Release normal | settle request test usage valid, lalu reserve IDbaru akunB dalam transaksi | allowed=true; hanya perubahan transient |
| Role negatif | anon/auth reserve/settle/status | permission denied, tanpa perubahan |

Akhiri dengan ROLLBACK di semua koneksi, lalu SELECT history hash/count/allocated/blocked; wajib persis baseline. Tidak perlu mencatat fake cost sebagai request nyata karena seluruh test dirollback. STOP jika NO_OVERLAP, sesi tidak jelas, deadlock/timeout tak terduga, fungsi/izin berubah, rollback gagal atau riwayat berbeda. Jangan menghapus baris untuk memperbaiki hasil.

## Checklist satu aksi Meta live — belum dieksekusi

- [ ] SQL08 final approved/applied/rehearsed, fingerprint/ACL/RLS dan concurrency nyata lolos.
- [ ] Schema+owner-test entitlement QA sah; access normal berhasil, tanpa preview.
- [ ] Billing seluruh fakta di atas terbukti, batas efektif min(10USD, eligiblecredits, providerlimit, remainingledger); sisa attempt peruser dicek tanpa menaikkan10.
- [ ] QA-only UI pricing off; browser network test offline membuktikan nol suppliers/OpenAI/legacygenerators. Account/login/Save target hanya QA.
- [ ] Izin terpisah menyalakan local QA dan **satu** inference action; tidak inference page-load/background/auto-retry. Model2000output/20000input, reserve0,05; simpan margin konservatif.
- [ ] Prompt teks KL3hari/1orang; tanpa link/video/tools. Maksimal1preflight+1inference, kegagalan tetap satu attempt. Jika counter provider menghitung preflight juga, catat kedua HTTP request.
- [ ] JSON lengkap, hotel2malam, rute/waktu masuk akal; unknownprice bukan0; cacheC2 tanggal/sumber dipertahankan, tanggalflight/hotel tidak dipadankan keliru.
- [ ] Settle dollar dan finish quota oktrue; record input/output tokens, model, status, estimated/actualcost berlabel dan remaining. 429/usageunknown/settlefail/billingunexpected => STOP tanpa retry.
- [ ] Pilih ke editor biasa, ubah satu item lalu Save/MyTrips/reload dengan izin write QA; jangan regenerate. Log network menunjukkan tidak ada inference kedua/supplier.

## Tes dan submission readiness

`npm run test:gate-d`: **127 PASS, 0 FAIL, 0 skipped**. Artifact `artifacts/gate-d-activation-tests.tap`.
`npm run build`: **PASS**, TypeScript noEmit dan Vite berhasil; warning dynamic-import/plugin timing existing. Artifact `artifacts/gate-d-activation-build.log`. Ini tes offline/build, bukan live E2E atau PostgreSQL lock test.

- [x] Recovery QA terakhir berhasil; tidak diulang.
- [x] Settlement fail-closed dan test offline tersedia.
- [x] Read-only RPC/entitlement diagnosis aktual tersedia.
- [ ] SQL08 final migration safety dan real PostgreSQL tests.
- [ ] QA entitlement sah.
- [ ] UI tanpa supplier/generator tambahan.
- [ ] Promo-only billing protection.
- [ ] Satu live Meta result dengan cost+Save/reload evidence.

**Rekomendasi berikutnya:** perbaiki proposal SQL08 dan QA-only UI pricing gating secara lokal untuk review, kemudian minta approval versi final DB dan temporary-write SQL tests. Approval recovery sebelumnya tidak mencakup fungsi/grants/schema baru ini. Tidak perlu mengulang local safety suite lagi kecuali ada perubahan. Submission yang mengklaim verified live Meta demo masih **NOT READY**; materi offline boleh dinilai sebagai offline saja. Tidak lanjut Gate E.

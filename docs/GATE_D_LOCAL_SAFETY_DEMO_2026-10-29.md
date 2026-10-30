# Gate D — perbaikan lokal dan persiapan demo

29 Oktober 2026. **LOCAL IMPLEMENTATION; LIVE NO-GO.** Ledger recovery terakhir tetap 0,35/9,65/blocked=false/7 request/0 unsettled. Tidak diperiksa ulang, direset atau dipulihkan ulang pada pekerjaan ini. Tidak ada SQL yang dieksekusi, Meta/supplier request, secret dibaca, billing, production, deployment, commit atau push.

## Perubahan

- `worker/video-itinerary.js`: hasil ditahan HTTP503 `BUDGET_SETTLEMENT_FAILED` bila settle melempar, respons hilang, atau ok tidak true. Log settlementRecorded=false; tidak refund/retry. Hasil dengan usage hilang/melebihi guard juga tidak dianggap sukses. Error accounting dapat menggantikan error model supaya ketidakpastian finalisasi terlihat.
- `worker/meta-video-budget.js`: memerlukan safety-status RPC versi2 sebelum reserve, dan marker globalExclusive pada reservasi berhasil. Deployment DB lama ditolak sebelum reserve; mismatch reservasi ditolak sebelum provider. HTTP200 settlement dengan okfalse/malformed juga gagal. Tidak memakai mutex memory/KV untuk mengklaim penguncian global.
- `worker/assistant-discovery.js`: finalisasi Trip Pass yang sudah dicoba tidak diulang otomatis dari finally sebagai success=false setelah respons tidak pasti. Hasil tetap ditahan. Kegagalan sebelum percobaan finalisasi tetap melakukan satu cleanup normal.
- `docs/staging-proposal/sql/08_PROPOSED_GLOBAL_META_GUARD.sql`: usulan definisi RPC saja, **belum diterapkan**. Row lock ledger mengurutkan reserve/settle lintas akun dan Worker; seluruh request pending, termasuk yang lama, menolak reserve baru. UUID duplikat ditolak sebelum alokasi. Settle memeriksa request belum settled sebelum kemungkinan blocked=true; duplikat/tidak dikenal menghasilkan okfalse tanpa perubahan ledger. Usage tidak diketahui tetap pending, tanpa expiry/refund. Tidak ada unblock/reset/data history update di luar settlement request normal; batas10USD/0,05/10 per-user/20k input/2k output tetap.
- `package.json`: perintah offline `npm run test:gate-d`.
- Tes: baru `checks/gate-d-safety.test.mjs`; diperbarui `checks/assistant-discovery.test.mjs`, `checks/meta-qa.test.mjs`, `checks/video-itinerary.test.mjs`, `checks/phase2b.test.mjs`, `checks/phase2c.test.mjs`, `checks/staging.test.mjs`, `checks/assistant-combined.test.mjs`. Fixture sukses harus mengembalikan acknowledgement settlement eksplisit; ekspektasi lama yang membolehkan hasil saat settle gagal telah diperbaiki.

## Verifikasi dan batas bukti

Run final: lihat `artifacts/gate-d-local-tests.tap`. Build/typecheck: `artifacts/gate-d-build.log`. Tidak mengubah UI atau mengulang browser acceptance. Build dapat memberi warning dynamic-import/bundle timing existing, bukan kegagalan.

Konkurensi/duplicate/stale diuji melalui fixture RPC deterministik yang dipakai adapter asli; ini **bukan bukti penguncian PostgreSQL nyata**. SQL08 mendapat pemeriksaan statis saja, belum syntax/runtime test pada database PostgreSQL. Tidak ada klaim E2E Meta atau live RLS baru. Tes historis probe null-usage di phase2c memakai fixture legacy; SQL08 sengaja menolak finalisasi usage tidak diketahui. Jangan menjalankan probe allocate-005-no-refund untuk verifikasi baru karena akan menahan pending.

Entitlement discovery normal diuji: auth/Origin, unpaid ditolak sebelum model, schema/grant error bukan fake subscription, paid reserve sebelum model, finalisasi tidak pasti menahan hasil, tanpa retry finalisasi. Source tetap memakai reserve_paid_ai_request dan finish_ai_request; authorization/RLS tidak dinonaktifkan. Deployment schema dan entitlement owner QA **belum dibuktikan pada pekerjaan lokal ini**.

Route legacy video extraction dan preview QA bukan alur Trip Pass normal dan tidak boleh dipakai untuk mengklaim demo berlangganan lulus. Jangan mengeksposnya di demo publik. Pembatasan/pengintegrasian entitlement pada route legacy merupakan blocker jika route itu akan digunakan pada demo live. Gate D terkecil menggunakan **discovery normal saja**, bukan preview.

## Demo terkecil yang disiapkan

1. Sekarang: `npm run test:gate-d` dan `npm run build`; semua provider/RPC disimulasikan dan diberi label offline. Tidak menyalakan server atau inference.
2. Setelah approval aktivasi terpisah: gunakan UI asli dengan identitas QA owner; periksa entitlement lewat jalur normal. Tidak memindahkan identitas/langganan production atau membuat pass palsu.
3. Satu aksi eksplisit: prompt teks “Buat itinerary Kuala Lumpur 3 hari untuk 1 orang, museum dan transportasi hemat. Tandai harga yang belum tersedia.” Tanpa TikTok URL, video, web tools atau supplier refresh. Scope ini sengaja menghindari ketergantungan akses video eksternal.
4. Tepat satu preflight token-count dan maksimal satu inference, output2000/input20000, reserve0,05; kegagalan dihitung dan tidak retry. Tidak menjalankan delapan skenario sekaligus. Existing10/user tetap lebih ketat dari usulan20 GateD; hitung sisa slot akun sebelum aksi.
5. Validasi satu opsi lengkap/durasi3, urutan waktu/tempat, dua malam hotel, harga unavailable bukan0. Cache C2 bila digunakan diberi tanggal/sumber; tanggal flight6–8Nov berbeda dari hotel24–26Nov, jangan jadikan paket tanggal sama.
6. Klik opsi ke editor native, ubah satu kunjungan, Save/My Trips/reload dengan mekanisme normal. Tidak memanggil generator kedua/supplier baru atau booking/payment. Jika UI otomatis memanggilnya, hentikan dan lakukan wiring terpisah sebelum demo.
7. Pastikan settle dollar dan finish entitlement masing-masing terkonfirmasi sebelum hasil dinilai sukses. Jika usage/finalisasi tidak pasti, STOP; pending tetap menutup global guard. Tidak menghapus pending atau menambah kuota untuk melanjutkan demo.

## Tindakan owner yang masih diperlukan

1. Review SQL08 beserta perubahan perilaku stale/unknown usage dan fingerprint baru; berikan izin terpisah sebelum menerapkan **hanya ke QA aytrcvfncsklhqozreyk**. Jangan menjalankan SQL06. SQL08 bukan izin mengubah saldo atau grant entitlement. Fungsi baru hanya service_role; ACL existing yang tidak aman membatalkan transaksi.
2. Setelah izin DB, lakukan review deployed definitions/ACL/capability dan uji konkuren PostgreSQL terkontrol terpisah tanpa Meta. Jangan menganggap fixture membuktikan lock DB. Izin SQL08 belum diberikan pada pekerjaan lokal ini.
3. Verifikasi kesiapan RPC Trip Pass dan hak owner QA. Bila schema/entitlement belum ada, review proposal existing dengan izin tersendiri; tidak memakai production entitlement atau preview bypass.
4. Lengkapi bukti eligible promotional credit/model/expiry dan pencegahan paid-spill; konfirmasi asal kredit owner sudah dicatat, tetapi billing controls tetap belum terbukti. Jangan mengubah billing.
5. Setujui aktivasi local QA dan satu aksi inferensi setelah semua gate di atas lolos. Tidak ada permintaan credential baru. Verifikasi network gating UI agar tidak memicu supplier/generator tambahan, dan catat biaya provider+ledger.

## Submission readiness

Perbaikan lokal dan demonstrasi offline dapat direview. **Belum siap menjalankan controlled live test** sampai SQL08 dan konkurensi nyata, entitlement QA, billing dan wiring UI terbukti. Tidak mengeklaim video TikTok live, supplier refresh, pembayaran atau demo Meta E2E sebagai berhasil. Tidak otomatis melanjutkan Gate E atau deployment.

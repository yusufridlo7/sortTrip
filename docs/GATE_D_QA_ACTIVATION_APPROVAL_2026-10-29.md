# Gate D — paket review aktivasi Supabase QA

29 Oktober 2026. **READ-ONLY VERIFICATION + PREPARATION COMPLETE. Tidak ada mutasi DB atau aktivasi Meta.** SQL08/02/03/04 tidak dijalankan. Tidak mengubah production, billing, credential, deployment, commit/push. Dua diagnostik SELECT katalog/agregat dijalankan dalam transaksi READ ONLY pada QA saja; tidak reserve/settle atau membaca data akun.

## Kesesuaian aktual dengan SQL08

Identitas dashboard: **sorttrip QA**, project URL/ref **aytrcvfncsklhqozreyk**. Production tznxfgosmjcmwoszvkdk tidak diakses.

| Pemeriksaan aktual | Hasil | Kesesuaian |
| --- | --- | --- |
| PostgreSQL | **17.11** | Beda dari rehearsal18.6; bukan drift ledger/RPC, residual compatibility perlu dicatat |
| Role migrasi/owner RPC | postgres / postgres | Sesuai |
| Ledger | satu row, allocated0,35, remaining9,65, blockedfalse | Sesuai recovered baseline |
| Requests | total7, pending0, overoutput1, max2305, otheroverrun0 | Sesuai |
| Reserve fingerprint | 2f5b3af8ada27fe6076cea1e91a7ee33 | Sesuai pin |
| Settle fingerprint | 32847c39624929a29a3db9db0947b713 | Sesuai pin |
| SECURITY DEFINER/search_path | true / public,pg_temp pada keduanya | Sesuai |
| ACL | service EXECUTEtrue; anon/auth false; tidak ada grantee/grant-option tak diharapkan | Sesuai |
| RLS ledger/requests | true/true | Sesuai |
| Trigger user ledger | 0 | Sesuai |
| Safety-status v2 | belum ada | Sesuai migrasi pertama |
| Configured Supabase URL setting | UNSET | Tidak menjadi bukti identitas; dashboard+attestation manual wajib |
| trips / RLS trips | tersedia / true | Tidak diubah |
| Entitlement tables/RPC | belum ada | Blocker discovery normal |

Hash metadata tersanitasi: `artifacts/gate-d-qa-activation/read-only-metadata.json`. Hash penuh riwayat dihitung ulang dengan separator chr(10), cocok dengan cara SQL08: **76be9babe2d2e1d4be868ffba169f5c6**. Hash ledger: **ced9a3856f4820ba506306beb1967107**. Tidak menyimpan UUID akun/request, email, token atau isi riwayat.

**Tidak ditemukan drift baseline/fungsi.** Keberadaan overload tambahan reserve/settle akan tetap ditolak guard SQL08 saat apply. Tidak mengklaim seluruh runtime QA sudah cocok hanya karena metadata cocok.

## Writer — bukti dan batasnya

Pada snapshot: active ledger queries lain0; write-lock ledger oleh sesi lain0; fungsi public lain yang mereferensikan ledger0; cron.job tidak ada; pending0. Netstat tidak menampilkan listener pada knownports8790/5174/5175/5176/56549 saat pemeriksaan. Tidak menghentikan layanan apa pun.

Angka0 adalah bukti keadaan sesaat, **bukan bukti remote/future writer sudah drained**. Konfirmasi owner sebelumnya tidak ada deployment QA/staging atau komputer lain tetap konteks terpercaya, tetapi sebelum apply perlu freeze akses/administrasi dan konfirmasi tidak ada launcher/admin job yang dapat menyusul. Function/schema di namespace lain atau job eksternal tidak disimpulkan tidak ada dari hitungan public. Jika ada aktivitas atau snapshot/hash berubah, STOP; jangan menyesuaikan pin diam-diam.

## SQL08 final khusus QA — review, bukan izin eksekusi

Berkas `docs/staging-proposal/qa-activation/08_FINAL_QA_FOR_REVIEW.sql` disiapkan dari proposal yang lulus rehearsal. Manual project attestation diisi ref QA yang baru diverifikasi; **execution_authorized tetap false**.

Tambahan khusus QA: pin versi17.11 dan hash penuh ledger/request aktual sebelum preflight lama. Guards owner/ACL/fingerprint/snapshot, NOWAIT/timeouts dan pemeriksaan data hash/postflight tetap. Table lock mendahului semua pemeriksaan. Body reserve/settle/status sama dengan yang diuji pada PG18.6; tidak ada reset/unblock/perubahan budget atau request historis. Source proposal SQL08 lama dipertahankan.

Manifest `docs/staging-proposal/qa-activation/REVIEW_SHA256.json` mengikat versi berkas yang direview. Jika approval diberikan nanti, perubahan execution gate menjadi true harus dicatat sebagai delta eksplisit beserta hash baru; bukan menganggap hash berkas approved identik setelah gate diedit. UUID owner-test tetap dipilih privat oleh owner.

Final copy hanya direview statis, tidak dieksekusi pada17.11 atau lokal pada pekerjaan ini. Rehearsal55PASS mencakup body SQL08 pada18.6, bukan semua tambahan guard final di versi17.11. PostgreSQL17-specific rehearsal sebelum apply merupakan pilihan paling konservatif; bila memilih lanjut setelah review kompatibilitas, catat residual versi secara eksplisit, jangan mengklaim parity. SQL08 memakai fitur PostgreSQL dasar yang juga tersedia di17; ini penilaian source, bukan runtime proof.

## Review entitlement SQL02/03/04

- **SQL02:** schema minimum yang diperlukan normal discovery: trip_passes, ai_request_reservations, satu index; RLS aktif pada kedua tabel, revoke direct client access; service_role SELECT hanya trip_passes; reserve_paid_ai_request dan finish_ai_request server-only SECURITY DEFINER search_path kosong. Tidak membuat membership/payment/legacy reserve_ai_request dan tidak menyentuh trips policies. Fungsi memakai locking per-user dan penanda owner-test, bukan pass production.
- **SQL03 existing:** dua hasil berhasil/24jam; lebih besar dari kebutuhan satu aksi. Jangan menjalankan file existing bila menyetujui scope minimum berikut.
- **Varian minimum:** `qa-activation/03_MINIMUM_OWNER_TEST_FOR_REVIEW.sql`: satu hasil berhasil, berlaku **satu jam**, satu akun owner QA existing dengan email_confirmed_at; payment_reference owner-test:staging tetap untuk kompatibilitas schema, bukan transaksi atau production payment. requests0/request_limit1. Tidak memberi hak browser INSERT/EXECUTE atau memalsukan pembayaran. `u=NULL` dan execution gatefalse menutup eksekusi tanpa review/identitas privat. Guard global pending, alokasi+0,05<=10 dan total attempts owner+1<=10 tetap diperiksa; tidak reserve uang saat grant.
- **SQL04:** read-only metadata/ACL/RLS/policies checker sesudah schema. Bukan mutation, bukan role negative test atau bukti entitlement valid. **Belum dijalankan**, sesuai permintaan. SQL09 read-only digunakan untuk post-SQL08, juga belum dijalankan pada QA.

Entitlement ini membatasi **hasil sukses**, bukan izin mencoba berulang tanpa batas. Demo satu aksi tetap satu attempt eksplisit; gagal tidak menjadi izin retry. Sisa attempt per-owner belum diperiksa karena tidak mengambil UUID/account data; grant script memvalidasinya saat disetujui. Satu hasil cukup untuk discovery → pilih → edit manual → Save/MyTrips/reload; tidak termasuk regenerateAI kedua. Jika klarifikasi/invalid result terjadi, STOP, jangan mengganti akun atau memperbesar grant.

Owner-only authorization/allowlist Worker dan Access untuk deployment remote tetap wajib dibuktikan. Role service bukan user authorization. Jangan mengaktifkan route preview atau legacy video/auth-only sebagai pengganti entitlement normal. Kelayakan schema/RPC actual sekarang **NOT READY**; diperlukan approval khusus, rehearsal entitlement/pengujian negatif, dan postflight.

## Checklist approval presisi

| Tahap | Berkas/scope | Mutasi persistent yang akan dilakukan bila disetujui | Bukan bagian izin |
| --- | --- | --- | --- |
| A | Final QA SQL08 | Replace dua fungsi reserve/settle; create satu safety-status; ACL server-only status; tanpa data update saat migrasi | Tidak mengubah blocked/alokasi/history, tidak menjalankan inference |
| B | SQL02 schema minimum | Create dua tabel+index, enable RLS, revoke/grant table rights; create dua RPC dan ACL service-only | Tidak memasukkan entitlement, tidak mengubah trips/RLS lama, tidak memasang legacy generator |
| C | Varian minimum SQL03 | INSERT **satu** owner-test pass, limit1/1jam, untuk akun QA yang dipilih privat | Tidak membeli pass, mengganti payment, menambah budget/kuota Meta atau memberi hak ke akun lain |
| D | SQL09 dan SQL04 | **Tidak ada mutasi**, hanya postflight SELECT | Bukan bukti live model/negatif RLS dua akun |
| E | Pengujian entitlement negatif/transaksional QA | Belum disiapkan sebagai executable approved; perlu scope temporary-write/rollback terpisah | Tidak otomatis diizinkan oleh read-only atau rehearsal lokal sebelumnya |
| F | Backend QA + satu inference | Memerlukan izin tersendiri setelah A–E dan billing lolos | Tidak termasuk approval SQL ini, tidak supplier/production/deploy |

Sebelum tiap mutasi: recheck dashboard QA, versi/hash, writer freeze, simpan definisi/ACL lama privat. Jika lock gagal/data berubah/grant existing ditemukan, ROLLBACK dan STOP tanpa retry/reset. Setelah A, SQL09/hash data harus identik dan fingerprint fungsi sesuai hasil versi QA. Setelah B/C, SQL04 dan endpoint access normal harus membuktikan hak owner serta penolakan akun lain; jangan mengandalkan UI banner atau mode fixture. Setelah COMMIT, rollback berarti transaksi restorasi yang direview dan disetujui, tidak menghapus history; jangan drop objek yang sudah dipakai tanpa review dependency/records.

## Rekomendasi

**Metadata QA cocok dengan SQL08 preflight; tidak ada drift terdeteksi. Paket review siap, eksekusi belum diizinkan.** Langkah paling aman: owner mereview final SQL08 dan residual versi17.11 vs18.6, lalu menyetujui tahap A secara spesifik setelah fresh readback/writer freeze. Tahap B/C tetap terpisah; review/rehearsal entitlement sebelum apply disarankan. Tidak meminta ulang izin recovery dan jangan menjalankan SQL06.

Tidak mengulang130offline tests/build/browser atau55SQL rehearsal karena tidak ada perubahan code runtime pada review ini. Bukti sebelumnya tetap historis; pekerjaan ini menambahkan dua SELECT metadata QA dan review statis file baru. Gate D live/submission verified demo masih NO-GO sampai entitlement/backend/billing dan satu aksi inference terpisah lulus. Gate E tidak dimulai.

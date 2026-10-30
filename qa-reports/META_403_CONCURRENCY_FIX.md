# Perbaikan HTTP403 dan uji konkurensi B

27 Oktober 2026. Proyek QA: `aytrcvfncsklhqozreyk`. Checkpoint terbaru: satu inferensi teks Meta berhasil setelah gate lolos; tidak ada perubahan credential atau rilis production. Lihat bagian final state di bawah.

## HTTP403

Pemeriksaan ulang UI QA tetap mengembalikan HTTP503 aplikasi / HTTP403 upstream dengan kategori `DATABASE_PERMISSION_DENIED` (PostgreSQL42501). Gagal pada `budget-read`, sebelum reserve/settle. Status ini bukan bukti key salah dan tidak mengharuskan penggantian credential.

Owner menjalankan seluruh `supabase/meta-video-budget-service-read.sql`: memberi SELECT tabel agregat budget hanya kepada service_role, lalu memeriksa tiga boolean. Anon/authenticated tidak diberi akses. Patch source sudah tersedia; hasil eksekusi sukses dan readback runtime masih menunggu.

Jika sesudah patch masih403, jalankan `supabase/meta-video-access-diagnose.sql` yang hanya membaca metadata. Enam boolean membedakan izin schema, SELECT, reserve, settle, serta penolakan client role. Jangan menambah grant luas, menonaktifkan RLS atau merotasi key untuk menutupi penyebab yang belum terbukti.

## Konkurensi B v2

Hasil B asli=false tetap belum membuktikan contention. Versi berikutnya menggunakan marker sesi A. Revisi sekarang membuat B **menunggu hingga15detik** untuk marker aktif dari backend lain. B tidak mengambil marker sendiri dan tidak lagi memerlukan akun yang belum pernah dipakai.

Owner membuka dua jendela/tab SQL Editor QA yang dapat menjalankan query bersamaan:

1. Siapkan seluruh isi `supabase/meta-video-concurrency-b.sql` di jendela B dan `supabase/meta-video-concurrency-a.sql` di jendela A.
2. Jalankan **B terlebih dahulu**, lalu segera jalankan **A** dalam15detik. B akan menunggu A; A memegang global row lock selama20detik. A lebih dahulu juga diperbolehkan jika B dimulai saat A masih berjalan.
3. Hasil B yang diharapkan: kedua `passed=true`, dengan detail `OVERLAP_CONFIRMED` dan `LOCK_TIMEOUT_EXPECTED`.
4. Jika detail `NO_OVERLAP_NOT_A_BUDGET_FAILURE`, kedua query tidak terbukti berjalan bersamaan. Gunakan dua jendela yang benar-benar bisa menjalankan query paralel; jangan menandai budget rusak atau tes lulus.
5. Setelah A selesai, periksa saldo sama seperti sebelum tes. Seluruh temporary write B di-rollback; tidak ada reset/refund alokasi dan tidak ada Meta API call.

Marker menggunakan representasi advisory lock dua integer pada pg_locks, dengan filter database dan backend lain, sesuai [dokumentasi PostgreSQL](https://www.postgresql.org/docs/current/view-pg-locks.html). Marker hanya membuktikan overlap; penolakan lock diuji melalui fungsi reserve asli dan lock_timeout2detik.

## Verifikasi dan keterbatasan

Tidak ada PostgreSQL/psql lokal tersedia saat pemeriksaan. Skrip revisi belum dieksekusi terhadap database oleh agent; tidak diklaim sebagai tes SQL/concurrency lulus. Pengujian regresi adapter terpisah dicatat di log follow-up. Izin SQL dan pengoperasian sesi QA tetap dilakukan owner sesuai AGENTS.md. Flag inferensi tetapfalse sampai gate nyata lolos.

## Resolved follow-up — 27 October2026
Owner reports service-readSQL threebooleans alltrue. Actual QAUI then confirms aggregate-read success allocation0/remaining10/blockedfalse, followed by ONE successful realWorkerreserve+unknown-usage-settle: allocation0.05/remaining9.95; zeroMetacalls. This supersedes the HTTP403runtimeblocker above. Owner also reports revisedBconcurrencytworesultsalltrue; classify asowner-reportedactualDBtest, notagent-executedSQL. Post-concurrencyreadbackbeingchecked; do notresetreal0.05allocation. Screenshotevidence phase-2c/evidence/budget-worker-reserve-settle-success.png.

## Final state after successful text test
HTTP403 resolved; runtime reserve/settle verified. Owner Bv2 results bothtrue and postprobeledger unchanged. AuthorizedsyntheticMetatexttest subsequentlypassedHTTP200 (muse-spark-1.3,405/1341tokens,estimatedUSD0.0062055,8593ms). AggregateSQLownerconfirms2requests/2settled/0unsettled andallocation0.10/remaining9.90/blockedfalse. QAtripsmissingdiagnosed; ownerappliedexistingschema,actualSave/fullreload/freshDBlist/reopenPASS, including10:01/hemat/budget4500000. No furthergrant/concurrency/keysetupneeded. Allinferenceflagsrestoredfalse. Phase2C remainsPARTIAL onlyforremainingacceptance, includingnegativeRLSsecondaccount/liveframes; no productionrelease. Finalregression414pass/buildPASS/i18n1611; fourstatusentrytestsrepassedafterremovingmisleadingstaticverificationfield.

# Kontrol budget dan pengujian

27 Oktober 2026. **VERIFIED WITH MOCKS; ledger PostgreSQL nyata BLOCKED.** Batas izin pengujian USD10. Pengeluaran Meta oleh pekerjaan ini **USD0**.

## Aturan source

- Reservasi USD0,05 sebelum egress, maksimum 200 alokasi / USD10 global, dengan lock row SQL.
- Satu request belum settled per user selama dua menit; maksimal sepuluh alokasi lifetime/user pada ledger tes ini.
- Request token-count memakai payload sama persis dengan inferensi. Maksimal 20.000 input + 2.000 output; tidak ada tools, search, retry atau fallback berbayar.
- Dengan harga Standard yang diperiksa, batas rencana inferensi = 20.000×1,25/1.000.000 + 2.000×4,25/1.000.000 = **USD0,0335**. Alokasi USD0,05 menyisakan margin; ini bukan pengukuran tagihan akun atau jaminan biaya endpoint tambahan.
- Alokasi tidak dikembalikan, termasuk count gagal, timeout, output rusak, dan settlement gagal. Usage aktual dicatat terpisah; usage hilang tidak berarti gratis.
- Jika usage melampaui USD0,05 / 20.000 input / 2.000 output, source settlement menandai ledger blocked untuk rekonsiliasi owner.
- Tabel/function service-only dan RLS source; tidak ada perubahan database yang diterapkan.

## Tes

`checks/phase2b.test.mjs` dan tes adapter/regresi:

| Kasus | Bukti |
|---|---|
| 250 user paralel terhadap ledger mock terserialisasi | 200 alokasi, 200 inferensi mock, 50 penolakan; USD10 penuh |
| 20 request serentak user sama | Satu diterima; alokasi tetap ditahan saat settle gagal |
| Count 0/null/string/negatif/>20.000 | Ditolak sebelum generasi |
| Gate nonproduction/frame tidak ada | Tidak ada model egress |
| Provider auth/rate/timeout/malformed | Error aman, tanpa retry atau pengembalian alokasi tak pasti |
| SQL lock/privilege/user cap/anomaly halt | Pemeriksaan source, bukan eksekusi database |
| Accounting | Hanya metadata biaya; tidak ada media/prompt/secret dalam log |

Mock lock membuktikan kontrak pemanggilan adapter, **tidak membuktikan transaksi PostgreSQL, permission service role, RLS atau deployment**. Uji database nyata masih wajib sebelum live. Lihat log suite lengkap `evidence/phase-2b/full-tests.log`.

## Rekonsiliasi sebelum live

Owner perlu environment khusus nonproduction, memeriksa account mode/rates dan apakah token count menimbulkan biaya, menerapkan SQL, lalu menguji reservasi/settlement/konkurensi nyata dan failure recovery. Cocokkan allocation, unsettled requests dan usage provider sebelum mengaktifkan kembali test yang bermasalah. Jangan reset/refund saldo ledger untuk mencoba ulang error yang mungkin sudah ditagih. Batas ini hanya membatasi jalur adapter; pemakaian key yang sama di aplikasi lain berada di luar kendalinya. Billing alert/credits tidak menggantikan batas tersebut.


Revisi owner 27 Oktober 2026: maksimum dinaikkan dari USD5 menjadi USD10. Alokasi per request USD0,05 dan batas sepuluh alokasi/user tetap. Saldo terpakai tidak direset. Perubahan source belum diterapkan ke database; ledger nyata tetap belum terverifikasi. Bukti pengujian revisi: qa-reports/meta-budget-10/.

### Owner-provided database evidence — 27 October2026
Owner reported successful SQLapplication onQAproject aytrcvfncsklhqozreyk. Screenshots of read-only verification show allocated0, remaining10, blockedfalse, bothRLSenabled, anon/authenticated accessdenied, serviceRPCexecutionallowed. This supersedes “SQL not applied” for the owner-reportedQAproject only. The verification query displays total_limit_usd as literal10; it does not independently measure the actualconstraint/functioncap. Actual reservation/concurrency/exhaustion/settlement, serverQAconnection and Metaaccess remain unverified; no paid call. Keepflagsdisabled until remaininggatechecks pass.

### Transactional QA probe prepared — 27 October2026
supabase/meta-video-budget-probe.sql is owner-operated onQAproject aytrcvfncsklhqozreyk afterQAuserlogin. Temporary pg_temp function exercises reserve, active-user rejection, settlement/no-refund, finalallocation9.95→10, exhaustion, CHECK>10, anomalyhalt and source-rowlock presence. Intentional inner PLpgSQLexceptionrollsback ALLledgerwrites before returning9booleans. Ownermust runwholefile and thenverifyledgerunchanged; agent has not executed or certified thisSQLruntime. It is sequentialfunctiontesting and sourceinspection, not parallel-sessionconcurrency proof. NoMeta/paymentAPI involved. Existingflagsfalse. ActualMetaMETADATAaccess200 is nowverified separately, not inferencereadiness.

### Actual owner SQL probe results — 27 October2026
Owner screenshots confirm allninebooleans passed onQA: constraintdeniesabove10, exhausteddenial, lastallocation10, reservationallowed, functionrowlockpresent, same-usersecondactive denial, no-refundsettlement, allocation0.05, usageanomalyhalt. This supersedes source-only/unexecuted status for the owner-operatedsequentialprobe. The row-lock test inspectsfunctionsource, so actualparallel-sessionbehavior is still not claimed. Post-probe allocation/blocked state must be rechecked to confirmrollbackrestoration. No paidMeta inference or keyvaluesread; flagsremainfalse.

### Post-probe restoration confirmed — 27 October2026
Owner screenshot confirms allocated_usd0.000000, remaining_usd10.000000 and blockedfalse after the sequential probe. Rollback restoration gate is complete. This does not prove actual parallel-session concurrency or runtime service RPC; no paid inference occurred and activation flags remainfalse.

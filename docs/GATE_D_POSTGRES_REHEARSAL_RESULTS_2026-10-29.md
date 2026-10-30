# Gate D — rehearsal PostgreSQL lokal aktual

29 Oktober 2026. **55 pemeriksaan otomatis PASS, 0 FAIL pada run akhir. SQL08 siap untuk review owner sebelum approval QA terpisah.** Tidak terhubung ke Supabase QA/staging/production, tidak ada Meta/supplier request, billing, credential existing, service/PATH global, deploy, commit/push.

## Sumber dan lingkungan

PostgreSQL **18.6**, Windows x64, EDB package18.6-5. PostgreSQL.org menunjuk paket Windows dan ZIP EDB: https://www.postgresql.org/download/windows/ dan https://www.enterprisedb.com/download-postgresql-binaries . Checksum ZIP dipublikasikan pada repository installer vendor: https://github.com/EnterpriseDB/edb-installers/issues/746 .

Arsip existing `C:/Users/Yusuf Ridlo/Downloads/postgresql-18.6-5-windows-x64-binaries.zip`, ukuran384620317byte. SHA256 aktual dan yang dipublikasikan EDB cocok:
`e2246ba91d22345bc3d017586c09ede52d9df180b1eeb480f050445f1cad84e2`.

Binary tidak Authenticode-signed; verifikasi integritas memakai checksum arsip vendor. Tidak mengklaim ada tanda tangan digital. Folder pgsql owner diperiksa versi/hash/Zone.Identifier tetapi tidak diubah atau dipakai sebagai executable test: runtime diekstrak ulang dari ZIP terverifikasi, tanpa download tambahan. Hanya bin/lib/share diekstrak, zip-path traversal ditolak.

Root: `C:/Yusuf Ridlo/belajar koding/Platform Itinerary/sortTrip_VSCode_Local/sortTrip-local/.sorttrip-qa/pg-rehearsal-20261029-02/`.
Runtime: `runtime/pgsql`; data: `data`; database baru: `sorttrip_gate_d_rehearsal_20261029`; listen_addresses127.0.0.1, port56549, max_connections12. PATH hanya pada child process. Tidak menggunakan Windows service, WSL atau Docker. Role postgres dan trust authentication hanya pada cluster sintetis baru; tidak memasang password atau mengubah credential existing. Tidak boleh memakai cluster trust ini untuk data nyata.

Percobaan inisialisasi sandbox pertama tertahan dan dihentikan; direktori `pg-rehearsal-20261029` tidak dipakai ulang. Percobaan berikut membuat cluster baru-02 di luar sandbox. Penanganan stdout pg_ctl Windows diperbaiki agar tidak menunggu pipe yang diwariskan child. Pemeriksaan identitas awal gagal karena inet_server_addr tercetak127.0.0.1/32; diperbaiki menjadi host(inet_server_addr()). Dua hasil FAIL pada instrumentation awal disimpan `attempt-identity-format.json`; saat itu SQL08 belum dieksekusi. Tidak menyembunyikan kegagalan harness sebagai PASS SQL. Run akhir di bawah berhasil sesudah perbaikan harness; tidak ada penurunan guard SQL08 agar tes lolos.

## Basis data dan migrasi

Baseline dibuat dari source `supabase/meta-video-budget.sql`, auth.users minimal dengan dua UUID sintetis, tujuh request settled, allocation0,35/blockedfalse, satu output2305. Tidak ada data/identity/credential QA yang disalin.

Fingerprint baseline native PostgreSQL18.6 cocok **persis** dengan pins QA yang diperiksa sebelumnya:

- reserve: 2f5b3af8ada27fe6076cea1e91a7ee33
- settle: 32847c39624929a29a3db9db0947b713

Proposal asli dengan attestation UNVERIFIED diuji dan ditolak. Copy rehearsal identik dengan SQL08 kecuali attestation terisi dan guard tambahan nama database disposable; ini bukan berkas untuk deployment QA. Migrasi copy berhasil dengan locks/timeouts/preflight/postflight aktif. Hash seluruh ledger/request sebelum dan sesudah migrasi sama.

Fingerprint sesudah rehearsal:

- reserve: 8f29245d1218375afd6f41f958265aa4
- settle: 4f8b0935318aec03c4ee94538ab193be
- safety status: 9bcc59e6aa797dbe9b5224cb1ee60a5c

Ketiganya ownerpostgres, SECURITY DEFINER true, search_path public,pg_temp; service EXECUTE true, anon/authenticated false. Kedua tabel RLS tetap true. Ini bukti lokal, bukan pembacaan ulang QA.

## Hasil aktual

Run utama: **23 PASS / 0 FAIL**, termasuk checksum, identitas endpoint dan shutdown.
Run tambahan: **32 PASS / 0 FAIL**, termasuk pengulangan checksum, identitas endpoint dan shutdown.
Total **55 PASS / 0 FAIL**: 49 pemeriksaan SQL/behavior/invariant dan6 pemeriksaan runtime/identitas/shutdown. Kelompok assertions SQL memuat beberapa assertion internal; angka55 menghitung pemeriksaan runner, bukan55 skenario independen.

| Kelompok | Bukti yang lulus |
| --- | --- |
| Syntax/migration | Baseline, penolakan manual gate, SQL08 copy, postflight, riwayat sama |
| Behavior | First reserve; pending global lintas akun; stale1hari tetap ditolak; unknownusage tetap pending dan menolak reserve lain; normal settle; replay2305 tidak reblock; duplicate ditolak; normal release membolehkan ID baru |
| Dua koneksi nyata | A memegang row lock dan terlihat PgSleep melalui pg_stat_activity; B independen mendapat lock_not_available setelah1s, tanpa second allocation; A/B rollback |
| Negative permissions | anon/authenticated masing-masing ditolak reserve, settle, safety-status;6 checks |
| SECURITY DEFINER/search_path | service_role dapat reserve/settle saat caller search_path=pg_temp dan ada temporary shadow budget; public ledger dipakai, shadow table tidak disentuh; rollback |
| Guards negatif | Wrong configured URL; allocated0,40; pending berubah; fingerprint/search_path drift; PUBLIC execute; service execute dicabut; service grant option; function owner berubah; semuanya abort |
| Postflight rollback | Perubahan data sintetis setelah preflight sengaja disisipkan pada copy migrasi; postflight abort; definisi v2 serta seluruh data kembali sama |
| Batas | Alokasi terakhir9,95→10 boleh, berikutnya ditolak; attempt peruser ke11 ditolak; request tidak dikenal overrun tidak reblock; pending request overrun asli memblokir |
| Invariant | Semua transaksi uji behavior, role, cap, mutation negatif dirollback; ledger/history hash dan definisi kembali baseline |

Negative tests hanya mengubah object sintetis di transaksi sementara pada cluster milik task ini. Tidak ada rollback dengan delete/reset/refund record nyata. SQL08 source tidak diubah pada pekerjaan ini; runner dan assertions rehearsal ditambahkan/dilengkapi.

## Bukti dan shutdown

`artifacts/gate-d-postgres/summary.json`, `main-results.json`, `additional-results.json` memuat counters. File `*.log` dan negative-case `*.sql` merekam input/hasil sintetis. `baseline.json`, `baseline-fingerprints.log`, `postflight.log`, `connection_a.log`, `connection_b.log` serta log guard menunjukkan bukti terperinci. Runner: `scripts/run-gate-d-postgres-rehearsal.py`; tambahan: `scripts/gate-d-postgres-additional.py`.

Server dihentikan dengan pg_ctl fast -w pada kedua run sukses; server.log menyatakan database system is shut down; postmaster.pid tidak ada; pemeriksaan pg_ctl status sesudahnya menyatakan **no server running**. Probe socket Windows mengembalikan kode non-success10035 (sandbox sebelumnya10013), sehingga probe itu sendiri bukan bukti definitive no-listener; bukti shutdown menggunakan pg_ctl/log/PID. Runtime/data/log sintetis dipertahankan untuk review, tidak dibersihkan secara destruktif dan tidak dijalankan lagi otomatis.

## Perbedaan dan batas terhadap Supabase QA

- PostgreSQL lokal18.6 diketahui; versi, default privileges dan extensions QA tidak diperiksa pada task ini.
- Role sintetis NOLOGIN dan auth.users hanya id; tidak ada Supabase Auth gateway, JWT mapping, PostgREST, Trip Pass atau browser session. Test role langsung bukan E2E authorization cloud.
- Identitas project di SQL08 tetap attestation manual; setting URL dapat dimodifikasi admin dan tidak membuktikan asal server. Data directory/host/db guards membuat rehearsal lokal terikat cluster milik task ini, bukan perlindungan otomatis salah pilih project pada dashboard nanti.
- Recovery snapshot dan ownership/ACL/fingerprint QA harus diverifikasi lagi sebelum apply terpisah; jangan menganggap bukti lokal menggantikannya.
- Capability marker tetap dapat drift jika admin mengganti RPC sesudah deployment; pin fingerprints dan freeze writers/admin changes selama demo.
- Unknown usage/stale pending memang menghentikan global inference sampai investigasi owner; jangan menghapus pending agar demo berjalan.

## Readiness berikutnya

**SQL08 sekarang READY untuk review owner dan perencanaan deployment QA terpisah**, berdasarkan rehearsal PostgreSQL nyata yang lulus. Belum ada izin applyQA; jangan SQL06/reset. Sebelum apply: verifikasi QAproject, currentownerpostgres/ACL/search_path, baseline/fingerprints, writersdrained; terapkan proposal yang sudah direview sekali, lalu SQL09/readback/historyhash.

Gate D live tetap NO-GO: schema/owner-test entitlement QA belum tersedia berdasarkan pemeriksaan sebelumnya; promo-only billing coverage/expiry/hardstop belum lengkap; aktivasi backend dan satu inference memerlukan approval terpisah. UI QA offline isolation sudah diuji pada pekerjaan sebelumnya; tidak diulang tanpa perubahan UI.

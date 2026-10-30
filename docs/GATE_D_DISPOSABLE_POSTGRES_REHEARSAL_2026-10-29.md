# Gate D — pemeriksaan lingkungan rehearsal PostgreSQL

29 Oktober 2026. **BLOCKED sebelum provisioning/SQL.** Owner mengizinkan SQL hanya pada instance PostgreSQL lokal disposable baru berisi data sintetis, bukan QA/staging/production atau database existing.

## Pemeriksaan aktual

- SQL08 dan generator baseline/migration copy serta assertions/concurrency A/B dibaca ulang. Tidak dieksekusi.
- Get-Command tidak menemukan `psql`, `postgres`, `pg_ctl`, `initdb`, `docker`, atau `podman` pada PATH.
- `C:/Program Files/PostgreSQL` dan `C:/Program Files/Docker` tidak ada. Tidak ditemukan direktori PostgreSQL/Docker/Podman/Rancher pada pemeriksaan nama direktori Program Files.
- Bundel runtime native yang tersedia: git, jxrlib, libheif, poppler, powershell; tidak menyediakan server PostgreSQL.
- `@electric-sql/pglite` tidak tersedia di node_modules repository maupun bundel node runtime. PGlite sendiri juga tidak otomatis membuktikan dua koneksi PostgreSQL independen.
- `wsl.exe` tersedia sebagai launcher Windows, tetapi `wsl --list --quiet` menyatakan **Windows Subsystem for Linux is not installed**. Tidak memasang atau mengaktifkan WSL.

Ini pemeriksaan tool/path yang terarah, bukan klaim inventaris seluruh filesystem atau pembuktian bahwa tidak ada layanan database tersembunyi. Tidak perlu memakai database existing untuk mencari jalan pintas.

## Hasil tes

| Tahap | Status aktual |
| --- | --- |
| Review sumber SQL08/rehearsal | Dilakukan |
| Ketersediaan runtime terisolasi | BLOCKED — tool yang diperiksa tidak tersedia |
| Versi PostgreSQL | N/A, server belum dijalankan |
| Database sintetis baru | Belum dibuat |
| Syntax/migration guard/postflight/rollback SQL | NOT RUN |
| Duplicate/global pending/stale/unknown/replay/release | NOT RUN pada PostgreSQL |
| Dua koneksi/concurrency | NOT RUN |
| Role permissions/SECURITY DEFINER/search_path | NOT RUN pada PostgreSQL |
| Hash riwayat/alokasi setelah rollback | NOT RUN |

**SQL tests executed: 0. PASS: 0. FAIL: 0. Seluruh skenario PostgreSQL tertahan lingkungan.** Jangan mengartikan angka fail0 sebagai kelulusan. Tidak mengulang tes offline130PASS/build/browser6checks dari pekerjaan sebelumnya karena tidak ada kode yang diubah; hasil historis itu bukan bukti PostgreSQL nyata.

## Perbedaan terhadap Supabase QA

Belum ada database disposable untuk dibandingkan. Fixture yang disiapkan hanya memodelkan ledger/auth.users minimum, dua UUID sintetis, fungsi/ACL dan baseline0,35/7request; tidak mencakup Auth gateway, PostgREST, Supabase extensions/default privileges atau real RLS identities. Versi PostgreSQL QA tidak diperiksa ulang karena tidak ada koneksi QA yang diizinkan pada task ini.

## Readiness dan langkah berikut

SQL08 tetap **NOT READY untuk QA deployment**. Siap direview owner sebagai proposal, tetapi syntax, fingerprint canonicalization lintas versi PostgreSQL, ACL default, locking dan rollback belum mendapat bukti runtime.

Langkah yang diperlukan: sediakan runtime PostgreSQL native lokal terverifikasi (portable atau instalasi terisolasi) atau runtime container lokal yang siap. Instalasi/download/runtime baru perlu dibahas/disetujui terpisah; tidak dilakukan dalam pemeriksaan ini. Native PostgreSQL portable dapat menghindari aktivasi WSL/Docker dan harus memakai data directory baru serta endpoint localhost khusus tanpa memodifikasi cluster existing. Jangan kirim password atau credential. Setelah runtime tersedia, izin rehearsal disposable yang sudah diberikan tetap menjadi dasar; QA apply masih membutuhkan approval tersendiri.

Tidak ada SQL, koneksi database remote, Meta/supplier request, billing, credential change, deployment, Git branch/visibility change, commit atau push. Tidak membuat/menghapus database, memasang software atau menghentikan layanan existing. Berhenti sesuai instruksi owner ketika isolated PostgreSQL belum dapat diprovisikan dengan alat yang tersedia.

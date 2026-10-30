# Rehearsal SQL08 — berkas dan hasil aktual

Pembaruan 29 Oktober: rehearsal native PostgreSQL18.6 sudah dijalankan dengan izin owner pada cluster disposable baru; 55 pemeriksaan final PASS/0FAIL. Server sudah dihentikan. Bukti dan batas hasil: [laporan rehearsal](../../GATE_D_POSTGRES_REHEARSAL_RESULTS_2026-10-29.md). QA apply tetap memerlukan izin terpisah.

Petunjuk di bawah berlaku untuk PostgreSQL disposable **lokal** bernama `sorttrip_gate_d_rehearsal...`, owner postgres, tanpa data/credential production atau QA. Jangan memakai Supabase QA untuk fixture ini. Roles NOLOGIN juga bersifat cluster-wide: gunakan cluster disposable, bukan database tambahan pada cluster shared. Jangan mengulang rehearsal tanpa alasan/perubahan baru.

`node scripts/prepare-gate-d-rehearsal.mjs` hanya menghasilkan berkas:

- `artifacts/gate-d-rehearsal/00_synthetic_baseline.sql`: schema minimum dengan dua UUID sintetis, tujuh request settled, allocated0,35/blockedfalse, satu historical2305.
- `01_rehearsal_migration.sql`: copy proposal dengan attestation terisi **khusus rehearsal**, didahului penolakan database selain disposable. File proposal asli tetap UNVERIFIED; jangan deploy copy rehearsal.

Setelah approval SQL, owner menyiapkan cluster/database disposable dan menjalankan psql dengan host localhost dan database eksplisit, `-X -v ON_ERROR_STOP=1`. Jangan masukkan password di command line atau laporan. Jalankan baseline, lalu migration copy, kemudian `docs/staging-proposal/rehearsal/02_assertions.sql`. Fixture lama memuat source budget asli; jika fingerprint berbeda pada versi PostgreSQL lokal, STOP dan bandingkan definisi privat, jangan otomatis mengganti pin/hash untuk membuat tes lolos.

Expected assertions: reserve pertama true, stale pending lintas akun false, unknown usage okfalse, settle valid true, replay over-limit okfalse tanpa reblock, duplicate false. Semuanya ROLLBACK.

Concurrency: buka dua koneksi psql independen. Jalankan `03_connection_a.sql`; selama sleep20detik jalankan `04_connection_b.sql`. B harus mengeluarkan NOTICE PASS lock_not_available setelah timeout1detik. NO_OVERLAP adalah kegagalan tes, bukan pass. A/B berakhir ROLLBACK; verifikasi kembali0,35/false/7/0. Ini tidak memanggil Meta. Jangan menjalankan script A/B pada QA/production.

Negative rehearsal, masing-masing memakai fixture disposable baru: proposal asli dengan UNVERIFIED harus gagal; configured project URL salah harus gagal; allocated0,40 atau pending tambahan harus gagal; perubahan body/hash RPC harus gagal; owner bukan postgres, grant PUBLIC/auth/service WITH GRANT OPTION atau search_path berubah harus gagal. Tidak ada definisi/hash/data yang boleh berubah ketika migrasi gagal. Jalankan kembali fixture baru untuk postflight positif dan baca SQL09. Rekam hasil aktual, bukan sekadar file tersedia.

Sebelum QA apply: owner verifikasi dashboard/projectref; current owner/grants/search_path/fingerprint/snapshot harus sesuai pins. Guard configured_url hanya memberi bukti tambahan bila setting tersedia, bukan identitas yang kebal terhadap manipulasi admin. Jangan menandai manual attestation benar tanpa verifikasi dashboard.

Rollback: simpan definisi dan ACL sebelumnya secara privat sebelum apply, semua writers off. Error sebelum COMMIT: ROLLBACK dan STOP tanpa retry. Setelah COMMIT, restorasi fungsi/ACL/status capability membutuhkan transaksi dan approval terpisah; pertahankan inference off karena definisi lama lebih lemah. Jangan menghapus status function tanpa memperhitungkan dependency; kembalikan ke baseline reviewed dan hapus/ubah capability hanya sesuai versi rollback yang disetujui. Jangan menurunkan safety worker agar memakai guard lama. Ledger/history/budget tidak diubah oleh rollback.

SQL09 memeriksa snapshot, hash fungsi, ownership, ACL efektif dan RLS. Bandingkan dengan baseline dan rekam fingerprint baru setelah apply. Postflight dalam SQL08 sendiri memeriksa hash seluruh data ledger/request tidak berubah dan hak owner/service/anon/auth, grant option serta search_path sebelum COMMIT. Tidak ada grant entitlement atau perubahan RLS di SQL08.

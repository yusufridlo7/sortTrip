# Persiapan pemulihan aman ledger Meta QA

**Tanggal:** 28 Oktober 2026, Asia/Jakarta  
**Lingkup:** persiapan saja; source, bundle lokal dan snapshot database yang diberikan owner.  
**Status:** usulan selesai; **STOP sebelum eksekusi**. Keamanan runtime/deployed belum sepenuhnya terbukti.

## 1. Penilaian penyebab

Snapshot terbaru owner menyatakan ledger QA diblokir dengan alokasi USD0,35, sisa USD9,65, tujuh request global, nol unsettled dan rekonsiliasi benar. Satu output mencapai2.305 token. Ini menegaskan HTTP429 `BUDGET_EXHAUSTED` berasal dari penolakan ledger sebelum panggilan Meta, bukan bukti kredit Meta habis.

Penyebab paling mungkin tetap konfigurasi discovery historis4.000 yang melampaui guard settlement2.000. Source membuktikan mekanismenya; snapshot belum membuktikan request tersebut merupakan penulis pertama flag blokir. Guard lain adalah input>20.000 atau estimasi biaya>USD0,05. **Body deployed belum diverifikasi penuh**. Fingerprint/predicate yang sebelumnya diberikan owner tidak menggantikan peninjauan seluruh definisi dan kronologi.

## 2. Verifikasi jalur dan build

| Jalur/berkas | Hasil inspeksi lokal |
|---|---|
| `worker/video-itinerary.js:11,26,32,38,43` | `extractMetaText`: payload bersama maksimum2.000; payload yang sama untuk token-count dan satu inferensi; tanpa retry |
| `worker/video-itinerary.js:108,116,119` | Frame video, linked transcript dan transcript memakai fungsi bersama tersebut |
| `worker/assistant-discovery.js:2,8` | Discovery memakai `extractMetaText`, termasuk preview QA; tidak ada cap4.000 tersendiri |
| `artifacts/staging-worker.mjs:777,780` | Bundle staging yang sudah ada memuat `max_output_tokens:2e3` dan instruksi discovery2.000; tidak ada override Meta4.000 |
| `worker/staging.js:22–28` | Route terbatas; discovery membutuhkan generation/text/budget-ready; video route tidak diekspos staging |
| `supabase/meta-video-budget.sql:30–51` | Reserve USD0,05; tiga guard settlement; blokir terjadi sebelum pengecekan request unsettled |

Pemindaian seluruh source Worker menemukan satu implementasi inferensi Meta. Metadata/status bukan inferensi. Raw MP4 container-only tidak melakukan inferensi. Angka output lebih besar pada modul itinerary/terjemahan OpenAI yang ikut terbundle bukan override Meta; route tersebut tidak dibuka router staging.

Pemeriksaan statis offline terhadap source dan bagian Meta pada bundle **lulus**: satu deklarasi cap2.000, tanpa override4.000. Ini memverifikasi isi artefak lokal yang diperiksa, bukan kesetaraan seluruh bundle dengan source, versi server yang masih berjalan, atau layanan deployed. Tidak melakukan rebuild, tes jaringan atau inferensi. Staging tetap belum deploy; flag generasi pada konfigurasi staging tetap false.

## 3. SQL usulan

[SQL06 — NOT APPROVED — DO NOT EXECUTE](../docs/staging-proposal/sql/06_PROPOSED_SAFE_LEDGER_RECOVERY.sql)

SQL ini bukan migrasi dan tidak dimasukkan ke alur otomatis. Gate project-ref `UNVERIFIED` dan empat persetujuan/attestation false membuat eksekusi tidak sengaja berhenti sebelum write. Identitas proyek tetap wajib diperiksa **manual** di dashboard QA `aytrcvfncsklhqozreyk`; SQL tidak dapat membuktikan project-ref. Production `tznxfgosmjcmwoszvkdk` dilarang.

Transaksi mengunci kedua tabel ledger dengan `EXCLUSIVE NOWAIT`, lalu baris budget dengan `FOR UPDATE`; aktivitas yang berkonflik menyebabkan abort. Sebelum write, diwajibkan satu baris budget, blocked=true, alokasi0,35, tujuh request, nol unsettled, rekonsiliasi count×0,05 benar, satu output>2.000 dan maksimum2.305. Pelanggaran biaya/input lain atau trigger tambahan menyebabkan stop. Signature/fingerprint RPC harus sama dengan snapshot owner; kesamaan hash tetap membutuhkan review semantik privat.

Satu-satunya write usulan mengubah `blocked` ke false. Jumlah baris yang berubah harus satu. Digest seluruh record request sebelum/sesudah diperiksa secara internal tanpa ditampilkan; alokasi dan baris budget diperiksa ulang. Tidak ada perubahan request, token, timestamp, schema, izin, RLS, Trip Pass, pembayaran, credential atau batas anggaran. Error membatalkan transaksi; jangan retry otomatis.

## 4. Risiko dan prasyarat wajib

- **Worker aktif/panggilan terlambat belum dapat disingkirkan.** Owner harus menghentikan dan menguras semua writer QA: server lokal lama, Worker lain, job, tab QA dan perubahan admin. Nol unsettled hanyalah snapshot; tidak menyingkirkan RPC yang belum tiba atau settlement ulang. Lock hanya melindungi transaksi, bukan periode setelah commit.
- Settlement source dapat memblokir untuk ID lama/tidak ada karena setter berjalan sebelum update request. Baris historis2.305 sendiri **tidak** otomatis memblokir ulang; replay settlement-nya bisa. Jangan hapus, clamp atau re-settle baris tersebut. Log `settlementRecorded=true` juga belum menjamin RPC `ok=true`.
- Owner perlu membandingkan body deployed reserve/settle secara privat dengan source. Hash yang dipin SQL06 adalah reserve `2f5b3af8ada27fe6076cea1e91a7ee33` dan settle `32847c39624929a29a3db9db0947b713`; perubahan apa pun berarti stop/review, bukan menghapus gate. Pastikan tidak ada penulis/trigger lain.
- Usage NULL perlu direkonsiliasi sebagai probe atau penggunaan tidak diketahui; tidak dianggap biaya nol. Alokasi bukan tagihan provider. Verifikasi runtime cap2.000 pada semua writer; source lokal saja belum mencukupi.

**Rekomendasi sekarang: jangan jalankan pemulihan.** Body deployed, penghentian writer dan runtime belum terbukti. Jangan mengubah gate atau code/guard agar pemeriksaan lolos.

## 5. State yang diharapkan dan verifikasi tanpa biaya

| Nilai | Sesudah pemulihan yang kelak disetujui |
|---|---|
| blocked | false |
| allocated / remaining | USD0,35 / USD9,65 |
| requests / unsettled | 7 / 0 |
| over-output / maksimum output | 1 / 2.305, tetap tersimpan |
| rekonsiliasi alokasi | true |
| budget / reservasi / guard output-input | USD10 / USD0,05 / 2.000–20.000, tetap |

Bagian akhir SQL06 menyediakan transaksi `READ ONLY` terpisah dengan `expected_post_recovery_state`. Owner dapat menjalankan **hanya bagian SELECT tersebut** setelah persetujuan pemeriksaan baca; sebelum pemulihan nilai expected akan false karena blocked masih true. Setelah pemulihan, bandingkan semua nilai dengan snapshot sebelum perubahan, tetap dengan writer berhenti. Ini tidak membuktikan E2E Meta; tidak memanggil reserve, settle atau model dan tidak mengonsumsi alokasi baru.

Sebelum commit, error harus diikuti `ROLLBACK` lalu stop. Setelah commit, `ROLLBACK` tidak dapat membatalkan perubahan yang sudah disimpan. Bila state berbeda atau blokir berulang, hentikan seluruh AI QA dan simpan bukti. Reblock hanya boleh melalui usulan flag-only dan persetujuan baru; jangan reset/refund/hapus riwayat atau melakukan loop unblock.

## 6. Persetujuan owner yang masih diperlukan

1. Review proposal dan izinkan pengumpulan bukti hanya-baca serta penghentian/drain writer QA; owner menangani SQL sesuai AGENTS.md dan tidak membagikan secret.
2. **Setelah bukti aman lengkap**, persetujuan eksplisit atas versi final SQL06, proyek QA dan perubahan flag satu kali; owner yang mengoperasikannya. Permintaan persiapan ini bukan izin eksekusi.
3. Mengaktifkan writer/generasi dan melakukan inferensi Meta nyata memerlukan izin terpisah setelah verifikasi. SQL02/03 entitlement, deployment dan Phase3 tidak termasuk pemulihan ini.

## Pengujian dan status publikasi

Pemeriksaan source/bundle dan inspeksi statis SQL dilakukan lokal; SQL **belum dieksekusi atau diuji parser/PostgreSQL**. Tidak ada database/network/provider call, tambahan biaya Meta, perubahan kode aplikasi/schema/record, batas/credential, deploy, commit atau push. Dokumentasi progres diperbarui; laporan audit sebelumnya tetap dipertahankan.

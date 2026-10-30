# Verifikasi keselamatan akhir ledger Meta QA

**Tanggal:** 28 Oktober 2026, Asia/Jakarta  
**Status akhir: NOT READY.** Audit hanya-baca; bukan persetujuan pemulihan.

## 1. Kesimpulan dan bukti

**Penulis QA lokal masih aktif.** Metadata Windows pada12:53:24 WIB menemukan `workerd` PID30140 mendengarkan127.0.0.1:8790 dan `node` PID25536 pada127.0.0.1:5174. GET hanya-baca `/api/meta-qa/status` mengembalikan `environment=meta-qa-local`, proyek `aytrcvfncsklhqozreyk`, `analysisEnabled=true`, `framesEnabled=true`, dan `budgetMarkedReady=true`. Tidak ada layanan dihentikan. Flag aktif membuktikan jalur diaktifkan, bukan keberhasilan credential, otorisasi, reserve atau inferensi.

Snapshot database terakhir **dari owner**, bukan pemeriksaan live audit ini: blocked, alokasiUSD0,35/sisaUSD9,65, tujuh request, nol unsettled, satu output2.305 dan rekonsiliasi benar. Ini tidak membuktikan tidak ada panggilan tertunda di luar database. Fungsi deployed, ACL, trigger, job, remote writer dan versi runtime aktif belum sepenuhnya terbukti.

Kondisi yang terverifikasi aman pada lingkup lokal: cap Meta source/bundle2.000, gate SQL06 tetap empat false/projectUNVERIFIED, konfigurasi staging generasi false, dan tidak ada recovery dijalankan. Hipotesis penyebab historis tetap mismatch discovery4.000/guard2.000; bukan atribusi kausal yang sudah terbukti.

## 2. Inventaris penulis ledger

Status berikut adalah snapshot, bukan jaminan proses tetap sama setelah audit. PID tidak boleh dipakai untuk penghentian tanpa memeriksa ulang identitas proses. **Tindakan stop/disable di tabel adalah instruksi usulan untuk owner setelah persetujuan, bukan tindakan audit ini.**

| Komponen dan lokasi | Kemampuan menulis | Status | Stop/disable oleh owner dan verifikasi tanpa Meta |
|---|---|---|---|
| Meta QA Worker: `worker/meta-qa.js:21–23`; facade `worker/meta-video-budget.js:9–10`; `scripts/run-meta-qa.mjs:10` | Video/frame/transcript, discovery biasa dan preview memanggil reserve/settle melalui adapter. Preview tidak menghindari ledger dolar | **CONFIRMED RUNNING** port8790; flags aktif | Ctrl+C pada terminal launcher QA yang benar; pastikan child workerd juga berhenti. Cek port8790 tidak lagi listen dan GET status tidak lagi tersedia. Jangan hentikan seluruh proses node |
| Probe HTTP `worker/meta-qa.js:16`, `worker/meta-qa-budget.js:40–44` | Mode allocate memesanUSD0,05 dan settle usageNULL tanpa Meta; **tetap writer**. Mode read-status hanya membaca ledger | Handler tersedia di Worker lokal aktif; eksekusi/pending **UNKNOWN** | Stop Worker yang sama; jangan menekan probe untuk verifikasi. Periksa agregat DB hanya-baca dan aktivitas setelah writer berhenti |
| Frontend Vite QA `vite.meta-qa.config.js:10`, UI Assistant/video/QA | Bukan penulis langsung; browser memicu endpoint writer8790 | **CONFIRMED RUNNING** port5174. Tab/panggilan pending **UNKNOWN** | Tutup/hentikan aksi tab QA dan terminal Vite bila disetujui; cek port5174. Mematikan frontend saja tidak menghentikan backend |
| Staging `worker/staging.js:22–28`, `wrangler.staging.jsonc:18–22` | Discovery berotorisasi dapat reserve/settle bila tiga gate aktif; default konfigurasi mematikannya | Persiapan lokal, belum deploy menurut catatan proyek; proses/remote aktual **UNKNOWN** | Owner inventaris Worker staging/QA di dashboard. Pertahankan gate off dan hentikan ingress setelah izin. Tidak menyimpulkan remote stopped dari source |
| Worker generik `worker/index.js:97–98`; `wrangler.jsonc:4`, `wrangler.hotel-browser.jsonc:4` | Mengandung route Meta bersama; setiap salinan yang memakai bindingQA/flag sesuai bisa menulis QA | Salinan lokal/remote lain serta binding aktual **UNKNOWN** | Periksa hanya clone/resource QA secara privat; hentikan QA instance setelah izin. Production bukan target stop/perubahan. Tidak ditemukan listener8787 pada snapshot port terpilih; ini tidak membuktikan semua salinan berhenti |
| Cron source `worker/index.js:91` dan `wrangler.jsonc:30` | Scheduled handler saat ini hanya refresh rekomendasi/Price Watch/support; tidak ditemukan jalur ledger Meta pada pekerjaan itu | Source bukan writer Meta yang ditemukan; jadwal deployed/perubahan lain **UNKNOWN** | Owner memeriksa jadwal QA/clone di dashboard tanpa menjalankan job. Jangan mengubah cron production |
| SQL source `supabase/meta-video-budget.sql:14,30–51` | Instalasi dapat insert baris budget; fungsi reserve insert request/naikkan alokasi; settle update request/blokir | Source ada; penggunaan admin/RPC eksternal **UNKNOWN** | Jangan menjalankan/mengulang migrasi; hentikan admin writer yang teridentifikasi. Cocokkan fungsi deployed dan snapshot baca |
| Probe SQL `supabase/meta-video-budget-probe.sql:27–54`; concurrencyB`:28`; concurrencyA`:7` | Probe menulis langsung dan lewat RPC dalam subtransaksi rollback; B reserve sementara; A mengunci row. Tetap bukan uji hanya-baca | Eksekusi SQL lain **UNKNOWN**; tidak dijalankan audit | Owner membatalkan transaksi/probe QA yang teridentifikasi melalui dashboard; jangan mengeksekusi probe lagi. Verifikasi transaksi/lock dan snapshot baca; rollback bawaan tidak berarti tidak pernah menulis |
| SQL06`:48–113` | Usulan langsung mengubah flag dan mengunci tabel; tidak berjalan otomatis. SQL03 hanya membaca/mengunci ledger saat grant entitlement lain | SQL06 **NOT EXECUTED dalam audit ini**; sesi owner lain **UNKNOWN** | Biarkan gate false, jangan jalankan; review editor/job admin. SQL01/04/05/07 dan diagnosis SELECT lain bukan writer ledger |
| Otomasi/background/test | `scripts/agent/runner.mjs:1–24` bawaan hanya GET health; tes Meta memakai fixture/fetcher/ledger mock. Tidak ditemukan caller ledger tambahan pada skrip yang dipindai | Proses/background lain **UNKNOWN**; fixture bukan bukti DB | Task Scheduler scan nama SortTrip/meta.qa tidak menemukan task cocok; nama lain/host lain tidak tersingkirkan. Owner periksa scheduler/CI/admin yang bisa HTTP/RPC, tanpa menjalankannya |

Ditemukan13proses node/workerd pada snapshot; hanya dua port di atas yang terpetakan QA. Argumen proses, environment, cookie, token dan log sensitif tidak dibaca. Inventaris lokal tidak dapat menyingkirkan cron Supabase, job HTTP generik, CI, akun admin atau host lain.

## 3. Fungsi deployed, otorisasi dan reblocking

Source `supabase/meta-video-budget.sql:48–51` memblokir bila biaya>USD0,05 **atau** input>20.000 **atau** output>2.000. Setter berjalan **sebelum** update request yang memeriksa ID/unsettled. Settlement ulang/terlambat dengan2.305 output, bahkan ID tidak ada, dapat menyetel blokir lalu menghasilkan `ok=false`. Baris historis yang tersimpan sendiri tidak otomatis menjalankan settlement. Worker`:64–68` belum menguji body `ok` untuk indikator log settlement.

Expected fingerprints dari owner: reserve`2f5b3af8ada27fe6076cea1e91a7ee33`, settle`32847c39624929a29a3db9db0947b713`. **Belum dibaca ulang dari QA; full body deployed belum tersedia bagi audit.** Tidak bisa menyatakan sama dengan source hanya dari hash yang dilaporkan sebelumnya.

Source memakai SECURITY DEFINER dan search_path public,pg_temp; hak eksekusi PUBLIC/anon/authenticated dicabut, service_role diberiEXECUTE. Definer dapat beroperasi dengan hak pemilik; RLS saja bukan pengaman RPC. Worker melakukan autentikasi user, sedangkan RPC service-only tidak membuktikan kepemilikan `p_user` sendiri. ACL, pemilik, RLS dan hakCREATE pada schema perlu diverifikasi live, tanpa mengubahnya. Fingerprint definisi tidak mencakup seluruh perubahan ACL/pemilik/tabel/job.

Disiapkan [SQL07 hanya-baca untuk review privat](../docs/staging-proposal/sql/07_READ_ONLY_FINAL_SAFETY_REVIEW.sql), **belum dijalankan**: agregat ledger; signature/fingerprint/body RPC; SECURITY DEFINER/search_path; privilege; RLS; kandidat fungsi/prosedur berbasis referensi teks; trigger/rule; agregat aktivitas dan keberadaan cron catalog. Bagian cron opsional sengaja dikomentari agar proyek tanpa pg_cron tidak gagal. Pemindaian teks/aktivitas sesaat tidak membuktikan tidak ada indirect/dynamic/external writer. Body fungsi harus ditinjau owner secara privat; jangan kirim raw body atau secret.

## 4. Status batas output menurut lapisan

| Lapisan | Hasil |
|---|---|
| Source lokal | **VERIFIED2.000**: satu payload `worker/video-itinerary.js:26`; discovery`:32`, frame`:108`, linked transcript`:116`, transcript`:119` memakai fungsi bersama; tanpa override4.000 |
| Bundle Worker staging lokal yang sudah ada | **VERIFIED2.000** pada `artifacts/staging-worker.mjs:777,780`; satu deklarasi cap dalam bagian Meta. Tidak rebuild |
| Runtime QA lokal aktif | **UNKNOWN untuk payload cap**. Status hanya mengungkap flag/proyek, bukan payload/model build. Source lokal tidak membuktikan bundle termuat/hot-reload runtime |
| QA deployed remote | **UNKNOWN**: tidak mengakses deployment/konfigurasi remote |
| Staging deployed | Tidak ada deployment menurut catatan proyek; **UNKNOWN dari verifikasi remote saat ini**. Jangan menyebut cap deployed terverifikasi |

Meta itinerary/discovery yang ditemukan memakai fungsi bersama. Angka lebih besar dalam modul itinerary/terjemahan OpenAI yang ikut terbundle bukan cap Meta; route lama tersebut tidak dibuka staging. Tidak dilakukan panggilan inferensi untuk membuktikan runtime.

## 5. Review statis SQL06

**Bagian yang baik:** transaksi eksplisit; lock kedua tabel EXCLUSIVE NOWAIT lalu rowFOR UPDATE; snapshot/accounting dan guard overrun; pin dua fingerprint; pemeriksaan trigger; write hanya flag; digest riwayat sebelum/sesudah; exception membatalkan transaksi; postcheck terpisahREAD ONLY. `DO`/`END;`, SET LOCAL, GET DIAGNOSTICS dan penggunaan catalog tampak konsisten secara statis. **Belum diuji parser/server PostgreSQL**; tidak ada klaim SQL runtime lulus.

**Keterbatasan/isu keselamatan yang harus direview, tanpa koreksi pada audit ini:**

1. Project-ref dan empat gate adalah attestation yang bisa diedit, bukan pembuktian proyek atau drain writer. Lock melepaskan perlindungan saat commit; panggilan terlambat dapat menulis lagi.
2. Pin fingerprint tidak memeriksa ACL/pemilik/hak schema, rewrite rule atau job. Pemeriksaan trigger tidak menggantikan semua pemeriksaan tersebut. Jika SQL07 menemukan drift/candidate yang belum dijelaskan, **STOP**, jangan menghapus gate agar lolos. Pertimbangkan proposal pemeriksaan tambahan setelah izin koreksi.
3. NOWAIT menolak konflik lock yang ada; tidak membuktikan tidak ada request jaringan yang belum sampai. Default isolation tidak ditetapkan eksplisit di BEGIN; owner perlu memeriksa konfigurasi sesi/server. Timeout/deadlock/serialization error berarti rollback dan stop, bukan retry. Jangan mengubah proposal tanpa izin.
4. Function tidak ada/overload berbeda bisa menghasilkan error PostgreSQL lebih awal dari pesan custom; tetap abort aman. Runner/editor harus menghentikan batch pada error, bukan menganggap SELECT sesudahnya sebagai sukses recovery.
5. Postcheck tidak melempar exception bila hasil salah atau nol baris; owner wajib memerlukan **tepat satu baris, semua nilai cocok, expected=true**. COMMIT pertama sudah persisten; transaksi verifikasi sesudahnya tidak bisa membatalkannya.
6. Digest request memeriksa snapshot sebelum/sesudah write; bukan autentikasi terhadap arsip request historis yang disetujui. Angka snapshot/fingerprint saja tidak membuktikan seluruh isi tujuh request belum berubah sebelum transaksi. NULL usage membutuhkan rekonsiliasi owner.

Tidak ditemukan kesalahan sintaks yang dapat dipastikan hanya lewat inspeksi ini. SQL06 **tidak diubah**, termasuk gate false. SHA256 saat audit:`1600cd4976c8d8ce165769e7406888c4efc69831748afe844b95242b0d3edb37`.

## 6. Checklist owner dan keputusan

1. Tinjau laporan dan beri izin terpisah untuk menghentikan/drain writer QA yang teridentifikasi. Jangan mengubah production atau menghentikan semua node. Periksa ulang PID/terminal sebelum tindakan.
2. Hentikan ingress/pengujian dari frontend dan backend QA yang benar; inventaris seluruh QA Worker/host/job/admin. Pastikan tidak ada pending request/settlement. Verifikasi proses/port tanpa Meta; ambil snapshot agregat DB berulang setelah tidak ada aktivitas, sambil menyadari snapshot bukan bukti drain sendirian.
3. Pada dashboard proyekQA yang benar, review/jalankan SQL07 sendiri. Bandingkan full body keduaRPC secara privat; konfirmasi secara non-sensitive apakah cocok, hak klien tetap ditolak, serta semua kandidat writer/trigger/rule/job sudah dijelaskan. Jangan bagikan body/log/credential/ID privat.
4. Verifikasi artefak/version yang dimuat seluruh runtime QA tanpa inferensi. Bila dibutuhkan restart/rebuild/deploy untuk membuktikannya, minta izin terpisah; audit ini tidak melakukannya.
5. Selesaikan temuan SQL06; setiap koreksi perlu persetujuan sebelum diimplementasikan. Baru setelah bukti lengkap, minta persetujuan eksplisit atas versi final recovery dan eksekusi oleh owner. Izin recovery bukan izin entitlement/deployment/inferensi.

**NOT READY:** backend QA masih aktif dan enabled; drain, fungsi deployed/permissions, writer remote serta runtime cap belum terbukti. SQL06 jangan dijalankan, termasuk dalam transaksi rollback. Tidak ada reserve/settle, SQL database, inferensi, biaya baru, penghentian layanan, perubahan aplikasi/credential/limit, deploy, commit/push atau Phase3. Bukti baru hanya metadata lokal, GET status non-writing dan pemeriksaan statis; bukan E2E. Audit berhenti untuk review owner.

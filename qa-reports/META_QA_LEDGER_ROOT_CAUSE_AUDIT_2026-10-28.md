# Audit akar masalah ledger Meta QA

**Tanggal:** 28 Oktober 2026, Asia/Jakarta  
**Lingkup:** audit source lokal dan hasil SQL yang diberikan owner; tanpa implementasi/pemulihan.  
**Lingkungan:** QA `aytrcvfncsklhqozreyk`; production `tznxfgosmjcmwoszvkdk` tidak disentuh.  
**Status:** audit selesai; penyebab historis paling mungkin ditemukan, belum terbukti secara kausal.

## 1. Temuan terkonfirmasi

Hasil SQL01 owner menunjukkan `blocked=true`, alokasi USD0,35, sisa USD9,65, tujuh alokasi owner, nol pending terbaru dan nol unsettled owner. Satu respons memiliki output 2.305 token. Kondisi penolakan pertama adalah **LEDGER_BLOCKED**. Dengan snapshot ini, batas uang USD10 dan batas sepuluh request owner bukan kondisi yang sedang menolak reservasi. Ini bukan bukti tagihan/kredit Meta bermasalah.

Source `reserve_meta_video_test` hanya mengambil baris budget yang tidak diblokir. Penolakan reservasi diterjemahkan Worker menjadi HTTP429 `BUDGET_EXHAUSTED` **sebelum** token-count dan inferensi Meta. Kode yang sama dapat mewakili penolakan cap uang, konkurensi, atau jumlah request; hasil SQL owner memperjelas alasan snapshot sekarang. HTTP429 provider dan rate limiter memakai kode `RATE_LIMITED` yang berbeda.

Pada source settlement, salah satu kondisi berikut cukup menyetel blokir global: estimasi biaya >USD0,05, input >20.000 token, atau output >2.000 token. Jadi 2.305 output token **cukup menurut source**, termasuk bila hasil gagal validasi setelah provider memberi usage.

Fingerprint deployed yang diberikan owner: reserve `2f5b3af8ada27fe6076cea1e91a7ee33`, settle `32847c39624929a29a3db9db0947b713`. Predicate output guard terdeteksi. **Body deployed belum diverifikasi penuh**; hash dan substring tidak membuktikan seluruh semantik maupun urutan kejadian.

## 2. Penyebab paling mungkin dan keyakinan

Hipotesis utama: konfigurasi discovery historis mengizinkan 4.000 output token, respons melewati guard 2.000, lalu settlement memblokir reservasi berikutnya. Ketidakcocokan ini dicatat audit staging sebelumnya, dan 2.305 token konsisten dengan mekanismenya.

Keyakinan **tinggi terhadap mekanisme source**, **menengah terhadap penyebab insiden historis**. Tidak ada waktu/alasan blokir tersimpan pada tabel budget, body deployed belum lengkap, dan belum ada korelasi waktu settlement terhadap penolakan pertama. Jangan menyatakan respons 2.305 sebagai penyebab yang sudah terbukti.

## 3. Jalur lain dan risiko tambahan

- Request lain, termasuk pengguna QA lain, bisa melewati guard biaya/input/output yang sama. Data owner belum mencakup seluruh ledger.
- Settlement source menyetel blokir **sebelum** memeriksa apakah ID request ada dan belum settled. Pemanggilan ulang request lama atau ID yang tidak ada dapat memblokir ledger meskipun update request menghasilkan `ok=false`. Ini risiko source, belum bukti kejadian.
- Adapter mengembalikan body RPC, tetapi pemanggil hanya memeriksa exception. Log `settlementRecorded=true` tidak membuktikan RPC mengembalikan `ok=true`.
- Probe anggaran sengaja memanggil settlement dengan nilai melewati tiga guard. Skrip lengkap merollback subtransaksi; penggunaan normalnya tidak menjelaskan blokir permanen. Eksekusi parsial/modifikasi, SQL manual, trigger atau fungsi deployed lain belum dapat disingkirkan.
- Pencarian source terkait menemukan satu setter eksplisit ledger ini, di settlement; jalur pemanggilnya mencakup Worker dan probe. Variabel `blocked` pada transport browser tidak terkait ledger. Ini bukan inventaris seluruh penulis database deployed.

## 4. Berkas/fungsi dan kompatibilitas kontrak

Referensi berikut menunjuk source lokal saat audit, bukan jaminan versi runtime yang sedang berjalan.

| Berkas dan baris | Peran |
|---|---|
| `supabase/meta-video-budget.sql:30–40` | Reserve: lock, blokir, cap uang, pending, sepuluh request; alokasi USD0,05 |
| `supabase/meta-video-budget.sql:43–52` | Settle: tiga guard; setter blokir baris49 sebelum update request baris51 |
| `worker/meta-video-budget.js:9–10` | RPC reserve/settle; usage null jika tidak diketahui; tidak mengurangi alokasi |
| `worker/video-itinerary.js:20–26` | Reserve sebelum egress; HTTP429; payload `max_output_tokens:2000` |
| `worker/video-itinerary.js:32–47` | Discovery memakai cap sama; token-count dan provider; penggunaan token |
| `worker/video-itinerary.js:64–68` | Settlement dan keterbatasan indikator log |
| `supabase/meta-video-budget-probe.sql:51–59` | Pemicu guard dalam probe yang kemudian rollback |
| `docs/staging-proposal/OWNER_ACCESSIBLE_STAGING_AUDIT_2026-10-28.md:41` | Catatan historis konfigurasi discovery4.000/guard2.000 |
| `worker/staging.js:22–28` | Daftar route terbatas dan generation gate |
| `wrangler.staging.jsonc:13–22` | QA tetap; identitas belum dikonfigurasi; generation/text/frames/budget-ready false |

Discovery, transcript dan frame Meta berbagi `extractMetaText` dan batas **2.000** saat ini; tidak ditemukan override Meta >2.000 pada source aktif yang diperiksa. Raw MP4 container-only tidak melakukan inferensi. Tes `checks/video-itinerary.test.mjs:36` dan tes staging memeriksa payload memakai fixture; bukan bukti live.

Path itinerary lama masih memiliki angka lebih besar: `worker/ai-draft.js:9,18,20` (3.500/10.000), `worker/price-research.js:77,79` (4.500/3.500), dan `worker/narrative-translation.js:25` (12.000). Ini jalur **OpenAI**, bukan ledger Meta; panggilan itinerary ada di `worker/itinerary.js:78–84`. Router staging tidak membuka route itinerary/terjemahan lama. Batas lokal yang telah diselaraskan belum membuktikan bundle runtime lama sudah diganti. Audit ini tidak mengubahnya.

## 5. Bukti yang masih diperlukan

Disiapkan [SQL05 hanya-baca](../docs/staging-proposal/sql/05_READ_ONLY_LEDGER_ROOT_CAUSE.sql), **belum dijalankan**. Owner perlu memastikan proyek QA di dashboard sebelum menjalankan. Hasil tidak memuat ID akun/request, prompt atau credential.

SQL05 memeriksa snapshot global: jumlah request, unsettled, usage tidak diketahui, pelanggaran masing-masing guard, rekonsiliasi jumlah request ×USD0,05 terhadap alokasi, timestamp baris pelanggaran, fingerprint/signature fungsi, dan trigger tabel. Tujuh ×USD0,05=USD0,35 konsisten dengan data owner, tetapi rekonsiliasi global tetap diperlukan. NULL usage tidak berarti biaya nol. Estimasi biaya bukan tagihan provider.

Owner juga perlu meninjau definisi deployed kedua fungsi secara privat pada dashboard, membandingkan urutan guard/update dan seluruh kondisi dengan source di atas. Jangan mengirim credential atau body yang memuat secret. Fingerprint saja tidak cukup. Jika tersedia, korelasikan timestamp usage dengan log accounting yang sudah disanitasi dan penolakan pertama; tanpa riwayat blokir, atribusi historis mungkin tetap tidak dapat dipastikan.

## 6. Usulan pemulihan minimum — belum disetujui

1. Selesaikan bukti hanya-baca tersebut. Pertahankan blokir selama ada ketidakjelasan.
2. Setelah persetujuan terpisah, hentikan semua jalur penulis/inferensi QA, termasuk server Meta-QA lokal lama, dan pastikan tidak ada request/settlement terlambat. Flag staging false saja tidak menghentikan penulis lain.
3. Verifikasi seluruh runtime Meta memakai2.000 dan deployed settlement sesuai kontrak. Pertahankan USD10, USD0,05, input20.000, sepuluh alokasi/user, RLS dan tanpa retry. Jangan menaikkan guard atau mengganti akun untuk menghindarinya.
4. Rekonsiliasi seluruh request/alokasi dan review baris2.305. **Simpan usage aktual dan riwayatnya**; jangan clamp ke2.000, hapus request, refund/reset alokasi atau mengulang settlement lama. Baris over-limit tidak perlu diubah untuk pemulihan flag, tetapi perlu penjelasan penyebabnya.
5. Bila semua prasyarat terbukti dan owner menyetujui pemulihan, perubahan minimum dapat berupa update manual hanya pada flag blokir dengan pengecekan state yang masih cocok dalam transaksi. Alokasi tetap USD0,35 bila snapshot belum berubah. Diperlukan SQL korektif terpisah untuk review owner; **tidak disediakan atau dieksekusi pada audit ini**. Tidak ada unblock otomatis/TTL.
6. Verifikasi tanpa biaya melalui SELECT: flag, alokasi, count dan unsettled; cocokkan dengan sebelum perubahan. Verifikasi source/bundle cap secara lokal. Jangan menjalankan reserve/settle probe atau inferensi untuk pemeriksaan ini. Uji Meta nyata tetap memerlukan persetujuan tersendiri.

Hentikan pemulihan jika ada writer aktif, unsettled global, akuntansi tidak cocok, runtime cap tidak terverifikasi, guard/fungsi deployed berbeda, atau pelanggaran belum dapat dijelaskan. Jika setelah pemulihan terjadi blokir ulang, hentikan AI dan tinjau; jangan loop unblock. Rencana rollback owner adalah mengunci inferensi kembali dan, bila disetujui, memblokir ledger tanpa mengubah riwayat/alokasi.

## 7. Implikasi staging dan batas verifikasi

| Aktivitas | Dampak ledger diblokir |
|---|---|
| Deploy staging terkunci, Meta dimatikan | Tidak menjadi hambatan teknis; deploy tetap belum diizinkan dan konfigurasi Access/Auth perlu selesai |
| Login owner QA, Save/reload, RLS | Tidak bergantung langsung pada ledger Meta; perlu Auth QA, tabel trips dan kebijakan yang benar |
| Discovery Meta nyata | Ditolak; perlu pemulihan yang disetujui, entitlement sah, konfigurasi dan izin inferensi terpisah |

SQL02/03 entitlement **terpisah** dari pemulihan ledger dan tidak memperbaiki flag blokir. Jangan menerapkannya sebagai workaround atau mematikan otorisasi Trip Pass/RLS.

Verifikasi audit: inspeksi lokal source/SQL/tes dan bukti owner; tidak ada pembacaan database langsung, SQL dijalankan, suite/build baru, provider call atau E2E nyata. Tidak ada perubahan kode aplikasi, schema/record, credential, billing, limit, commit/push/deploy atau Phase3. Hanya laporan, lampiran diagnostik untuk review dan catatan progres diperbarui.

## 8. Satu tindakan owner berikutnya

**Minta persetujuan owner untuk tahap pengumpulan bukti hanya-baca SQL05 pada QA dan peninjauan privat body fungsi deployed.** Owner mengoperasikan SQL sesuai AGENTS.md. Persetujuan ini hanya untuk diagnosis; bukan izin unblock, schema entitlement, deploy atau inferensi. Berhenti setelah laporan ini sampai ada persetujuan.

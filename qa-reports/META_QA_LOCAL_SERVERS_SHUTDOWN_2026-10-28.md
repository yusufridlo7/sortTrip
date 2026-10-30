# Penghentian aman server QA lokal

**Tanggal:** 28 Oktober 2026, Asia/Jakarta  
**Otorisasi:** owner hanya mengizinkan penghentian layanan QA lokal pada port8790/5174 dan launcher/child terkait yang sudah diverifikasi.  
**Hasil: LOCAL QA SERVERS STOPPED — REMOTE WRITERS NOT YET VERIFIED**

## Identitas yang diverifikasi ulang

| Komponen | Bukti sebelum penghentian |
|---|---|
| Backend127.0.0.1:8790 | PID30140, executable `node_modules/@cloudflare/workerd-windows-64/bin/workerd.exe` di repository SortTrip; parent21680 |
| Wrangler backend | PID21680 → parent16708 → launcher5732. Dua proses Wrangler memakai executable `C:/Program Files/nodejs/node.exe`; command line cocok dengan path repository, `wrangler.meta-qa.jsonc`, environment `meta-qa`, `--local`, port8790, tanpa `--remote` |
| Launcher backend | PID5732, node dengan penanda `run-meta-qa.mjs`, parent shell27064. Identitas didukung rantai child yang memakai repository/configQA, bukan hanya nama skrip relatif |
| Child QA tambahan | Workerd18860 dan esbuild23528, keduanya parent21680 dan executable di repository; khusus pohon WranglerQA yang sama |
| Frontend127.0.0.1:5174 | PID25536, executable `C:/Program Files/nodejs/node.exe`, command line `vite.meta-qa.config.js`, parent shell8068. GET file konfigurasi publik `?raw` persis cocok dengan file repository; proxy status mengembalikan proyekQA yang benar |

Status backend/proxy sebelum stop mengonfirmasi `meta-qa-local`, proyekQA `aytrcvfncsklhqozreyk`, serta flag analysis/frames/budget-ready true. Command line diperiksa secara privat dan hanya penanda aman dilaporkan; tidak membaca environment atau menampilkan argumen sensitif. Waktu pembuatan proses, executable, relasi parent dan pemilik port diperiksa ulang tepat sebelum tindakan untuk mencegah penggunaan PID yang sudah berubah.

## Tindakan dan metode

Tidak ada handle jendela pada proses target untuk shutdown biasa, dan tidak tersedia handle terminal terverifikasi yang dapat digunakan untuk mengirim Ctrl+C secara aman. Digunakan fallback **penghentian berdasarkan PID terarah**, tanpa wildcard nama atau penghentian seluruh node/workerd.

1. `Stop-Process -Id 5732`: launcher backend QA dihentikan.
2. PID16708,21680,30140,18860,23528 diperiksa setelahnya dan sudah keluar; tidak perlu dihentikan satu per satu.
3. `Stop-Process -Id 25536`: frontend QA dihentikan.

Shell parent27064/8068 serta proses lain tidak ditargetkan. Tidak ada production Worker, deployment atau konfigurasi yang diubah. Keluar setelah penghentian launcher tidak diklaim sebagai shutdown graceful pada setiap child.

## Verifikasi sesudah stop

| Waktu WIB | Port8790 | Port5174 | GET status backend | PID QA terverifikasi tersisa | Restart teramati |
|---|---|---|---|---|---|
| 13:03:59 | Tidak listen | Tidak listen | Tidak terjangkau | 0 | Tidak |
| 13:04:06 | Tidak listen | Tidak listen | Tidak terjangkau | 0 | Tidak |
| 13:04:13 | Tidak listen | Tidak listen | Tidak terjangkau | 0 | Tidak |

Kedua layanan tetap berhenti selama tiga pemeriksaan tersebut. Ini bukti aktual lokal pada waktu verifikasi, bukan jaminan tidak pernah restart kemudian. File konfigurasi tetap sama; proses yang dijalankan ulang dapat kembali memakai flag QA yang sebelumnya aktif.

## Batas dan tindak lanjut

Writer remote/host lain, job Supabase/Cloudflare/CI/admin, panggilan atau settlement yang sudah terlanjur dikirim, serta body/izin fungsi deployed masih **UNKNOWN**. Penghentian lokal bukan bukti seluruh ledger writer sudah drained dan bukan pernyataan ledger siap dipulihkan. Tidak memeriksa database untuk menyimpulkan pending sudah nol.

SQL06/SQL07 tidak dijalankan. Tidak ada reserve/settle, budget probe, inferensi Meta, pembacaan/perubahan credential, perubahan Supabase/blocked/budget/riwayat, deploy, commit/push atau Phase3. Pemeriksaan HTTP hanya GET konfigurasi frontend non-secret dan status lokal; tidak memanggil Meta. Laporan dan catatan progres adalah satu-satunya berkas yang diperbarui. Berhenti untuk instruksi owner berikutnya.

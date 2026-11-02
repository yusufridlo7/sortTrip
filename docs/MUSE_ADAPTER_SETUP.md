# Muse adapter — aktif lokal; teks/foto teruji

Tanggal: 1 November 2026. Implementasi awal mempertahankan default OpenAI; keputusan owner berikutnya memilih Muse untuk semua launch lokal dan memblokir OpenAI. Tidak ada migrasi database, salinan ledger/entitlement QA, perubahan credential, commit/push atau deployment.

**Status terbaru:** dua generasi nyata teks/foto berhasil dan tersimpan/reload. Riset kini merekonsiliasi token konteks hasil search terhadap hard caps; source IDs pada wire memadatkan keluaran dan dipulihkan ke URL asli sebelum validasi/save. Supplier function tools hanya pada riset umum, bukan putaran rute terpisah. Dev:worker sekarang alias dev:worker:muse; semua jalur launch lokal menyertakan OPENAI_DISABLED=true. Kill switch menolak OpenAI sebelum egress planning/translation. Runtime numeric diagnostics hanya localhost, transient/reset saat reload, bukan ledger atau invoice. Report qa-reports/MUSE_FIX_AND_MULTIMODAL_LIVE_QA_2026-11-01.md.

**Pembaruan sesi aktivasi berikutnya (1Nov):** owner mengizinkan aktivasi lokal dan uji berbayar. `dev:worker:muse` + JALANKAN-APP.bat kini memilih Meta dengan enable/billing-attestation/expiry melalui CLI lokal, tanpa mengubah deployment vars atau secret. Capability nyata configured=true/mediaEnabled=true. Satu percobaan UI gagal dalam guard; belum bukti inference sukses atau biaya provider. Handler kini menampilkan allowlisted failure code untuk diagnosis berikutnya. Lihat qa-reports/MUSE_ACTIVATION_LIVE_ATTEMPT_2026-11-01.md. Pernyataan "belum aktif" di uraian implementasi awal adalah riwayat; produksi tetap tidak dideploy.

## Bentuk integrasi

- UI Assistant existing menerima teks dan panel lampiran opsional; editor, database ownership/RLS, Save/My Trips, lock/paid/hold dan checkout memakai mekanisme existing.
- `worker/ai-provider.js` adalah adapter Responses, bukan login baru. Meta memakai host tetap `api.meta.ai`, Standard `muse-spark-1.3`, stateless `store:false`, tanpa fallback otomatis ke OpenAI. Standard/store:false bukan jaminan retensi data nol; owner harus meninjau ketentuan provider sebelum mengirim data pribadi.
- Konteks `worker/platform-context.js` v2026-11-01.2 ditempel kembali setiap putaran. Structured JSON dan validator itinerary existing tetap berlaku. Hasil tidak otomatis merupakan harga/ketersediaan/booking terverifikasi.
- Media hanya pada riset umum dan replay loop riset terkait. Maksimal 3 gambar browser-normalized JPEG <=1280px/512KB masing-masing dan 1 MP4 <=4MB/60 detik; input gambar JPEG/PNG/WebP <=10MB dan <=40MP. Total media <=5.5MB, body <=7.5MB. Worker memeriksa signature/dimensi JPEG, atom/durasi MP4 dan consent; ini validasi struktur, bukan pemindaian malware/validasi codec lengkap. Token preflight provider menjadi guard tambahan.
- File/nama file tidak masuk data trip, conversation, hasil draft atau storage aplikasi; preview di memori browser. Media dikirim ke Meta hanya pada aksi generate yang disetujui. Navigasi ke trip lain mereset lampiran. Transkripsi audio tidak dijanjikan. TikTok/Instagram page URL bukan input_video dan tidak diunduh otomatis.

## Tool dan kontrol risiko

Hanya `search_hotels` (LiteAPI existing) dan `search_activities` (Viator production existing). Kota harus berasal dari trip saat ini. Tanggal/guests/rooms/budget hotel ditentukan server; bukan model. Pencarian hotel split-stay/airport di tool ditolak sebagai unavailable dan enrichment existing tetap authoritative. Hasil hotel berunit full-stay total dengan pajak; wisata berunit starting price per person, bukan admission atau dated availability. Provider nonaktif/gagal menghasilkan unavailable, bukan nol atau angka buatan.

Model tidak mendapat generic fetch URL, SQL, filesystem, credential, pembayaran, booking, edit account atau Save tool. Argumen ekstra, tool tidak dikenal, pengulangan nama+query/call_id ditolak. Output supplier/media tetap untrusted. Web search existing tetap tersedia pada riset dan dibatasi; tidak membuka akses endpoint aplikasi lain.

Per generasi: <=8 inference calls (termasuk draft/correction), <=8000 output per call, <=24000 total output, <=24000 counted input per call, <=80000 total counted input, <=2 function calls, <=4 web-search calls, <=3 putaran per riset, deadline 150 detik. Preflight `/responses/input_tokens` wajib sebelum setiap inferensi; gagal/usage tidak tersedia/overrun/429/incomplete menghentikan panggilan berikutnya. Tidak ada retry transport otomatis. Putaran tool dan koreksi terbatas bukan retry jaringan. Permintaan model diserialisasi per generasi; cancellation/expiry diperiksa kembali sebelum egress, termasuk setelah token-count.

Trip Pass reserve/finish dan auth existing tetap dipakai; tidak memberikan kuota gratis. Rate limiter existing memakai key tambahan Meta lintas user. **Ini bukan ledger biaya USD atau distributed mutex global**: beberapa Worker isolate/generasi masih dapat berjalan bersama. Tidak ada klaim bahwa batas USD100/limit akun provider sudah diverifikasi atau diterapkan oleh kode baru ini. Batas token/request mengurangi eksposur tetapi tidak membuktikan biaya web-search/media atau total akun. Sebelum aktivasi, owner harus memverifikasi harga/akses model, budget provider dan jalur biaya yang dapat diukur/dibatasi; bila tidak dapat dibatasi, tetap nonaktif. Tidak mengubah budget/ledger historis.

## Aktivasi terpisah oleh owner

Agent tidak membaca/menulis file secret atau menjalankan aktivasi. Konfigurasi yang diperlukan di server existing:

| Nama | Tujuan |
|---|---|
| AI_PROVIDER | `meta`; tanpa nilai/default `openai` mempertahankan alur lama |
| META_ASSISTANT_ENABLED | `true` hanya setelah review |
| META_MODEL_API_KEY | credential Standard diisi sendiri owner, jangan dikirim ke chat |
| META_BILLING_CONFIRMED | `true` adalah attestation owner, bukan hasil verifikasi billing otomatis |
| META_ASSISTANT_EXPIRES_AT | Usang dan diabaikan; tidak ada batas tanggal sejak keputusan owner 2 November 2026 |

Keputusan owner 2 November 2026 menghapus penghentian otomatis 5 November. Meta tetap aktif tanpa batas tanggal selama enable/key/billing tersedia. Semua egress itinerary, riset, koreksi, terjemahan dan Guide melalui adapter yang sama. Batas pemakaian per generasi, autentikasi, Trip Pass, kuota, timeout, validasi media dan tool tetap berlaku. Tidak ada fallback otomatis ke OpenAI. Menonaktifkan META_ASSISTANT_ENABLED tetap memblokir egress termasuk antrean.

Owner menyiapkan credential sendiri, memastikan biaya, lalu restart server/deploy hanya dengan instruksi terpisah. GET `/api/ai/capabilities` hanya menunjukkan configured/mediaEnabled, bukan bukti koneksi/model/billing. Setelah konfigurasi, uji live berizin satu generasi kecil diperlukan untuk memastikan schema Responses, web-search/replay, video token counting, mutu hasil dan Save/reload nyata. Jangan mengirim data pribadi pelanggan. Jangan mengklaim tes mock sebagai live.

Keputusan owner terbaru melarang peran OpenAI lokal: jangan mengaktifkan ulang melalui rollback otomatis. Menonaktifkan Meta tetap membiarkan editor/Save/booking non-AI bekerja dan tidak perlu schema/entitlement/record reset. Menghidupkan provider lain memerlukan keputusan owner baru. Kode kompatibilitas OpenAI yang tersimpan bukan provider aktif.

Referensi resmi yang dibaca: [Models](https://dev.meta.ai/docs/models), [Responses](https://dev.meta.ai/docs/protocols/responses), [Tool calling](https://dev.meta.ai/docs/tool-calling), [Images](https://dev.meta.ai/docs/image-understanding), [Video](https://dev.meta.ai/docs/video-understanding), [Input tokens](https://dev.meta.ai/docs/api-reference/responses/count-input-tokens).

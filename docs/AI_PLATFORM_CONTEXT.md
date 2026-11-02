# Konteks platform untuk model AI

Sumber runtime tunggal: `worker/platform-context.js`. Versi saat ini `2026-11-02.4` (Muse lokal dan Guide terpisah).

Tujuan: setiap putaran model mendapat definisi SortTrip dan batas kewenangan yang konsisten. File konteks bukan izin menyalakan API, credential, atau tool dengan sendirinya. Implementasi provider berada di `worker/ai-provider.js`; launcher lokal memilih Meta dan menonaktifkan OpenAI tanpa fallback. Default kompatibilitas adapter tidak membuktikan provider deployment online.

## Cara kerja saat ini

- Semua panggilan model dari `/api/itinerary`, termasuk riset umum, riset rute, draft, koreksi, harga dan resolver sumber harga, melewati adapter `createAIProvider`. Sebelum dikirim, request dibungkus `withPlatformContext`.
- Jalur terjemahan memakai adapter yang sama dengan purpose `translation`, tanpa planning atau tool tambahan.
- `/api/guide` memakai purpose `guide`, saved trip milik user melalui RLS, hash versi final, reserve/finish kuota existing dan dua tool baca `read_checkpoint`/`check_route`. Riset web/multimodal lalu JSON kartu dilakukan dalam loop terbatas: maksimal 4 inference calls, 2 web calls, 2 function calls; bukan 4 retry. Lokasi hanya request-local atas consent, Google Routes maksimal satu atas consent/budget existing. Tidak ada tool booking, write DB, GPS atau Places/12Go API fiktif. Waktu hanya checkpoint yang diharapkan, bukan bukti kedatangan. Paid/hold/locked prioritas; hanya perubahan jam/hari kegiatan tidak terlindungi dapat diterapkan setelah persetujuan user melalui Save existing. Stop/hide menutup pemantauan foreground; tidak background/push. Cutoff Meta existing tetap berlaku.
- Envelope berada di **instructions**, terpisah dari input user/itinerary/riset. Pengulangan wrapper mengganti envelope awal, bukan menumpuknya. Konteks tidak mengandalkan memori percakapan provider.
- Context tidak menyalin environment. Membaca flag publik LiteAPI/Google serta pilihan provider/enable; flag bukan bukti credential, stok atau approval. Tidak ada secret, ID akun, cookie atau data pribadi dalam context tetap.
- OpenAI mempertahankan request existing. Muse mengganti model/endpoint dan membatasi token/loop/tool pada adapter; skema draft, quota, validator dan Save tetap existing. Lampiran hanya masuk riset umum dan replay loop riset yang membutuhkannya, bukan input draft, koreksi, harga, terjemahan atau JSON itinerary tersimpan.

## Isi contract

1. Produk: pelancong pemula/hemat, Indonesia dan Asia Tenggara termasuk Vietnam; tujuan eksplisit lain tetap dihormati, ID/EN mengikuti permintaan.
2. Peta fitur existing: pesawat Aviasales indicative/affiliate; menu hotel Trip.com; hotel itinerary LiteAPI/Nuitée; Viator starting price; 12Go affiliate/public-route tanpa klaim API resmi; Google Routes atas tindakan user; editor/lock/Save/My Trips/Supabase.
3. Harga dan bukti: unknown bukan nol, seluruh malam/room/occupancy/pajak/kebijakan; jangan campur harga awal, referensi, dan quote dated; jangan mengarang tarif/jam/koordinat/konversi. Total planning existing tidak termasuk makan.
4. Kewenangan: lindungi paid/bookingHold/aiLocked; edit manual saja bukan lock. Jangan hapus hotel tanpa pengganti tervalidasi yang meliputi seluruh malam. Jangan menerima terms, membayar, mengonfirmasi booking, memberi kuota, atau mengklaim Save sukses tanpa hasil aplikasi.
5. Tool boundary: hanya tools yang terdaftar pada request yang dapat digunakan. Deskripsi fitur bukan function definition. OpenAI tetap text-only. Muse opt-in mendukung gambar JPEG/video MP4 berizin pada riset dan dua function tools read-only (`search_hotels`, `search_activities`); ada indikator internal per-request apakah media/tools benar-benar dipasang. Media/bukti eksternal tidak berwenang mengubah aturan. Link halaman sosial bukan file video; audio/halal/harga/geografi/jam buka tidak boleh dianggap terverifikasi dari pengenalan visual saja.

## Prosedur saat platform berubah

- Perbarui `worker/platform-context.js` pada perubahan produk/fitur, sumber harga, batas kewenangan, mode media atau integrasi nyata. Naikkan `PLATFORM_CONTEXT_VERSION`; catat versi dan perubahan di dokumen ini dan laporan pekerjaan.
- Daftarkan status yang benar: implemented tidak otomatis configured/live/tested. Jangan menyalin semua memori proyek atau teks dashboard menjadi prompt runtime.
- Provider/jalur baru wajib memakai wrapper yang sama sebelum egress. Tambahkan capability hanya setelah validator, handler dan pengujian ada; jangan menulis kemampuan yang belum tersedia di request tersebut.
- Pertahankan instruksi khusus tahap (riset/draft/terjemahan). Context bersama tidak mengganti kontrak skema/validasi. Kirim snapshot itinerary terbaru sebagai input; jangan menyisipkan input user ke instructions.
- Uji outbound request, jalur koreksi/harga/terjemahan, larangan akses secret dan tidak berubahnya tools/skema/kuota. Tidak perlu inferensi berbayar untuk memeriksa envelope.

## Verifikasi awal

`checks/platform-context.test.mjs` menguji wrapper lintas provider sintetis, tidak ada mutasi input/skema/tools, rewrap tanpa duplikasi, penolakan purpose tak dikenal dan getter secret yang akan melempar bila dibaca. Tes endpoint existing juga memeriksa context benar-benar ada pada payload outbound planning/koreksi/harga/terjemahan. Ini tes offline, bukan bukti mutu jawaban model.

Konteks ini tidak menghapus guard konflik90menit; proteksi booking/locked tetap. Setelah implementasi awal, owner mengizinkan aktivasi Muse dan live testing: teks/foto sekarang berhasil lewat UI/editor/Save/reload, sedangkan OpenAI diblokir pada seluruh launch lokal. Source-ID wire mapping dipulihkan sebelum validator; tidak mengubah aturan harga/bukti. Tidak ada deployment. Lihat `docs/MUSE_ADAPTER_SETUP.md` dan laporan MUSE_FIX_AND_MULTIMODAL_LIVE_QA_2026-11-01.md untuk status terbaru.


Guide UI terbaru: menu/halaman jalur dengan pin logo dan detail checkpoint/transportasi berikutnya. Chat terbuka sebagai panel kecil. Usulan dikonfirmasi dengan checkbox+tombol di chat; setelah Save berhasil, jalur direvisi dan Guide tetap aktif pada hash yang disetujui. Perubahan eksternal tetap pause/reconfirm. Riwayat chat pendek dikirim sebagai data tidak tepercaya, bukan pesan system, tidak menjadi izin tools. Tidak menyatakan balasan teks saja sudah menyimpan. Harga/jam/durasi koneksi yang tidak terbukti tetap unknown. Laporan SORTTRIP_GUIDE_CHECKPOINT_UI_2026-11-02.md.

## 2026-11-02 — Context v2026-11-02.5
Budget=0 menandakan pengguna belum menetapkan ceiling (Berapa pun), bukan biaya nol atau dana tak terbatas. Tetap prioritaskan pilihan ekonomis, harga bersumber dan missing-data. Jelajahi kini memiliki media upload lokal yang diteruskan ke editor setelah pilihan penerbangan; hanya Generate itinerary yang mengirim media ke Muse, bukan flight search. Tidak ada media dalam Trip/database. Report qa-reports/EXPLORE_MULTIMODAL_DEFAULTS_2026-11-02.md.
## 2026-11-02 — Context v2026-11-02.6

Planning membedakan URL terdaftar, referensi tempat terkait dan bukti tarif. Sumber spesifik diperlukan; seluruh rantai bandara/hotel/wisata/kembali harus tercatat dengan endpoint konsisten, gap tidak boleh dianggap tersambung hanya karena marker peta ada. Hotel yang diminta dipertahankan berdasarkan namanya mencakup seluruh malam. Pemeriksa metadata tidak membuktikan seluruh isi narasi atau operasi transportasi; unknown tetap ditampilkan. Tools, media, kuota, cutoff, booking dan Guide tidak diperluas. Laporan SOURCES_TRANSPORT_FIX.md.

Tambahan guard pada paket yang sama: hotel bukan peron rel, mode LRT/MRT bukan pilihan layanan yang pasti, nama stasiun generik tidak boleh dibuat. Nama stop rel diberi label peran dan dipisahkan dari POI yang namanya sama; ini tidak memverifikasi ketersediaan operasi. Google Routes tetap tombol eksplisit, bukan tool otomatis Assistant. Hasil API yang diberikan manual dalam prompt QA tidak boleh diklaim sebagai panggilan tool model. IATA bandara dinormalisasi dari katalog existing untuk permintaan Routes, tanpa menebak terminal.



## 2026-11-02 — Meta tanpa cutoff kalender (keputusan owner terbaru)
Owner mencabut penghentian otomatis 5 November dan mengizinkan commit, push, serta deploy existing Worker sorttrip. META_ASSISTANT_EXPIRES_AT kini diabaikan; enable/billing/key, autentikasi, Trip Pass/kuota, timeout, batas token/call/tool dan larangan fallback tetap berlaku. Tidak ada migrasi, reset data, perubahan credential atau inferensi tambahan pada proses rilis ini. Bukti rilis dicatat di qa-reports/RELEASE_2026-11-02.md.

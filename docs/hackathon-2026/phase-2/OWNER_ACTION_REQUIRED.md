# Owner actions and remaining implementation

27 Oct 2026. Phase 2 PARTIAL; Phase 3 NOT READY. Start/end HEAD `737fbc5636145fc27a0bf4ac41be831835dfbd44`. No deployment/commit/push requested by this brief.

1. **Account/access/privacy:** owner privately verifies Meta account, active credits, Standard Spark 1.3 access, applicable data terms and licensed non-sensitive demo content. Install `META_MODEL_API_KEY` only server-side; never send its value in chat or place it in VITE config. No credential was read or modified.
2. **Hard spending boundary:** review the source-only `supabase/meta-video-budget.sql` and RPC adapter in a nonproduction project. Applying it changes database tables/grants and was deliberately not done here. Verify concurrent global/user reservations, no-refund behavior and fixed $5 allowance, token/cost bound and account mode. Only then may the owner set `META_VIDEO_BUDGET_READY=true` and `META_VIDEO_TEXT_ENABLED=true` for a separately verified test. These flags currently have no operational verification. Alerts/$150 credits alone do not satisfy the cap gate.
3. **Real transcript test:** after the above, conduct one licensed/non-sensitive fixture inference, record sanitized model/usage/latency and actual response quality. Current evidence is mocked. No further paid call is implied by completion of these reports.
4. **Native video implementation:** a trusted sandboxed media inspector, actual duration/track safety, permitted frames/speech extraction and model-supported forwarding with retryable remote-file deletion remain engineering work. No paid processor/storage was provisioned. Select/approve an available existing processor or explicitly approve infrastructure before native video activation. The current upload path validates only container structure and stops.
5. **Verification coverage:** provide approved public place sources or separately approve location-service access to expand beyond the two inherited KL museums. Opening/closure and fare/route evidence remain unknown.
6. **Auth/save QA:** verify a generated draft through Save in a disposable nonproduction account and two-user isolation. The UI and source reuse existing RLS; no owner trip was saved or customer database read for this work.
7. **Hackathon rules:** official eligibility, pre-existing-code disclosure and submission requirements remain owner review; do not mistake this feature branch for organizer approval.

Independent source implementation, schema/URL/upload/error tests, local review→planner/map UI and reports were continued despite these gates. Existing partner registration/credentials and production finance settings do not need to be redone for this feature. Phase 3 and production release require separate explicit approval.

## Phase2B — panduan sederhana untuk owner (status terbaru)

27 Oktober2026: owner menyatakan environment uji belum siap dan belum memahami setup. Tidak perlu mengirim credential ke chat. Live API dan Save/RLS tetap BLOCKED; lihat PHASE_2B_IMPLEMENTATION.md. Pekerjaan lokal sudah dilanjutkan tanpa menunggu setup ini. Bagian native video lama kini memiliki fallback frame browser yang benar-benar bekerja, tetapi belum ASR/full-video Meta.

**Environment nonproduction** artinya tempat latihan terpisah dari SortTrip online: memakai database dan akun uji, supaya data perjalanan/pembayaran pelanggan tidak tersentuh. Jangan langsung mengganti konfigurasi Worker produksi untuk Tahap2B.

### Urutan yang perlu disiapkan

1. **Siapkan proyek Supabase khusus uji.** Di dashboard Supabase, gunakan proyek baru/terpisah untuk SortTrip QA. Pilih opsi tanpa layanan berbayar baru; jika muncul biaya/persetujuan yang tidak dipahami, berhenti untuk ditinjau. Owner sendiri menangani login/OTP/Terms. Catat nama dan URL publik proyek saja. Jangan menyalin database pelanggan ke sana.
2. **Dua akun uji.** Di aplikasi uji yang nanti diarahkan ke proyek tersebut, owner login/signup dua akun yang dikuasai sendiri. Gunakan dua profil browser terpisah saat QA. Tidak memakai akun pelanggan. Password/OTP hanya di form resmi, tidak di chat, source, laporan atau Telegram.
3. **Meta Developer.** Buka https://dev.meta.ai/ dan periksa akses Model API, model muse-spark-1.3 Standard, kredit/billing dan ketentuan data. Owner menangani seluruh authorization atau pembuatan key. Jangan memilih Contributor hanya karena lebih murah tanpa keputusan privasi terpisah. Key tidak perlu dikirim ke agent.
4. **Pemasangan privat server uji.** Owner memasang META_MODEL_API_KEY di secret server lokal/nonproduction, bukan VITE/browser. Service-role Supabase juga hanya server-side proyek uji. Jangan menimpa secret Worker produksi atau menampilkan isi file .dev.vars/.env di screenshot/log. Agent tidak membaca atau mengubah nilai credential.
5. **Tinjau SQL sebelum aktivasi.** File supabase/meta-video-budget.sql mengubah table/grant/RLS dan harus ditinjau serta dijalankan owner pada proyek QA yang benar. Jangan langsung menerapkannya di produksi. Jangan mengaktifkan flag hanya karena SQL berhasil ditempel: perlu uji concurrency/privilege/settlement nyata dan verifikasi schema aplikasi/save di database uji.
6. **Validasi tanpa inferensi berbayar terlebih dahulu.** Verifikasi auth aplikasi QA, SELECT/UPDATE/DELETE isolation dua akun, service-only ledger, cap USD5 dan alokasi USD0,05, lalu entitlement/count endpoint, tarif aktual, dan kemungkinan biaya count endpoint. Gate tidak dianggap lolos dari laporan mock ini.
7. **Baru aktifkan test terkontrol.** Setelah pemeriksaan di atas lolos, konfigurasi server QA mencakup META_VIDEO_NONPRODUCTION, META_VIDEO_TEXT_ENABLED dan META_VIDEO_BUDGET_READY. Frame test memerlukan META_VIDEO_FRAMES_ENABLED juga. Nilai aktif true hanya dipasang setelah gate terverifikasi; tidak ada yang diaktifkan oleh agent. Uji satu request dulu, lihat usage/accounting dan billing yang disanitasi sebelum mencoba lagi. Batas owner tetap USD5, bukan target pengeluaran.
8. **Konten demo.** Gunakan MP4 milik sendiri/berizin, maksimal4MiB/60detik tanpa data pribadi. URL TikTok/Reels/Shorts boleh menjadi referensi, tetapi belum memberi aplikasi akses media. Berikan file asli yang sah atau transkrip yang ditulis/disediakan sendiri; jangan memakai downloader/bypass. Clip sintetis QA hanya membuktikan decoder, bukan AI mengenali tempat.

Tidak perlu menyelesaikan semuanya sendiri sekaligus. Titik mulai praktis: siapkan proyek database QA dan buka halaman Meta Model API. Setelah siap, kirim status/nama/URL publik saja agar verifikasi berikutnya dapat diarahkan; jangan kirim secret. Tidak ada klaim bahwa panduan ini sudah dijalankan.

### Masih perlu engineering/verifikasi

Audio CLI belum terhubung ke aplikasi atau Meta. Full MP4 analysis dan lifecycle remote-file deletion belum diimplementasikan. Perlu bukti live Meta, Save/reload/RLS dua akun, serta UI TripPass/PriceWatch pada environment QA sebelum status complete. Demo dan Phase3 tetap NOT READY. Tidak ada izin commit/push/deploy atau pembayaran/booking dari dokumen ini.

## Revisi budget owner — USD10, 27 Oktober2026
Owner sekarang mengizinkan maksimum kumulatifUSD10, menggantikanUSD5 pada panduan/historical checkpoint di atas. Source Worker/SQL dan tes disesuaikan; per-requestUSD0.05 dan per-user10attempt tidak berubah. SQL upgrade mempertahankan alokasi lama. Belum diterapkan/diaktifkan di environment nyata. Ikuti META_API_SETUP_ID.md untuk membuat key sendiri dan memasangnya privat pada serverlokal dengan flag tetapfalse. Jangan mengaktifkan analisis sampai gate nonproduction/ledger/model diverifikasi.66tes terkait lulus; actualMetaUSD0. Panduan lama tentangUSD5 adalah historis, bukan batas izin terbaru.

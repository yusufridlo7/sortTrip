# Meta API — verifikasi dokumentasi dan batas bukti

27 Oktober 2026. **Status adapter: VERIFIED WITH MOCKS. Status akun/live inference: BLOCKED.**

Model yang ditargetkan `muse-spark-1.3` Standard. **Model yang benar-benar dipanggil: tidak ada.** Owner menyatakan environment uji belum siap. Tidak membaca secret, memeriksa nilai key, atau menganggap kredensial lama membuktikan entitlement.

## Dokumentasi resmi yang diperiksa

- [Models](https://dev.meta.ai/docs/models): Spark 1.3 mendukung teks, gambar, video, audio dan PDF; Standard dan Contributor memiliki ketentuan data berbeda. Pilihan tetap Standard.
- [Video/audio](https://dev.meta.ai/docs/video-understanding): mendokumentasikan MP4/embedded audio, Files API `input_file`, serta `input_video`. Dukungan dokumentasi bukan bukti akses akun atau bahwa integrasi SortTrip sudah memakai format itu.
- [Image understanding](https://dev.meta.ai/docs/image-understanding): mendukung `input_image` dengan data URI. Jalur alternatif SortTrip memakai maksimal tiga JPEG inline; tidak membuat file remote Meta.
- [Token counting](https://dev.meta.ai/docs/token-counting): `POST https://api.meta.ai/v1/responses/input_tokens` menghitung konteks sebelum generasi. Payload yang dihitung sama dengan payload inferensi.
- [Responses](https://dev.meta.ai/docs/protocols/responses): inferensi di `https://api.meta.ai/v1/responses`, output tokens mencakup reasoning dan teks.
- [Pricing](https://dev.meta.ai/docs/pricing-rate-limits): Standard input USD1,25 dan output USD4,25 per satu juta token saat pemeriksaan. Tidak memakai web search berbayar.

## Implementasi

Gate `META_VIDEO_NONPRODUCTION=true`, `META_VIDEO_TEXT_ENABLED=true`, key server, ledger budget dan readiness wajib untuk request nyata. Frame juga memerlukan `META_VIDEO_FRAMES_ENABLED=true`. Tidak ada flag yang diaktifkan oleh agent.

Sebelum inferensi: reservasi USD0,05, preflight token, maksimum 20.000 input dan 2.000 output. Timeout total adapter maksimal 30 detik, respons dibatasi, schema/evidence diperiksa, returned model yang berbeda ditolak. Auth error, rate limit, input berlebih, output malformed dan timeout tidak memicu retry atau provider fallback. Log hanya metadata model, outcome, usage, alokasi dan status settlement; tanpa prompt, frame, credential, user/session ID atau error mentah.

`mock:false` pada respons adapter menandai jalur provider, bukan sertifikat bahwa laporan tes memanggil API live. Tes menyuntikkan fetcher mock dan dinyatakan mock secara eksplisit.

## Belum dibuktikan

Entitlement model, key aktif, credit balance, ketentuan akun, request token-count nyata, biaya endpoint preflight pada akun, latensi/output aktual dan pencocokan pemakaian billing belum diuji. Tidak ada response ID atau penggunaan billing nyata untuk dilaporkan. Jangan memakai credits/notifikasi billing sebagai hard cap. Panduan privat tersedia di OWNER_ACTION_REQUIRED.md.

## Subsequent actual metadata verification — 27 October2026
Earlier “no actual Meta response” is superseded for READ-ONLY MODEL METADATA ONLY. Owner privately configured backend/frontendQA and logged in; direct browser QAlogin persisted onreload. Authenticated server request to GET /v1/models/muse-spark-1.3 returned200 with matchingid, sanitizedUI success screenshot qa-reports/meta-budget-10/qa-model-access-success.png. No inference, token-count or media request; no budgetallocation/TripPassresult consumed. Creditbalance/inferencepermission and real modeloutput remain unverified. Source supports fixedmetadata-onlyroute with auth/origin/limiter/timeouts/bodybound and sanitized diagnostics, visibleonlyVitemeta-qamode. Initialfailure was Cloudflareunsupportedredirect:error; fixed to manual plus non2xx checks acrossMetaadapter/auth/budgetRPC, with nofollow/credentialforwarding regression. Full407tests, build and i18n1603pass. Next transactionalbudgetprobe ownerhandoff; liveanalysisflagsremainfalse. No secret read/reveal/rotation or productionrelease.

### Owner credit evidence — 27 October2026
Billing screenshot shows USD150 free credits active and Rp0 outstanding. The same screen warns that content may be used for product improvement while free credits are used. Treat this warning as applicable to QA content; do not claim Standard no-training privacy is verified from the model name. Use only synthetic non-sensitive text for initial bounded testing; retain owner USD10 cumulative boundary. No billing toggle/payment or key change needed or performed. Inference access remains untested.

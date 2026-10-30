# Panduan pemasangan Meta API — lokal/nonproduction

27 Oktober 2026. Owner mengubah izin budget total pengujian dari USD5 menjadi **USD10**. Ini maksimum kumulatif pekerjaan tes, bukan target belanja, limit bulanan otomatis, atau izin rilis produksi. Source cap diperbarui; SQL belum diterapkan dan live calls tetap tidak diaktifkan.

## Langkah awal: buat dan simpan key sendiri

1. Buka https://dev.meta.ai/ dan login sendiri. Jika ada OTP, CAPTCHA, Terms atau billing, kerjakan langsung di halaman resmi; jangan membagikan nilainya di chat.
2. Buka dashboard **Model API → API keys → Create API key**, sesuai [quickstart resmi](https://dev.meta.ai/docs/quickstart). Nama key dapat memakai `SortTrip QA`. Label atau langkah tambahan dapat berbeda menurut status akun; jangan menganggap akun sudah mendapat entitlement hanya karena menu terlihat.
3. Salin key secara privat. Jangan mengirim screenshot layar yang menampilkan key, menuliskannya di chat, source JS/TS, atau terminal command/history.
4. Buka file `.dev.vars` di root folder SortTrip di editor Anda. Tambahkan/ganti **hanya** `META_MODEL_API_KEY` dengan nilai key tersebut. Nama ini adalah binding yang dibaca Worker SortTrip; dokumentasi Meta mencontohkan nama generik `MODEL_API_KEY`. Tidak perlu memasang SDK/CLI Muse atau mengubah model Codex.
5. Selama database QA/ledger belum siap, pastikan flag Meta tetap nonaktif. Contoh struktur berikut memakai placeholder, bukan key nyata:

```dotenv
META_MODEL_API_KEY=<isi-key-sendiri-di-editor>
META_VIDEO_TEXT_ENABLED=false
META_VIDEO_FRAMES_ENABLED=false
META_VIDEO_BUDGET_READY=false
```

Jangan mengganti seluruh isi file karena memuat konfigurasi fitur lain. Jangan mengunggah/commit file itu. Agent tidak akan membuka file atau membaca nilainya. Ini memasang key saja, belum mengaktifkan request model.

6. Simpan dan beri tahu “key Meta sudah disimpan”, tanpa mengirim nilai. Jika membutuhkan panduan tampilan dashboard, kirim screenshot yang **tidak menampilkan key atau data sensitif**. Restart Worker dapat dilakukan sesudah setup siap; restart sendiri bukan bukti akses Meta sukses.

## Sebelum mengaktifkan analisis

- Siapkan proyek database dan aplikasi nonproduction terpisah; owner sebelumnya menyatakan belum siap. Jangan menyalin secret/database pelanggan atau mengganti Worker produksi.
- Tinjau dan terapkan `supabase/meta-video-budget.sql` pada proyek QA saja. Source baru membatasi total alokasi USD10; upgrade constraint mempertahankan alokasi yang sudah terpakai, tidak meresetnya. USD0,05/request dan sepuluh alokasi/user tetap.
- Verifikasi permission/lock/concurrency/settlement nyata serta entitlement model, tarif dan biaya token-count endpoint. Model target `muse-spark-1.3` Standard, bukan Contributor.
- Baru setelah verifikasi, owner dapat mengaktifkan flag server QA dan `META_VIDEO_NONPRODUCTION=true` untuk satu uji terbatas. Jangan mengaktifkannya hanya karena key berhasil disimpan. Batas aplikasi bukan pembatas seluruh akun Meta; penggunaan key di aplikasi lain di luar kontrol adapter.
- Uji Save/RLS memerlukan dua akun QA. Tidak perlu melakukan pembayaran atau booking hotel untuk pemasangan API Meta.

Bukti source revisi: `qa-reports/meta-budget-10/tests.log`, 66 tes terkait lulus. Tidak ada key dibaca/diubah agent, SQL dijalankan, panggilan Meta, commit, push atau deploy. Pengeluaran Meta oleh agent tetap USD0.

## Setup terpisah yang sekarang dipakai (setelah proyek QA dibuat)
Proyek QA owner: aytrcvfncsklhqozreyk. SQLmigration dilaporkanSuccess; screenshot row/RLS/grants sesuai, belum actualconcurrency/Meta. Jangan menimpa .dev.vars lama. Owner membuat .dev.vars.meta-qa di root, dengan SUPABASE_PUBLISHABLE_KEY dan SUPABASE_SECRET_KEY dari proyek QA serta META_MODEL_API_KEY dari proyek Meta sorttrip development. Ikuti qa-config/meta/README.md; jangan menyalin semua secret produksi. ServerQA hanya dijalankan melalui node scripts/run-meta-qa.mjs (lokal8790), yang menolak start jika filekhusus belum ada. FrontendQA memakai file publik terpisah qa-config/meta/.env.meta-qa.local, port5174. Semua flagberbayar masihfalse.66tes adapter/isolation/media lulus, serverbelumdijalankan. Backendkeybaru dikirim viaapikey, bukan JWTBearer; servicelegacy tetapdidukung. Tidak ada privatefiledibuat/dibaca/diubaholehagent.

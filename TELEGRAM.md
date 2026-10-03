# Notifikasi SortTrip Agent

Notifier ini berjalan dari proses Node.js lokal, terpisah dari frontend dan Worker. Tidak ada pengiriman otomatis saat server dimulai.

Isi sendiri `TELEGRAM_BOT_TOKEN` dan `TELEGRAM_CHAT_ID` di `.env.telegram.local` pada root project. File ini di-ignore oleh aturan `.env.*` yang sudah ada. `.env.example` hanya menyediakan nama variabel dengan nilai kosong. Jangan gunakan prefix `VITE_` untuk credential Telegram.

Periksa kelengkapan konfigurasi tanpa mengirim pesan:

```powershell
npm run telegram:check
```

Kirim pesan yang tidak mengandung informasi sensitif setelah konfigurasi diisi:

```powershell
npm run telegram:notify -- "SortTrip Agent: pekerjaan selesai."
```

Perintah hanya menampilkan hasil umum. URL request, credential, response Telegram, dan detail exception tidak dicetak. Tidak ada retry otomatis untuk menghindari pesan ganda.

Agent Node.js dapat mengimpor `notifyTelegram` dari `scripts/telegram-notify.mjs`, lalu memanggil `await notifyTelegram('Pesan status aman')`. Jalankan proses agent dengan `node --env-file=.env.telegram.local ...` agar konfigurasi dimuat ke `process.env`. Hindari menyertakan log, file environment, atau data pribadi dalam pesan.

Tes offline dengan konfigurasi dummy dan fetch mock:

```powershell
npm run test:telegram
```

Pengiriman menggunakan metode [sendMessage Telegram Bot API](https://core.telegram.org/bots/api#sendmessage).

## Kontrol dua arah dan human-in-the-loop

Jalankan bot di terminal terpisah dengan `npm run telegram:agent`. Proses memakai `.env.telegram.local`, long polling `getUpdates`, dan notifier yang sama. Tidak ada webhook, deployment, shell execution dari Telegram, atau proses Codex yang otomatis diluncurkan.

Command dari chat allowlist:

- `/help`: daftar command.
- `/status`: status task aktif (task nonterminal paling awal).
- `/task <instruksi>`: mendaftarkan instruksi natural language.
- Pesan biasa: diperlakukan sebagai task setelah validasi.
- `/cancel [task-id]`: membatalkan task queued/waiting; running hanya ditandai untuk pembatalan pada titik aman.
- `/resume <task-id>`: meminta verifikasi ulang; tidak otomatis melanjutkan atau membuktikan login berhasil.

Task otomatis yang tersedia persis: `/task Periksa health lokal SortTrip` atau `/task Check local SortTrip health`. Runner hanya memeriksa halaman utama dan `/api/health` pada `127.0.0.1:5173`. Tidak menguji login, pembayaran atau layanan pihak ketiga. Task umum menjadi `WAITING_FOR_USER` dengan alasan handoff Codex lokal. Antrean memproses task queued satu per satu; task waiting tetap menunggu dan tidak dilanjutkan otomatis.

Status: QUEUED, RUNNING, WAITING_FOR_USER, COMPLETED, FAILED, CANCELLED. Notifikasi lifecycle: task diterima, mulai, AUTH_REQUIRED, TASK_COMPLETED, TASK_FAILED. Ringkasan memakai template tetap; instruksi, credential, respons API mentah dan hasil bebas tidak dikirim kembali. Detail progress bisa dilihat dengan `/status`.

Data persisten berada di `.sorttrip-agent/queue.json`, di-ignore Git. File menyimpan instruksi, metadata, hasil berupa kode aman, offset update dan outbox. Tidak menyimpan token, chat ID atau kredensial. Input yang terdeteksi berisi credential ditolak sebelum persistence. Filter tidak dapat mengenali semua kemungkinan secret: jangan kirim credential, log mentah atau data pribadi sebagai task. Penyimpanan lokal tidak terenkripsi; perlindungan akun/ACL Windows tetap penting. Lock mencegah dua writer. Setelah crash, hentikan semua proses bot sebelum menghapus `runner.lock` yang stale secara manual; task RUNNING dipulihkan ke WAITING_FOR_USER.

Outbox dicoba ulang jika delivery gagal. Crash setelah Telegram menerima pesan tetapi sebelum save dapat menghasilkan notifikasi ganda. Offset tersimpan untuk mencegah task duplikat setelah restart. Jangan jalankan notifier `getUpdates` lain bersamaan dengan polling bot.

### Handoff ke agent di laptop

1. Hentikan polling dengan Ctrl+C sebelum mengubah antrean melalui CLI lokal. `list` dan `show` dapat dibaca saat polling aktif.
2. `npm run telegram:agent -- list` menampilkan metadata saja. `show <task-id>` menampilkan instruksi lokal yang telah lolos validasi; output ini tidak dikirim ke Telegram atau log bot.
3. Task QUEUED dapat diambil dengan `claim <task-id>`. Task yang telah WAITING_FOR_USER perlu `/resume <task-id>` dari owner, lalu pemeriksaan langsung aplikasi/browser oleh agent lokal.
4. Setelah state aplikasi terverifikasi: `npm run telegram:agent -- resume-reviewed <task-id> application-state-verified`. Ini hanya mencatat attestation pemeriksaan lokal; program tidak dapat membuktikan autentikasi. Jangan gunakan tanpa pemeriksaan langsung.
5. Jika terhambat: `npm run telegram:agent -- wait <task-id> Viator "Authentication required"`. Service/action berasal dari allowlist dalam `scripts/agent/security.mjs`. Ambil alih laptop untuk login, OTP/2FA, CAPTCHA, authorization, API credential, payment/billing atau approval sensitif. Jangan kirim credential lewat Telegram.
6. Setelah pekerjaan benar-benar diperiksa: `npm run telegram:agent -- complete <task-id>` atau `fail <task-id>`. Kemudian jalankan polling lagi.

Aturan berulang untuk Codex disimpan di AGENTS.md. Antrean bukan mekanisme membangunkan chat Codex Desktop. `codex exec` tersedia pada komputer ini, tetapi auth/runner CLI belum diuji dan bridge model tidak diaktifkan. Untuk pekerjaan umum tetap diperlukan local agent/handoff atau bridge tambahan yang mengisolasi environment, menerapkan sandbox, dan memverifikasi state aplikasi.

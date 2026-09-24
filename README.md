# sortTrip — proyek lokal untuk VS Code

Paket ini menyalin antarmuka prototipe sortTrip dan menyesuaikannya untuk pengembangan di laptop memakai React + Vite. Kode utama menggunakan JavaScript/JSX serta TypeScript/TSX. Tidak perlu mengubah ekstensi berkas.

## 1. Buka proyek

1. Ekstrak ZIP, jangan jalankan dari dalam ZIP.
2. Buka VS Code > File > Open Folder.
3. Pilih folder `sortTrip-local` yang berisi `package.json`.
4. Pilih Terminal > New Terminal.
5. Periksa `node --version`. Paket ini memerlukan Node.js 22.13 atau lebih baru.

## 2. Jalankan

Ketik satu per satu dan tekan Enter:

```sh
npm install
npm run dev
```

Tunggu instalasi pertama selesai. Internet diperlukan untuk mengunduh dependensi.
Buka alamat yang muncul di terminal, default http://127.0.0.1:5173.
Jangan membuka `index.html` dengan klik dua kali atau Live Server.
Biarkan terminal berjalan. Untuk berhenti tekan Ctrl+C.
Untuk menjalankan kembali cukup `npm run dev`.

Jika PowerShell mengatakan `npm.ps1 cannot be loaded`, gunakan `npm.cmd install` dan `npm.cmd run dev`, atau pilih terminal Command Prompt. Tidak perlu mengubah kebijakan keamanan PowerShell.
Jika port 5173 terpakai, hentikan terminal proyek sebelumnya terlebih dahulu.

## 3. Mengedit

- `main.jsx`: titik masuk aplikasi.
- `app/brand.ts`: nama merek. Ganti 'sortTrip' menjadi 'SortTrip' bila sudah diputuskan.
- `app/travel-app.tsx`: navigasi dan itinerary utama.
- `app/flight-search.tsx`: pencarian pesawat fleksibel.
- `app/direct-search.tsx`: pencarian hotel dan transportasi.
- `app/travel-data.ts`: data dan perhitungan simulasi.
- `app/hotel-planner.tsx`: pilihan hotel dalam itinerary.
- `app/globals.css`: desain dan tampilan ponsel.
- `app/local-trips.ts`: penyimpanan demo lokal.
- `public/`: gambar yang digunakan aplikasi.

Simpan perubahan dengan Ctrl+S, lalu lihat hasilnya di browser.

## 4. Simpan itinerary

Mode lokal memakai satu identitas demo, tanpa registrasi. Tombol Simpan menyimpan data di localStorage browser, bukan akun online atau database pusat. Data hanya terlihat pada browser dan alamat yang sama. `localhost` dan `127.0.0.1` memiliki penyimpanan berbeda. Menghapus data situs/browser dapat menghapus itinerary. Jangan gunakan data pribadi sensitif.

## 5. Pemeriksaan sebelum perubahan diterbitkan

```sh
npm run build
npm run preview
```

Build menghasilkan folder `dist`. Preview tersedia pada http://127.0.0.1:4173 dan memiliki ruang simpan browser tersendiri. Ini bukan perintah untuk menerbitkan website.

## Status dan batas paket

Harga, jadwal, bintang/rating hotel, dan ongkos transportasi masih simulasi. Gambar hotel adalah ilustrasi. Peta online dan tautan penyedia membutuhkan internet. Afiliasi dan harga live belum terhubung. Ini salinan pengembangan lokal, bukan migrasi layanan produksi. Akun ChatGPT/Sites dan database online tidak disertakan. Perubahan di laptop tidak otomatis mengubah website sortTrip yang sudah terbit.

Sebelum digunakan publik perlu backend, autentikasi nyata, database per pengguna, integrasi penyedia, dan pengujian keamanan. Jangan menaruh API key di kode frontend.

## Alur kerja perbaikan

Catat masalah di `WORKFLOW.md`, kerjakan satu perubahan, jalankan build, lalu uji skenario pengguna terkait. Gunakan Git untuk riwayat perubahan ketika siap.

## Referensi dan kredit

Panduan Vite: https://vite.dev/guide/
Foto Kuala Lumpur: Jayden Sim / Unsplash https://unsplash.com/photos/Aja8j63bqcE
Foto Singapura: Wengang Zhai / Unsplash https://unsplash.com/photos/Jg5de3v42y0
Foto Wat Arun: Diliff / Wikimedia Commons https://commons.wikimedia.org/wiki/File:Wat_Arun_from_Chao_Phraya_River.jpg (CC BY 2.5, dipotong untuk tampilan).
Foto hotel: sumber dan kredit tersedia di `app/hotel-photos.ts` serta antarmuka.
Peta: OpenStreetMap contributors.

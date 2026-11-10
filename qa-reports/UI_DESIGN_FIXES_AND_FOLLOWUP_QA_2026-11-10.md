# Perbaikan desain dan QA lanjutan — 10 November 2026

Status: perubahan lokal teruji, **belum commit/push/deploy** pada task ini. Website online dipakai untuk verifikasi alur hotel existing, bukan bukti bahwa perbaikan baru sudah online. Guide tidak diubah atau diaktifkan.

## Perbaikan yang diterapkan

1. **12Go mobile/desktop:** CSS pada dokumen embed milik aplikasi menyusun empat field menjadi satu kolom pada ponsel dan empat kolom desktop. Override lebar/float vendor yang menyebabkan field menyusut; endpoint, affiliate, formhandler, sandbox dan atribusi tetap. Tidak menulis ulang pencarian supplier.
2. **Editor lebih ringkas:** jadwal pesawat, tanggal/traveler/budget dan returnflight dikelompokkan di disclosure `Trip details & settings`. Isi dan callback tetap; dapat dibuka kapan saja. Pada itineraryyangdiuji, posisi dokumen tab turun dari sekitar948px menjadi764px. Masih ada kuota dan warning asli yang tidak disembunyikan.
3. **Biaya:** tabel lima kolom pada desktop (kategori,item/status,sumber,detailbooking,jumlah); kartu pada layar sempit. ItemBooking existing berada pada disclosure per baris. Edit, purchasedmarker, sumberharga dan tautan tetap; membuka details tidak menjalankan pembelian.
4. **Budget parsial:** `small` menjadi block dengan jarak; angka dan peringatanunknown tidak lagi berdempetan.
5. **Bantuan:** utility Continueitinerary dipindahkan keluar areahero ke surfaceputih dengan linkberbingkai sehingga terbaca.
6. **LiteAPI search UI:** radius, jarak, form dan hasilhotel mengikuti kartu desktop/mobile yang sama. Ini presentasi; logika pencarian/harga tidak berubah.

File: `app/travel-app.tsx`, `app/transport-widget.ts`, `app/i18n/locales/{id,en}.json`, `app/ui-alignment/index.js`, `app/ui-alignment/boards/refinements.css`. Script perubahan lokal `scripts/refine-responsive-design-20261110.py` bukan runtime. Tidak mengubah Worker, database/schema, billing, credential, quota, providerAI atau bookingterms.

## Hasil verifikasi

| Uji | Hasil |
|---|---|
|7suite terarah|**56 PASS,0 FAIL,0 skipped**; tidak mengulang tesGuide|
|TypeScript dan Vite build final|**PASS**; log `ui-exact-2026-11-10/design-fix-build.txt`|
|AST kontrak presentasi|**PASS**, callback submit/change enam komponen dan propsAIPlanner identik baseline; tidak membuktikan seluruh interaksi secara otomatis|
|Guide source/CSS/trail diff|Tidak ada perubahan|
|12Go iframe390px|clientWidth329=scrollWidth329; semua4field lebar299px/tinggi44px; tidak scrollbarhorizontal|
|12Go iframe1440px|clientWidth1240=scrollWidth1240;4kolom sekitar292px; tidak scrollbarhorizontal|
|Disclosure tripsettings|Buka/tutup PASS; flightdan3kontrol tetap tersedia; tidak mengubah nilai|
|Biaya desktop/mobile|11baris/5header pada itineraryuji; details buka/tutup PASS; tombol bookingexisting tetapada; tidakoverflow390/1200/1440|
|Bantuan desktop|Utilitybottom124px, herotop140px; posisi static di luar foto|
|Label budgetparsial|Computed displayblock; tidak mengubah jumlah/statusharga|

Screenshot lokal di `ui-exact-2026-11-10/design-fixes/` dan `GALLERY.html`.

## Pengujian baru terhadap layanan existing

### Hotel online — PASS sampai formulir tamu

MyTrips itineraryKL mendatang14–21Nov2026 → Find/changehotel → satu Findhotels nyata → SpaceHotel → BookinSortTrip → Viewavailablerooms → Chooseroom. Rate SingleCapsuleMixed tersedia; total saat cekRp1.444.171 untuk7malam/1dewasa, nonrefundable. Harga berubah dari hasilsearch dan tidak dikunci; jangan dijadikan penawaran tetap.

Formulirtamu berhasil dibuka dan di-reload pada tab lain. Desktop dua kolom; mobile390px satu kolom, input16px, tidakoverflow. Consent tetapfalse dan tombolproceed disabled. Photos/facilities/reviews berhasil memuat data supplier.

**Efek samping terbatas:** memilih kamar membuat satu draftcheckout uji pada akunowner lewat alurproduk. Tidak mengedit itinerary, tidak Select&savehotel, tidak isi data tamu, tidak centangketentuan, tidak prebook/payment/confirmreservation. Draft tidak dihapus/reset. Berhenti di formulirtamu mengikuti keputusanowner sebelumnya; SDK/portalpayment belum diujiulang.

### Pesawat exact-date — BELUM TERBUKTI

Satu pencarianlocal nyata dilakukan. Otomasi mengisi DOM21–24Nov tetapi setelah renderkontrol lain nilai tanggal kembali kosong. Hasilcheapest7Dec menunjukkan tanggal belum masuk stateReact pada interaksiotomasi itu; sourcebackend memfiltertanggal dan frontendresolveSearchDates mempertahankan tanggal yang terisi. Ini bukan bukti bug filterproduk. Jangan klaim exact-datePASS; perlu uji dengan pemilih tanggal native/owner atau otomasi input yang benar. Tidak mengubah logika date/API berdasarkan percobaan yang tidak valid.

### 12Go — tampilan PASS, E2E formwidget BELUM TERBUKTI

Kolom dan tombol terlihatutuh. Browserautomation mendeteksi tomboliframe tetapi interaksi klik/keyboard gagal pada focusroot; tidak memaksa eksekusiJS/formsubmit. JalurpartnerCTA membuka halaman12Go normal. Tidak mengklaim embeddedFindTickets→hasil→checkoutPASS. Uji diChrome/Edge biasa masih dibutuhkan. Pencarian pada halamanmitra juga tidak selesai karena keterbatasan inputtool; tidak membeli.

## Batas dan tindak lanjut

- Semua perbaikan baru masih lokal. Tidak menyatakan seluruh halaman identikpiksel dengan rasterboard atau seluruhfitur sudahE2EPASS.
- Loginbaru/OTP tidak dioperasikan agent; sesiownerexisting dipakai. Tidak ada Meta inference baru; pendingledgerhistoris tidak disentuh.
- Guide tidak berubah, tidak aktivasi, tidak GPS/chat/riset.
- Pembayaran/prebook memerlukan tindakanowner sesuaihuman-in-the-loop; tidak menganggap tomboldisabled sebagai SDKpaymentPASS.
- Jika owner menyetujui rilis, deploypaketbaru setelah review; jangan menjalankan migrasi atau resetdata untuk merilis perubahanpresentasi.

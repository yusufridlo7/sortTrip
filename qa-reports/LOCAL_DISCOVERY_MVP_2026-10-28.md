# AI Local Discovery MVP — hasil pekerjaan

**28 Oktober 2026 · Implementasi lokal, belum deploy.**

## 1. Fitur yang diimplementasikan

Tour Guide kini memiliki **Jelajahi Sekitar** dengan kategori Makanan terdekat, Kuliner khas dan populer, Oleh-oleh khas, serta Wisata sekitar. Lokasi awal mengikuti destinasi itinerary yang sedang dibuka.

Tombol **Gunakan lokasi saya sekali** meminta browser GPS hanya ketika diklik: satu `getCurrentPosition`, batas waktu8detik, tanpa watchPosition, tracking berkelanjutan atau background. Izin ditolak/timeout/tidak tersedia kembali ke destinasi itinerary. Hasil yang terlambat setelah keluar/ganti destinasi diabaikan. GPS hanya di memori browser dan tidak dimasukkan ke item atau Save. Maps hanya menerima tujuan, tanpa originGPS dari fitur ini.

Kartu menampilkan nama, kategori, deskripsi ID/EN, tingkat verifikasi lokasi, sumber, detail dan Maps. Jarak merupakan **garis lurus**, hanya dihitung bila koordinat titik awal dan tempat tersedia. GPS mode memakai radius10km dan tidak menyebut tempat tanpa koordinat sebagai “dekat pengguna”. Cakupan terbatas ditampilkan secara eksplisit; tidak ada reverse-geocoding/API pencarian tempat global.

Pertanyaan makanan/oleh-oleh didukung pada panel lokal dan Q&A Tour Guide. Pertanyaan murah mengakui belum dapat menentukan termurah tanpa harga; pertanyaan halal tidak mengubah status unknown menjadi halal/nonhalal. Filter **Hanya status halal terverifikasi** tidak menampilkan tempat jika belum ada bukti. Q&A memakai referensi deterministik, bukan inferensi AI live.

**Pilih tempat → pilih hari/jam → Tambahkan ke itinerary** menggunakan state editor existing. Semua item lama, termasuk paid/AI-locked dan parameter booking, dipertahankan. Duplikat ditolak, input hari/jam divalidasi, data tempat di-resolve ulang dari katalog sehingga koordinat/harga palsu dari caller tidak ikut tersimpan. Makanan masuk kategori Makan; aktivitas/belanja memakai Wisata existing dengan tujuan kunjungan ditulis di catatan. Harga tetap unknown, bukan gratis.

Item makanan kini juga terlihat pada WorldPlanner. Tombol **Simpan itinerary** existing tetap dipakai; di demo penyimpanan hanya browser. Mekanisme auth/database aplikasi biasa tidak diganti atau dilewati.

## 2. Data nyata versus fixture

| Data | Status dan batas |
|---|---|
| Wisata dari placeCatalog existing | Identitas/koordinat referensi; termasuk Wat Arun/Wat Pho. Dapat menghitung jarak, bukan live opening/availability |
| Wang Lang Market | Referensi pasar/distrik Bangkok Noi; koordinat presisi belum diverifikasi, sehingga jarak tidak dihitung |
| Tha Maharaj | Nama, direktori shops/restaurants dan alamat dari situs resmi; bukan offer/restoran termurah, tanpa pin presisi terverifikasi |
| The Old Siam | Panduan pemerintah Bangkok menyebut sutra Thailand, kerajinan dan makanan ringan; pin lokasi/stok belum diverifikasi |
| Harga/jam buka/rating | Tidak diada-adakan. Tidak tersedia pada katalog ini; tidak ada klaim termurah/rating/realtime |
| Halal | Seluruh record sekarang unknown; belum ada sertifikasi terverifikasi |
| Kota/kategori tanpa referensi | Daftar kosong, lalu opsi **Lihat contoh alur berlabel demo**. Fixture bernama generik DEMO, tanpa lokasi, jarak atau tautan Maps palsu |
| Tes GPS, pengenalan video, suara dan Save database | Fixture/stub/memori; bukan bukti permission GPS fisik, Meta, audio fisik atau RLS live |

Sumber kurasi: [panduan pemerintah Bangkok](https://invest.bangkok.go.th/shopping-mall/), [Wang Lang—Tourism Authority of Thailand](https://www.tourismthailand.org/Attraction/wang-lang-market-2), [alamat resmi Tha Maharaj](https://www.thamaharaj.com/location), [direktori resmi toko/restoran](https://www.thamaharaj.com/shops-restaurants). Ini referensi tersimpan yang diperiksa28Oktober2026, bukan integrasi provider baru atau pembuktian inventori saat ini.

## 3. Berkas berubah

| Berkas | Tujuan |
|---|---|
| app/local-discovery.tsx dan .css | Panel kategori, GPS satu kali, pertanyaan lokal, detail, Maps, tambah hari/jam, mobile |
| lib/local-discovery.mjs dan .d.mts | Data referensi, filter/jarak, GPS bounded, Q&A, deduplikasi, penambahan aman |
| app/tour-guide.tsx; lib/tour-guide.mjs | Entry Nearby, callback editor, sumber jawaban dan routing pertanyaan lokal |
| app/item-booking.tsx | Meneruskan callback edit ke Guide tanpa menghapus booking |
| app/world-planner.tsx | Callback dan visibilitas item Makan |
| app/travel-app.tsx; app/route-map.tsx; app/mvp-demo.tsx | Meneruskan hasil tambahan ke state itinerary yang sudah ada |
| app/i18n/locales/video.json | Seluruh microcopy baru ID/EN |
| checks/local-discovery.test.mjs | Unit/integrasi data/GPS/itinerary/privacy |
| scripts/qa-local-discovery-browser.mjs | Acceptance Nearby memakai GPS stub dan browser lokal |
| scripts/qa-mvp-browser.mjs | Memperjelas scope selector Q&A/Maps setelah ada panel baru |
| Dokumentasi progres/arsitektur/keputusan | Bukti dan batas implementasi lokal |

Tidak mengubah ID affiliate, provider adapter, credential, formula anggaran, SQL, RPC, RLS, atau konfigurasi production. Perubahan lama pada working tree dipertahankan.

## 4. Tes dan hasil

- **149tes terarah lulus,0gagal/skip**, mencakup Nearby, GPS granted/denied/timeout/unavailable, fixture tanpa data, Maps, duplikat, preservasi item booking, persistensi memori, video, editor hari, flight/hotel/transport/Viator/affiliate. Bukan seluruh suite repository.
- TypeScript dan build demo terisolasi lulus.
- Browser Nearby lulus: default destinasi tanpa permintaan GPS otomatis; denial fallback; granted satu kali; radius/jarak; kategori food/souvenir; unknown price/hour/halal; pencegahan duplikat; tambah restoran hari2pukul12:30; Save browser/full reload; GPS tidak tersimpan; ID/EN; mobile390px; fallback fixture tanpa Maps.
- Regresi browser existing juga lulus: MP4 sintetis→tiga frame→fixture destinasi→review/edit→browser Save/reload→flight/hotel/transport/activity UI→Guide Q&A/narasi APIstub/fallback/Maps/next.
- Kedua tes browser mencatat **0request eksternal/API terlarang dan0pageerror**. Screenshot mobile diperiksa; perbaikan label aksesibilitas hari/waktu diuji ulang.

Bukti: [tes terarah](../artifacts/local-discovery/targeted-tests.log), [hasil Nearby browser](../artifacts/local-discovery/browser-results.json), [regresi browser inti](../artifacts/local-discovery/core-regression/browser-results.json), [screenshot mobile](../artifacts/local-discovery/nearby-mobile.png), [build](../artifacts/local-discovery/build.log).

Tidak ada tes lokasi perangkat fisik, suara fisik, supplier live atau Save ke Supabase dalam pekerjaan ini. Tidak ada SQL/database write, reserve/settle, Meta berbayar, pemesanan/pembayaran, deploy, commit/push atau audit ledger ulang.

## 5. Blocker integrasi tersisa

Data kuliner/oleh-oleh nyata saat ini terbatas pada pasar/area Bangkok; belum ada provider Nearby Places live atau daftar restoran individual yang menyeluruh. Tempat tanpa koordinat tidak dapat dipakai sebagai hasil radius GPS; kategori makanan GPS dapat kosong walaupun referensi kota tersedia. Harga/jam buka/status halal memerlukan bukti sumber tersendiri. Kota lain memakai wisata berkatalog atau fallback demo yang jelas, tanpa menciptakan bisnis palsu.

## 6. Langkah berikutnya

**Owner mencoba Tour Guide → Jelajahi Sekitar di http://127.0.0.1:5175/**: kategori, GPS sekali-pakai, lalu tambah tempat dan Simpan itinerary. Server demo yang sudah ada digunakan dan tidak dihentikan oleh pengujian. Coba permission GPS sungguhan pada browser/perangkat owner; pengujian kami memakai stub. Perlu persetujuan terpisah sebelum menghubungkan provider tempat live, memakai inferensi atau melakukan deploy.

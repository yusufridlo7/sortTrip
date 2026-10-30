# Budget bebas dan pencarian termurah

28 Oktober 2026. Lokal; belum commit/push/deploy.

## Perubahan

- Budget pencarian awal kini **Berapa pun · bebas**. Tidak wajib mengisi nominal untuk mencari perjalanan.
- Pilihan **Tentukan batas** menampilkan input kosong yang wajib diisi bila mode itu dipakai. Input menerima nominal tanpa kelipatanRp50.000 (`step=any`), tetap dengan validasi nilai positif dan batas numerik backend yang sudah ada.
- Memilih bebas menghapus batas nominal. Memulai pencarian mengembalikan urutan harga termurah; filter “sesuai budget” tidak ditampilkan ketika tidak ada batas dan state filter lama dibersihkan.
- Durasi awal tetap bebas. Budget positif dari itinerary/preset yang dibuka tetap dapat dipakai atau diubah menjadi bebas.
- Nilai internal0 berarti belum ada batas maksimum. Kebijakan request planner kini menjelaskan bahwa ini bukan permintaan perjalanan gratis atau biaya nol. Pilihan ekonomis praktis diprioritaskan, tetapi harga yang tidak diketahui tidak boleh diklaim nol, termurah, atau sesuai budget.
- Input budget pada Assistant itinerary juga bisa dikosongkan dengan keterangan bebas. Data perjalanan lain, booked/locked items, harga dan kebijakan pembayaran tidak diubah.

## Verifikasi

- UI aktual: default bebas; tentukan batas; masukkan1234567 → valid tanpa step mismatch; kembali bebas → nominal tidak diwajibkan.
- Pencarian aktual tanpa batas budget dan dengan durasi bebas berhasil. Delapan kartu negara tampil dengan harga tiket naik:1434847,1885702,2715231,3198227,3544739,4429439,4889786,6697197IDR per dewasa pulang-pergi pada saat uji. Ini harga indikatif dari hasil tersedia, bukan harga terkunci atau minimum seluruh pasar.
- Pemeriksaan DOM memastikan urutan harga kartu menaik. Sumber adalah jalur baca-saja publik SortTrip/Aviasales yang sudah ada.
- Label Inggris `Any budget` dan pergantian kembali ke Indonesia diverifikasi pada UI.
- 435tes lulus,0gagal/skip; build/typecheck lulus; i18n1.640kunci,0error/literal belum diterjemahkan terdeteksi. Peringatan bundle yang sudah ada tetap ada.
- Tes tambahan membuktikan budget0 tetap0 melalui validasi, batas total positif tetap dipertahankan, batas hotel spesifik tetap terpisah, dan request model tidak menafsirkan budget0 sebagai perjalanan gratis.

## Batas hasil

Urutan aktual dibuktikan berdasarkan tiket, bukan total lengkap tiket+hotel+transportasi+wisata. Sebagian biaya lain belum tersedia atau berupa estimasi berlabel; tidak diklaim sebagai perjalanan lengkap termurah. Kebijakan ekonomis pada planner diuji pada pembentukan request, tanpa inferensi baru. Tidak memakai kuota Meta/AI, menyimpan perjalanan, membuat booking atau membayar selama QA ini. Flag QA interaktif tetap aktif untuk owner.

Bukti: `artifacts/free-budget-live.json`, `free-budget-choice.png`, `free-budget-cheapest-results.png`, `free-budget-full-tests.log`, `free-budget-build.log`, `free-budget-i18n.json`.

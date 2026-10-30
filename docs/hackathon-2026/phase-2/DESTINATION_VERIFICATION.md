# Verifikasi tujuan

27 Oktober 2026. **Sumber publik diperiksa langsung; pencocokan dan itinerary VERIFIED WITH MOCKS.** Katalog offline kini lima identitas, bukan dua. Tidak ada partner approval/API baru.

| Identitas | City/country yang diterima | Sumber koordinat |
|---|---|---|
| Muzium Negara | Kuala Lumpur / Malaysia | [OSM way 323394984](https://www.openstreetmap.org/way/323394984), bukti lama 24 Okt |
| Islamic Arts Museum Malaysia | Kuala Lumpur / Malaysia | [OSM way 659878360](https://www.openstreetmap.org/way/659878360), bukti lama 24 Okt |
| Hoàn Kiếm Lake | Hanoi / Vietnam | [Wikidata Q1151254](https://www.wikidata.org/wiki/Q1151254), diperiksa 27 Okt |
| Merlion statue | Singapore / Singapore | [Wikidata Q208760](https://www.wikidata.org/wiki/Q208760), diperiksa 27 Okt |
| Borobudur Temple | Magelang / Indonesia | [Wikidata Q42798](https://www.wikidata.org/wiki/Q42798), diperiksa 27 Okt |

Wikidata menyediakan structured data berlisensi CC0. Koordinat dikonversi dari nilai DMS sumber ke desimal; tidak memakai koordinat model. Borobudur **tidak** disamakan dengan kota Yogyakarta. Label sumber UI kini generik “Sumber lokasi”, sehingga tautan Wikidata tidak diberi label OpenStreetMap.

Pencocokan mensyaratkan nama/alias, city dan country yang tepat setelah normalisasi NFKC, whitespace dan huruf kecil. Hanya satu kecocokan diterima; alias ambigu tidak mengambil hasil pertama. Alias tempat yang sama dideduplikasi menggunakan ID katalog. Identitas diselesaikan ulang saat review→Trip dan saat metadata diteruskan, tanpa mempercayai `verified`, `geo`, atau source URL kiriman model/client.

Label verified berarti **identitas cocok dengan snapshot**, bukan bukti bahwa tempat terlihat jelas pada video. Kandidat frame tetap evidenceKind inferred, dengan confidence model yang harus ditinjau pengguna. Unknown/ambigu tetap tanpa koordinat dan memerlukan koreksi/hapus sebelum draft MVP dibuat. Destinasi review saat ini harus satu kota; multi-city itinerary dari media belum diterapkan.

Tes mencakup lima identitas, alias Vietnam, country/city salah, collision ambigu, deduplikasi, priceUnknown dan JSON round-trip draft. Tidak mengarang tarif, jadwal buka, status operasional, waktu tempuh atau ketersediaan. Katalog ini kurasi terbatas, bukan geocoder global atau data live per request.

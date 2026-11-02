# SortTrip — Project Context

## Purpose
SortTrip is an AI-assisted travel planning and booking platform focused initially on Indonesian travelers, especially people planning their first international trips and travelers who are budget-conscious.

The product should help a user move from an idea such as “I want to travel abroad cheaply” to a practical, editable trip plan and then to booking actions through external partners.

## Core user journey
1. Choose or discover a destination.
2. Enter dates or flexible dates, trip duration, traveler count, and budget.
3. Compare flight options.
4. Discover hotels/accommodation.
5. Receive an AI-assisted itinerary.
6. Discover activities, tours, transport, food, and other useful trip components.
7. Estimate and optimize total trip cost.
8. Save and edit the trip.
9. Monitor relevant prices where supported.
10. Continue to external partner/affiliate booking links.

## Product principle
AI is an orchestrator and planning assistant, not the source of truth for live commercial facts. Prices, schedules, availability, visa rules, weather, and bookable inventory should come from appropriate APIs/databases/sources when available. The AI should not invent these facts.

## Current positioning
Initial destination focus includes domestic Indonesia and Southeast Asia (including Vietnam), per owner clarification2026-10-22. Budget/value choices should be surfaced explicitly rather than sampling only premium hotels. Preserve optional worldwide searches and truthful provider coverage.
Working concept: **AI Travel Planner & Booking Assistant**.

SortTrip should combine planning across providers rather than becoming the merchant of record for every travel product during the initial phase.

## Important distinction
A feature being discussed or represented in the UI does not mean that a live supplier integration exists. Always distinguish:
- planned,
- simulated,
- implemented locally,
- connected to an API,
- partner-approved,
- tested,
- and production-ready.

## Security / owner-control policy
Passwords, OTP/2FA, CAPTCHA, API secrets, recovery codes, payment/bank information, and other sensitive credentials remain owner-controlled.

Agents may work with already-authorized sessions and environment-based configuration without revealing secret values. Never store secrets in project-memory documents.

## 2026-11-01 — Runtime context AI terpusat
worker/platform-context.js adalah sumber model-facing bersama; docs/AI_PLATFORM_CONTEXT.md menjelaskan kontrak dan prosedur sinkronisasi saat fitur berubah. Jalur AI baru/provider baru wajib memakainya sebelum egress. OpenAI restored tetap aktif; perubahan ini tidak mengaktifkan Muse/multimodal atau loop tool. Context tetap harus mencerminkan fitur yang benar-benar tersedia, bukan seluruh rencana produk.

## 2026-11-01 — Adapter Muse dan multimodal opt-in (lokal)
Owner mengizinkan implementasi adapter Muse dengan mempertahankan database/editor/booking existing. worker/ai-provider.js kini menyediakan pilihan opt-in Meta Standard dan default OpenAI, memakai konteks v2026-11-01.2. Panel lampiran Assistant menerima gambar normalized JPEG dan MP4 berizin untuk riset; hanya dua function tools read-only hotel/wisata. Belum aktivasi config, live inference, SQL atau deployment. Tenggat absolut Meta 2026-11-04T17:00:00Z tetap berlaku. Batas token/request bukan hard USD cap; billing/provider limit belum diverifikasi. Setup docs/MUSE_ADAPTER_SETUP.md; bukti qa-reports/MUSE_MULTIMODAL_ADAPTER_2026-11-01.md. Status ini menggantikan pernyataan sebelumnya bahwa source belum memiliki adapter/media, bukan bukti provider aktif.

Latest activation follow-up: owner subsequently approved local activation and paid testing. dev:worker:muse/JALANKAN-APP.bat now select Meta locally, capability configured/media=true. One UI generation failed at generic adapter safety response; no successful Meta itinerary, usage or actual bill demonstrated. Safe fixed failure codes added for the next diagnostic test,36offlinechecksPASS. No key read/change, SQL, quota bypass, deploy or automatic retry. See qa-reports/MUSE_ACTIVATION_LIVE_ATTEMPT_2026-11-01.md. Production and default non-Muse dev script remain unchanged.

Latest live follow-up supersedes that failed-only status: Muse teks+foto sekarang berhasil lewat UI login→editor→Save/MyTrips→reload. Root fixes: web-search token reconciliation, source-ID wire compression/restoration, compact output/arrival schema. No-prompt new journey measured0Meta/0OpenAI. Owner explicitly disabled OpenAI; all local launch scripts now choose Muse with server kill switch (compatibility code retained, not active). Hotel replacement unknown remains unresolved and hotel retained; speculative airport-hotel routes safely corrected.355tests/buildPASS. Production/deployment/credentials/SQL unchanged; no actual invoice/ledger balance claim. Report qa-reports/MUSE_FIX_AND_MULTIMODAL_LIVE_QA_2026-11-01.md.

## 2026-11-02 — SortTrip Guide lokal
Guide telah menjadi menu/halaman tersendiri dengan jalur checkpoint bergaris/pin logo, halaman detail dan transportasi berikutnya, serta chat kecil untuk tanya dan konfirmasi jadwal. Aktif sesudah saved itinerary final dikonfirmasi; waktu bukan bukti arrival, GPS opsional foreground. Paid/booked/locked prioritas; proposal belum mengubah itinerary sebelum user approve+Save. One real Muse chat+proposal+approved Save/reload verified; data/booking/editor existing tetap. Laporan qa-reports/SORTTRIP_GUIDE_CHECKPOINT_UI_2026-11-02.md. Tidak deploy/commit/push atau SQL/schema/credential change; cutoff5Nov00WIB tetap.
## 2026-11-02 — Latest UI contract (lokal)
Jelajahi memiliki prompt dan kamera foto/video, default Berapa hari pun/Berapa pun (budget0 tanpa ceiling, bukan gratis); lampiran ephemeral diteruskan setelah memilih perjalanan ke editor, Generate existing tetap explicit. Menu Pesawat hanya pencarian tiket, tanpa Assistant. Guide tetap terpisah dengan aktivasi setelah itinerary final dan konfirmasi sebelum perubahan. Polish desktop tahap1–8 mempertahankan handler, supplier widgets, schema, Save/booking/paid locks; bukan bukti production release. Laporan terakhir qa-reports/UI_ALIGNMENT_CROSS_PAGE_2026-11-02.md.

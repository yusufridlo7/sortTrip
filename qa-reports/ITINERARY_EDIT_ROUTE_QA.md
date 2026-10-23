# Itinerary edits, nightly hotel budget, admission references and connections

Date: 2026-10-23. Branch: `codex/qa-production-readiness-2026-10-23`. Local implementation only; no commit, push or deployment.

## Reported case

The saved Kuala Lumpur itinerary contains the owner's current prompt: “hari pertama ganti menjadi wisata museum, hotel cari yg dibawah 500000 permalam”. The museum and selected accommodation have unknown prices and lack coordinates. Existing transport text still mentions Travelodge. These saved facts were inspected without regenerating or saving the owner's trip.

## Causes and corrections

| Issue | Correction | Verification |
| --- | --- | --- |
| Selected unpaid hotel always survived regeneration | Current-message replacement IDs release explicitly requested unpaid stays; confirmed paid items remain protected. A hotel replacement must have supplier identity and cover the previous stay; otherwise preserve the old selection. | Merge regressions, including a previously AI-selected hotel with no available replacement. |
| Per-night cap never reached the supplier | Parse explicit ID/EN hotel budget; validate again on the server; retain it through target normalization. Filter comparable tax-inclusive public totals per room per night, with strict `<` for “di bawah/under”. Search bounded city inventory for a hard budget, not only a central area. | API fixtures test 300k/night, strict boundary rejection, inclusive maximum, out-of-area budget stock. |
| First-day edit could alter later sightseeing | Parse explicit day scope and retain later-day attractions, including prior AI suggestions. Default regeneration behavior remains unchanged without a scoped request. | Regression uses the exact owner's current sentence; preserves Genting. |
| Museum admission was never collected | Existing research now requests admission evidence, visitor category and original currency. Strict draft fields are nullable. Server accepts only bounded numeric facts with named-place identity, an exact excerpt in the cited research and an allowlisted source. Render as a tariff reference, not a live booking price. | Positive/negative reference and identity fixtures; browser verifies explicit unknown state/source link for historical data. |
| Attraction coordinates were discarded | Accept nullable cited coordinate evidence, validate both numbers and named-place identity against the research, and carry accepted coordinates onto attraction items. | Coordinate evidence/rejection fixtures. No centre-of-city substitute. |
| Missing hotel/visit connections | Build hotel → ordered visits → hotel connections from actual current items, independently of coordinates and generated Transfer entries. Add route controls in item details and the map tab. Preserve qualified excursion addresses instead of appending the overnight city. | Fixtures and actual saved-trip UI: three connections on day 1, four on day 2. |
| Maps link only appeared after API failure | Direct Google Maps directions link is present immediately inside the route disclosure. API requests still require an explicit button click. Collapsed summaries show the actual endpoints. | ID/EN server rendering and browser controls. |
| Missing coordinates could produce a misleading straight line across omitted stops | Keep available markers, suppress the connector line when an attraction is absent from mapped points, retain the missing-coordinate notice and complete text directions. | Source contract and actual map UI. |
| Dedicated transport research ran before new sights were known | Reuse the completed general research in the existing transport research call, without adding another provider call. | Existing mocked authenticated workflow tests. |

## Checks

- Full fixture regression: **269 passed, 0 failed, 0 skipped**. Socket/temp-file fixtures require the approved Windows sandbox escalation; no real Telegram delivery or payment.
- TypeScript and Vite production build passed. Existing bundle-size warning remains.
- Translation audit: 1,385 keys, 1,026 static calls, no errors or untranslated literal findings.
- Actual browser, signed-in saved Kuala Lumpur trip: museum detail opens; admission unknown/source link visible; route disclosure opens with meaningful endpoints and direct Maps link; map loads Leaflet; day selector switches to day 2 and exposes four connections. ID/EN labels checked. Existing nine AI results remain unchanged.
- Responsive map check: widths 320/390/768/1280; no document horizontal overflow, map remains initialized and all connections remain in the DOM.
- Final local public HTTP smoke: homepage, hotel-checkout and health expected 200; unknown page expected 404.

Evidence: `2026-10-23/evidence/itinerary-edit-*`.

## Limits and follow-up

- No live AI regeneration was submitted and no owner's saved itinerary was overwritten. Live model extraction quality, a newly returned hotel below 500k for these exact dates, and the museum's current admission price are **not established by fixture tests**. Historical empty admission/coordinates remain empty until a new sourced result is obtained.
- Admission references retain original currency and visitor category and are excluded from the IDR subtotal. No invented exchange rate or implication of free admission. Cited research excerpts are reference evidence, not an independent live ticket/availability check.
- Text directions cover known consecutive places; they do not prove transit service, timetable, accessibility, road geometry, fare or a previously unknown airport endpoint. Missing coordinates remain explicitly unavailable; no new geocoding service or billable Google request was introduced.
- Hotel search is bounded to the existing supplier sample and safeguards, not proof of cheapest city-wide stock. Failure to match preserves old selections and explains the unmet nightly budget.
- Existing saved manual transfer text can still name an old hotel. Current connection controls derive endpoints from current lodging/visits; manual or paid route facts are not silently rewritten as newly verified services.
- No credentials, financial flags, White-label integration, partner approval or deployed production configuration changed.

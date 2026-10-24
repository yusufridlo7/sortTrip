# AI itinerary locks and stale hotel transfers — 2026-10-24

Implemented locally; no commit, push or deploy.

## Cause and correction
`userEdited` previously implicitly protected transfers and manually edited AI entries. It is now edit provenance, not an AI lock. An explicit `aiLocked` boolean protects user-chosen items. Paid and pending supplier bookings remain protected regardless of this flag.

Both standard and world itinerary rows expose a reversible lock button, with accessible pressed state, keyboard support, disabled protection for booked items, and Indonesian/English copy. Locks survive trip JSON serialization and use the existing trip save payload; no database schema change. Click Save itinerary to persist the chosen locks to the account. Lock controls are disabled while the Assistant is working.

AI context and merge rules honor current locks even when reapplying an older plan. Unlocked manually edited entries can be regenerated; requests scoped to another day retain their day scope. Supplier-verified hotel proposals need not match the narrow client replacement keyword parser. Missing, incomplete, mismatched or over-budget hotel quotes still retain the old accommodation instead of deleting it. Flight selections and factual/source/schedule validation continue using existing supplier selection workflows.

Unprotected legacy hotel transfers are reconciled against each night's selected stay when opening/changing the local draft. The obsolete route fare, geometry, alternatives and booking link are cleared for a fresh route check. No new fare or navigable path is fabricated. Paid, pending or explicitly locked transfers stay unchanged.

## Verification
- Full regression suite:316 passed after Windows sandbox temporary-file restrictions required the approved unrestricted rerun.
- Additional price-lock regression and affected suite:24/24 passed (includes the new price test).
- TypeScript + Vite production build passed. Existing bundle-size advisory remains.
- Localization audit:1476 keys; no missing keys, interpolation mismatches or unexpected JSX literal text.
- Real local standard itinerary:19 lock controls, click-to-lock and Space-to-unlock verified; test hotel restored to unlocked.390px viewport measured no horizontal overflow.
- Current owner draft day2 now displays Sky Sentral Bus Terminal, Genting Highlands → Salak Boutique Hotel. Zero Travelodge occurrences in rendered itinerary titles.
- Corrected route remains unpriced and requires a fresh transport check. Existing duplicate/partial old plan entries are not silently deleted on page open; future AI regeneration may replace unlocked entries.
- Evidence: branding/evidence/itinerary-ai-lock-desktop.png, itinerary-ai-lock-mobile.png, itinerary-route-corrected.png.
- World planner integration verified by typecheck/build; browser interaction coverage above is the standard KL planner. Account database save/reload and paid-model generation were not performed; no AI quota, booking or payment used. Existing owner draft remains unsaved, preserving user control over account persistence.

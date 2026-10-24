# Hotel change and final KLIA overnight — 24 October 2026

Status: owner-authorised deployment complete on 24 October 2026. Version `8e0b708d-46f0-4700-a549-da678fa8db80`. Source remains uncommitted (owner requested deploy only). Existing account itinerary was not changed and no successful AI result was consumed.

## Reported problem and causes

The owner requested a budget hotel and a final overnight near KLIA. The saved result instead used the same city hotel for both nights, with transfers still naming Travelodge.

- Budget discovery deliberately searched city-wide and passed no area constraint. Consequently the model's airport-area preference did not constrain the supplier choice.
- The final airport overnight was only prose in the prompt. The server neither required it nor separated its location before hotel grouping.
- Old unprotected hotel transfers were sent back as route requests. Hotel enrichment/merge did not reconcile their endpoints after selecting a different property.

## Corrections

- Parse explicit Indonesian/English final-day/night accommodation near KLIA, including the reported `dekan` typo, as the final **night**, `days - 1`. One-day trips and explicit negative instructions do not create this constraint. Server derives it from the message, not a client-supplied override.
- Keep earlier city nights separate; scope the final overnight to KLIA/Sepang. Require a final area row in the model draft (or an existing retained stay covering that night). Missing coverage invokes the existing bounded correction/failure path.
- Search `/hotels/rates` by the existing KUL map coordinates with a 20,000-metre radius. Independently reject coordinates outside that radius or absent coordinates. This is a straight-line planning radius, not a driving-time or shuttle guarantee. No city-centre fallback for an unmet airport constraint.
- Retain exact dates, occupancy, public tax-inclusive price validation, nightly budget cap, paid/held bookings and complete-stay replacement checks. The client also rejects a replacement covering the airport night without matching coordinates.
- Stop feeding unprotected obsolete hotel routes back as required routes. Reconcile mutable transfer hotel endpoints by the selected overnight and morning origin. Invalidate the old fare, route options, duration, supplier reference and booking link after an endpoint changes; keep a clear Google Maps recheck instruction. Preserve paid, held and manually edited transfers. Existing item/map connection controls use the corrected endpoints. No new Google Routes API request was made.
- Report an unresolved airport hotel search explicitly instead of claiming the requested move succeeded. Do not erase an existing stay without a complete quoted replacement.

## Verification

- Full regression: **307 passed**, zero failures (Windows loopback/temp-file tests require the approved outside-sandbox rerun).
- Focused coverage: final-night parsing/split; cheap city-hotel rejection; missing-location and missing-night failure; whole-stay quote replacement; stale Travelodge endpoints and price invalidation; unchanged correct morning routes; protected bookings; map directions from the city hotel to visits and onward to the airport hotel.
- Production build and TypeScript: passed. Existing main-bundle size advisory remains.
- Localization coverage: 1,467 keys, zero errors/untranslated JSX literals. New route and unresolved-search notes support ID/EN.
- Actual read-only supplier test through the local Worker with owner-configured credentials: **31 January–1 February 2027**, one adult/one room, strict below IDR500,000/night. A valid quote was returned for **S Rose Hotel, IDR244,048.58 total**; coordinates `2.82523,101.70613` passed the KLIA radius check. Supplier availability/prices may change. Evidence: `artifacts/airport-stay-live.json` (local ignored aggregate).
- No authentication handling, credential read/change, booking, payment, itinerary write or AI quota debit. Full live model regeneration of the owner's saved trip was not performed. The existing saved itinerary still needs an explicit update after a release; this local change does not silently rewrite production records.

## References

- [LiteAPI rates documentation](https://docs.liteapi.travel/reference/post_hotels-rates): latitude/longitude/radius (metres) and airport search methods on the existing rates endpoint.
- [Official Sama-Sama location page](https://www.samasamahotels.com/location-map/): KLIA/Sepang geographic reference only; no selection or price claim for that property.


## Production release verification

Owner explicitly requested deployment. Final TypeScript/Vite build passed; deployed with `wrangler.hotel-browser.jsonc --keep-vars`. Previous version `ede52a3d-de0e-4cad-8945-9a5433c82f9a` retained as rollback reference. Homepage200 and exact new asset `/assets/index-ClXlPHEF.js`200/hash match local build; health200; recommendations200/three cities; unauthenticated itinerary401. Smoke evidence: `artifacts/airport-release-production-smoke.json`. No live model generation, booking, payment or saved-account mutation for deployment QA. Existing itineraries need an explicit Assistant update to apply changed hotel selection. No commit/push performed.

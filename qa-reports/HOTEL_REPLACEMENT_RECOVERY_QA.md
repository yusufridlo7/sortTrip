# Hotel replacement and budget discovery QA — 24 October 2026

## Result
Implemented locally; not committed, pushed or deployed. Owner reported a budget-hotel change returning an itinerary with only an unpriced area and no selected hotel. The historical AI response/provider timing was not captured, so the exact sequence of that particular generation is not asserted.

## Reproduced defects and corrections
1. Prior AI-generated lodging was excluded from retained items unless manually edited or paid. An unrelated regenerated day could therefore remove it. Existing lodging is now retained unless explicitly requested and fully replaced.
2. Model activity IDs restart on each response. An eligible replacement hotel could share an ID with a retained attraction; the final merge silently discarded the new hotel after removing the old one. New IDs now avoid collisions and carry their price/leg-quote identity correctly.
3. Replacement eligibility previously relied on hotel identity/date coverage before applying returned prices. Now supplier quote normalization runs first. Full stay/date/occupancy/tax/room validation, budget and overlap checks precede deletion. Partial, failed, malformed or over-budget replacement preserves the previous stay. Paid/pending stays remain protected; overlapping stays are resolved to a stable set before removal.
4. Transport legs could consume all12 bounded pricing targets. Lodging now comes first, and deterministic hotel queries run before transport-page research consumes the shared deadline.
5. AI budget search used first-catalogue sampling whereas the native form used city-rate discovery with a budget pass. Explicit nightly-cap AI searches now share the native city discovery, preserve the supplied deadline and strict per-room/night cap, and cache identical scoped queries within the request. This remains bounded standard-free endpoint usage under the existing allowlist, not a universal no-cost supplier guarantee.
6. ID/EN feedback explains when the original hotel is kept because no verified full-stay replacement meets the request.

## Actual read-only tests
- Production native hotel search: Kuala Lumpur,30Jan–1Feb2027,1adult,one room,maxRp500000perroom/night,tierbudget. HTTP200 in6.7seconds:147hotels checked,23eligible results,partialfalse. Examples:RiccartonCapsule~Rp244580/night,SpaceHotel~Rp254562/night,HotelOCrossroads~Rp276015/night. These are current quoted public totals, not held inventory or confirmed bookings.
- Corrected AI pricing adapter in a separate loopback-only temporary Worker with existing private runtime configuration: passed in10seconds,12candidate results retained for diagnostics, one selected supplier quote. RiccartonCapsule totalRp489159.17 for two nights (~Rp244580/night), exact dates/oneadult/one room. No AI generation, quota consumption, user itinerary save or booking/payment.
-291full fixture tests pass. TypeScript/Vite build and bilingual static translation audit pass (1416keys/1038calls, no missing keys or untranslated JSX).
- Regression cases include existing AI hotel preservation, ID collision with retained attraction, valid budget replacement with applied price, no/invalid/partial/over-budget quotes, overlap dependency, paid/pending protection, and hotel-target priority over15transfers.

Evidence retained locally:artifacts/hotel-budget-live.json,hotel-budget-adapter-live.json,hotel-retention-regression.tap,hotel-retention-build.log,hotel-retention-i18n.json. Temporary probe code/config is not part of production routes. Secret values were neither inspected nor changed; existing account markup preserved.

## Limits
No fresh full model generation or owner-trip mutation was performed. Exact airport-neighborhood matching, another date/occupancy, positive booking/payment and recovery of already-overwritten historic choices are not verified. Earlier lost selections are not automatically reconstructed from unknown prices. New production behavior requires an owner-authorized release, then a new search/update; saved hotel areas cannot be turned into real hotel inventory without a quote.

# Location verification

27 Oct 2026, local; start/end HEAD `737fbc5636145fc27a0bf4ac41be831835dfbd44`.

Reuse: moved the two existing `app/verified-places.ts` museum records into `lib/video-itinerary.mjs` and re-exported them through the original helper. Existing callers keep the same exact alias behavior. Catalog identity is based on exact normalized alias + city + country, with public OSM source/feature IDs and existing coordinates. No new geocoding or provider call.

Supported identities: Muzium Negara/National Museum of Malaysia, OSM way 323394984; Islamic Arts Museum Malaysia, OSM way 659878360. Provenance was checked in the pre-existing 24 October project records; this phase did not refresh OSM data or prove current opening/closure status. UI explicitly says identity match, not current availability.

NFKC/case/space normalization, canonical-ID deduplication and name+city+country fallback deduplication do not perform fuzzy geographic substitution. An unknown museum, incorrect country/city, visual guess or ambiguous generic name remains unverified without coordinates. Manual edits must match the catalog before inclusion. No city-center marker is substituted.

The catalog is intentionally tiny: arbitrary Wat Arun/Hanoi/Singapore attractions are **not** newly verified by this feature. Multi-city automatic generation is rejected. Reliable closure/seasonality, accessibility and opening hours remain unknown. Expand source-backed coverage or approve an appropriate geocoder separately; no paid geocoder was used here. Browser QA verified the existing map renders the first museum marker from the generated draft, with missing route data described honestly.

# Ten-result Trip Pass and travel UI refresh — 2026-10-11

New purchases: Rp15.000,30 days,10 successful Assistant results shared across all trips. Existing20-result passes keep their original balance/expiry. Failed generations remain uncounted; manual editing stays available.

## Database release prerequisite

Owner reviews and applies `supabase/trip-pass-10.sql` through the normal Supabase SQL workflow. This replaces the existing payment settlement function to grant10 for future payments and changes the default for new rows. It does not update existing pass limits/counters/expiry or create payments. RLS/function access restrictions and refund revocation are retained. Repeated notifications retain the same grant through the existing payment-reference conflict rule. **Migration not applied by agent.** Do not release purchase copy before database grant policy is updated. No credentials need to be shared.

Checkout rejects repurchase if any unexpired account pass has remaining results, including older20-result passes. Fully exhausted passes no longer hide the purchase button; pending checkout may be continued rather than duplicated. Existing manual editing/AI reservations/auto-save/map/partner integration remain.

## UI

Horizontal sortTrip wordmark with arrows after the text, matching arrow favicon, firmer system font. Shared styles for header, search fields, travel cards, price breakdown, Assistant composer/messages, pass state, itinerary, partner selection and44px actions. Information controls and estimate labels retained. No external fonts, supplier scripts or security changes introduced.

## Validation

Browser preview: homepage and Hotel navigation rendered;390px DOM measurement shows no horizontal overflow. Preview4173 has no live backend regression claim. Owner payment and authenticated exhausted-to-new-pass integration remain pending database/application/release. Build and fixture tests recorded in project progress.

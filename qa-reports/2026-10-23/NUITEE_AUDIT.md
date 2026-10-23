# Nuitée hotel audit

Audit date: 23 October 2026 (Asia/Jakarta). Branch: codex/qa-production-readiness-2026-10-23. Local QA fixes only; no commit, push, deploy, migration, credential/financial setting change or real booking/payment/customer message. Pre-existing owner changes were preserved.

White-label Nuitée is outside the active product path and is not a release gate. Standalone Hotels uses Trip.com; itinerary hotels use Nuitée API + Payment SDK.

## Verified now

Fresh bounded local production search for Yogyakarta, 30 Jan–1 Feb 2027, one adult,one room, IDR 100,000–400,000/room/night:187 hotels checked,178 matched before budget,47 returned,partial=false,capped=true. Omah Atik total IDR 294130.31 (~147065.155/night),Cempaka308357.45 (~154178.725/night),Bring In House336273.09 (~168136.545/night). These are supplier quotes, not held stock, guaranteed lowest prices or reservations.

Omah Atik content 200: 24 photos, 2 room types, 36 facilities, 10 reviews. Content units/availability depend on supplier; absence is not fabricated. Cancellation RFN/NRFN, taxes, currency, total-stay vs nightly/room, occupancy and public/member price validation covered by contracts. Browser native form ID/EN passed seven widths; inverted budget rejected, clearing resets it. No hotel was saved or booked during QA.

## Checkout and commercial limits

Nuitée API + Payment SDK is the active itinerary path. Historical owner evidence establishes form rendering from Indonesia, not a completed production reservation. Local checkout history503 reflects local readiness/configuration; production unauthenticated401 only verifies a protected enabled route. Do not reactivate approval flags, rotate keys or require White-label repair. Owner-published default5%margin is inherited; no extra frontend markup added. Actual settlement/payout unverified. LAS-3185 card liability remains a commercial question, separate from the retired White-label.

## Cost controls

Source endpoint allowlist blocks Places and price-index paid paths; bounded catalogue/rates sampling with at most two discovery-rate calls plus a metadata fallback, capped results; content fetch on demand; backend rate limits/validation/timeouts and adapter fixture coverage. Normal core/content pricing is described in provider documentation, but account add-ons, fair-use/look-to-book and financial terms were not independently attested. Do not promise all requests universally free. Pricing documentation reviewed earlier in this audit: https://docs.liteapi.travel/reference/api-pricing-usage-costs (Price Index examples conflict across docs; blocked here).

## Remaining

E2E-NUITEE-FINANCIAL requires owner-operated controlled authorization/3DS, Book,status recovery,cancel/refund and settlement. White-label branding/domain/403 are OUT OF SCOPE by latest owner direction, not failed active-path tests. Source sampling does not prove all budget hotel inventory in every city or Vietnam. Prior same-day Hanoi production quote exists in project memory; this evidence file newly repeats Yogyakarta only.

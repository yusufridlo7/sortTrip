# LiteAPI Payment SDK hotel checkout

Implemented locally on2026-10-14; not deployed or enabled. No real Prebook, payment or Book performed by agent. Eight fixture tests cover public-rate validation, owner isolation, encrypted storage, final terms consent, concurrent booking exclusion, and uncertain-response reconciliation. Provider SDK rendering/3DS, live payment authorization/refund, SQL engine concurrency and actual booking confirmation remain unverified.

## Flow

Hotel menu or itinerary LiteAPI hotel → /hotel-checkout (new tab preserves itinerary) → authenticated single-hotel room search → choose checked public full-stay offer → contact/lead guest for each room and initial consent → server Prebook → review exact final supplier terms → explicit payment consent → official SDK portal → provider redirects to server-owned checkout UUID → explicit confirm reservation → backend Book with stored transactionId/prebookId and unique clientReference → verified confirmation or uncertain state → read-only reconciliation by clientReference.

No White-label required. Existing White-label403/support ticket is independent; broken click-outs removed from active hotel actions. Room search supports1–8adults,one/two adults per room, no children, IDR, Indonesian guest nationality, max31nights. API supplier hotel ID is fetched and validated; client prices/offer IDs/payment IDs are never trusted. Standard public tax-inclusive offers only; prebook amount must equal public display amount. Unsupported/mismatched responses fail closed before showing payment portal. Price/room/cancellation/board changes require a fresh selection. This strict parser needs real sandbox response validation, not a claim every supplier response passes.

## Owner prerequisites

1. Review and apply supabase/liteapi-checkout.sql in the intended Supabase project. Private RLS table; only service_role can read/write, no customer direct table access. claim_hotel_checkout atomically claims each Prebook/Book attempt. SQL has not been executed by agent. No trip/pass/payment tables changed.
2. For an owner-operated sandbox test, privately configure existing LITEAPI_API_KEY with sandbox access, OWNER_USER_ID and non-secret LITEAPI_CHECKOUT_MODE=sandbox/LITEAPI_CHECKOUT_ENABLED=true in the test Worker only. No owner ID, key, or private config was read or modified by agent. Customer hotel searches continue rejecting sandbox offers. Open a documented sandbox hotel/dates checkout URL to test independently of customer search.
3. Owner operates SDK payment, using only the supplier's documented test card. No real card, OTP or production transaction during sandbox test. Agent never enters payment details. Confirm guest data/terms submission and retain actual response evidence without copying identifiers/secrets into project logs. Test declined/abandoned payment, refresh/reopen, unknown booking recovery and duplicate-click behavior.
4. Production requires supported production key, provider payment entitlement/commercial terms and explicit owner activation. Configure LITEAPI_CHECKOUT_MODE=live, LITEAPI_CHECKOUT_ENABLED=true and LITEAPI_BOOKING_LIVE_APPROVED=true only after review and separately authorized deployment. Adapter requires prod_/live_ key classification; alternative official key formats need documented verification before changing gate. Do not enable flags merely to make an error disappear.

## Security and boundaries

- No card input or card storage in SortTrip; payment form is loaded on explicit action from https://payment-wrapper.liteapi.travel/dist/liteAPIPayment.js?v=a1. Existing affiliate loader is skipped on /hotel-checkout. Client secret is sent only to the authenticated checkout owner over a no-store response for SDK use; never localStorage/sessionStorage/logged/placed in return URLs by SortTrip.
- Guest data, supplier offer/prebook/transaction identifiers and SDK client secret are sealed using purpose-derived AES-GCM from the existing runtime LiteAPI key, random IV per write. No new credential generated. Key rotation requires a migration/recovery plan for in-flight encrypted checkouts; losing the key makes their private payloads unavailable. Table metadata contains hotel/date/price/state and owner identity, not card data. Standard account/backend access protection still applies.
- Public business checkout UUID in returnUrl is a lookup reference, not authentication. Every endpoint authenticates and restricts owner/environment. Provider redirect/payment status is never treated as booking confirmation. Book only uses TRANSACTION_ID from sealed server Prebook; no wallet, credit line or merchant-card debit fallback.
- Unknown/time-out Book stays uncertain; do not automatically submit another booking or payment. Status checks query the provider by persisted clientReference, validate hotel/dates/reference/status, then update the private record. Confirmed requests are idempotent. Provider payment validation must still be verified live; clicking a button cannot prove payment.
- Selection expires after15minutes as an application limit, not a statement of provider offer lifetime. Payment-portal reopening is also limited; after a payment attempt, final Book can reach provider even after local expiry to avoid blocking a paid user's confirmation. Provider may reject expired Prebook; status remains uncertain and needs support. No automatic refund/cancellation implementation or email promise; provider confirmation code may arrive later.
- Booking history is a private checkout page view. Confirmed records persist separately; current implementation does not automatically mark a trip item paid, edit its budget, or send confirmation email. Manual itinerary purchased markers remain separate from provider proof.
- Trip Pass/Midtrans/AI successful-result quota untouched. No booking activation, credential/SQL/billing change, transaction, commit/push/deploy performed.

Official references reviewed2026-10-14:
- https://docs.liteapi.travel/docs/user-payment
- https://docs.liteapi.travel/docs/hotel-integration-guide
- https://docs.liteapi.travel/reference/post_rates-prebook
- https://docs.liteapi.travel/reference/post_rates-book
- https://docs.liteapi.travel/reference/listbookings
- https://docs.liteapi.travel/reference/get_bookings-bookingid

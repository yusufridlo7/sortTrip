# SortTrip — Partner & Affiliate Register

**QA evidence / scope — 2026-10-23:** Fresh bounded local Nuitée production rates200:47Yogyakarta budget offers for30Jan–1Feb2027/oneadult/one room/100–400kIDR per room/night; sample OmahAtik content200/24photos/2roomtypes/36facilities/10reviews. Actual public production Viator search200/one from-price product; local environment still sandbox. Authenticated local GoogleWALK200/44min/3km, counters working. These establish tested read-only paths only; no new partner approval, booking, payment, commission payout or universal inventory claim. Owner explicitly removed Nuitée White-label from active product: historical403/LAS-3147 must not be a release gate. API+PaymentSDK financial lifecycle and LAS-3185 remain separate. Evidence: `qa-reports/2026-10-23/evidence/`.

**Nuitée local production/budget inventory — 2026-10-23:** Owner privately replaced local sandbox key after safe runtime category diagnosis. Fresh local adapter production HTTP200 verifies1adult30Jan–1Feb2027 actual budget rangeIDR100000–400000perroom/night:41Yogyakarta properties after172checked (including Cempaka~154179/night and RedDoorznearHartonoMall3~170127/night),1Hanoi property after261checked (FamilyTransit2~331785/night), no partial flags. This resolves local production-config/real-budget-stock uncertainty for these searches only. No new deployment/booking/payment/commission verification, credential access by agent or White-label403 resolution; provider default5% retained.

> This register must distinguish discussion from actual application, approval, API access, configuration, and production readiness.
> Never store API keys, tokens, passwords, cookies, OTPs, or other secrets here.

## Status vocabulary

## New accommodation candidates — researched 2026-10-09
Not recorded as previously contacted in project memory; status DISCOVERED only, no registration/inquiry sent or SortTrip approval inferred.
- ZenHotels: official https://www.zenhotels.com/journey/affiliate/ advertises free affiliate application, hotel search widget, deep links, banners and co-branded page; up to7% per completed stay (headline ceiling, not SortTrip terms). API eligibility and Indonesia payout/currency support UNVERIFIED. Closest candidate for hotel-only search widget.
- HotelPlanner: https://www.hotelplanner.com/Affiliate.htm advertises private-label hotel booking engine and REST API search/booking/reporting, individual/group options and negotiated revenue share. Contact Sales route; fees, approval and SortTrip commercial terms UNVERIFIED.
- Hostelworld: https://partners.hostelworld.com/faqs/ says affiliate signup free; https://partners.hostelworld.com/solutions/ offers deep links/feed and live property/destination API case-by-case through affiliates@hostelworld.com. Accommodation-budget niche rather than general hotel inventory; API approval UNVERIFIED.
`DISCOVERED` → `CONSIDERED` → `APPLICATION_STARTED` → `APPLICATION_SUBMITTED` → `WAITING_APPROVAL` → `APPROVED` → `API_ACCESS_AVAILABLE` → `CREDENTIAL_CONFIGURED` → `INTEGRATION_IN_PROGRESS` → `TESTING` → `PRODUCTION_READY`

Use `UNVERIFIED` whenever the historical record does not establish the exact status.

## Klook — latest evidence 2026-10-09

Owner supplied screenshots of the authenticated Klook Affiliate My Ads dashboard, with sortTrip selected in the widget generator, then supplied public hotel embed ad ID 1489007 and authorized local installation. Affiliate dashboard/tools availability is evidenced; this supersedes historical inquiry-only status for tools access. Hotel widget configured for Indonesian, IDR, two items, destination ID 49 (city name UNVERIFIED). Local menu integration implemented, build and 77 regression tests pass. Official browser tool cannot initialize in this session, so live widget inventory, responsive rendering, click-out and commission attribution are NOT verified. API entitlement, payout readiness and production readiness remain UNVERIFIED. No credential used or changed; no deployment.

## Viator
**Support inquiry submitted — 2026-10-01:** Owner requested contacting Viator. Official Partner Help contact form, Affiliate / API inquiry / Other Affiliate API inquiry, submitted using authorized owner name/email. Redirect to `https://partnerhelp.viator.com/en/articles/199-thank-you` confirmed submission; no ticket number displayed. Await response about persistent sandbox HTTP 401 despite Full Access/Enabled UI. No keys, local file content or credentials supplied. Avoid duplicate inquiry pending reply.
**Latest upgrade verification — 2026-10-01:** Official API page now shows selected Full Access for both sandbox and production, with Enabled labels. Owner reported replacing the API key. A fresh Node runtime loaded local configuration without exposing values and tested the existing adapter against sandbox `/partner/products/search`: upstream HTTP 401, adapter 502 / VIATOR_AUTH_REQUIRED. Upgrade UI is verified; usable local authentication and certification/production readiness are not. No production fallback or secret changes. Owner must verify the local sandbox credential and access; previous Basic Access observations below are historical.
**Latest connection test — 2026-10-01:** Owner reported local setup complete. Runtime loaded the ignored local configuration without displaying values. A real sandbox POST to `/partner/products/search` returned HTTP 401; adapter returned `VIATOR_AUTH_REQUIRED`. Stop for owner verification of sandbox credential/access. No production request was made and no key was changed. This does not establish the reason for rejection or invalidate previously observed Production Basic Access.

**Category:** Activities / tours / experiences  
**Known history:** Viator was investigated as a SortTrip partner. The owner progressed through the Viator affiliate/API onboarding flow and agreed to the displayed API/content licence terms. The project conversation subsequently treated Viator as a partner being actively set up.  
**Latest safe status:** `API_ACCESS_AVAILABLE — PRODUCTION BASIC ENABLED; LOCAL CONNECTION NOT YET TESTED`  
**Important:** Do not infer that API credentials or production API access exist merely because affiliate/API terms were accepted. Verify the dashboard.  
**Next action:** Owner configures a sandbox key in the ignored local Worker file using `VIATOR_SETUP.md`; then run a sanitized sandbox connection check before customer-facing integration.

**Latest evidence — 2026-10-01:** Owner supplied a masked dashboard screenshot showing Production keys, Basic Access and Enabled. This supersedes earlier API-access uncertainty below. No secret value was visible or read. Local backend adapter is prepared; sandbox credentials, successful requests and production integration are not yet established.

**Verification attempt — 2026-10-01:** Task `t-f3184836-28b3-40a0-9a8e-aae7444e0c6c` opened the official partner portal at `https://partners.viator.com/login` through Codex In-app Browser. The page displayed a DataDome CAPTCHA before dashboard access. Stopped for OWNER_ONLY action. Account approval, affiliate/deep-link access, API access, and account-specific integration requirements remain `UNVERIFIED`; this browser access challenge is not evidence of rejection or approval. Owner must complete the challenge and any authentication manually before browser state is checked again.

**Follow-up evidence — 2026-10-01:** After manual owner authentication, the official dashboard was visibly accessible. Account Verification displayed `Verified` and stated no action was needed. Account Settings listed the current program as `Affiliate`; My Profile displayed an 8% commission rate. Tools displayed affiliate link creation, widgets, banners, and Viator Shop. These establish affiliate account/tools availability, not tested tracking or earned commission. No link/widget was created and no payout setup was performed.

**API boundary:** Tools exposed an `Affiliate API` entry. Opening it reached an additional verification gate with `Cancel` and `Send my code`; the gate remained present on the next owner-requested state check. No code was requested or read, and no credential values were inspected. API entitlement, sandbox/production access, and API-specific integration requirements remain `UNVERIFIED`. Owner must complete this verification manually before further inspection; do not expose keys afterward.

## Travelpayouts / Aviasales

**Positive inventory verified — 2026-10-02 QA:** Official In-app Browser production search CGK–KUL return 8–11 October 2026 displayed Rp2.017.193 per adult and actual Aviasales flight details. Local regression after domestic-scope fix displayed CGK–DPS return 1–4 December 2026 Rp2.809.416 per adult. These are indicative cached Data API fares, not live availability/checkout guarantees. Existing integration is functioning for these searches; no new account or credential changes. Affiliate tracking/commission and checkout not verified. This supersedes earlier zero-result-only observations for inventory evidence.
**Latest local verification — 2026-10-01:** After owner supplied the existing token locally and the stale Worker was replaced, direct and proxied health show configured=true, and both flight searches return HTTP 200 without provider error. Zero offers matched the test query; do not claim positive inventory from that test. No account or integration was recreated.
**Runtime verification — 2026-10-01:** Public SortTrip health `flightsConfigured:true`; test flight search HTTP 200 from Aviasales Data API, no matching offers in that query. Local health false and local flight request HTTP 503; owner must supply the existing token to local Worker configuration. Do not infer a production-token loss or recreate the integration.
**Category:** Flights / affiliate flight discovery  
**Known history:** Travelpayouts/Aviasales was used/discussed as the initial direction for flight affiliate integration. Global flight search work progressed in the product.  
**Latest safe status:** `EXISTING CONNECTION CONFIRMED BY OWNER — DO NOT RECREATE`  
**Evidence:** Owner explicitly confirmed the existing connection on 2026-10-01. Code inspection also confirmed the existing Aviasales Data API adapter (`/aviasales/v3/prices_for_dates`). The separate Search API MAU requirements do not invalidate that integration.  
**Next action:** Preserve the existing integration. Do not register another account or replace/rebuild it. Recheck live behavior only when relevant and authorized.

## Hotellook
**Category:** Hotels  
**Known history:** Investigated in connection with Travelpayouts. Historical project context records that Hotellook was closed/unavailable for the intended hotel API path.  
**Latest safe status:** `NOT CURRENT HOTEL API PATH`  
**Next action:** Do not build new dependency on Hotellook without re-verifying current availability.

## Agoda
**Verification — 2026-10-01:** Official affiliate portal redirected to a login form; no authenticated dashboard or application status was available. `WAITING_FOR_USER` for manual login. No duplicate application created.
**Category:** Hotels  
**Known history:** Agoda was discussed as a hotel integration option. Historical context says API access was awaiting approval and an application/form attempt had failed.  
**Latest safe status:** `UNVERIFIED / PREVIOUSLY WAITING OR APPLICATION ISSUE`  
**Next action:** Verify whether an application was ultimately submitted and its current status before doing integration work.

## Outreach verification — 2026-10-01

**Latest Payoneer update — 2026-10-01:** Owner reports Payoneer is under review (`WAITING_REVIEW`, owner-reported). Await review; do not repeat signup or change payout details. This does not establish CJ payout completion or Booking.com advertiser approval.

**GetYourGuide — 2026-10-01:** `INQUIRY_SUBMITTED / WAITING_RESPONSE`. Official partner contact form confirmed `Message sent` and ticket `22305587`. Non-binding inquiry covers independent developer eligibility, affiliate links/widgets, Partner API/sandbox, tracking, content rules and fees/contracts for owner review. No membership account, agreement, credential or payment was created. API approval remains `UNVERIFIED`. Source: https://partner.getyourguide.com/en-us/contact-confirmation . Official API overview: https://api.getyourguide.com/ .

**tiket.com recheck — 2026-10-01:** Registration form still displays Google `Login untuk melanjutkan`. `WAITING_FOR_USER` for manual authentication; nothing submitted.

**Booking.com / CJ correction (owner report, 2026-10-01):** CJ account has already been created. Do not register a duplicate. Account completion is blocked at payout/bank setup; owner reports difficulty adding an Indonesian bank and being directed to Payoneer. This is owner-reported, not independently verified as a mandatory or exclusive payout method. Financial-account creation, bank details and agreements remain owner-only. CJ account existence does not establish Booking.com programme approval or Demand API access.

- **Viator:** owner reports entering the additional code, but official controls for the existing API tab timed out. No key values were inspected; account-specific API status remains UNVERIFIED. Public documentation says Basic access is self-service and Full/Full+Booking require approval/certification; this does not verify the account tier.
- **tiket.com:** DISCOVERED / ONBOARDING OPENED, NOT SUBMITTED. Official affiliate route now redirects to Business Partner, advertising hotels/flights/trains and API. Registration requires Google authentication; legal-entity eligibility unresolved.
- **Booking.com:** DISCOVERED / ONBOARDING OPENED, NOT SUBMITTED. Official affiliate signup routes through CJ/APAC including Indonesia; password/email verification is owner-only. Demand API is a separate Managed Affiliate/contract route; API status UNVERIFIED.
- **Klook:** INQUIRY_SUBMITTED / WAITING_RESPONSE. Official contact form confirmed submission of a non-binding affiliate/API eligibility inquiry. Account approval and API availability for SortTrip remain UNVERIFIED.
- **12Go:** DISCOVERED / DRAFT_ONLY. Official programme describes transport links/widgets and API inquiries, but user browser permission denied contact-form access. No submission.
- **Aviasales:** public Search API prerequisite verified as 50,000 confirmed MAU. SortTrip eligibility unproven; Data API/widgets are candidates, not verified live integrations.
- **Agoda:** official Demand API documentation lists Online Affiliates/MSE. Existing account/application status remains UNVERIFIED.

See `PARTNER_OUTREACH.md` for sources, draft messages and exact submission record.

## Other categories discussed (historical)
Potential partner categories:
- eSIM,
- travel insurance,
- airport transfer.

**Status:** `DISCOVERED/CONCEPT ONLY unless later evidence says otherwise.`

## Partner operating rule
Before changing a partner status, obtain evidence from:
- the partner dashboard,
- an email/official notification,
- an API response proving access,
- or another reliable owner-provided record.

Do not equate:
- “we discussed the company”
with
- “we applied,”
- “we were approved,”
- or “the API is active.”


## Owner clarification and link verification — 2026-10-03

Owner explicitly states hotel partners are not yet available and requests skipping hotel affiliate work. No hotel partnership approval is inferred. Owner reiterates Aviasales uses existing Travelpayouts API; integration retained. Local browser outgoing 12Go route link includes existing public affiliate identifier, itinerary date and adults. This verifies link construction only, not ownership approval, cookie attribution or commission payment. Aviasales commission attribution remains unverified; no re-registration or credential changes.

12Go owner update — 2026-10-03: owner reports meeting with 12Go and permission to use their affiliate search widget, and supplied embed ID17068680. Local official widget click-out search now tested; account payout/commission attribution and API access remain unverified. This supersedes historical draft-only status for widget availability, not API/financial approval.


## Trip.com — owner public affiliate tools verified locally,2026-10-09
Evidence: owner supplied official search embed S20157986 and co-branded landing link with public Allianceid10936143/SID332965312. Official In-app Browser rendered the embed hotel/destination and check-in/check-out form locally on2026-10-09. Status: OWNER_PROVIDED_AFFILIATE_TOOLS / IMPLEMENTED_LOCALLY / WIDGET_RENDER_TESTED. This updates the older hotel-work-deferred note for Trip.com only. It does not prove API access, live hotel inventory, exact product checkout, commission attribution, payout approval or production deployment. Generated public links preserved exactly. Official affiliate tools FAQ: https://www.trip.com/partners/help/faq/tools . No supplied callback for returning selected hotel to SortTrip; owner approved manual confirmation.
12Go: existing public affiliate17068680 retained. Transport search and itinerary route/date links are affiliate search handoffs, not verified reservations for a specific operator/seat. No new API approval or commission evidence. Other partner statuses unchanged.


### Trip.com correction and official deep link evidence —2026-10-09
Owner-reported co-brand sorttrip.trip.com link was visibly unreachable in browser. Official logged-in Affiliate Tools→Affiliate Link→Custom link generated working general Hotels landing and CUBE Kampong Glam property1729952 links; public existing tracking identity preserved, generated trip_sub3D20158392. Exact property link opened correct hotel in official browser. Status GENERATED_AFFILIATE_LINKS / PROPERTY_HANDOFF_TESTED_LOCALLY for this property only. No API entitlement, dates/room availability, booking, payout or commission proof. FAQ https://www.trip.com/partners/help/faq/tools requires generated links unchanged and currently describes hotel date-link support as under development. Do not extrapolate one property link into arbitrary dynamic hotel affiliate checkout.
12Go: public https://12go.asia/en/travel/johor-bahru/malacca supports audited city/terminal mapping. Browser affiliate search handoff preserved date/adult count; provider normalized tracking off displayed URL. No commission or exact-seat checkout proof.


Trip.com public browser price verification2026-10-11 (not API or affiliate approval): Desktop anonymous dated hotel search returned inclusive IDR totals for CUBE Kampong Glam and Travelodge Kuala Lumpur City Centre. Owner-authorized Cloudflare browser deployment launches successfully but returns no rendered hotel-price DOM despiteHTTP200, including ordinary landing-page warm-up. Actual-price automation remains INTEGRATION_IN_PROGRESS / NOT PRODUCTION_READY. Affiliate agreement/commission attribution unchanged and unverified by these read-only searches; no booking or secret changes. Evidence in docs/PROJECT_PROGRESS.md and artifacts/production-hotel-price-check.png.
2026-10-11 Trip.com cloud-browser evidence: www.trip.com redirects anonymous server hotel request to account/login path. Public navigation blocked and no login attempted. This establishes a current server-access limitation, not partner approval or verified hotel API access. Positive dated quotes remain Desktop observations only; automatic cloud-price integration is not production-ready.

2026-10-11 Hidden browser follow-up evidence (local implementation, not partner approval): clean Trip.com cloud session still redirects to account after public HTTP200; hotel actual-price automation remains blocked.12Go Desktop public Johor Bahru–Melaka dated form and IDR vehicle offers observable without login; new cloud browser adapter probe returned no verified quote/PRICE_UNAVAILABLE, cause not established. No hotel/transport API entitlement, dated ticket success, exact checkout, commission or payout approval inferred. Read-only checks; no authentication/booking/payment performed.
# Hotel API candidates researched — 2026-10-12

Owner requested official hotel sales APIs as alternatives to unreliable browser price extraction. Public-documentation research only: no applications, messages, registrations, account/credential changes or API calls. All SortTrip-specific entitlement, pricing, market support and production eligibility remain UNVERIFIED.

- Nuitee Connect / LiteAPI — DISCOVERED. Official https://docs.liteapi.travel/reference/overview describes live availability/rates by stay/occupancy and search/prebook/book REST flow; https://docs.liteapi.travel/reference/getting-started-1 describes signup/dashboard keys. https://docs.liteapi.travel/docs/faq describes adding a valid card to unlock production key. Sandbox is not live inventory proof. Candidate for initial API evaluation; owner controls billing and production activation.
- Emerging Travel Group Metasearch API — CONSIDERED (existing ZenHotels discussion does not establish access). https://metasearch.docs.emergingtravel.com/ describes HotelRates for prices/availability and booking tracking, with signed agreement and account-manager authorization. Closely fits itinerary pricing plus partner checkout; actual agreement/redirect flow/commercial terms need confirmation.
- Booking.com Demand API — DISCOVERED. https://developers.booking.com/demand/docs/getting-started/prerequisites requires Managed Affiliate Partner registration, signed-contract Partner Centre access and affiliate/API identifiers. https://developers.booking.com/demand/docs supports search/look/redirect flow. Ordinary affiliate signup is not proof of Demand API access.
- Duffel Stays — DISCOVERED. https://duffel.com/docs/guides/getting-started-with-stays requires requesting Stays access and documents dated occupancy search/rates/final quote/booking. Direct booking integration differs from current SortTrip affiliate click-out; eligibility/commercial/payment support remain unverified.
- Expedia Rapid — DISCOVERED. https://partner.expediagroup.com/en-au/join-us/rapid-api describes shopping/booking/payment integration and case-by-case application review. Not assumed immediately available to SortTrip.
- Hotelbeds APItude — DISCOVERED. https://developer.hotelbeds.com/documentation/getting-started/ offers evaluation registration with50requests/day and sandbox-only initial keys; certification/production access is separate. B2B sales/booking workflow needs commercial review before adoption.
# LiteAPI account checkpoint — 2026-10-14

Owner reports creating a LiteAPI/Nuitee account and explicitly confirms API key not configured. Status ACCOUNT_CREATED_BY_OWNER; API entitlement, successful authentication, live rates, production/billing access and booking/commission remain UNVERIFIED. Prepared scripts/liteapi-check.mjs for a single reference-currencies GET using owner-supplied runtime LITEAPI_API_KEY; current no-key check returns LITEAPI_KEY_NOT_CONFIGURED without network request. No credential file/value read or modified by agent.
# LiteAPI authentication verified — 2026-10-14

Owner privately configured runtime LITEAPI_API_KEY and authorized connection test. Official reference-data GET /v3.0/data/currencies returned HTTP200 with136currencies includingIDR. Status AUTHENTICATED_REFERENCE_API_TESTED; dated hotel rates, production-mode entitlement, booking/payment, commission and complete SortTrip integration remain UNVERIFIED. Initial sandbox-network failure resolved by an approved unsandboxed request. No key values, provider bodies or authentication metadata printed/stored; no booking performed.
# LiteAPI catalogue and sandbox rates verified — 2026-10-14

Owner authorized read-only hotel/rate testing. Runtime sandbox key classification, five catalogue requests (Kuala Lumpur, Singapore, Bangkok, Denpasar, Jakarta; limit5each) all HTTP200 with5returned properties each. One dated /hotels/rates request for Kuala Lumpur10–12November2026,1room/2adults,IDR/guestNationalityID returned HTTP200 with5hotel rate records, named room types, IDR offerRetailRate and cancellation-policy fields. Status SANDBOX_SEARCH_RATES_TESTED; these are sandbox test rates, not verified actual production availability/prices. Production payment entitlement, public selling-price policy, tax inclusion handling, booking redirect/commission and SortTrip UI integration remain UNVERIFIED. No booking/prebook/payment made or key/session/offer identifiers exposed.
# LiteAPI-only implementation and Google Maps discussion — 2026-10-14

Owner selected LiteAPI as hotel provider including native Hotel menu; locally implemented, production access not verified. Owner explicitly reports no White-label booking site. Official https://docs.liteapi.travel/docs/deeplinking-to-whitelabel documents hotel detail URL/date/base64 occupancy flow; optional builder prepared, actual owner site/checkout/commission UNVERIFIED. Google Maps Platform only researched: https://developers.google.com/maps/documentation/routes/transit-route supports transit steps/alternatives and optional total fare when all segments known; https://developers.google.com/maps/documentation/routes/usage-and-billing requires billing/API authentication. No Google account access or integration/configuration performed.
# White-label owner URL and Google Routes status — 2026-10-14

Payment SDK checkpoint2026-10-14: owner requests native hotel checkout. Official docs user-payment/hotel-integration-guide/post_rates-prebook/post_rates-book/listbookings reviewed; optional local SDK flow with durable private records and separate production gate implemented. Status IMPLEMENTED_LOCALLY/FIXTURE_TESTED, not PAYMENT_API_TESTED or PRODUCTION_READY. No real prebook, card/payment, booking, refund, commission, entitlement or SQL execution by agent. White-label403 case LAS-3147 remains independent of SDK path.

Follow-up2026-10-14: owner reports checkout SQL and private sandbox flags set; safe runtime checks confirm table/NULL-claim RPC reachable and sandbox mode, no sensitive identity/key values inspected. Real authenticated local checkout room search200 and2eligible room choices persisted in private sandbox checkout table after edge-request compatibility fix. Status SANDBOX_ROOM_SELECTION_TESTED; no Prebook/SDK payment/Book/production/commission verification. Owner must operate guest/terms/payment steps. No live supplier booking or financial account changes.

Owner identifies https://yusuf-ridlo-kkxjf.nuitee.link as their LiteAPI White-label; public URL configured locally. Official Desktop browser returns403country restriction from CloudFront for the testing location; reachable owner-market/customer checkout remains UNVERIFIED. No secret/account/dashboard/commission change. Google owner confirms no billing/API/key setup yet; local bounded route integration implemented but no actual Google connection verified. No partner approval or production readiness implied.

Follow-up2026-10-14: owner confirms403 on their own device. Official authenticated Nuitee Connect UI shows exact domain ACTIVE and preview403country restriction; password protection off, no visible country-access setting. White-label public access BLOCKED_PENDING_PROVIDER_REVIEW; booking/checkout/commission still UNVERIFIED. Customer-login/10%guest-markup toggles observed enabled, unchanged; API-to-White-label price parity requires clarification. Support draft prepared but not submitted without owner messaging authorization. No secret, request ID or authentication state retained in this record.

Owner-approved support submission2026-10-14: official Request Assistance confirms LAS-3147/Open (Bug Report/Medium), requesting country-restriction/provisioning investigation and Indonesia access. No provider response yet; blocked status and unverified checkout unchanged.

## LiteAPI SDK sandbox confirmation — 2026-10-14
Status: SANDBOX_BOOKING_CONFIRMED (single owner-operated case). Owner screenshot of confirmed sandbox reservation plus independent read-only database check confirmed. Owner completed SDK test payment and reservation confirmation; agent performed no financial action. API room/Prebook/Book path and saved confirmation succeeded for one dated stay. Real inventory/customer booking, account commission/payout and production approval remain UNVERIFIED. White-label403/ticket LAS-3147 remains an independent issue. Production deployment unchanged.

### Native content verification — 2026-10-14
Hotel Details + Reviews endpoints independently returned200 with24hotel images,20room types with photos and10guest reviews for test property. Official local UI displays actual supplier images and reviews, including mobile fit. This establishes metadata access only, not production price/payment eligibility. Production key onboarding/card authorization still owner-pending; no credential changed by agent.

### Google Maps Routes actual QA — 2026-10-15
Local key and feature flag present (values never read); counter schema reachable. One authorized public transit request, budget reserved first, returned Google HTTP403/SERVICE_DISABLED. Status API_REQUEST_REJECTED_SERVICE_DISABLED, not API_CONNECTED or PRODUCTION_READY. Owner action: enable Routes API on project associated with configured key. Local workerd endpoint timeout also unresolved independently. No Google billing/account/credential changes, no AI quota debit, no deployment. Actual quota/price tier compliance still unverified.

Google follow-up2026-10-15: owner screenshot shows Routes API Enabled, exact key/project association unverified. One post-enable budgeted request still403 SERVICE_DISABLED (second monthly attempt). Local Worker/frontend health recovered200; no route results verified. Await owner public project identification, never credential values.

### Google Routes local connection and UI verified — 2026-10-15
Status API_CONNECTED_LOCALLY / AUTHENTICATED_UI_TESTED. Actual provider TRANSIT200 yields4route alternatives and3transit steps; no fare. Actual signed-in local SortTrip WALK UI through Worker/budget returns44minutes/3.0km/directions; budget remaining1observed.5focused tests/32combined pass, mobile panel no overflow. Earlier SERVICE_DISABLED no longer present in latest tested requests; exact propagation/project cause unproven. Four conservative attempts retained; no AI quota debit or owner itinerary changes. Google billed SKU/account-wide Console limits and deployed customer behavior UNVERIFIED, not production-ready/released. Google project name remains owner-reported My First Project; app/Supabase SortTrip naming is independent.

Production card research2026-10-15: official FAQ requires valid card to unlock production; SDK ordinary payment by end-user/NuiteeMoR. Documented SDK voucher exception charges account card for merchant-funded discount. Current SortTrip sends no voucherCode and uses TRANSACTION_ID only, but cannot guarantee no account charges under onboarding contract. Exact backup-card/chargeback/card-limit terms require owner review/written Nuitee confirmation; no acceptance or account change by agent. See official https://www.liteapi.travel/terms/ and vouchers-api-guide.

2026-10-15 card-policy clarification sent with owner authorization: Nuitee official Billing ticket LAS-3185/Open, Medium. Await reply about SDK account-card/fallback/voucher/chargeback liability and disabling account-funded payments. No credential/card/financial setting changes performed; production activation remains owner-controlled. White-label403 ticket LAS-3147 also stillOpen. Inquiry text in docs/NUITEE_PAYMENT_CARD_INQUIRY.md.


## Nuitee ticket status update — 2026-10-19
Owner supplied official status-notification screenshots for LAS-3147 (White-label inaccessible: CloudFront country restriction403) and LAS-3185 (Account-card liability and production activation with Payment SDK). Both explicitly show IN TRIAGE, superseding last recorded Open status. Evidence received2026-10-19; notification timestamp not visible. No substantive answer,403 resolution, production approval or card-liability clarification appears in supplied evidence. No fresh dashboard/API/access test, credential or financial-account change performed.


## Nuitee White-label substantive response — received 2026-10-20
Owner pasted support reply attributed to Vlatka Babic on White-label403 case LAS-3147. Provider says Indonesia access issue is being checked and will follow up; no fix/resolution evidenced. Provider explains dashboard Sandbox selector starts Production onboarding, not proof of activation/entitlement. Provider confirms guest-price toggle adds10% above configured margin for logged-out White-label visitors, applied by LiteAPI at White-label request; not a LiteAPI default. Direct API without extra markup is approximately10% lower according to support and matches member pricing; toggle off aligns prices (matched search/rate context still requires actual comparison). No toggle/account/credential changes or fresh price test performed. Provider asks about 'No credentials or customer booking details are included'; this was an informational security note, not a defect report. No answer to separate LAS-3185 account-card liability inquiry supplied. Latest recorded ticket status IN TRIAGE; substantive reply does not prove status changed.


2026-10-20 LAS-3147 status superseded: owner supplied official notification screenshot explicitly showing AWAITING CLIENT. Provider expects client response; no resolution of Indonesia403 evidenced. Prior substantive reply requested clarification of security-note sentence; this is a possible reason for pending response, not explicitly established by status notification. LAS-3185 status/liability answer unaffected and not newly verified. No reply sent or account change.


## Google Routes production verified — 2026-10-22
Owner-authorized nonsecret feature activation deployed in version a9c9ead2-6b59-4a6d-8ed5-6635d6729920. Existing Cloudflare Google secret name present; no value inspected or changed. Official signed-in production UI actual WALK TravelodgeKL→KLCCPark returns44minutes/3.0km/instructions and account4checks remaining today. Status API_CONNECTED_PRODUCTION / WALK_UI_TESTED. One route attempt behind atomic Supabase budget, no AI quota/itinerary writes. Supersedes production-inactive statement for this tested Google path only. TRANSIT/DRIVE production, fare/ticket availability, account-wide billing/Console limits/billedSKU remain unverified. No zero-cost guarantee or billing configuration change.


2026-10-22 production inventory recheck: Viator publichealth configuredtrue/environment sandbox/connectionTestedfalse; no supplier request or production entitlement inferred. LiteAPI native search/content/checkout all503 configuration gated; no upstream rejection or entitlement denial inferred from this. OwnerWhiteLabel ordinarypublicGET still403; no resolution evidenced. Google authgate401 with prior same-day actual productionWALK success. No partner/account/financial change or support message. See docs/PRODUCTION_READINESS_2026-10-22.md.


2026-10-22 owner-authorized Viator production follow-up: authenticated partner dashboard reached; APIAccess requires extra Send my code verification. API-page gate remains owner-only, not evidence of approval/rejection or credential usability. No code requested by agent, API key value read or environment change. Current production site adapter still sandbox. WAITING_FOR_USER for manual API-access verification before reviewing access labels/production setup.

**Viator latest evidence — 2026-10-22:** Production mode now deployed (f2b46a72-b0f1-454c-a3fd-76cc1020a5e2); health200/configuredtrue/production. Owner OTP gate completion directly verified; safe dashboard labels show Production keys and Enabled, credential values not inspected. Actual inventory NOT successful:502 VIATOR_UNAVAILABLE, failureStage=request before upstream HTTP response. Existing Cloudflare key preserved; whether it is the correct Production key remains unverified. Status CONFIGURED / CONNECTION_BLOCKED, not PRODUCTION_READY. Owner private key verification required; prior sandbox401 does not diagnose this new failure.

**Viator latest — 2026-10-22 production API connected:** After owner private credential update/deploy, health200/production/configuredtrue and final live search destination77/count1HTTP200 with one normalized product. Worker version d8e1996a-03a6-4f41-86f0-e1df5031d489. Redirect handling manual (never follow or expose Location), nine synthetic testsPASS. Supersedes previous CONNECTION_BLOCKED for tested request. Scope API_CONNECTED / production inventory tested; customer UI, exact-date availability, checkout/certification/tracking/payout remain unverified. No credentials inspected or changed by agent.

**Viator itinerary verification — 2026-10-22:** Production exact-city free-text search is connected and official browser search/link/account-save/reopen tested on owner-selected Genting example. Product57373P326 returned from API, affiliate URL preserved. Native choice UI lets users optionally apply starting-price estimates; no API dated quote/booking integration. Cheapest API variantRp72575 is Genting SkyWay, whereas provider detail default23Oct2026/one traveler showed Awana standard ONE WAYRp84187; owner example explicitly uses the latter reference, not31Jan2027 availability. No supplier purchase or payout/tracking revenue verified. Affiliate click-out currently lands on city listing with requested ticket first, followed by direct product detail. Native Viator booking remains unimplemented; partner certification not established by these tests.

**LiteAPI cost audit — 2026-10-22:** Official pricing lists standard hotel flow/content free subject to ToS/reasonable look-to-book; paid Places/PriceIndex and dashboard add-ons are separate. Owner screenshot shows Production account view, not financial approval or verified zero balance. SortTrip invalid-search probe remains503/LITEAPI_PRODUCTION_REQUIRED. Deployed default-deny hotel endpoint policy1ab73453-5995-4e79-b682-c176dc0c22c1;32fixture testsPASS, no supplier call during audit. Billing services/add-ons/custom terms and LAS-3185 liability response remain unverified.

**Nuitée activation checkpoint — 2026-10-22:** Owner Production screenshot and activation request acknowledged. Metadata confirms SortTrip Cloudflare LITEAPI_API_KEY absent; credential installation owner-only/pending. Local read-only flag prepared, not deployed. Old public White-label ordinaryGET still403/CloudFront country wording; current domain owner verification pending. Neither successful hotel production inventory nor White-label access/financial approval is newly established.

**Nuitée latest production API evidence — 2026-10-22:** Owner privately installed key; deployed featureflag version32088613-f1a6-418e-8470-4f68495cb8ad. Real readonly hotel search KualaLumpur30Jan–1Feb2027/oneadult returned200/12datedIDRoffers. StatusAPI_CONNECTED/production catalogue+rates tested, supersedes missing-key/read-only-disabled notes. Native SDK checkout remains503 gated; no card liability/payment approval established. Owner reconfirmed yusuf-ridlo-kkxjf.nuitee.link; ordinaryGET still403country restriction, so White-label not usable/approved as working checkout. No credentials handled by agent.

**Trip.com Hotel menu — 2026-10-22:** Owner-authorized restore of existing affiliate widgets S20157986/S20187449 with original tracking. Deployed85ef3fb6-d4a1-4a06-b7cc-07ed7cc8350d, official browser desktop/mobile full form verified. Click-out actual hotel results/purchase and earned commission not newly tested. Manual trip record form retained. This is widget/affiliate use, not Trip.com API or renewed browser scraping.

**Nuitée checkout geography — 2026-10-22:** Public PaymentSDK JS200(no country block); native SortTrip checkout503(readiness gate), White-label403(country wording). Actual production payment-session/Prebook/Book geography still UNVERIFIED. Owner confirms LAS-3185 still unanswered; no live approval/payment activation. Itinerary-native Nuitée search and checkout path preserved by owner request.

**Nuitée live checkout QA — 2026-10-22:** After owner deployment, readiness passes (history401login instead of503; signed-in UI accessible). Production dated hotel search200/12offers. One native checkout-room query has supplier rates but all filtered by SortTrip validation; exact rejection cause unisolated. No country403 on tested native flow; payment-session geography and successful production booking remain UNVERIFIED. PublicSDK200/WhiteLabel403 unchanged; LAS-3185 unanswered. No financial transaction or Prebook performed.

**Nuitée checkout room selection verified — 2026-10-22:** Same production hotel/date retry now returns two public refundable options and official UI selection opens blank guest form. Previous rates_filtered not reproduced; original exact cause unverified. Validator remains strict, fixed rejection-count diagnostics deployed2df9e920-0547-4148-bfa8-55ff0a02a81a. Status live rates/room selection UI tested, NOT production payment/booking tested. No supplier Prebook/payment/Book performed; account liability LAS-3185 and payment-session geographic access remain unresolved.

**Nuitée current checkout blocker — 2026-10-22:** Second owner attempt read-only status confirms payable_total_validation/payable_mismatch, not optional-terms absence or country403. Correction deployed4f730eb4-18a5-47a8-aaea-7686e7b55539: authenticated native checkout validates supplier retail payable consistently; public discovery retains SSP floor.31focused regression tests/buildPASS. No agent SDK/Prebook/Book/payment; actual production SDK readiness still requires owner-operated fresh consent/submission. No account margin/financial setting changed; LAS-3185 unanswered.

**Nuitée Prebook progress — 2026-10-22:** Third owner UI attempt reaches changed-conditions guard, establishing supplier response and payable validation passed for that attempt, but prior code then failed valid changes. Final-review fix deployed ed3050d1-7755-4748-9298-7acf002f398f;39fixtures/buildPASS. Payment portal/production booking remain unverified; no card-liability support response. No new agent supplier financial calls.

**Nuitée Payment SDK rendering verified — 2026-10-22, owner screenshot evidence:** Production native Prebook reached final review withRp2035947/Breakfast Included; owner accepted final consent and embedded Google Pay/card portal rendered with Indonesia selected. No403 on this tested payment-form path. Status PRODUCTION_PAYMENT_PORTAL_RENDERED, not payment/Book/settlement/payout tested. White-label country403 and LAS-3185 liability remain independent/unresolved. No credential/card content retained or agent payment action.

**Nuitée commission configuration — 2026-10-22:** Read-only authenticated production Commission Management after auth completed shows Active Default Markup0%; code rates requests omit margin/additionalMarkup, inherit account default. No standard markup commission configured through account default. Public SSP price difference is not realized earnings. Official guide says margin/markup is commission model, paid after completed stays subject to account terms; actual booking commission/payout and hotel-level overrides not audited. No financial settings changed. Owner choice/manual configuration needed before assuming revenue; avoid paid managed dynamic pricing add-on unless explicitly approved.

**Nuitée default markup5% ACTIVE — independently verified2026-10-22:** Owner published; fresh authenticated production Commission page reload persists5%/Active with disabled Publish changes and preview100net->105guest/5earnings=4.76%of selling price. Supersedes current0%/draft-only state. SortTrip no request override, so future rate searches inherit account default. Not actual earned/payout commission proof or card-liability resolution. No financial publication by agent.
# 12Go — actual backend browser fare evidence, 2026-10-23

Remote Cloudflare browser read-only QA returned one validated dated bus ticket IDR57,647/person for Kuala Lumpur→Malacca/Melaka6Nov2026/oneadult, matching the public desktop MelorInterlineExpress card. This supersedes historical no-positive-cloud-quote evidence **for this query only**. Current UI parser fixes (compact date, per-adult label, departure-card selector) are local and undeployed. Local/prod public health200 confirms configured binding, not production quote success. No API entitlement, new account approval, booking/seat/checkout, affiliate attribution or payout evidence. One-adult limitation remains. Source/time/evidence:`qa-reports/12GO_ACCESS_PRICE_QA.md`, `2026-10-23/evidence/12go-backend.json`, checked09:32UTC. Existing publicaffiliate17068680 unchanged.


## 2026-10-23 — Read-only purchase-status verification evidence
Travelpayouts public marker782849 supplied by owner. Existing runtime statistics credentials reached field metadata200 in authenticated local UI; booking-only execute_query400 FILTER_REJECTED. Therefore flight conversion sync is IMPLEMENTED LOCALLY / LIVE VERIFICATION BLOCKED, not partner-approved or production-ready. Scoped Aviasales outbound link prepared and DOM-verified; no purchase/commission attribution proven. Nuitée private checkout record lookup available locally; exact-context status linkage implemented, but no newly linked production reservation/payment exercised. No broader partner status upgraded. See qa-reports/BOOKING_STATUS_SYNC_QA.md.

## 2026-10-23 — Travelpayouts statistics HTTP400 correction verified
Supersedes previous LIVE VERIFICATION BLOCKED classification for the read-only query. Campaign100 live metadata200 lists sub_type, not action_type; old filter400 ACTION_TYPE_REJECTED was an application query mismatch. Corrected supported sub_type=booking query returned200 through actual authenticated local saved-trip UI. Status API-CONNECTED / READ-ONLY QUERY TESTED LOCALLY, zero matching scoped purchases. Public marker782849 retained. No positive conversion/commission/airline-issued-ticket or production deployment evidence; no credential replacement, registration or approval required for this repair.

## 2026-10-23 — Production statistics query verified after release
Application770afbd deployed version7f7ea8c2-225e-4a72-9bcf-ce8f7ee076a1. Actual official authenticated production saved-trip UI verifies Travelpayouts campaign100 fieldmetadata200 and booking-only sub_type query200, available/zero scoped matches. Thus read-only production statistics connection tested; no positive purchase attribution, airline issuance or earned commission proven. Hotel private-record lookup available; no new linked booking/payment exercised. Public marker782849 published; no secret or financial account setting changed. Other partner approvals/liability remain unchanged.

## 2026-10-24 — Nuitée budget inventory reverified read-only
Existing production native search KL30Jan–1Feb2027/oneadult/max500kperroomnight returned200/23hotels,147checked,partialfalse. Updated local AI budget adapter also returns a matching real supplier quote (RiccartonCapsule2nightRp489159.17) via city/rates discovery. Existing credential/account markup unchanged. API inventory evidence only; no new approval, payment, booking, commission or production publication of this correction. See qa-reports/HOTEL_REPLACEMENT_RECOVERY_QA.md.


**Aviasales Hanoi sample —24October2026:** Existing local runtime access200 verifies CGK⇄HAN7–11November2026/oneadult cached combined return fareIDR5314916 and positive actual frontend5-day search. Four-day recommendation mismatch corrected locally; no new API entitlement/partner approval, booking, settlement or credential change. Cache offered5/9-day November rows and no accepted rows in the other two sampled months; do not infer no flights. Report qa-reports/HANOI_BUDGET_QA.md.

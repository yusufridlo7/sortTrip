# SortTrip — Partner & Affiliate Register

> This register must distinguish discussion from actual application, approval, API access, configuration, and production readiness.
> Never store API keys, tokens, passwords, cookies, OTPs, or other secrets here.

## Status vocabulary
`DISCOVERED` → `CONSIDERED` → `APPLICATION_STARTED` → `APPLICATION_SUBMITTED` → `WAITING_APPROVAL` → `APPROVED` → `API_ACCESS_AVAILABLE` → `CREDENTIAL_CONFIGURED` → `INTEGRATION_IN_PROGRESS` → `TESTING` → `PRODUCTION_READY`

Use `UNVERIFIED` whenever the historical record does not establish the exact status.

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

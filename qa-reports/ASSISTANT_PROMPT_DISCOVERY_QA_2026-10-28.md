# Assistant prompt → trip choices → itinerary

28 October 2026. **Implemented locally; UI/contract regression verified. New end-to-end Meta success and production activation NOT verified.** Owner deferred subscription/quota work during this task. No commit, push, deployment, payment, credential change or database migration performed.

## Corrected behavior

- Any nonblank Assistant prompt takes the authenticated Assistant branch before ordinary flight discovery. Previous country results are cleared. An AI error or clarification cannot silently fall through to all-country search.
- Blank prompt retains public flight search, country → city/date → ticket choices and existing holiday estimates. Initial duration remains flexible and budget unrestricted.
- Server Meta discovery contract supports a country-level request such as Vietnam, up to two destination/itinerary choices, airport catalogue validation, Vietnamese accented city names, duration and interest preferences. Every day and overnight must be represented. Prices, hotel identities, availability and coordinates are not invented by the model.
- Progress reflects checking access, planning and fetching prices. Results are distinct cards. Opening one passes the already built Trip to the ordinary editable planner, without another model call.
- Available flights use the existing public supplier path. Recent city hotel minimums may provide a **planning reference**, counted for all nights and ceil(travellers/2) rooms. Cards and itinerary subtotal use the same reference. A Hanoi minimum cannot price Sapa overnights. Missing/stale/incomparable references stay unknown.
- Flight-only prices are labelled as tickets, not the full holiday budget. Budget-from cards explain exclusions and room assumptions. Incomplete costs are never shown as a complete free holiday.
- Empty coordinate sets now show a clear route-check notice rather than a world map centred on zero. Existing location/connection Google Maps links remain usable. Identical city names are not appended twice.
- New UX strings supplied in Indonesian/English; reduced-motion support for loading dots.

## TikTok reference limitations and actual check

Added a bounded public oEmbed metadata reader: exact TikTok host allowlist, manual redirects, 6-second deadline, response size cap, no account headers, cookies, embed execution, scraping fallback, video/audio download or authentication bypass. Metadata is untrusted source content, never system instructions.

Actual supplied short link: redirect **301**, official oEmbed **200**, **no usable title/caption** in the response. Therefore video was not accessed and no caption was supplied to the planner. A written request mentioning Vietnam/Hanoi/Sapa can drive planning; a bare unread link may still require a short destination clarification inside Assistant. It must not trigger an unrelated all-country result.

Official reference reviewed: https://developers.tiktok.com/docs/en/embed-videos (22 October 2026 update; oEmbed example does not guarantee a title, and older Embed Videos is being deprecated). This does not establish TikTok partner approval or arbitrary-link video analysis.

Evidence: `artifacts/assistant-tiktok-public-check.json`.

## Verification

- Full regression: **454 passed, 0 failed, 0 skipped**. Includes 19 new discovery/reference tests for paid-only product access, no basic-quota fallback, atomic settlement behavior, model failures, clarification, malformed requests, origin rejection, QA isolation, metadata redirects/SSRF boundaries, catalogue/duration and overnight coverage.
- Build/typecheck passed. i18n coverage: **1,669 keys, no errors or unexpected JSX literals**.
- Real browser, normal app, blank prompt: eight public country choices, cheapest-ticket ordering, no horizontal overflow. No Meta request needed. Evidence `artifacts/assistant-discovery-free-search-live.json`.
- Browser **SIMULATED fixture**, using actual FlightSearch/AssistantDiscovery/WorldPlanner components: prompt → Hanoi card → editable itinerary; one simulated analysis and one flight request, still one after opening. No actual model, payment or Save in this fixture.
- One-person fixture: flight IDR2,500,000 + hotel IDR300,000 ×4 nights = known subtotal IDR3,700,000; card and itinerary agree.
- Three-person fixture: flights IDR7,500,000 + two rooms ×IDR300,000 ×4 nights = IDR9,900,000 total / IDR3,300,000 per person. All four overnight date intervals present, no overflow.
- Indonesian and English card/itinerary controls exercised. Native map-view switch and route detail expansion work; Google Maps direction URL verified without invoking paid route search or completing booking.
- Development fixture not included in production dist (checked for fixture token/banner/entry strings). Fixture URL is a labelled simulation, not a working Meta demo.

Evidence: `assistant-discovery-tests.log`, `assistant-discovery-full-tests.log`, `assistant-discovery-build.log`, `assistant-discovery-i18n.json`; screenshots `assistant-discovery-cards-simulated.png` and `assistant-discovery-route-simulated.png`, under `artifacts/`.

## Deferred and not claimed

Owner read-only SQL results: trip_passes, ai_request_reservations, reserve_ai_request, finish_ai_request and reserve_paid_ai_request all absent in the separate QA project. Existing production subscription was NOT judged invalid or copied into QA. Source-only setup/readiness/test-pass scripts are prepared but not applied. Owner then explicitly deferred quota work; do not request another grant or reset as part of this UI task.

Local QA has an explicitly labelled `/api/meta-qa/discovery-preview` tool, guarded by localhost, the fixed QA project and nonproduction flag. It still requires QA authentication, rate limiting and the existing atomic Meta USD10 ledger. It does not grant a subscription or bypass the paid production endpoint. No automatic fallback from product request to preview.

Two live preview attempts did not establish a successful new itinerary response: the first failed without a retained cause, and the later attempt returned **429 BUDGET_EXHAUSTED** before inference. This can represent an existing test-allocation restriction; no remaining balance, actual spend or per-account exhaustion cause was established. Limits were not raised/reset and no further paid retry was attempted. Final ledger reconciliation is deferred with quota work.

The production product route remains subscription-gated and Meta extraction remains nonproduction-gated. Real prompt→Meta→priced itinerary success, date-specific hotel availability, full video/ASR, broad model compliance, responsive mobile acceptance, production subscription migration and deployment remain unverified. Existing older QA evidence is not substituted for this run.

# Explore homepage, AI progress and recommendation budgets

**Follow-up24October2026:** The initial missing Hanoi budget/photo and fixed four-day assumptions below are superseded by [Hanoi QA](HANOI_BUDGET_QA.md). Actual cache offered5/9days, not4. Hanoi now5days/4nights, return fare5,314,916, hotel total1,354,480.25, food400,000, Budget from7.1m. New sunset panorama replaces the initial image and has Pexels attribution. Whole-stay hotel totals and per-destination duration are explicit;303tests/build/dry-run and positive actual frontend Hanoi search passed. Still local/uncommitted, not deployed.

Verified locally: 24 October 2026. Branch: codex/qa-production-readiness-2026-10-23. Not deployed or committed by this task.

## Implemented

- Explore opens initially while account/guest drafts remain in session storage. The existing Continue itinerary action remains available for a restored draft.
- Search region control now has aligned card padding, matching labels and a single-column mobile layout.
- AI requests negotiate an SSE response with actual validation/research/draft/hotel/transport/finalisation callbacks, animated dots, an accessible live status, cancellation and existing JSON compatibility. No simulated completion percentage or invented flight-search stage.
- Three recommendation cards show a destination photo, city and Budget from/Check trip budget. Cards open editorial four-day itineraries, assumptions, price methodology and a search CTA. CTA fills CGK, destination, four days, one adult and available budget; it does not buy, save, generate AI or silently search.
- Hotels use the current lowest eligible API sample. IDR500,000/night is a **preference**, not an absolute recommendation cap: use the lowest available higher rate when no cheaper sample exists. This does not relax an individual traveller's explicit hotel-search maximum.
- Mean and sample standard deviation (n−1) apply to comparable ticket series only, never hotels or the fixed food allowance. A single sample has a mean and no deviation; the UI explicitly explains this.
- Flight budget component is max(sample minimum, mean minus sample deviation), or the single fare when n=1. Add three hotel nights and four daily food allowances; round up to IDR50,000. This is a planning floor, not a bookable package or a statistical confidence interval.
- Paid attraction references remain separate from the base budget: Viator starting prices are not verified date-specific admission fares. Different product codes, categories and price bases are not pooled.
- Monthly snapshots use a dedicated public-aggregate Cloudflare KV namespace. A dedicated daily02:00UTC cron checks for the current UTC month, with at most three failed attempts per month separated by 24 hours. Only aggregates, public product identities and dates are stored. Homepage reads do not call suppliers. Keep at most 12 collection months; hide numeric budgets after 60 days without a valid capture.

## Actual supplier samples

Initial capture: 2026-10-24, three future departure/stay months, one adult, CGK return itinerary lasting four days. Each hotel rate was for a three-night stay; prices include the supplier adapter's validated quote basis. This is not a year of historical observations.

| Destination | Lowest hotel / night | Return flight samples | Budget from |
|---|---:|---|---:|
| Kuala Lumpur | IDR219,906 | one departure date, IDR2,061,915 | IDR3,150,000 |
| Hanoi | IDR338,638 | no accepted four-day fare | unavailable |
| Singapore | IDR600,457 | one departure date, IDR2,903,338 | IDR5,450,000 |

Singapore's higher fallback was independently retrieved after owner approval: BEAT. Capsule Hostel @ Boat Quay, Single Capsule – Mixed, sample stay 23–26 November2026; two further sampled minima were approximately IDR614,198 and IDR614,837. Budget/capsule choices are explained in details. Minimum sampled prices are not availability guarantees for another date and are not a market-wide cheapest-price claim.

Six actual Viator production product starting-price references were captured through SortTrip's existing public endpoint (three KL, three Hanoi), including the Hanoi water puppet entrance product at IDR151,792.08 starting price. Singapore activity search returned400 and is not claimed verified. Hotel samples were collected through configured private runtime credentials; no credential files or values were read.

Base budget excludes local/airport transport, paid attractions, extra baggage and insurance. Unknown components are not assigned zero or declared free. Ground transport automation/statistics remain pending comparable dated route/class/passenger samples; no 12Go API entitlement is claimed. Full annual coverage and a numerical deviation remain pending additional real samples. No numerical Hanoi budget is invented.

## Verification

- 301 automated tests passed, including ten new tests for sample/pooled variance, hotel minimum/higher fallback, product separation, monthly retries/history deduplication, stale-budget suppression, SSE chunking/UTF-8/status/fallback/cancellation.
- Production build passed. Existing bundle-size advisory remains (~1MB main JS before gzip); no build errors.
- i18n coverage:1462 matched keys,1070 static calls, no untranslated JSX literals or coverage errors. New single-sample English labels avoid incorrect singular/plural wording.
- Wrangler deployment dry-run passed with the KV binding; no release performed.
- Official desktop browser: ID/EN homepage, language persistence across reload, card open/close, pricing details, Singapore CTA fills SIN/4days/1adult/IDR5,450,000, mobile390×844 and desktop layout. Opened the existing13-item KL trip, reloaded, and verified Explore opens with Continue itinerary available; no AI regeneration or save was triggered.
- Mobile dialog header/close button stays outside the scrollable detail body; long English copy remains readable.
- Actual AI generation not rerun: existing owner quota, itinerary contents, booking/payment and supplier billing untouched. Progress delivery and cancellation verified with fixture handlers and the actual client stream parser, not a paid model request.

Evidence: `artifacts/recommendation-live.json`, `artifacts/recommendation-singapore-live.json`, `artifacts/recommendation-attractions-live.json`, `artifacts/explore-recommendations-regression.tap`, `artifacts/explore-recommendations-i18n.json`, and `qa-reports/2026-10-23/evidence/recommendation-mobile-en.png` and `recommendation-desktop-id.png`.

## Sources and asset attribution

- [Aviasales Data API](https://support.travelpayouts.com/hc/en-us/articles/203956163-Aviasales-Data-API): cached indicative fares, not invented past-year history.
- [API rate limits](https://support.travelpayouts.com/hc/en-us/articles/4402565416594-API-rate-limits): existing prices-for-dates access, bounded requests.
- Hanoi photo: © Vyacheslav Argenberg, [Hoan Kiem Lake](https://commons.wikimedia.org/wiki/File:Hanoi,_Vietnam,_Hoan_Kiem_Lake.jpg), [CC BY4.0](https://creativecommons.org/licenses/by/4.0/). Published960px image downloaded unchanged; displayed cropped. Source/license/crop attribution is in the Hanoi dialog. Existing KL/Singapore assets reused.

## Release follow-up

Changes remain local and uncommitted. A new KV namespace was created for this requested feature; no paid plan, credential or financial setting was changed. After release authorization, publish both code/assets and the binding with existing production variables preserved. Seed data serves until KV has a published snapshot; optionally initialise the current snapshot from the included non-sensitive seed to avoid an unnecessary first-month recollection. Verify production homepage/API and monthly persistence separately. Preserve unrelated WORKFLOW.md deletion and untracked owner/evidence files.


## Compact header follow-up —24October2026
Owner-requested welcome panel removed from the empty flight-search state. Price Watch and Continue itinerary share one utility row, notice spacing is reduced, and Explore headline/intro use less vertical space. At1280×900the form starts around268px and the entire search form fits onscreen.390×844English mobile layout inspected; utility links wrap naturally. Both shortcuts navigate correctly (no monitoring toggle, save or generation), and the saved KL itinerary remains restorable. Build and i18n coverage passed; no new implementation-mirroring tests added for these layout-only changes. Production unchanged. Evidence: explore-compact-desktop-id.png, explore-compact-mobile-en.png; artifacts/compact-explore-build.log and compact-explore-i18n.json.


## Pricing-copy follow-up —24October2026
Owner requested hiding pricing methodology. Dialog section renamed Rincian biaya / Cost breakdown; formulas/statistics/supplier sampling rules and ticket statistical references removed from rendered UI. Return-flight, whole-stay hotel, food, update date and excluded costs remain. Computation unchanged. Build and i18n passed; actual expanded Hanoi dialog confirms only cost details, screenshot recommendation-costs-only-id.png. Still local, not deployed.

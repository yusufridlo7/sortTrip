# Hanoi photo, flight discovery and full-stay budget QA

Verified locally on24October2026. Changes are uncommitted and not deployed.

## Findings and corrections

The existing Aviasales adapter successfully returned HTTP200. For CGK–HAN in November2026 the supplier cache contained two return fares: a nine-day trip at IDR4,963,191 and a five-day trip at IDR5,314,916. No rows were returned for the other two sampled months (February/June2027). The recommendation collector required exactly four days, so neither November fare qualified. This is a duration mismatch in our recommendation assumptions, not evidence that Hanoi has no flights or that the token/access is broken.

Hanoi now uses a five-day/four-night example, matching a verified cached return fare. KL/Singapore remain four-day/three-night examples. Search CTA passes the destination's actual duration, and the Hanoi editorial itinerary now ends on day5. Explicit user searches for four days continue to require four days; they are not silently expanded.

Flight statistics are pooled only for the same destination/trip duration. Older four-day Hanoi observations cannot contaminate the five-day series. Missing current hotel data does not inherit an older hotel's rate as a fresh quote.

The total budget previously already multiplied hotel nightly rate by three for the original four-day example. The detail row only displayed a nightly rate, which obscured the included stay cost. The server now exposes `hotelTotal`, `foodTotal`, `flightEstimate`, `days`, `nights` and `journey`; UI displays the **whole-stay hotel total**, plus the nightly multiplication. Duration values are used consistently in the formula, food allowance, example itinerary and search form.

## Verified Hanoi example

| Component | Verified basis | Amount IDR |
|---|---|---:|
| Return flights, one adult | CGK⇄HAN,7–11November2026, `one_way=false`, accepted return timestamp |5,314,916 |
| Hotel, four nights | Lowest of three actual four-night rates |1,354,480.25 |
| Food allowance, five days | Planning allowance80,000/day |400,000 |
| Budget from | Sum7,069,396.25 rounded up to50,000 |7,100,000 |

Actual hotel samples: Family Transit2 Hotel,23–27November2026 total1,358,091.07;21–25February2027 total1,354,480.25;21–25June2027 total1,354,480.25. Lowest per-night rate338,620.0625. These component samples are collected across dates; they do not establish one simultaneously bookable package at the displayed floor. Local/airport transport, paid attractions, additional baggage and insurance remain explicitly excluded. A single ticket observation has no calculated sample standard deviation.

Return-fare price is used once. It is neither a one-way fare nor doubled again. The existing adapter sends `one_way=false` for return searches and rejects missing/nonchronological return dates. New regression proves the Hanoi fare remains5,314,916, is accepted for five days and rejected for exact four days.

## Photo

Replaced the foreground-person lake image with an actual panorama of Hoan Kiem Lake, Turtle Tower and Hanoi's skyline at sunset, by Hân Vũ FPV. Asset: `public/hanoi.jpg`, versioned image URL to refresh cached photos. Source and licence credits appear in the Hanoi dialog.

- [Photograph on Pexels](https://www.pexels.com/photo/sunset-over-hanoi-skyline-and-hoan-kiem-lake-38983924/)
- [Pexels licence](https://www.pexels.com/license/) permits website use. Image downloaded at1280px and displayed cropped, without pixel editing.
- [Aviasales Data API reference](https://support.travelpayouts.com/hc/en-us/articles/203956163-Aviasales-Data-API) explains cached fare data and the `one_way` query parameter. Cache absence is not a no-service/no-availability conclusion.

## Verification

- 303 automated tests passed; new cases cover Hanoi five-day return pricing, four hotel nights, duration-series separation and missing-current-hotel handling.
- Production build and Worker deployment dry-run passed. Existing bundle-size advisory remains.
- i18n1465keys, no coverage errors/untranslated JSX literals. Also corrected a rendered flight-estimate fallback that remained Indonesian in English mode; actual refreshed English search now shows “Non-flight costs unavailable”.
- Official browser: Hanoi card opens5days/4nights and IDR7.1m; detail row displays hotel total1,354,480 and nightly multiplication; CTA fills HAN/5days/1adult/7.1m.
- Actual frontend search returned Vietnam→Hanoi,7–11November2026,5days,CGK⇄HAN,IDR5,314,916. No flight selected for a new trip and no booking made.
- English mobile390×844 detail layout verified, with header/close control retained and full-stay numbers readable. Indonesian desktop photo/card verified. Existing draft remained restorable; no save, AI generation/quota debit, credential change or payment.

Evidence: `artifacts/hanoi-flight-diagnosis.json`, `artifacts/hanoi-budget-refresh.json`, `artifacts/hanoi-budget-regression.tap`, `artifacts/hanoi-budget-build.log`, `artifacts/hanoi-budget-worker-check.log`, `artifacts/hanoi-budget-i18n.json`; browser captures `qa-reports/2026-10-23/evidence/hanoi-search-positive.png`, `hanoi-budget-mobile-en.png`, `hanoi-recommendation-desktop-id.png`.

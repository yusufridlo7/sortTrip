# Flight audit

Audit date: 23 October 2026 (Asia/Jakarta). Branch: codex/qa-production-readiness-2026-10-23. Local QA fixes only; no commit, push, deploy, migration, credential/financial setting change or real booking/payment/customer message. Pre-existing owner changes were preserved.

White-label Nuitée is outside the active product path and is not a release gate. Standalone Hotels uses Trip.com; itinerary hotels use Nuitée API + Payment SDK.

## Executed

Five real adapter route probes:CGK–KUL return 200 / 0 offers,CGK–SIN one-way 200 / 2(lowest808361IDR),CGK–BKK return 200 / 2(lowest4710978),CGK–NRT return 200 / 0,SUB–SIN return 200 / 0. Dates/windows are in scripts/qa-live-providers.mjs. Source: Aviasales Data API cached indicative fares, one adult. Empty cache is not sold-out availability.

Actual browser search exercised one-way selection,Singapore destination autocomplete, country/city/date/drilldown, flight details and duration sorting; affiliate URL inspected without purchasing. API tests cover flexible/exact dates, region/default/domestic/worldwide, invalid routes, deduplication and provider failures. Contract links preserve route/date and supported one-adult parameters. Other passenger costs are estimates unless provider says otherwise.

## Corrections and limitations

English singular city/stops/traveller/category/CTA corrected. Default Indonesia/SEA and optional worldwide remain available. Origin autocomplete is NOT_IMPLEMENTED: current origin is fixed CGK/SUB/DPS. Final live fare/baggage/seat inventory, all filter permutations and external airline checkout are NOT_TESTED; no group fare or bookable-price guarantee. Representative routes returning no cached fares remain valid empty-result connection tests.

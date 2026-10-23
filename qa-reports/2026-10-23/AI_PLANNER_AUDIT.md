# AI planner and itinerary audit

Audit date: 23 October 2026 (Asia/Jakarta). Branch: codex/qa-production-readiness-2026-10-23. Local QA fixes only; no commit, push, deploy, migration, credential/financial setting change or real booking/payment/customer message. Pre-existing owner changes were preserved.

White-label Nuitée is outside the active product path and is not a release gate. Standalone Hotels uses Trip.com; itinerary hotels use Nuitée API + Payment SDK.

## Evidence

Current provider is OpenAI; no Meta adapter found. Unit/contracts cover structured JSON schema, geographical/date/transport context, prompt safety, retries/timeouts, fact/quote constraints, costs, preservation of paid/manual items and failed-result quota behavior (see individual UNIT rows). Source mocks are not twelve live itinerary generations.

Live display translation of an existing Indonesian itinerary completed in English with30January–1February2027, summaries/notes translated, original user prompt preserved.10 successful-result quota remained. Month/weekday instruction and cachev2 fixed stale mixed language. Source validation preserves numeric facts, identifiers,URLs and prices; supplier/place proper names remain. Unknown historical route-placeholder fields may remain original-language: LOC-01.

Existing saved trip read/reopen and edit modal open/close were verified; no save/delete/paid-toggle/regenerate action on owner data. Budget model/paid-item protection and multi-city application are contract-tested. Whole-trip duplicate/export/share/delete and Meta collaboration are NOT_IMPLEMENTED.

## Profile coverage

Budget, luxury, family, solo, multi-city, multi-country, flexible/fixed dates, hotel/budget/transport changes and regeneration all have explicit NOT_TESTED live rows. A disposable account/itinerary is required to run these without consuming owner entitlement or overwriting records. No invented live price/confirmed-booking claim is approved by this audit. Historic AI recommendations can still contain stale or unverified supplier facts; source labels must remain visible.

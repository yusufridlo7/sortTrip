# UX, accessibility and SEO audit

Audit date: 23 October 2026 (Asia/Jakarta). Branch: codex/qa-production-readiness-2026-10-23. Local QA fixes only; no commit, push, deploy, migration, credential/financial setting change or real booking/payment/customer message. Pre-existing owner changes were preserved.

White-label Nuitée is outside the active product path and is not a release gate. Standalone Hotels uses Trip.com; itinerary hotels use Nuitée API + Payment SDK.

## Executed browser coverage

147 top-level overflow samples across21views at320,375,390,768,1024,1440,1920px; no horizontal document overflow in these samples. ID/EN homepage/help/flights/Trip.com/transport/saved/planner/map/costs/native hotel/Price Watch/edit dialog/policies/checkout shells are represented. 29 recorded browser interactions cover dialogs,10FAQ entries,empty search,one-way/autocomplete/details,language persistence,mobile dropdown,trip read,Google WALK,translation,budget validation,legal navigation and12Go readiness. Screenshots accompany320/1440samples.

DOM image-alt scan found0missingalt in sampled top-level views. Modal rawDOM unnamed-button metric1 is not itself a confirmed defect: accessibility tree showed named modalcontrols and the scan includes background/inert content. No comprehensive cross-origin iframe alt/focus, screen-reader, colour-contrast or touch-target certification. Payments/consent/delete/save/register/logout were not executed on owner account.

## Findings

English plural/category/CTA/geography/narrative month and aria labels fixed; ID/EN forms remain responsive. True404 and crawl files pass locally. Production unknownpage/crawl responses remain FAIL pending owner release. Header navigation is in-memory:refresh returns Explore while language/session/draft persist; browserback/forward verified on real policy URLs. This behavior is documented rather than falsely claiming deep-linking of every view.

Expired/empty checkout does not start a payment. Local not-ready error is translated; an empty checkout lacks a dedicated Find hotel CTA beyond Return home (P3improvement). Native real payment form full3DS/confirmUI cannot be recreated safely on owner production record. Original owner payment tab preserved.

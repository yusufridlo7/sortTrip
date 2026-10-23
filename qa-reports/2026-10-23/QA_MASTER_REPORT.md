# SortTrip master QA report

Audit date: 23 October 2026 (Asia/Jakarta). Branch: codex/qa-production-readiness-2026-10-23. Local QA fixes only; no commit, push, deploy, migration, credential/financial setting change or real booking/payment/customer message. Pre-existing owner changes were preserved.

White-label Nuitée is outside the active product path and is not a release gate. Standalone Hotels uses Trip.com; itinerary hotels use Nuitée API + Payment SDK.

## Assessment

**NO-GO for unrestricted financial/booking launch. CONDITIONAL GO for limited read-only discovery/affiliate browsing**, with unverified fares clearly labelled and the restrictions in PRODUCTION_READINESS.md. QA execution/reporting is closed for this evidence snapshot; this does not certify every feature or resolve owner-controlled operations.

| Status | Count |
| --- | --- |
| PASS | 490 |
| FAIL | 3 |
| PARTIAL | 1 |
| BLOCKED | 1 |
| OWNER_ACTION_REQUIRED | 10 |
| NOT_IMPLEMENTED | 7 |
| NOT_TESTED | 17 |

Total matrix rows: **529**. This is a mixed-layer ledger, not 529 end-to-end user journeys. Automated fixtures:259PASS; browser layout samples:147; browser interaction records:29; HTTP probes:46; supplier read-only probes:9. Baseline251 tests are historical, not double-counted. White-label 403 archived but excluded from current counts. No skipped case counted as PASS.

## Findings and safe corrections

15 fix groups were implemented locally. No observed P0 in the bounded audit; this is not a security assurance or evidence that hidden vulnerabilities do not exist. Three production SEO/404 probes remain FAIL because local fixes have not been released. One local checkout readiness probe is BLOCKED.

| ID | Severity | Finding | Test ID | Expected | Actual | Reproduction | Cause / recommendation | Fix / regression |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| REL-01 | P1 | Production lacks the local QA fixes | PROD-MISSING-PAGE / PROD-ROBOTS / PROD-SITEMAP | Unknown page should404; crawl files should be real. | Production returned200 homepage HTML for all three. | GET each path in HTTP evidence. | QA source not deployed; owner release needed. | OPEN; local fixes PASS, production NOT RELEASED |
| PAY-01 | P1 | Live financial lifecycle unverified | E2E-NUITEE-FINANCIAL / E2E-MIDTRANS-SANDBOX | Server-verified authorization, booking and correct recover/refund/entitlement lifecycle. | Only contracts, protected-route probes and historical owner SDK render; no current full financial E2E. | Run an isolated sandbox payment and owner-operated authorized supplier test. | Need controlled environment; LAS-3185 commercial liability still unanswered. | OWNER_ACTION_REQUIRED; fixtures PASS, live NOT_TESTED |
| PW-01 | P1 | Scheduled alert delivery not established | E2E-PRICE-WATCH-DELIVERY | A scheduled lower fare produces one accurate in-app/email alert. | Existing watch has last-check timestamp/no fare; no actual delivery witnessed. | Use a controlled watch/recipient and observe a scheduled baseline then synthetic eligible lower fare. | No designated test recipient; production scheduler cannot be safely forced. | OWNER_ACTION_REQUIRED; unit/contract PASS |
| DB-01 | P1 | Deployed policy/migration isolation not attested | E2E-AUTH-RLS / E2E-MIGRATIONS | Two users cannot access each other’s records; deployed grants match source. | Source RLS examined; two-user deployed test not executed. | Use two QA accounts and isolated records, verify read/write/RPC denial. | No controlled accounts or privileged migration attestation. | OWNER_ACTION_REQUIRED; source review only |
| CFG-01 | P2 | Local/prod readiness differs | LOCAL-HOTEL-PRIVATE / LOCAL-VIATOR-HEALTH | Clear environment separation and intended enabled features. | Local checkout503; local Viator sandbox while production inventory200. | GET local history/activities health and compare production evidence. | Local private overrides / owner financial config retained. | BLOCKED locally; do not change credentials/approval flags |
| SUP-01 | P2 | Two-way support delivery unverified | E2E-SUPPORT-TWOWAY | Controlled user/admin conversation round-trips and persists. | Source/fixtures implemented; local disabled, production config enabled; no message sent. | Use controlled ticket and designated admin, reply and close. | No test recipient authorization/configuration. | OWNER_ACTION_REQUIRED |
| PERF-01 | P2 | Large entry bundle | PERF-CWV | Measured acceptable mobile load/interaction. | Entry JS about966kB minified/288kB gzip; Vite chunk warning; CWV not measured. | Build; profile throttled mobile with cold cache. | Large shared application bundle. | OPEN; schedule route/component chunking and measure before choosing optimization |
| SEC-01 | P2 | Static response hardening incomplete | HTTP headers in http-probes*.json | Security headers compatible with SDK/widgets. | Several static responses lack CSP/referrer/frame/nosniff/HSTS headers. | Inspect recorded headers on root/policies. | No shared hardened static policy; third-party embeds need an allowlist. | OPEN; design report-only CSP first, test SDK/widgets before enforcement |
| LEGAL-01 | P2 | Policy wording needs product/legal review | UI-POLICIES-LANGUAGE-HISTORY | Privacy accurately describes available deletion and native SDK flow. | Privacy says users can delete trips, but whole-trip delete not found; general partner-site wording may conflict with embedded SDK section; “where the external service applies” is ambiguous. | Read privacy data-management, booking and Google sections. | Historical prose not aligned consistently; meaning deliberately preserved. | OWNER_ACTION_REQUIRED; proposed interpretation must be reviewed, no legal rewrite applied |
| LOC-01 | P3 | Third-party and historic content exceptions | UI-12GO-READY / UI-TRIPCOM-WIDGET | Consistent language where under SortTrip control. | 12Go English form in Indonesian shell; Trip.com 0 Children vendor copy; provider review text and original user input may remain original. Some saved route placeholder modes/locations remain source-language. | Open widgets and historical AI trip; expand route details. | Vendor-controlled frame / user-authored data / unknown narrative placeholders. | PARTIAL; do not rewrite supplier/place facts or cross-origin widgets |
| A11Y-01 | P3 | Accessibility coverage partial | A11Y-WCAG | Full WCAG2.2AA evidence. | No top-level image-alt omissions sampled; modal DOM metric found one unnamed background/inert element, while modal AX buttons were named. No full contrast/screen-reader audit. | Inspect accessible dialog and run dedicated screen reader/contrast profiling. | DOM heuristic is not a full accessible-name/inert-tree algorithm. | PARTIAL; manual verification required |
| SEO-01 | P3 | Client views share one browser route | UI navigation / static source | Navigation state survives expected refresh/back behavior. | Header sections use in-memory view state; refresh returns Explore, though session/language/trip draft persist. | Open transport then refresh; return to Explore. | Single-path SPA state model. | OPEN product decision; real policy URLs back/forward PASS |

## Evidence and coverage limits

See QA_TEST_MATRIX.csv for each test ID, status, layer and evidence. See FEATURE_INVENTORY.md for all inventoried source files, endpoint families and database definitions. The source scan covers 156 selected files; generated/vendor/env/secret/queue/git-history contents are excluded. All identified source control families are mapped; not every destructive/payment/login button was clicked. Those exclusions are explicit in the matrix, not assumed to work. Screenshots and sanitized JSON/TAP/build output are under 2026-10-23/evidence. Browser iframe pixels/inputs and full WCAG/CWV are not covered by the top-level layout metric.

## Remaining work ownership

Owner-operated controlled financial, multi-user database and messaging tests are in OWNER_ACTION_REQUIRED.md. Engineering follow-ups are in FIX_LOG.md and domain reports. Source RLS and mock provider behavior do not prove deployed policy state, successful payment, supplier reservation, scheduler execution or notification receipt.

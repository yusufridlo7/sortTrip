# Performance and reliability audit

Audit date: 23 October 2026 (Asia/Jakarta). Branch: codex/qa-production-readiness-2026-10-23. Local QA fixes only; no commit, push, deploy, migration, credential/financial setting change or real booking/payment/customer message. Pre-existing owner changes were preserved.

White-label Nuitée is outside the active product path and is not a release gate. Standalone Hotels uses Trip.com; itinerary hotels use Nuitée API + Payment SDK.

## Measurements

The final build produces approximately 966 kB of entry JavaScript (288 kB gzip), 156 kB of CSS (33 kB gzip) and a lazy Leaflet chunk of 149 kB (43 kB gzip). Vite still reports an entry chunk larger than 500 kB. Exact sizes and build duration are in build-final.log; build time is not page-load performance.

Recorded supplier elapsed samples: Yogyakarta hotel search 6,307 ms, content 1,209 ms, production Viator 2,035 ms and flight searches 290–738 ms. These are individual mixed warm/cold samples, not p95 latency, an SLA or a load benchmark. HTTP probe JSON includes individual timings. No high-volume production load test was run.

The console summary captured two warning/error entries. Raw messages and URLs were not retained to avoid sensitive diagnostic data. Local checkout readiness 503 was deliberately exercised; no blanket claim of a clean console is made.

Timeouts, retries, invalid provider responses, duplicate actions and cache/identity handling have mock regression coverage. LCP, INP, CLS, heap memory, throttled/offline networking and physical-device profiling are NOT_TESTED. Split the large application bundle where measurements justify it, then profile a cold mobile load before setting acceptance thresholds.

## Local rebuild incident

Repeated dist rebuilds while Wrangler dev was running temporarily produced static404 responses for the homepage and checkout. Restarting the agent-owned local Worker restored both to200 while unknown pages remained404. This is consistent with stale local asset-manifest state; no source checkout-routing defect was established. See evidence/runtime-rebuild-incident.json and final HTTP probes. Complete the build before starting the QA Worker.

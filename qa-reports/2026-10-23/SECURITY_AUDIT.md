# Security audit

Audit date: 23 October 2026 (Asia/Jakarta). Branch: codex/qa-production-readiness-2026-10-23. Local QA fixes only; no commit, push, deploy, migration, credential/financial setting change or real booking/payment/customer message. Pre-existing owner changes were preserved.

White-label Nuitée is outside the active product path and is not a release gate. Standalone Hotels uses Trip.com; itinerary hotels use Nuitée API + Payment SDK.

## Bounded findings

Full npm audit0 known advisories (evidence/npm-audit.json), not proof of no vulnerabilities. Limited source/build pattern scan across 156 selected files found0 private-key/service-role JWT/private API key patterns.42 env names only were inventoried. No env/dev.vars/secret/queue/git-history files read; no secret values output. This is not an exhaustive historical secret scan.

Auth/origin/webhook negative HTTP probes pass. Contracts cover trusted HTTPS hosts,query validation, SSRF/redirect constraints,provider failure sanitization,unsafe AI output,booking price/consent/status guards, payment amount/signature and idempotency,support authorization/rate/privacy rules. Parameterized Supabase APIs and RLS source reviewed. Deployed DB policies/two-account isolation, token refresh and external account/WAF security not attested.

React text rendering reduces direct HTML injection; this is not a complete XSS audit. Vendor affiliate scripts and sandboxed third-party widgets remain supply-chain dependencies. Several static pages lack security headers (SEC-01); enforce a tested allowlist/report-only CSP before production enforcement to avoid breaking official SDK/widgets. No destructive penetration test or third-party attack run.

No observed P0; P1 payment/RLS verification gaps remain. Source credentials are server-side as reviewed, but no claim about supplier compromise or universal immunity is made.

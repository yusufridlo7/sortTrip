# PHP2Shell exposure review — SortTrip

Review date: 2026-10-22 (Asia/Jakarta). Owner requested checking SortTrip and connected platforms. Read-only local inspection, npm advisory checks and public vendor research; no exploit payloads, third-party scans, credential inspection, supplier authentication, bookings or production changes.

## Conclusion and limits

No PHP web runtime identified in the reviewed SortTrip application/deployment definitions. Frontend is React/TypeScript built by Vite; production backend is JavaScript Cloudflare Workers with static assets. Optional browser service uses Node22/Playwright and a Node Docker base, not PHP. Source inventory found no PHP/phtml/phar application or Composer manifests in app/worker/services/public. This supports NOT APPLICABLE for direct PHP2Shell exposure in that reviewed deployment, not a general security certification or proof of no compromise. Unmanaged infrastructure, developer machine PHP installations, supplier internal services, Cloudflare account WAF state and historical security logs were not audited.

Ordinary public GETs to homepage and /api/health returned HTTP200/server cloudflare. No PHP X-Powered-By marker observed; header absence alone is not proof of runtime. Public GET success proves availability only, not security or PHP patching.

## Confirmed threat

PHP's 2026-10-21 advisory identifies CVE-2026-109618 (OOM corruption) and CVE-2026-109619 (stale global state), potentially unauthenticated RCE. PHP8.5.12/8.4.27/8.3.36/8.2.35 include fixes. Distribution/LTS backports must be assessed from vendor evidence; old numeric versions alone are insufficient to reject a backported fix. PHP web deployments must update/restart affected workers; application/plugin updates or WAF alone do not replace runtime fixes.

Source: https://www.php.net/ (Security advisory: Critical remote code execution vulnerabilities, update now,21Oct2026).

Cloudflare announces PHP2Shell protections for WAF users including Free. This is not confirmation that the owner's specific workers.dev/custom-domain routes have the relevant rules deployed/blocking; no dashboard review performed. Source: https://blog.cloudflare.com/php-vulnerabilities-waf-protection .

## Connected platforms / supplier boundary

Public indexed-domain searches for PHP2Shell found no partner-specific statement for Supabase, LiteAPI, Nuitee, Midtrans, Travelpayouts, Aviasales,12Go,Trip.com,Klook,Viator,Google Cloud,Telegram,Stripe or OpenAI during this review. This is limited public-search evidence, not a statement that these vendors are unaffected or that their whole infrastructure uses no PHP. No partner approval/production status changed. Provider support or official incident advisory is required for a positive patch/unaffected claim.

SortTrip uses server-side JSON APIs for core suppliers and a third-party LiteAPI payment script on checkout; legacy affiliate widgets/links also exist. A compromised API service could affect data integrity/availability, and a compromised third-party script could affect browser checkout. PHP2Shell does not automatically cross an HTTP API into the Worker, but lack of direct PHP exposure does not eliminate supply-chain risk. No claim of supplier compromise is made.

## Separate npm findings (not PHP2Shell)

Registry-backed root `npm audit --json`:6 package entries rated high,0critical. Entries include propagation of the same underlying advisories; this is not6independent PHP flaws.

| Installed package | Path / finding |
| --- | --- |
| vite8.0.13 | Direct development dependency; Windows file-deny bypass and editor-handling advisories |
| wrangler4.143.0 | Direct development dependency, inherits Miniflare advisories |
| miniflare5.20260926.0-alpha | Development runtime dependency, inherits sharp/undici findings |
| sharp0.35.4 | Development dependency; librsvg advisory, audit fix available |
| undici7.29.0 | Development dependency; multiple HTTP/WebSocket advisories, patched7.29.1 branch available |
| source-map-js1.2.1 | Tailwind/PostCSS development chain; indexed-source-map DoS, fix1.2.2 or later |

Root `npm audit --omit=dev --json`:0 known advisory entries. Separate optional browser-service npm audit:0. Neither result certifies runtime OS/container image/Chromium safety, exploit reachability or future unknown issues.

Vite dev and preview scripts bind127.0.0.1; no evidence of public Vite exposure in reviewed configuration. Maintain local binding/no tunnels. Local-only access reduces exposure but does not substitute for updating tooling or establish safety against all browser-origin/local attacks. Production Worker serves built assets, not Vite dev server.

Primary maintainer examples:
- https://github.com/vitejs/vite/security/advisories/GHSA-fx2h-pf6j-xcff
- https://github.com/nodejs/undici/security/advisories/GHSA-w293-vg96-wgc3

First registry attempt failed DNS in sandbox; approved rerun succeeded. npm audit did not modify package manifests/locks. No package upgrade, npm audit fix, commit/push/deploy or server settings change performed.

## Next actions

1. Prioritize a reviewed local security update of Vite, Wrangler and affected transitive dependencies; avoid force/major blind upgrades. Repeat root full/production and browser-service audits, build and relevant Worker/checkout/security tests before release.
2. Check Cloudflare Security events/rules only through authorized owner session; do not infer installed WAF state from the provider blog or HTTP header.
3. If supplier assurance is required, request written PHP2Shell applicability/patch/incident confirmation from vendor support. No outreach was sent by this review.
4. Any newly discovered PHP origin under owner control requires runtime version/backport inventory and official patch/restart. No unknown exploit scanner or downloaded PoC is necessary for this assessment.


## Follow-up: tooling remediated locally — 2026-10-22
Owner subsequently authorized Vite update/deploy. Vite8.3.5,Wrangler4.151.3 and lockfile updates resolve all6previous high package entries in current registry audit (0known findings). source-map-js1.2.2,sharp0.35.5,undici7.29.1 verified in tree. All228fixtures/build/i18n/dry-run pass on owner-upgraded Node24.22.1. This supersedes pending local tooling-update action above, not the limits of the PHP/supplier assessment. Cloudflare deploy blocked at CLI auth and awaiting owner; production remains unchanged.

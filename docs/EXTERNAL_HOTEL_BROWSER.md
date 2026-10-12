# External hidden hotel browser

Local implementation, not a production deployment. Browser work runs on a separate Node service; the website receives only validated dated hotel prices through the Worker. No browser windows or supplier pages appear on the customer's device.

## Local testing

1. `npm.cmd --prefix services/hotel-browser ci`
2. `node services/hotel-browser/node_modules/playwright/cli.js install chromium`
3. `node services/hotel-browser/server.mjs`
4. In another terminal, `node services/hotel-browser/smoke.mjs`

Local server binds only 127.0.0.1:8794. It rejects browser-origin requests and accepts only predefined public Trip.com property URL shapes, valid dates, one room and one/two adults. Smoke uses a fixed public hotel; no AI provider, account, trip, quota or payment operations. Fresh anonymous contexts contain no owner browser sessions. No login/CAPTCHA or access-check bypass.

## Production deployment remains owner-controlled

A separate server is required; owner currently has none. Build Docker from the repository root with this Dockerfile if using containers. Docker image build and hosting are not yet verified. Server must have enough memory for Chromium, controlled outbound access, a process supervisor and an HTTPS reverse proxy. Keep port8794 private. Browser sessions are ephemeral; do not mount owner browser profiles. Default Chromium process settings are used without stealth or proxy rotation.

Owner privately configures `HOTEL_SERVICE_PUBLIC=true` and `HOTEL_PRICE_SERVICE_TOKEN` (at least32 characters) in the service. Public mode refuses to start without authentication. The same secret belongs only in the Worker runtime, never frontend code. The agent does not create, inspect or change credentials.

Worker runtime settings after server QA: `HOTEL_PRICE_SERVICE_ENABLED=true`, `HOTEL_PRICE_SERVICE_URL=https://<owned-service-host>/v1/hotel-prices`, and privately set `HOTEL_PRICE_SERVICE_TOKEN`. No real hostname is configured yet. URL must be HTTPS without credentials, query, fragments or a nonstandard port. Request redirects are rejected. No automatic failover to Cloudflare after an external supplier access failure.

The Worker authenticates the customer and reserves usage through its existing itinerary handler, calls the external service for eligible hotels, then independently verifies returned property, dates, guests, duration and inclusive total. Success follows existing save/quota processing; unavailable evidence yields no fabricated price. Hotel evidence does not change affiliate booking links. No database migration needed for the external service.

## Bounds

One browser batch per service process; concurrent requests return429. Up to3 hotels and45 seconds per batch. Max12KB request; no request/header/body dumps or raw exception logging. Only public property search, no checkout. Service stores no customer identity or tokens. Costs, actual supplier access and VPS availability must be verified on the chosen host before enabling production. A successful Desktop browser lookup does not guarantee fresh headless sessions will succeed.

## Actual local result —2026-10-12
192 tests/build/Worker dry-run pass. Service-local Playwright Chromium fresh anonymous headless context opens public hotel property HTTP200 but no inclusive room total renders, including ordinary scroll to the room region. Actual smoke:0 accepted quotes, accessRequired false,PRICE_NOT_RENDERED. Desktop existing-session success does not establish headless access. The full-Chromium channel was also tried but failed to launch in this Windows environment; default headless retained. The service was stopped after testing. No production deployment/configuration, user trip changes, quota consumption or payment. No VPS exists yet; do not purchase one assuming it solves access. Need a genuinely successful provider-backed retrieval before enabling production.

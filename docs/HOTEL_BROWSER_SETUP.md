# Hidden Trip.com price search

Deployed under owner authorization on 2026-10-11; automatic cloud hotel-price retrieval remains unsuccessful and is not production-ready. A public Desktop browser search was verified on 2026-10-11: CUBE Boutique Capsule Hotel @ Kampong Glam, 2027-02-04 to 2027-02-05, one adult, one room; mixed single capsule, non-refundable, total IDR 645,152 including taxes and fees. This is an observed offer at that time, not a booking or a cloud-runtime test.

## Configuration to activate after review

Cloudflare Browser Run uses the `HOTEL_BROWSER` browser binding and `nodejs_compat`. The complete alternate configuration is `wrangler.hotel-browser.jsonc`, preserving the existing assets, rate limiter and cron. It also sets the non-secret variable `HOTEL_BROWSER_ENABLED=true`. The ordinary `wrangler.jsonc` remains unchanged. Review both configurations together when changing shared settings.

The owner must confirm Browser Run availability and any account billing/authorization in Cloudflare. Never paste credentials into chat or documentation. No new secret is required for this binding. Deployment is a separate authorized action; use `wrangler deploy --config wrangler.hotel-browser.jsonc` only after owner authorization. Existing deployed secrets are retained by Wrangler; verify dashboard variables required by the app rather than printing values.

Before considering this production-ready: run a real authenticated SortTrip price refresh against the deployed browser binding, verify hotel identity, dates, guests and inclusive total, successful quota decrement once, cloud save and reload. Test unavailable/challenge behavior and cost/latency under actual traffic. A dry-run bundle does not verify Cloudflare browser execution or Trip.com acceptance of a cloud browser.

## Behavior and limits

- Anonymous background browser reads only public hotel results; no login, Reserve, payment, credential storage or CAPTCHA bypass. A challenge or unavailable result leaves the hotel amount unchanged.
- Initially supports one room with one or two adults, no children, up to three hotel searches per request. Other room/guest configurations remain unknown until verified support is added.
- Public hotel page resolution uses cited Trip.com property URLs. Exact hotel name, date parameters, rendered nights/guests, occupancy, room type, cancellation terms and inclusive IDR total must match. Model-generated prices are never accepted as actual dated prices.
- The stay total is stored directly without multiplying it by nights or guests again. Room type, dates, guests, source and checked time accompany it. Supplier prices can change before checkout.
- Trip.com's property/rate DOM can change. Parser failure yields unknown rather than a fabricated price. Conditional first-booking/member/login/coupon offers are excluded.
- Existing affiliate booking links remain separate from evidence links. Price research does not establish affiliate attribution or change existing paid reservations.
- Successful batch refresh follows the existing one-result quota reservation and save flow. A batch with no accepted prices releases the successful-result reservation; partial accepted transport or hotel results may consume one result for that successful batch.

Official binding documentation: https://developers.cloudflare.com/browser-run/playwright/ and https://developers.cloudflare.com/browser-run/reference/wrangler/.


## Deployment checkpoint —2026-10-11
Owner-authorized deployment completed; final version052d68aa-f4bf-4f6b-b419-8e8ec9823bf4. The binding successfully launches. Production Trip.com searches returnHTTP200 without hotel/quote DOM, including after ordinary landing warm-up; the cloud price workflow is not production-ready. Desktop dated-price proof does not establish cloud access. No new billing/credential action is justified by this evidence. Failed tests retained the itinerary prices and10 remaining results. Final137 regressions pass. Continue provider-rendering diagnosis or official inventory integration before claiming automatic actual-price insertion.

2026-10-11 Continued existing hotel diagnosis without resetting setup or credentials. Production logs identified a main-document redirect on www.trip.com to an account/login path (fixed diagnostic HOTEL_BROWSER_REDIRECT_ACCOUNT), not a hotel quote page. Navigation is blocked by design; no account/login/CAPTCHA action was performed. Adapter now ends further hotel attempts immediately on this access gate and reports a fixed PRICE_SOURCE_ACCESS_REQUIRED message when the batch yields no prices, preserving failed-result quota and existing prices. Owner-authorized deployment version22c07d12-cf3d-422c-ab8b-26562f113562 uses wrangler.hotel-browser.jsonc --keep-vars.13 focused hotel/price tests pass. Automatic cloud dated-price insertion remains unverified and blocked by supplier access; Desktop public observations do not establish server access. No commit/push or secret changes.

2026-10-12 Indonesian support checkpoint: local adapter accepts id.trip.com public property sources and ID labels/Rp totals, with rendered-date/guest/night validation.188 tests/build pass. Opt-in isolated local-worker smoke uses existing remote browser and no customer data, AI or payment calls: id.Trip.com navigation still reaches account gate after HTTP200;0 accepted quotes. No access bypass or production deployment. Desktop observed property quote is not cloud quote proof; release remains on hold.

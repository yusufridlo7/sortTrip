# Viator Basic Access — local backend preparation
Latest evidence (2026-10-01): API dashboard now shows Full Access selected for sandbox and production with Enabled labels. The existing limited adapter remains unchanged. Fresh-runtime sandbox search after owner key replacement still returned HTTP 401; successful authentication and API certification are not established. Historical Basic Access evidence below has been superseded by the upgrade UI observation.

Account evidence (2026-10-01): the owner supplied a masked dashboard screenshot showing Production keys, Basic Access, Enabled. Production entitlement exists. Local runtime configuration, sandbox access and successful API requests are separate and have not yet been verified.

## Owner-only setup

The ignored root `.dev.vars` file was created with an empty `VIATOR_API_KEY` and `VIATOR_ENVIRONMENT=sandbox`. Wrangler loads this file locally. It is not a Vite environment file and the key must never use a `VITE_` prefix.

1. In Viator, obtain a sandbox key using your own browser interaction. If only a production key is available, complete the official sandbox access procedure first. Do not paste a production key into sandbox configuration.
2. Open `.dev.vars` locally yourself. Enter the sandbox value after `VIATOR_API_KEY=`. Keep `VIATOR_ENVIRONMENT=sandbox`. Do not send the value, screenshot of it, or file content to the agent.
3. Restart `npm run dev:worker`. Run the frontend separately with `npm run dev` if needed.
4. Tell the agent that local configuration is complete. The next step is a sanitized sandbox connection check, followed by UI integration. No credentials are needed in chat.

Production secrets are a later owner-only deployment action; no production config/deploy was performed. Do not replace existing secret files or copy other service values into documentation.

## Implemented backend

- `GET /api/activities/health`: booleans and environment only; `connectionTested:false` means this endpoint does not contact Viator.
- `GET /api/activities?destination=<Viator destination ID>&count=10&start=1`: bounded search mapped to POST `/partner/products/search`, API version 2.0, English content, IDR prices.
- `VIATOR_ENVIRONMENT` accepts only `sandbox` (default) or `production`; callers cannot choose an arbitrary upstream host.
- Key stays in the server request header. Requests timeout after 10 seconds and redirects are rejected. Provider errors are replaced by fixed safe codes.
- Response includes only normalized summaries and provider-generated Viator click-out URLs. Prices are starting prices, not final booking quotes. Wrong currency and unsafe links are discarded. No booking/payment endpoint is implemented.
- This stage adds the backend adapter only. No customer-facing live activities UI, destination taxonomy mapping, rate-limit rollout, or production readiness is claimed. Existing Aviasales integration remains unchanged.

## Verification

Latest real attempt (2026-10-01): local configuration was present, but sandbox returned HTTP 401 and the adapter returned `VIATOR_AUTH_REQUIRED`. Owner must verify sandbox key/environment and enabled access. Do not infer that the key is production-only from this response alone. Do not use a production request as a diagnostic fallback.

Run `node --test checks/viator-api.test.mjs`, existing API tests and `npm run build`. These tests use synthetic data, never local environment values. Real sandbox verification remains pending owner setup.

Sources: [Basic Access integration guide](https://partnerresources.viator.com/travel-commerce/affiliate/basic-access/golden-path/), [API technical documentation](https://docs.viator.com/partner-api/technical/). The official technical documentation requires testing in sandbox. A masked production key screenshot is not a successful connection test.

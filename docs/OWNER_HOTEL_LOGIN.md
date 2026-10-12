# Owner-only Cloudflare hotel login experiment

Implemented locally, not activated for customer production requests. This prepares a Cloudflare Browser Run session for the owner to log in manually via Live View, then save encrypted browser state for an isolated restore test.

Start `node scripts/hotel-owner-login.mjs` and open `http://127.0.0.1:8795/`. The panel binds only loopback and requires the exact local Host and same-origin POSTs. Its isolated workerd control port also rejects browser-origin requests and requires the panel's custom control header; it is not a public endpoint. No customer app or database credentials are loaded by this configuration.

1. Prepare the Cloudflare browser in the panel.
2. Open Live View and enter Trip.com login/password/OTP yourself. The agent must hand off authentication; no CAPTCHA bypass.
3. Enter a separate encryption passphrase of at least16 characters in the local panel (not your Trip.com password), confirm that you completed login and permit saving, then click Save.
4. The runtime captures only Trip.com browser state, encrypts it with AES-GCM and a PBKDF2-derived key (random salt/IV), and stores ciphertext in ignored `.sorttrip-auth/cloud-hotel-session.enc`. The passphrase is not persisted. Do not paste it, state, or Live View URLs in chat, logs or documentation.
5. A later Restore uses the owner-entered passphrase, opens a new cloud browser with that state, and provides another Live View. Verify account state there. A successful save means ciphertext was stored, not proof of valid authentication or successful price retrieval.

Live View credentials stay in the runtime and are reached through a no-store local redirect. No API tokens, session IDs or signed viewer links are printed by the panel. Recording is not enabled. The agent must not inspect form values or auth files. Close the browser when the experiment ends.

The active session uses a10-minute inactivity timeout; stored snapshot has an application-imposed7-day cap, not a promise that Trip.com login lasts7days. Supplier authentication may expire/revoke earlier. A restart ends the interactive browser; existing snapshot can be restored with the owner's passphrase. Closing browser retains ciphertext so a restore can be tested.

Authentication persistence for production still needs protected backend storage and owner-only controls, plus confirmation that login yields dated room prices. This panel does not connect stored login to public SortTrip requests. Do not deploy the experimental worker or control panel publicly. The existing release hold remains.

Sources: https://developers.cloudflare.com/browser-run/features/live-view/ and https://developers.cloudflare.com/browser-run/playwright/#storage-state

2026-10-12 Handoff repair: owner saw SESSION_NOT_ACTIVE. Panel now forwards302 with redirect manual and generates Live View at click time. Isolated local Durable Object retains browser/context across requests. Fresh start and separate /view request verified302 without printing signed links. Missing/expired session shows a return-to-panel page rather than rawJSON. Cloud login/save still owner-operated and not verified.

2026-10-12 Connection follow-up: user saw Trip.com then disconnect. Added harmless30s connectivity checks while panel remains open, bounded to20minutes from preparation; this can reduce idle expiry but is not a reconnect guarantee. Current creation test fails with CLOUD_BROWSER_LIMIT (safe provider429/limit classification); daily/concurrency/rate type not yet independently verified. Do not claim authentication saved. Owner can inspect limits/live sessions in Cloudflare; retry only after limit clears. No automatic launch retry.

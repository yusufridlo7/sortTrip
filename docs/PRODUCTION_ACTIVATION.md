# SortTrip production activation

## Current checkpoint — 2026-10-11

Owner reports the Midtrans merchant account is active and has now privately installed the production Server Key, changed MIDTRANS_ENV to production, and completed the requested flags/notification configuration. This supersedes the initial missing-key checkpoint. These are owner statements, not a verified production transaction or effective remote payment settings. No production environment setting or secret has been changed by the agent.

The Worker already selects production Snap and status endpoints when `MIDTRANS_ENV=production`. Local hardening now rejects owner-test grants in production even if an old test flag is still enabled. This change is not deployed yet.

## Owner setup in Cloudflare

1. Open Workers & Pages → `sorttrip` → Settings → Variables and Secrets.
2. Add/update **Secret** `MIDTRANS_SERVER_KEY` privately with the Server Key from the Midtrans **Production** dashboard. Do not use Supabase anon/service keys, and do not send the key in chat or screenshots.
3. Set non-sensitive variables `MIDTRANS_ENV=production`, `OWNER_TEST_ENABLED=false`, and `PAYMENTS_ENABLED=false` while preparing the release. Save through Cloudflare's normal interface. These settings may create a new Worker version; keep purchases closed during setup.
4. In Midtrans Production payment settings, set the HTTP payment notification URL to `https://sorttrip.yusufridlo7.workers.dev/api/payments/webhook`. The standard Snap integration verifies the notification signature and then checks Midtrans status before granting access.
5. After the hardened source is released and configuration is verified, the owner opens purchases by setting `PAYMENTS_ENABLED=true`. The owner performs the first real checkout and payment. Verify server-confirmed settlement, Trip Pass activation, reload, and account-wide AI quota. Do not use test-pass grants as evidence that production payment works.

Source: https://docs.midtrans.com/docs/switching-to-production-mode and https://docs.midtrans.com/docs/https-notification-webhooks . No Client Key is required by the current server-generated Snap redirect flow.

## Other services

- AI and Supabase already use their normal service endpoints; API billing, database migrations and quota are separate owner-controlled prerequisites. No fake response or quota reset is part of activation.
- Aviasales/Travelpayouts, 12Go and Trip.com affiliate links already point to external customer services. Affiliate attribution, live prices and booking settlement are distinct checks; do not claim they are verified by a production mode setting.
- Viator remains blocked on the unresolved authenticated API/partner verification recorded in `PARTNERS.md`. Do not switch it to production to bypass sandbox errors, or test real bookings without owner action.
- Browser iframe `sandbox` attributes are security controls, not payment test modes. Retain them.
- Indicative flight data and hotel/transport estimates remain labelled accurately. A production launch must not relabel estimates or simulated schedules as live inventory.

## Release gates

Production payments are NOT ready until the owner has installed the production key, configured notifications, released the hardened code, enabled purchases deliberately, and verified a real payment. No secret inspection is needed. Existing sandbox orders remain separated by environment; do not delete or migrate orders or historical test passes automatically.

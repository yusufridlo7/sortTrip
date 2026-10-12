# FAQ and Telegram support — local implementation, 2026-10-12

Branch: `codex/support-faq-telegram`, based on the current bilingual working tree. Existing uncommitted changes were preserved. No commit, push, production deployment, SQL execution, bot creation or webhook registration was performed.

## What is implemented

- Public Help menu and footer link, with ten searchable FAQs in Indonesian/English.
- Signed-in customer support conversations stored in Supabase, separate from itinerary data and AI quota. One open conversation per account; older resolved conversations remain available (20 recent conversations, 100 recent messages per open view).
- Replies from the dedicated support bot's allowlisted **private owner chat** are mapped to the original conversation and shown in SortTrip. Users do not need Telegram.
- Conversation states: awaiting reply, answered, resolved. Owner uses Telegram Reply to answer and Reply `/close` to resolve. Customers start a new conversation after resolution.
- Foreground polling every ten seconds; language changes preserve FAQ search and expanded answers. Refresh restores the Help view. No promises of immediate staff response.
- An atomic database outbox saves the customer message before notifying Telegram. Sending is leased, retries are bounded to five attempts, and a new two-minute cron retries pending deliveries. Existing hourly Price Watch scheduling remains hourly. New POST requests also trigger an immediate background delivery attempt.
- Duplicate customer request IDs and Telegram update IDs are handled in SQL. Telegram acceptance followed by a failed delivery-record write may still create duplicate Telegram notifications; exact-once external delivery is not claimed.
- Authentication, explicit ownership checks and RLS protect customer reads. Database writes/RPCs are service-role only. Webhook has a dedicated 32–256-character secret and checks the private owner's chat/sender identity. Group chats and arbitrary updates do not dispatch project tasks.
- Recognizable credentials, OTP/card-like data and credential-bearing URLs are rejected before storage/forwarding. The form also tells users not to send sensitive information. Pattern filtering cannot guarantee detection of every possible sensitive value.

## Owner setup required

These steps involve private credential configuration and database changes. Follow the owner-control rules in `AGENTS.md`; do not send any credential value to Codex or Telegram.

1. Review and run **`supabase/support-chat.sql`** in the intended Supabase project's SQL Editor. It creates four support tables, two customer read policies, and four service-only RPCs. Existing trip/payment tables and their RLS are not changed. Do not run against a different project's database.
2. Create a **new dedicated customer-support bot** through Telegram's official BotFather. Keep the project-control bot unchanged. Open the new bot's private chat and send `/start` yourself.
3. Privately configure these **Worker runtime secrets**, not `VITE_` variables or build settings:

   | Name | Purpose |
   | --- | --- |
   | `SUPPORT_TELEGRAM_BOT_TOKEN` | Token for the new support bot |
   | `SUPPORT_TELEGRAM_CHAT_ID` | Your positive numeric private Telegram user/chat ID; no group ID |
   | `SUPPORT_TELEGRAM_WEBHOOK_SECRET` | A separately generated secret of 32–256 letters/digits/underscores/hyphens |

   Existing `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are reused at runtime. Do not change or disclose their values. For a local test, the owner may set the three support names privately in the already-used Worker local environment. The agent does not inspect secret files.
4. Review the combined branch changes and authorize a release separately. Deploy frontend and Worker together, keeping the browser-enabled configuration (`wrangler.hotel-browser.jsonc --keep-vars`). Both Wrangler configs include the extra support retry cron. This document is not production-deployment authorization.
5. **After deployment**, register the new bot's webhook yourself. Use an ignored `.env.support.local` file created privately by the owner, containing these names:

   ```text
   SUPPORT_TELEGRAM_BOT_TOKEN=YOUR_PRIVATE_SUPPORT_BOT_TOKEN
   SUPPORT_TELEGRAM_WEBHOOK_SECRET=YOUR_PRIVATE_WEBHOOK_SECRET
   SUPPORT_WEBHOOK_URL=https://YOUR_SORTTRIP_HOST/api/support/telegram/webhook
   ```

   Use your real deployed SortTrip host. Never put a token in the webhook URL. Then run:

   ```powershell
   npm run support:webhook
   ```

   This owner-run script checks the public configured endpoint, registers the HTTPS webhook and prints a fixed result only. It does not print credentials or provider responses. It must not be run by the autonomous agent or Telegram task runner. If local project-control credentials happen to be in the same process, it rejects reuse of that bot token. Otherwise the owner must ensure this is the new dedicated bot.
6. Verify the real flow yourself: send a harmless support question from a signed-in SortTrip account; receive it in the new private bot chat; Reply with a harmless answer; confirm it appears in SortTrip within the polling interval; Reply `/close`; confirm resolved status and a new conversation. Test another account cannot read the first account's conversation. Avoid sending real personal/credential data as test content.

Telegram webhook and `getUpdates` polling are mutually exclusive for one bot. Using a separate bot prevents interference with the existing local project-control polling. See [Telegram webhook documentation](https://core.telegram.org/bots/api#setwebhook).

## Files

New: `app/support-center.tsx`, `app/support.css`, `app/i18n/locales/support.json`, `worker/support.js`, `supabase/support-chat.sql`, `scripts/support-webhook.mjs`, `checks/support.test.mjs`, this setup report.

Integrated: `app/travel-app.tsx`, `app/trip-save.ts`, `app/travel-refresh.css`, `app/i18n/index.ts`, `worker/index.js`, `worker/localization.js`, `checks/i18n-loader.mjs`, `scripts/i18n-coverage.mjs`, `package.json`, `wrangler.jsonc`, `wrangler.hotel-browser.jsonc`, project memory documents. No old Telegram runner/queue files modified.

## Verification and limits

- **183 tests passed**, including 13 support tests: catalogue parity, public anonymous FAQ rendering, authentication/ownership checks, cross-origin refusal, credential-text rejection, customer submission, dedicated notification delivery, webhook sender/secret checks, provider failure and localized error responses. Tests use fixtures; they do not send Telegram messages.
- TypeScript/Vite build passed. Main bundle still has the existing size warning (about 900 kB minified).
- Worker browser-enabled `--dry-run` bundle passed; it explicitly exited without deployment.
- Current catalogue audit: **1,140 paired keys**, 901 static calls, no missing keys, interpolation mismatches or root-app literal JSX text.
- Official local browser verified Help refresh restoration, ten FAQ entries, search `Trip Pass` narrowing to two results, expanded bilingual answer and retained query when switching languages, and honest chat-unconfigured state. Desktop and narrow mobile layouts had no horizontal overflow; header overlap found during QA was corrected.
- SQL migration/RPCs/RLS have not been executed against Supabase in this task. Telegram notification/reply delivery and concurrent real database requests remain unverified until owner setup and live QA.
- Public `enabled` config checks required runtime configuration, not SQL health or Telegram delivery. If migration is missing, the UI shows an availability error. Exhausted outbox retries require owner investigation; do not claim every saved message has been delivered to staff.
- FAQ remains usable before chat activation; the UI intentionally disables sending while the dedicated bot is unconfigured. Support is manual human assistance and consumes no AI-result quota.

Screenshots: `artifacts/support-faq-desktop-id.jpg`, `artifacts/support-faq-desktop-en.jpg`, `artifacts/support-faq-mobile-id.jpg`. No runtime secrets or customer transcripts are included.

## Release checkpoint — 2026-10-12
Owner reports SQL and three support secrets installed and explicitly authorized deployment. Version f6b0e2b2-6db7-491e-a307-44dcad0a9b4c deployed at https://sorttrip.yusufridlo7.workers.dev using browser-enabled config/keep-vars;183 tests/build pass. Public support config enabled true, public health API/AI/flights/browser configured true. Official signed-in production browser displays10 FAQs and empty chat composer with no visible error; authenticated list load succeeded. Owner-only webhook registration remains pending; no real support message/Telegram notification/reply tested. No commit/push or agent secret access. Production screenshot artifacts/support-production-deployed.jpg.

2026-10-12 Owner-confirmed live result: website question reached support Telegram; after using Reply on the bot notification, the answer appeared back in SortTrip. Ordinary unthreaded messages do not map to a customer conversation. This success is based on owner confirmation, not an agent reading the private transcript. Close/new-thread and multi-account isolation still need separate live QA.

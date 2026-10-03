# SortTrip — Architecture Context

## Verified local project stack
Current local project inspection established:
- React 19 + Vite 8 frontend.
- TypeScript/JavaScript.
- Tailwind CSS.
- Cloudflare Workers backend via Wrangler.
- Supabase for authentication/database.
- Leaflet for maps.
- Existing code references/integrations include OpenAI, Travelpayouts/Aviasales, Midtrans, and Resend.

## Local development
Viator backend preparation (2026-10-01): `worker/viator.js` serves `/api/activities` and `/api/activities/health`. Runtime-only `VIATOR_API_KEY`; `VIATOR_ENVIRONMENT` defaults to sandbox, fixed official hosts, 10-second timeout and sanitized summaries/errors. Local connection pending owner sandbox setup. No frontend activity integration or production readiness claimed. Existing Aviasales Data API remains intact.

Typical local services:
- Vite frontend: `127.0.0.1:5173`
- Cloudflare Worker: `127.0.0.1:8787`
- Vite proxies `/api` to the Worker.

A prior smoke test established:
- homepage rendered,
- Jakarta location search returned results,
- `/api/health` returned HTTP 200 through Vite,
- `/api/locations` returned HTTP 200,
- proxy health response matched the direct Worker response.

At that test, health reported:
- `aiConfigured: false`
- `flightsConfigured: false`

Treat this as a point-in-time development observation, not permanent state.

## AI architecture
AI should orchestrate the user journey and consume grounded data from services rather than fabricate live travel facts.

## Secret handling
Environment/secrets are separate from project memory.
Never copy secret values into:
- Markdown documentation,
- Git,
- Telegram,
- logs,
- task queue payloads.

## Agent interfaces under development
### Telegram
A two-way Telegram workflow has been created with commands including:
- `/status`
- `/task <instruction>` (and authorized plain messages)
- `/cancel [task-id]`
- `/resume <task-id>`
- `/help`

The bot uses an authorized-chat allowlist and persistent local queue. Telegram notifications have been tested successfully.

### Desktop browser
Codex in-app browser can perform browser workflows within the Desktop session, including reading pages, opening tabs, clicking, and filling non-sensitive fields. Manual owner authentication can be handed back to the agent afterward.

### Important limitation
Telegram currently does **not** have a verified bridge that can wake or resume the Codex Desktop browser agent for arbitrary tasks.

The autonomous local runner supports limited known workflows; general Telegram → Codex Desktop browser automation remains unresolved.

## Security model
Suggested action classes:

### AUTO
Examples:
- research/browsing,
- reading documentation,
- non-sensitive form entry,
- local code changes,
- build/test/debug,
- use of already-configured environment secrets without exposing values.

### APPROVAL_REQUIRED
Examples:
- submitting a new partnership application,
- accepting new contractual/terms commitments,
- production deployment,
- Git commit/push,
- production database changes.

### OWNER_ONLY
Examples:
- passwords,
- OTP/2FA,
- CAPTCHA,
- revealing/entering new API secrets,
- recovery codes,
- payment/bank information.

When OWNER_ONLY is reached:
`WAITING_FOR_USER` → Telegram notification → owner acts → `/resume` → agent verifies application/browser state → continue.

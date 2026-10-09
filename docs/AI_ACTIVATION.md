# SortTrip Assistant activation

## Verified 2026-10-09
- Follow-up after owner reported successful migration/private key setup: runtime presence checks all required variables PRESENT; REST schema HTTP200 exposes reserve_ai_request and finish_ai_request. Restarted local Worker error-only. Direct/proxy health aiConfigured=true; unauthenticated itinerary401. Read-only OpenAI configured-model GET HTTP200, proving authentication/model access only, not generation quota or web-search success. Official browser still fails initialization; real authenticated generation/edit/save/reload awaits manual UI test. No production deployment.
- Local Worker and frontend proxy health HTTP200, aiConfigured=false. Unauthenticated itinerary POST HTTP503; no AI provider call.
- Runtime-only presence checks: OPENAI_API_KEY missing; SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY and SUPABASE_SERVICE_ROLE_KEY present. No values displayed or copied.
- Read-only Supabase REST schema request HTTP200; reserve_ai_request and finish_ai_request not exposed in schema. This is an activation blocker; not proof of the exact database/schema-cache cause.
- Production health reports aiConfigured=true on historical deployed code; that version does not require the service key in its health check. Presence does not prove generation, provider credit or quota migration readiness.

## Owner steps
1. In VS Code, add OPENAI_API_KEY to existing ignored .dev.vars privately. Use your OpenAI API project key; do not send it through chat, Telegram or screenshots. API account quota/billing is separate from app subscriptions and remains owner-controlled. Do not alter other credentials.
2. Review supabase/ai-quota-v2.sql. It creates quota reservations and service-only functions; preserves usage and existing trips, revokes authenticated access to old pre-charge function. It expects ai-access.sql tables/function to exist. Do not blindly rerun old ai-access.sql after the new migration.
3. Apply the reviewed migration in the correct Supabase project's SQL Editor yourself, or give explicit approval for the concrete database change. No production migration has been applied by this investigation.
4. Notify the agent only that configuration/migration is complete, with safe error text if necessary. Restart local Worker with --log-level error so bindings/values are not logged.
5. Login manually at localhost5173. Test a short itinerary, references, edit/use/save/reload; verify quota accounting and error release. Do not send session/token/password to the agent.

## Release gate
No generation success yet. Validate two account-wide successful free uses, third-use Trip Pass gate, manual editing, active pass and concurrent reservation behavior against actual database after setup. Provider failure must not consume successful quota. Deployment remains a separate approval after review/testing; no push/commit/deploy performed.

# Private QA configuration (owner only)

**Interactive QA activation, 28 October2026:** Owner explicitly permits Meta quota for testing and wants preparedvideoanalysis to work. Public local config now enables text,frames,budgetreadiness; runtime verifiedtrue. Keep active for this owner QA session, retaining enforcedUSD10cumulativeledger and fixed nonproductionproject. Earlier disabled-default instructions below describe the original setup checkpoint, not current runtime. Do not turn these flags off automatically after each response or read/changeprivatebindings to diagnose503. No productiondeployment implied.

**Search follow-up:** QA now serves the existing local location catalogue, a bounded supplied-text destination resolver, and GET-only flights from the fixed anonymous public SortTrip endpoint. No production credential, QA JWT, cookie, prompt or account data is forwarded to that public endpoint. Booking/payment/general itinerary APIs remain unavailable. Earlier “video API only/no search” statements below are historical. See qa-reports/DESTINATION_SEARCH_FIX_2026-10-28.md; actual Hanoi autocomplete and five-day return fare verified.

Owner creates `.env.meta-qa.local` in THIS directory, with one binding:

```dotenv
VITE_SUPABASE_PUBLISHABLE_KEY=<paste-QA-publishable-key-privately>
```

Never put a secret/server/Meta key in this frontend file. The QA URL is fixed by vite.meta-qa.config.js. Root production .env files are not loaded. Launch frontend with `npx vite --config vite.meta-qa.config.js --mode meta-qa`. Only local video API is exposed by the separate QA Worker; booking/payment/planner APIs are deliberately unavailable in this stage.

Owner creates `.dev.vars.meta-qa` at repository ROOT with:

```dotenv
SUPABASE_PUBLISHABLE_KEY=<QA-publishable-key>
SUPABASE_SECRET_KEY=<QA-server-secret-key>
META_MODEL_API_KEY=<Meta-key-from-sorttrip-development>
```

These are placeholders, not credentials. Owner copies the Meta value privately from their saved source; agent must not read or edit it. Omit flag overrides: the separate Wrangler config keeps analysis, frames and budget readiness false. Never copy the production secret set. Both private file patterns are already gitignored.

Launch backend using `node scripts/run-meta-qa.mjs`; it checks private file existence without reading it, then uses Wrangler --env meta-qa --local at127.0.0.1:8790. No deploy command is provided. Do not launch until owner private setup is complete. Real concurrency/privilege/entitlement tests remain required before enabling paid calls.

For two-account QA, A uses http://127.0.0.1:5174/ and B uses http://localhost:5174/. Browser storage is isolated by origin; owner performs both logins privately. The local proxy accepts its Origin mapping only when Host is exactly one of these two authorities and Origin exactly matches that Host. It does not enable a production proxy or copy auth state. The QA-only RLS panel creates disposable fixtures and tests direct ID access with the current user or a fresh anonymous publishable client. It never uses the server key, dumps auth storage or targets an ordinary travel trip. Preserve references in the open panels until final checks; they are not persisted on reload.

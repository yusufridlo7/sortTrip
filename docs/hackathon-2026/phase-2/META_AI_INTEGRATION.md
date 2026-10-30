# Meta adapter — implemented, live access NOT VERIFIED

Starting/ending HEAD `737fbc5636145fc27a0bf4ac41be831835dfbd44`; local changes only, 27 October 2026.

Adapter target: `muse-spark-1.3`, **Standard**, fixed `POST https://api.meta.ai/v1/responses`. No Contributor/training mode, tools, web search, automatic retry or alternate provider. Existing OpenAI planner remains unchanged. Actual model used in this phase: **none**. Test fetchers return synthetic response fixtures; this does not prove Meta account entitlement, quality, latency or a live successful integration.

`worker/video-itinerary.js` sends only the consented transcript, system extraction instruction and strict schema, with store:false and max_output_tokens:2000. It never sends user ID/email/trip history or full customer itinerary to Meta. Candidate names/evidence/localities are validated again before returning; provider output cannot request SQL, payment, shell, messages, file IDs or URLs to fetch. Model assertion `verified:true` has no authority.

Gate defaults off: `META_VIDEO_TEXT_ENABLED=true`, owner-installed server secret `META_MODEL_API_KEY`, and a reviewed atomic budget service or the SQL-backed facade with `META_VIDEO_BUDGET_READY=true` are all required. No flags/secrets were configured. The SQL migration is source only; no live counter or permission claim. Tests inject a fake budget service; production has no such test fixture binding configured.

Deadline 30 seconds within the authenticated handler's 40-second operation bound; request cancellation propagated. One inference attempt; timeout/429/401/403/404/invalid schema produce fixed codes. No uncertain call is refunded or repeated automatically. Bounded upstream body 64,000 bytes. Usage input/output tokens, estimated USD and outcome contain no transcript or provider identifier. No raw provider exceptions/headers are logged or returned.

Official public docs rechecked 27 Oct: [video](https://dev.meta.ai/docs/video-understanding), [structured output](https://dev.meta.ai/docs/structured-output), [pricing](https://dev.meta.ai/docs/pricing-rate-limits). Published Spark Standard input/output rates are $1.25/$4.25 per million tokens. Native video through Files and the Spark audio caveat were considered; neither native video nor ASR is implemented/live-tested. No FFmpeg decoding on Workers, no new paid storage or queues. See API_COST_REPORT.md for the account/hard-cap verification gate.

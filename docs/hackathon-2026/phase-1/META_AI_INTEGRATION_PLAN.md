# Meta AI integration plan — verified documentation, untested account

27 October 2026. No Meta SDK/configuration/secret was added and no authenticated API or paid inference was attempted. A public model listing is not proof of account access, granted credits or billing readiness. Existing OpenAI integration remains unchanged.

## Model selection

| Model | Verified advertised role | MVP decision |
|---|---|---|
| Muse Spark | Hosted multimodal reasoning, tool calls and structured output; current IDs include `muse-spark-1.3` and `muse-spark-1.2` | Primary candidate:1.3 for image/text extraction and planning; address its documented audio caveat separately |
| Muse Wonder | `muse-wonder-1.0`, preview; multimodal, long-horizon agentic reasoning | Optional benchmark for difficult constrained plans after explicit spend approval; not necessary to make the product agentic. Wonder Full is not the same API offering |
| Muse Voice Transcribe | `muse-voice-transcribe-1.0`; speech-to-text, speaker/turn timing; evaluated Indonesian and other SEA languages | Audio fallback candidate; no translation or geographic truth guarantee, not voice synthesis |
| Muse Image | `muse-image-1.0`; image generation/editing | Defer. A generated destination picture is not extraction/verification evidence |
| Muse Spark Open | Open-weight multimodal model,816B total/42B active; self-host or separate hosted provider | Defer self-hosting: documented weight footprint is537GB NVFP4 or1.65TB BF16, incompatible with a normal Worker. Hosted alternative needs separate availability/terms |
| Muse Glimmer |30B open-weight, text+image→text, Apache2.0; local/edge-oriented | Optional privacy-oriented frame/text experiment if hardware available; not a native hosted video/ASR substitute |
| SAM3.1 | `sam-3.1`, image/video masks and boxes with text prompts | Optional segmentation experiment only if it solves an actual UX problem; masks cannot establish destination identity |

Sources: [model catalog](https://dev.meta.ai/docs/models), [API overview](https://dev.meta.ai/docs/overview), [Spark Open](https://dev.meta.ai/docs/muse-spark-open), [Glimmer](https://dev.meta.ai/docs/muse-glimmer). All seven lines are documented, so none is dismissed as invented; SortTrip entitlement/performance for every one remains NOT VERIFIED.

## API surfaces and server contract

- Base URL: `https://api.meta.ai/v1`; existing Worker `fetch` can call it without introducing an SDK dependency. Namespace the future Worker secret as `META_MODEL_API_KEY` while mapping it to the documented Bearer credential. Owner installs it privately; never use `VITE_*` or expose it in a client response. Do not read/copy existing environment values for this audit.
- `POST /responses`: reasoning/tool loop and media references; `POST /chat/completions` is also documented. Existing OpenAI Responses wire compatibility does **not** guarantee identical tools/events/usage/reasoning fields. Introduce an adapter with fixture-tested request/response normalization rather than replacing the OpenAI hostname in place.
- Files: `POST /files`, then `input_file`/`input_video` with a server-held file ID; `DELETE /files/{file_id}` for cleanup. Do not expose stored provider file IDs as authorization or trust user-supplied IDs.
- File ASR: `POST /asr/transcribe` with multipart `request` JSON and `audio` WAV, Bearer auth. Native file format: mono16-bit PCM RIFF/WAVE at16kHz or24kHz. Realtime `wss://api.meta.ai/v1/asr/realtime` uses a handshake credential rather than an HTTP Authorization header. Prefer file ASR for the short-upload MVP.
- Structured extraction: `text.format` JSON Schema on Responses or `response_format.json_schema` on Chat Completions; explicitly `strict:true`, required properties and `additionalProperties:false`. Strict structure does not verify prices, coordinates or rights. Validate semantics again server-side.

Sources: [Responses](https://dev.meta.ai/docs/api-reference/responses/create-response), [structured output](https://dev.meta.ai/docs/structured-output), [file handling](https://dev.meta.ai/docs/file-handling), [video/audio](https://dev.meta.ai/docs/video-understanding), [speech-to-text](https://dev.meta.ai/docs/speech-to-text). Spark1.3's video guide warns about degraded/incomplete audio support; do not base the demo on an untested assumption that it correctly transcribes narration. Voice Transcribe supports Indonesian, but local names/code-switching still require evaluation.

## Proposed data shapes, not implemented

Extraction schema: `observations[]` with candidate name, locality hypotheses, timestampMs, evidence kind, confidence, uncertainty, and excluded content. Never let model output set `userId`, paid status, provider secrets, database query text or arbitrary fetch URLs.

Normalized result: `{provider,model,usage,observations,finishReason,requestRef}`; requestRef is private diagnostic metadata, not a public log field. Tool calls resolve only registered read-only typed functions. Planner output uses the existing domain types after verified-place/quote enrichment; do not let schema compatibility silently bypass `validatePlan` or paid/pending locks.

## Cost and limit checkpoint

Published [Meta pricing/rate limits](https://dev.meta.ai/docs/pricing-rate-limits), checked27 Oct 2026; account-specific quota/credits not verified:

| Standard hosted service | Public rate | Public team limit |
|---|---|---|
| Spark | Input$1.25/output$4.25 per1M tokens |3,000RPM/4MTPM |
| Wonder | Input$4/output$20 per1M tokens |3,000RPM/4MTPM |
| Voice Transcribe |$0.18/audio hour |256concurrent streams;16,000streams/hour |
| Muse Image |$0.01/generated image |150RPM |
| SAM |$2.50/1,000images; $0.20/1,000video frames,50-frame minimum |3,000RPM |

Contributor Spark is cheaper but permits training use; choose Standard for user media unless the owner/users separately approve a different policy. Rates/limits can change; verify the team dashboard before live work.

Illustrative text-only Spark call:5k input+2k output = $0.01475, excluding visual tokens, audio, web search, retries and infrastructure. This is not an observed video-run cost. Measure actual usage before selecting a per-job ceiling. No hackathon credits are assumed. An application limit of1active job/user,2requests/minute and≤4model calls/job is a proposed initial cap, not permission to spend.

## Reliability and controls

Proposed stages: authenticate→reserve job/cost budget→upload/inspect→extract→verify places→plan→validate→preview. Persist job state before long operations; honor cancel without marking completed. Separate extraction failure from partial ambiguity and never overwrite the existing trip on either.

Per-call deadlines should fit a proposed120sec end-to-end budget; measure on the approved fixture. Retry429 using Retry-After/backoff+jitter, bounded to two attempts **inside** the overall call/spend cap. Retry transient5xx/network only where safe; do not blindly retry an uncertain uploaded file or create duplicate jobs. For401/403/402, stop and mark OWNER_ACTION_REQUIRED; do not search for another key, enable billing or fall back to paid OpenAI silently. Invalid output gets at most one bounded correction; refuse/cancel cleanly.

Tools must be server-registered and validated, not eval/shell/SQL. Egress allowlist, privacy minimization, no training-mode switch, no raw media/prompts/transcripts/headers in logs. Redact errors to fixed categories. Record usage and safety counters without content. Feature flags default off and production uses its existing provider until a later approved rollout.

## Owner/live-verification gate

Confirm acceptance/credits, model IDs enabled for the team, region/account access, privacy terms and an explicit maximum spend. Then owner installs server credential and authorizes one fixture test in a nonproduction environment. A future metadata-only catalog check can precede inference; it was not attempted now because credentials were not requested or inspected. Phase 2 approval is required before adding the adapter or upload UI.

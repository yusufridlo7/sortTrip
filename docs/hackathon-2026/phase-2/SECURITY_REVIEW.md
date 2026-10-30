# Phase 2 bounded security review

27 Oct 2026; start/end HEAD `737fbc5636145fc27a0bf4ac41be831835dfbd44`. Not a penetration-test certification.

Implemented controls: exact social URL allowlist and no fetching; authenticated server processing; Origin match; existing per-user limiter; streamed body cap and active cancellation; MP4 container type/signature/box/depth/count/duration/external-reference checks; content consent; no persistent media; strict schema plus evidence/identity validation; fixed Meta endpoint with redirects denied; no model tools, fallback or automatic retries; no raw logging; bounded output/deadlines; fail-closed budget pre-reservation. Fixture demo exists only in DEV UI and is explicitly labelled.

Budget SQL source enables RLS on both new tables, revokes browser/public grants and RPC execute, grants only service_role functions, fixes search_path, serializes global $5 allocation using FOR UPDATE and prevents simultaneous active allocations for one user. Every inference attempt permanently consumes $0.05 of allowance; retries/missing usage never refund it. SQL was not applied and live grants/concurrency were not tested. An application allocation cap is not an account-wide provider billing cap. Do not enable live mode before verifying rates/token bound and this mechanism independently.

Media limitation is intentionally blocking: container headers can lie; no trusted codec inspection, frame sampling, ASR, sandboxed decoder or retryable provider-file cleanup exists. A syntactically valid MP4 does not imply safe/complete media analysis. Raw upload forwarding is not implemented. Untrusted captions/transcripts may contain instructions; no execution tools exist, but real-model prompt-injection quality still needs validation. No customer/private media was used.

Prior Phase 1 findings remain: Wrangler/Miniflare/Undici advisories, missing static response hardening, public flight abuse controls, incomplete live RLS/financial lifecycle evidence. No dependencies/configuration were upgraded and no payment logic was modified in this phase. Credential/env files, auth storage, customer rows and production settings were not inspected or changed. No private key values appear in reports; tests use literal fixture placeholders.

Residual gates: live budget migration and concurrent reserve proof; owner-installed model credential; account/privacy/access evidence; licensed demo and media processor/deletion; real extraction quality; real save isolation. These are documented limitations, not hidden successful integrations.

## Phase2B supplement — 27 October 2026

Status: VERIFIED WITH MOCKS plus actual local codec execution; production/live security certification remains BLOCKED.

- Nonproduction explicit gate added before all Meta extraction; frame path has its own disabled-by-default gate. No credential/env file read, key change, paid request, deployment or infrastructure provisioning.
- Raw MP4 is not forwarded. Browser uses local object URLs and native decoder, bounded dimensions/duration/frame size, timeout/cancel, cleanup in finally. Original media and sampled frame previews are not added to Trip or persistent storage. Frame payload requires consent/auth/origin/rate/schema/byte/dimension checks; only inline JPEG data URIs, never remote image URLs. JPEG headers are not full codec/malware validation or proof of media authenticity.
- Payload preflight token count precedes inference, fixed Standard model/endpoint, no tools/retry/provider fallback, bounded response and output schema. Unexpected returned model is rejected. Media-derived identities remain inferred candidates even when matched to verified location coordinates; caption cannot become video evidence.
- SQL remains source-only. Added per-user attempt limit and anomaly halt, no refunds/reset. Mock concurrent tests are not deployed SQL/RLS proof. Account-wide spend, billing of token-count endpoint, rate/entitlement and database isolation require owner verification before activation.
- Safe accounting log contains fixed event/model/inputKind/outcome, numeric usage/cost/allocation and settlement flag only. No media, transcript, prompt, raw errors, credential or user/session identifier. Tests explicitly check sensitive fixture strings are absent.
- Offline FFmpeg helper uses existing binary, separated arguments/no shell, file/pipe-only protocols, bounded process time/buffers and verified workspace-only scratch cleanup. It is NOT an internet-facing sandboxed decoder. FFmpeg7.1 inherited binary security/update review and stronger resource isolation are required before any server deployment; audio helper is not connected to the application/Meta.
- Dataset uses public Wikidata CC0 identities alongside inherited OSM entries. Unknown/ambiguous places cannot self-assert coordinates; exact city/country and source re-resolution remain mandatory. No new fares/hours/availability are invented.
- Native video Files API/deletion not implemented. No remote file was created, so no remote-deletion success is claimed. Synthetic fixtures are retained intentionally as non-sensitive QA evidence; decoded CLI scratch deleted after use.
- Existing auth, Trip Pass/payment and booking systems were not changed in Phase2B. No account save or customer message. Supabase two-user RLS and live Trip Pass/PriceWatch interaction remain unverified because owner confirmed nonproduction is not ready.

Evidence: END_TO_END_QA.md, BUDGET_CONTROL_TESTS.md and evidence/phase-2b/. No new full-repository/history secret audit or external penetration test was performed.

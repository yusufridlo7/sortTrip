# Video frame analysis

**Browser extraction and provider sampled-frame analysis VERIFIED LIVE, 27 October 2026.** Separate local QA Worker and fixed QA database only.

Existing authorized synthetic3second MP4 and JPEG evidence remain under ../evidence/phase-2b/. Browser samples three real JPEGs, ≤4MiB/60seconds source, max320px side with payload/validation/cancel/resource cleanup. Server validates header/dimensions/timestamps, not malware safety or authenticity.

Frame input adapter uses input_image with explicit source labels; guesses are inferred, supplied captions are not claimed as heard audio. No full video understanding or ASR claim. URL handling validates/canonicalizes only, does not bypass social restrictions or download content. Offline FFmpeg helper is not an application audio service.

After budget and two-account RLS gates passed, tested the existing synthetic-qa.mp4 (3 seconds). Browser produced and visually displayed three JPEGs at 0.45, 1.5 and 2.55 seconds. Each shows the synthetic QA card, not a destination. Optional transcript was empty; caption explicitly requested no guessed locations or reuse of previous itinerary places. No audio was submitted as a transcript.

One explicit inference returned HTTP200, muse-spark-1.3, 6951ms, 685 input / 767 output tokens, estimated USD0.004116. Zero place candidates is the correct negative result for these frames; draft creation remained disabled. This proves live image-request acceptance and honest empty-result handling, not recognition accuracy on real travel footage. Existing text-reference positive review/draft/Save chain remains separate evidence.

Allocation read before/after: USD0.10 → USD0.15; remaining USD9.85, blocked false. Owner read-only SQL confirms requests3/settled3/unsettled0 and known estimated usage USD0.01032150 (text plus frames). Trips present/RLS enabled/authenticated INSERT allowed all true. Allocation is a conservative ledger reservation, not billed cost. All three local analysis/readiness flags restored false and runtime-verified after this single request. No retries, remote video/Files upload, production activation or payment. Evidence: evidence/meta-frames-live-result.json and .png.

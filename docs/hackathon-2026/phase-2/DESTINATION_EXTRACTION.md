# Destination extraction and review

Local Phase 2, 27 Oct 2026. Start/end HEAD `737fbc5636145fc27a0bf4ac41be831835dfbd44`.

`destinationSchema` requires name, city, country, category, activity, sourceEvidence, evidenceKind, confidence, verified and nullable recommendedDurationMinutes. Maximum eight candidates; allowed categories attraction/museum/park/food/other, confidence low/medium/high, duration 15–240 minutes. Missing/extra fields, controls, excessive strings, invalid enums and durations fail semantic validation. Names/locality hypotheses must be nonempty; unknown identity may still be represented if named, but is not routable.

Mentioned evidence must be an exact substring of the supplied transcript. This verifies quotation provenance, **not** that the quoted text proves the proposed place. Inferred hypotheses are visibly labelled and remain separate from catalog identity. High confidence is never geographic proof. User changes/additions are labelled as review edits, not fresh AI observations. The original evidence stays visible for comparison. No model-provided coordinates or price fields are accepted.

Review supports editing name/city/country, adding up to eight stops and removal. An identity edit clears/recomputes verification. Distinct verified candidates in one city are required before generation; duplicates are flagged. Empty extraction returns an explicit no-destinations state. Draft construction re-resolves identity rather than trusting candidate flags/coordinates. Duplicate IDs cannot force repeated stops by changing the duplicate flag.

Local-only demo button uses two synthetic museum candidates and a clearly marked fixture banner. It performs no AI call and is omitted in the production build. Real server adapter responses were tested with injected fixture HTTP only. No fabricated demo is presented as actual transcript or video analysis. Extraction quality, names in multilingual speech, visual timestamp grounding and recall remain untested with a real Meta response.

# Destination grounding

**VERIFIED WITH MOCKS AND BOUNDED LIVE QA.** Two museum names from the synthetic transcript were returned by real Meta, manually reviewed and matched to the existing catalog. A separate actual three-frame synthetic video without travel places returned zero candidates rather than guessed destinations. Catalog identities carry earlier public-source snapshot evidence; positive location recognition from real travel footage remains unverified.

Structured candidates retain name/city/country/category/activity/sourceEvidence/evidenceKind/confidence/duration. Verification and coordinates are independently resolved from existing five-place catalog. Unknown or wrong-city candidates lose verification/geo; aliases normalize to identity; duplicates are marked; reviewed empty or unverified selections cannot create a draft. Model-supplied verified=true is not trusted.

New checks/phase2c.test.mjs tests exact catalog matches, wrong city, unknown place, duplicate alias, empty selection, invalid extra structured fields, order and review-required. Existing suite tests mentioned/inferred evidence, invalid response, payload bounds and injection-like text. Ambiguous/nonmatching identities must remain unverified; catalog is deliberately limited. No live geocoder or commercial API used.

No ticket price, operating hour, transport duration or bookable availability invented. Approximate visit durations remain identified as approximate. A catalog match is identity evidence, not business-hours/admission verification.

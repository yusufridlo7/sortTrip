# Existing itinerary integration

27 October 2026, Phase 2 local; start/end HEAD `737fbc5636145fc27a0bf4ac41be831835dfbd44`.

`initialVideoTrip` returns the existing Trip/Item shape and is TypeScript-declared against the actual domain types. Inputs: valid calendar start, 1–14 days, 1–8 travellers and reviewed same-city catalog identities. Stable visit order, bounded 09:00/13:00/17:00 slots and approximate 15–240-minute visits; at most three visits/day. This is a simple initial schedule, not route optimization, opening-hours feasibility or arrival/departure planning.

Output has no database ID, flight, purchased item, fake lodging or quote. `priceUnknown:true`, zero accounting placeholder and `estimateIncomplete:true` make missing costs explicit in existing UI. Unknown does not mean free; no hotel/airfare/admission price or travel time was invented. Map pins use only catalog coordinates. Existing map/detail components remain available for later user-controlled routes/prices; no billable route/partner request is triggered automatically.

The entry invokes existing `chooseTrip` to create a separate draft; existing unsaved-draft confirmation remains. It never calls replacement AI or applies a new plan over purchased/pending/locked rows. No existing persisted trip is updated by extraction/generation. Current planner fields allow name/time/cost and locking; normal Save uses `persistTrip`→`databaseTrips` with Supabase authenticated user checks and existing RLS. No duplicate database or alternate write endpoint was added. AI and video request controls interlock to avoid simultaneous UI operations.

Browser QA created a labelled demo draft, saw both museum items, unsaved status, Save button, existing edit controls and a map marker. No Save was pressed against the owner's real account. Real DB persistence and two-user isolation are NOT newly verified; source and existing fixture tests establish compatibility only. Session draft storage is the pre-existing planner workflow; raw video/transcript is not placed in Trip data. Demo-origin item notes retain a demo label after draft creation. Advanced agentic replanning remains Phase 3; budget optimization remains Phase 4.

# Phase 5 — Evidence + Timeline

## What was built
- **Backend:** `/api/personas/{id}` now returns full PGP/wallet objects with
  dates (not just strings) and a computed `last_observed` field — the max
  timestamp across that persona's PGP observations, wallet activity, and
  posts.
- **Evidence Inspector:** each evidence card now shows a real, deterministic
  "what was observed" sentence generated from its own payload (no LLM yet —
  that's Phase 6+, so nothing here says more than the data actually shows),
  plus source and reliability, matching the original Evidence Inspector spec
  (what/source/timestamp/reliability).
- **Persona profile:** shows "created … · last observed …" using the new
  backend field.
- **Timeline — full rebuild:** now shows one horizontal lane per persona
  (ordered by creation date), with that persona's own events as paper-tab
  markers positioned by real timestamp. Where two temporally-adjacent
  personas share a relationship edge, a **dashed brick-red bridge** connects
  the earlier persona's last known activity to the later persona's creation —
  exactly the "migration hypothesis, not fact" convention Concept D
  specifies. ShadowFox→NightFox and NightFox→DarkWolf should each show a
  bridge; the redundant ShadowFox↔DarkWolf edge is intentionally not
  re-drawn as a third bridge, since it's implied by the chain.

## Verification checklist
1. Restart the backend (`uvicorn app.main:app --reload`) so the updated `/api/personas/{id}` response is live
2. Click ShadowFox → panel now shows "created … · last observed …" and dated PGP/wallet entries
3. Click the ShadowFox–NightFox edge → each evidence card shows a real sentence (e.g. "The same PGP fingerprint … was observed across ShadowFox, NightFox, DarkWolf.") instead of raw JSON
4. Timeline now shows 4 lanes (one per persona), ShadowFox on top (earliest), RedGhost wherever its creation date falls
5. Two dashed red bridges should be visible: ShadowFox→NightFox and NightFox→DarkWolf; RedGhost's lane has no bridge touching it
6. Hovering a timeline marker still shows its description tooltip

## Known gaps (expected at this phase)
- "Attribution breakdown by signal" is explicitly labeled as not-yet-available — that's Phase 7, and the UI says so rather than faking a number
- Bridges are inferred from persona creation order + relationship existence, not a dedicated "migration" event type — good enough for this dataset; worth revisiting if Phase 9/10 add more complex actor histories

**Status: Phase 5 complete. Awaiting verification + approval before Phase 6 (Investigation Orchestrator).**

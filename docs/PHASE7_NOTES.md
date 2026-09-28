# Phase 7 — Attribution Engine

## What was built
- **`backend/app/attribution.py`** — the real scoring engine. Each evidence
  type has a base probability of indicating same-actor (PGP reuse strongest
  at 0.75, infra correlation weakest at 0.40), scaled by the actual measured
  value where one exists (stylometric similarity), and discounted by the
  evidence's own `reliability` field (verified ×1.0, inferred ×0.8,
  single-source ×0.5). **Noisy-OR fusion** combines them:
  `confidence = 1 − Π(1 − pᵢ)`, hard-capped at 97% — the system never
  reports certainty, only potential attribution.
- **`AttributionResult` table** — every computed score is persisted with its
  full signal breakdown and method version, so it can be reproduced or
  audited later, not just trusted.
- **`GET /api/relationships/{id}/attribution`** — computes fresh and returns
  `{confidence, method_version, signal_breakdown}`.
- **Orchestrator updated** — `SIGNALS_COMPUTED`/`FUSED_SCORE` now call this
  engine for real instead of passing through the seeded placeholder; the
  trace shows the actual computed confidence per relationship.
- **"Why this score?" is now real** — the Evidence Inspector fetches live
  attribution data per relationship and shows each evidence card's own
  contribution ("contributes 71% signal probability") next to its
  description, not just a flat evidence list under an unexplained number.

## How to run it
```
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload
```

## Verification checklist
1. Click the ShadowFox–NightFox edge → confidence now computes live (should
   land somewhere in the 80s–90s%, not necessarily the old seeded 91 — it's
   independently derived now) and each of the 4 evidence cards shows its own
   "contributes N% signal probability" line
2. Click the ShadowFox–DarkWolf edge (the weaker, transitive one) → its
   computed confidence should be visibly lower than ShadowFox–NightFox's,
   since it's driven by the same evidence but nothing extra
3. Run "investigate ShadowFox" → the trace's `FUSED_SCORE` line lists a real
   computed number per relationship, and the report's relationships use
   those same numbers
4. Confirm no confidence ever displays as 100% — the cap should be visible
   if you inspect a hypothetically all-verified relationship
5. `GET /api/relationships/1/attribution` directly in the browser → returns
   `signal_breakdown` with one entry per evidence item, each with its own
   `signal_probability`

## Known gaps (expected at this phase)
- Base probabilities and reliability multipliers are hand-set constants in
  `attribution.py` — configurable in the sense that they live in one place
  and are versioned (`method_version`), not in the sense of a tuning UI;
  that's reasonable for a hackathon prototype and worth saying explicitly
  in the demo if asked
- Persona DNA (Phase 8) will give stylometric similarity a much richer
  signal than the single scalar it uses today

**Status: Phase 7 complete. Awaiting verification + approval before Phase 8 (Persona DNA).**

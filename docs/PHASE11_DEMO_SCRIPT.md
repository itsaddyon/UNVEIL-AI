# Phase 11 — Demo Script: "Operation Nightfall"

This is the primary SIH demonstration flow, built entirely from what already
works in the app — nothing here is staged or hardcoded for the demo; every
number on screen is computed live by the engines built in Phases 7–9.

**Setup:** run the seed script fresh before demo day (`python -m app.seed`)
so the case list opens on a clean "Operation Nightfall" case with no stray
notes/history from testing.

---

## 1. Search (Case entry)
Open the app → the "Cases" page shows **Operation Nightfall** already there
(no empty-state fumbling). Click it.

*Say:* "This is a live case. Nothing here is scripted — it's a real SQLite
database behind a FastAPI backend."

## 2. Investigation (Orchestrator)
Type **"who is ShadowFox"** in the search bar and click **investigate**.

*Say:* "I can phrase this naturally — 'who is', 'investigate', 'tell me
about' all resolve the same way." Point at the trace panel that opens:
8 stages, each with a real timestamp, ending in a generated report.

## 3. Discovery
Still in the trace panel, point at the relationship list — three rows,
each showing a live-computed confidence percentage. Click the
**ShadowFox ↔ NightFox** row.

*Say:* "Clicking a finding takes me straight into the graph." (This closes
the trace and opens the Evidence Inspector on that exact edge.)

## 4. Graph expansion
Close the inspector and look at the canvas: ShadowFox, NightFox, and
DarkWolf cluster together; **RedGhost sits apart with no lines touching
it**. Click ShadowFox directly — its two real neighbors light up with a
steel glow, everything else fades.

*Say:* "The layout isn't hand-placed — it's a force simulation reacting to
real relationship data. RedGhost drifts away because nothing pulls it in."

## 5. Evidence
Click the ShadowFox↔NightFox edge again (or it's already open from step 3).
Walk through the four evidence cards: PGP reuse (verified), wallet reuse
(verified), infrastructure correlation (inferred), stylometric similarity
(inferred) — each with a plain-language sentence, source, and timestamp.

*Say:* "Every one of these is a real database row, not a placeholder."

## 6. Persona DNA
Point at the stylometric evidence card specifically — the overlaid
waveform/dot/tick fingerprint for ShadowFox vs. NightFox, plus the four
per-dimension percentages underneath.

*Say:* "This isn't a canned similarity score — it's computed live from
their actual post text: sentence rhythm, vocabulary richness, punctuation,
function-word use." Optionally open RedGhost's profile and note its DNA
strip looks visibly different in shape.

## 7. Attribution
Point at the amber confidence number at the top of the panel.

*Say:* "This is Noisy-OR fusion — one minus the product of each signal's
independent miss-probability — capped below 100%, because we never claim
proof, only potential attribution." Click the ShadowFox↔DarkWolf edge next
to show its confidence is visibly lower, despite similar evidence types —
proof the engine actually discriminates.

## 8. Explanation
Re-run "investigate ShadowFox" (or reopen the earlier trace) and read the
generated explanation paragraph aloud — it names real handles and real
percentages, composed from structured evidence, not an LLM.

## 9. Report
Click **history** in the top bar to show the investigation is logged.
Click **export json** and **export csv** to show the case can leave the
tool as a real file — open the downloaded JSON briefly to show it's not a
stub.

---

## Fallback / Q&A notes
- If a judge asks "why isn't this 100%?" → point at the capped confidence
  and the "potential attribution, not proof" line — it's a stated design
  principle, not a bug.
- If asked "what stops false positives?" → click RedGhost: zero
  relationships, zero migration bridges, visibly lower DNA/infra scores
  against any of the trio.
- If asked about AI/LLM use → the explanation layer is template-based by
  default (see `docs/LLM_PROVIDER_STRATEGY.md`); attribution math has no
  LLM anywhere in the path.

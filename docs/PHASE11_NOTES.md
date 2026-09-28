# Phase 11 — Controlled Demo Simulation

## What was built
Almost every piece the required flow (Search → Investigation → Discovery →
Graph expansion → Evidence → Persona DNA → Attribution → Explanation →
Report) needs already existed from Phases 1–10. Phase 11's job was making
these connect into one continuous, presentable narrative:

1. **Demo case seeded** — `seed.py` now creates a `Case` row named
   "Operation Nightfall" (and wipes `Note`/`InvestigationRun`/
   `AttributionResult` on re-seed for a clean slate), so the app never
   opens on an empty case list on demo day.
2. **Report → Graph connective fix** — clicking a relationship inside an
   investigation's report (`OrchestratorPanel`) now jumps straight to that
   relationship on the canvas, opening its evidence panel. Previously this
   required manually closing the report and re-finding the same edge.
3. **`docs/PHASE11_DEMO_SCRIPT.md`** — the actual demo script, 9 steps
   mapped to real clicks and real (not hardcoded) expected behavior, plus
   a Q&A fallback section for likely judge questions.

## Verification checklist
1. Re-run `python -m app.seed` → prints "case #1 'Operation Nightfall'…"
2. Restart backend, open the app → Cases page shows "Operation Nightfall"
   immediately, no manual case creation needed
3. Follow the demo script's steps 1–9 in order, end to end, without
   hitting a dead click or a page that requires backend knowledge to recover
4. Specifically test the new connective fix: run "investigate ShadowFox",
   click any relationship row in the report → canvas should show that
   edge selected/red and the Evidence Inspector open, report panel closed
5. Confirm RedGhost still behaves as the control in every relevant step
   (no edges, no bridges, visibly different DNA/infra signals)

## Known gaps (deferred to Phase 12)
- No loading skeletons/spinners — panels show "computing…" text but no
  animated states yet
- No responsive/mobile layout pass — the app assumes a reasonably sized
  desktop window, consistent with the investigator-workspace concept
- No accessibility pass (keyboard nav, ARIA labels) yet

**Status: Phase 11 complete.**

# Phase 6 — Investigation Orchestrator

## What was built
- **`backend/app/orchestrator.py`** — a plain linear state machine (no
  autonomous agent loop) implementing the 8 stages from the blueprint:
  `QUERY_RECEIVED → IDENTITY_RESOLVED → RELATIONSHIPS_EXPANDED →
  EVIDENCE_COLLECTED → SIGNALS_COMPUTED → FUSED_SCORE →
  EXPLANATION_GENERATED → REPORT_READY`. Every stage logs its own
  timestamp and a plain-language detail line into a trace, so a run is
  fully inspectable after the fact.
- **`SIGNALS_COMPUTED` and `FUSED_SCORE` are explicitly mocked** — they
  pass through the seeded relationship strength and say so in the trace.
  The real Attribution Engine (independent signals + Noisy-OR fusion)
  is Phase 7; building it now would mean two competing scoring paths.
- **`backend/app/explanation.py`** — the `TemplateProvider` from the
  Phase 0.5 LLM strategy doc is finally implemented (not just designed):
  a deterministic, evidence-grounded explanation generator, no external
  call, no key required.
- **`POST /api/investigate`** — takes `{"handle": "ShadowFox"}`, runs the
  full pipeline, returns the trace + a small report.
- **Frontend:** an "investigate" button next to search (or press Enter)
  runs it and opens a new right-hand panel showing the stage-by-stage
  trace followed by the generated report — mutually exclusive with the
  persona/evidence panels, so only one focused view is ever open.

## How to run it
Restart the backend so the new endpoint is registered:
```
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload
```
Frontend needs no restart if already running.

## Verification checklist
1. In `/case/1`, type "ShadowFox" in search and click **investigate** (or press Enter)
2. Right panel opens showing 8 trace lines in order, each with a timestamp
3. Report section shows "ShadowFox — report", 3 relationship(s), evidence count, and a generated explanation paragraph mentioning all three linked personas and their correlation percentages
4. Try a handle that doesn't exist (e.g. "Nobody") — trace should stop at `IDENTITY_RESOLVED` with "no matching persona found," and the panel should show "no matching persona — pipeline stopped early" instead of a report
5. Clicking a persona or relationship on the graph while the trace panel is open should close it and open the normal inspector instead (mutual exclusivity)

## Known gaps (expected at this phase)
- Confidence numbers shown are still the seeded placeholders, clearly labeled as such in the trace — real independent scoring is Phase 7
- No case-scoping yet — `/api/investigate` searches all personas globally, not within a specific case (case/investigation organization is Phase 10)

**Status: Phase 6 complete. Awaiting verification + approval before Phase 7 (Attribution Engine).**

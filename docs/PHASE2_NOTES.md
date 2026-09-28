# Phase 2 — Intelligence Data Model

## What was built
- Full schema: `Actor`, `Persona`, `PGPKey`, `Wallet`, `Post`, `Forum`, `OnionService`,
  `Infrastructure`, `Evidence`, `Relationship`, `Event` (backend/app/models.py).
- Seed script (`backend/app/seed.py`) populating one controlled case:
  **ShadowFox → NightFox → DarkWolf** (linked: reused PGP key, reused wallet,
  correlated hosting infrastructure, matching writing style — 3 relationship
  edges, each backed by real evidence rows) plus **RedGhost**, a control
  persona sharing nothing with the other three, to prove the system doesn't
  over-correlate.
- Read-only verification endpoints in `main.py`: `/api/personas`,
  `/api/personas/{id}`, `/api/relationships`, `/api/evidence`, `/api/events`.
  These are deliberately simple list/detail views — the real investigation
  UI that consumes this data is Phase 3, not this phase.

## Why RedGhost matters
Every comparable project I found builds a dataset where everything connects.
Including one deliberately unrelated persona means Phase 7's attribution
engine has something to correctly score *low* — proof the confidence number
means something, not just a demo that always says "match found."

## How to run it

```
cd backend
.venv\Scripts\activate
python -m app.seed
uvicorn app.main:app --reload
```

## Verification checklist
1. `python -m app.seed` prints: `Seed complete: 4 personas, 3 evidence-backed relationships, 1 control persona.`
2. `GET /api/personas` → 4 entries: ShadowFox, NightFox, DarkWolf, RedGhost
3. `GET /api/personas/1` (ShadowFox) → shows its PGP fingerprint, wallet, and one post
4. `GET /api/relationships` → 3 edges, each with `strength` and non-empty `evidence_ids`; none involve RedGhost
5. `GET /api/evidence` → 4 rows (pgp_match, wallet_reuse, infra_correlation, stylometric_similarity)
6. `GET /api/events` → 5 events, ordered by timestamp, including ShadowFox's "activity_stopped" and the later personas' creation events (the raw material Phase 5's timeline will render)

## Known gaps (expected at this phase)
- No UI shows any of this yet — that's Phase 3
- No `Case` row links to this data yet — case/investigation scoping arrives with the case-creation flow later
- Attribution scores in `Relationship.strength` are seeded placeholder values, not yet computed by a real engine — that's Phase 7

**Status: Phase 2 complete. Awaiting verification + approval before Phase 3 (Investigation UI).**

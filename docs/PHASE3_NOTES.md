# Phase 3 — Investigation UI

## What was built
Real investigator workspace, wired to Phase 2's live API, styled per Concept D:
- **Search** — filters personas by handle (client-side, live)
- **Platform filter** — dropdown derived from actual forum names in the data
- **Canvas** — personas render as Paper-register cards at deterministic positions;
  relationship edges render as SVG lines in the Instrument steel-blue, turning
  brick-red (the `--thread` token) when selected — exactly the grammar defined
  in Concept D
- **Persona profile panel** — clicking a persona slides in the inspector with
  real PGP keys, wallets, and posts from `/api/personas/{id}`
- **Evidence inspector** — clicking a relationship edge shows its real evidence
  records (type, source, reliability stamp, payload) from `/api/evidence`,
  plus the confidence number in amber — never shown without its evidence
- **Timeline strip** — renders all 5 real events from `/api/events` as paper-tab
  markers on an instrument baseline, positioned by actual date, not evenly spaced

## What's intentionally still basic (Phase 4's job)
- Node positions are a fixed formula, not a real graph layout algorithm
- No expand/traversal animation yet — clicking doesn't reveal new nodes, since
  all personas already load at once (this dataset is small; traversal matters
  more once Phase 9/10 add more data)
- No drag-to-reposition

## How to run it
Backend must be running with seeded data (from Phase 2):
```
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload
```
Frontend:
```
cd frontend
npm run dev
```
Visit `http://localhost:5173/case/1`.

## Verification checklist
1. Canvas shows 4 persona cards: ShadowFox, NightFox, DarkWolf, RedGhost
2. Two steel-blue lines connect ShadowFox–NightFox–DarkWolf; RedGhost has no lines (matches the control-persona design from Phase 2)
3. Typing "fox" in search dims RedGhost's card (and DarkWolf, since it doesn't match "fox") — only matching cards stay full-opacity
4. Clicking ShadowFox opens the right panel with its real PGP fingerprint, wallet address, and post
5. Clicking the ShadowFox–NightFox line turns it brick-red and opens the evidence panel showing 4 evidence cards and a 91% confidence figure in amber
6. Bottom timeline shows tick markers roughly spaced by real date (2021–2024), hovering one shows its description as a tooltip

## Known gaps (expected at this phase)
- Graph layout/traversal, drag, and expansion animation — Phase 4
- No "why this score" narrative paragraph yet, just the evidence list — Phase 7 adds the explanation layer

**Status: Phase 3 complete. Awaiting verification + approval before Phase 4 (Intelligence Graph).**

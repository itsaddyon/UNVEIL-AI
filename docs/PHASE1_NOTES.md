# Phase 1 — Application Foundation

## What was built
- **Frontend:** React + TypeScript + Vite, routed with react-router-dom (`/` case list, `/case/:id` investigation canvas shell). Tailwind configured with the exact Concept D tokens (colors + 3 font families) locked in Phase 0.5 — no other colors exist in the config.
- **Backend:** FastAPI app, CORS enabled for the Vite dev server, SQLite via SQLAlchemy, one real table (`Case`) so `/api/cases` returns actual queried data (currently empty) rather than a hardcoded stub.
- **Dev environment:** `.env.example`, `.gitignore`, dependency manifests for both sides.

## What is intentionally NOT built yet
Per the working rule ("every backend capability needs a demonstrable UI state"), Phase 1 only includes what the UI can currently show: an empty case list and an empty canvas shell. The full intelligence data model (Actor, Alias, PGP, Wallet, Evidence…) is Phase 2 — adding it now would create backend capability with nothing on screen yet.

## How to run it

**Backend:**
```
cd backend
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```
Runs at http://localhost:8000 — visit /health to confirm the DB connected and the `cases` table exists.

**Frontend:**
```
cd frontend
npm install
npm run dev
```
Runs at http://localhost:5173.

## Verification checklist
1. `http://localhost:8000/health` → `{"status":"ok","tables":["cases"]}`
2. `http://localhost:8000/api/cases` → `[]`
3. `http://localhost:5173/` → "Cases" page loads, shows "0 case(s) on record" and the empty-state message (proves frontend↔backend↔DB round trip)
4. `http://localhost:5173/case/1` → canvas shell loads with top bar, disabled search field, empty canvas message, and idle instrument rail
5. Fonts: Space Grotesk (nav/labels), Source Serif 4 (headline "Cases"), JetBrains Mono (rail text) should all be visibly distinct

## Known gaps (expected at this phase)
- No way to create a case yet (Phase 2)
- Canvas, graph, evidence, timeline are all placeholder text (Phases 3–5)
- No LLM call is wired yet — not needed until Phase 6

**Status: Phase 1 complete. Awaiting verification + approval before Phase 2 (Intelligence Data Model).**

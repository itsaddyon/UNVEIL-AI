# Phase 10 — Investigator Query + Cases

## Scope decision (read this first)
The full Phase 10 wishlist (NL queries, case creation, history, saved
findings, notes, entity collections, filters, report generation, CSV/JSON
export) is large enough to be its own project. I built the slice that's
genuinely useful and fully working, and explicitly deferred the rest:

**Built:** case creation, case-scoped investigation history, notes on any
persona/relationship, JSON/CSV export per case, lightweight deterministic
NL query parsing.

**Deferred, on purpose:** retrofitting `case_id` onto the intelligence
dataset itself (personas/evidence/relationships stay one shared global
corpus — a case organizes *investigation activity*, not the underlying
intel, which is how a real multi-case platform would work too); a separate
"entity collections" feature (folding this into cases + notes was the
right-sized call rather than building a second organizing concept).

## What was built
- **Case creation** — `POST /api/cases`, wired into a real `CaseList.tsx`
  with a create form; creating a case navigates straight into it.
- **Case-scoped investigation history** — every `investigate()` call now
  optionally carries a `case_id`; a new `InvestigationRun` row is persisted
  per run (even failed lookups, so a dead-end search is still recorded),
  and a "history (N)" toggle in the canvas header shows past runs for the
  open case.
- **Notes** — a new `Note` model + `POST/GET /api/notes`, surfaced as a
  small paper-register annotation box at the bottom of both the persona
  profile and the "Why are these connected?" evidence panel. Purely the
  investigator's own words — nothing here is generated.
- **Export** — `GET /api/cases/{id}/export.json` (full case dump: runs +
  notes) and `.../export.csv` (flattened investigation-to-relationship
  rows), linked directly from the canvas header.
- **Lightweight NL query parsing** (`orchestrator.extract_handle()`) —
  deterministic regex stripping of common lead-ins ("investigate", "who
  is", "tell me about", "show me", "look up", "find"), so "who is
  ShadowFox" and "ShadowFox" alone resolve identically. Not an LLM — a
  fixed pattern list, and the trace shows exactly what was parsed.

## How to run it
Restart the backend (new tables/endpoints):
```
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload
```

## Verification checklist
1. Visit `/` → "Cases" page now has a create form; type a name, press Enter
   or click "new case" → navigates to `/case/{new id}`
2. Header shows the real case name (not "Case #N")
3. Type "who is ShadowFox" in the search box and click investigate → trace's
   `QUERY_RECEIVED` line shows the parsed handle; report still generates
4. Click "history (1)" → shows the query, resolved handle, relationship/
   evidence counts, and timestamp for that run
5. Run a second investigation (e.g. a name that doesn't exist) → history
   count increases to 2, showing "→ no match" for the failed one
6. Open ShadowFox's profile, add a note, close and reopen the panel → note
   persists and reloads
7. Click "export json" → downloads/opens a JSON with case info + both
   investigation runs + any notes
8. Click "export csv" → opens a CSV with one row per query↔related-persona
   pair, confidence included
9. Create a second case, run investigations there → its history is
   independent of the first case's (proves case-scoping actually works,
   not just a shared global list)
10. No console errors throughout

## Known gaps (expected, per the scope decision above)
- The intelligence graph (personas/relationships/evidence) is identical
  across every case — cases organize activity, not the dataset itself
- No entity-collection ("star this persona") feature — notes + history
  cover the practical need for this hackathon scope
- CSV export is investigation-run-centric, not a full graph/evidence dump —
  the JSON export is the complete one if a judge wants everything

**Status: Phase 10 complete.**

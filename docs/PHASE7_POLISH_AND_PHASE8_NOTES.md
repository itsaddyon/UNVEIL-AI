# Phase 7 Polish + Phase 8 — Persona DNA

## Phase 7 polish — what was fixed

1. **Raw IDs (`persona:1 ↔ persona:2`) eliminated at the source.**
   `orchestrator.py` gained a `_label(db, type, id)` resolver used in both
   the trace log and the report's relationship list, so the generated
   explanation text now says real handles. `/api/relationships` was
   enriched with `from_label`/`to_label` (the `from`/`to` type:id fields
   are unchanged, since the graph's edge-parsing logic depends on that
   exact format) — the Evidence Inspector now reads `rel.from_label ↔
   rel.to_label` instead of parsing raw refs itself.
2. **Horizontal overflow in the three inspector panels** — `InspectorPanel.tsx`
   and `OrchestratorPanel.tsx` asides now have `min-w-0 shrink-0
   overflow-x-hidden`, and every text block that can hold a long unbroken
   token (fingerprints, wallet addresses, trace detail lines, explanation
   text) has `break-words` or `break-all`. The canvas's own flex row also
   got `min-w-0` on the graph pane as a second line of defense.
3. **Timeline readability** — lane height 46→56px, label color switched
   from muted steel to bright `textOnInk` at 11px (steel is now reserved
   for secondary/date text only, consistent with Concept D's hierarchy),
   and a real date axis + a legend (event marker / migration line swatches)
   were added at the bottom.
4. **Excessive dimming reduced** — non-neighbor personas during a focused
   selection now fade to 70% opacity instead of 40%, staying legible and
   still fully clickable (this was already true, just visually harsh).
5. **Console cleanliness** — the shared `j()` fetch helper in `api.ts` now
   logs and rethrows, and every call site that previously did a bare
   `.then(setX)` with no `.catch` now handles the rejection, so a backend
   hiccup no longer produces an uncaught-in-promise console warning.

## Phase 8 — Persona DNA

- **`backend/app/stylometry.py`** (new) — `compute_persona_dna()` derives,
  purely from a persona's own posts: sentence-length sequence (rhythm),
  vocabulary richness (type-token ratio), punctuation rate, and a
  function-word frequency vector. Every result carries `method_version`
  and `source_post_ids` for reproducibility — same input, same output,
  always. `compare_dna()` computes per-dimension similarity (relative
  difference for the three scalar dimensions, cosine similarity for the
  function-word vector — with a deliberate fix so two personas who *both*
  avoid all tracked function words register as similar, not as
  "no signal") and an overall average. No LLM, no personality inference —
  every number traces back to a plain statistical formula.
- **Attribution engine integration** — `attribution.fuse()` now computes a
  fresh `compare_dna()` for any persona-to-persona relationship and uses
  its `overall_similarity` in place of the seeded `payload["similarity"]`
  value. The seeded value is now only a fallback for relationship types
  that don't connect two personas (none exist yet). This is recomputed on
  every call, so it always reflects current post data, and the breakdown
  returned to the frontend includes the per-dimension numbers, not just
  the final scalar.
- **New endpoints** — `GET /api/personas/{id}/dna` and `GET
  /api/personas/{a}/dna/compare/{b}` (works for ANY pair, not just
  relationship-linked ones — this is what lets the UI compare ShadowFox
  against RedGhost directly).
- **`PersonaDNAStrip.tsx`** (new) — a literal, non-decorative fingerprint:
  a waveform built from the actual sentence-length sequence, dot density
  from actual vocabulary richness, tick marks from actual punctuation
  rate. In comparison mode, both personas' strips overlay (steel vs.
  dashed thread), with matching vocabulary dots highlighted amber.
- **Wired into the UI in two places**: the Persona Profile panel now shows
  that persona's own DNA strip with provenance; the stylometric evidence
  card inside "Why are these connected?" now shows the live comparison
  strip, per-dimension percentages, and provenance for both personas —
  replacing what used to be a static, unexplained percentage.

## Verification checklist

**Restart the backend first** (new modules/endpoints):
```
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload
```

1. Click any relationship edge → header now reads real handles ("ShadowFox
   ↔ NightFox"), no `persona:N` anywhere
2. Resize the browser narrower with a panel open — no horizontal scrollbar
   should appear inside the panel itself
3. Timeline — labels are brighter/larger, a date range is visible at the
   bottom-left/right, and a small legend explains the event/migration marks
4. Select ShadowFox — NightFox and DarkWolf should still be clearly
   readable (steel ring, ~70% opacity on the rest), not washed out
5. Click ShadowFox–NightFox's edge → the stylometric evidence card shows a
   real overlaid DNA strip and per-dimension percentages; sentence rhythm
   and function-word usage should both be high given how similar their
   posts are
6. Click ShadowFox–DarkWolf's edge → its stylometric similarity should be
   visibly lower than ShadowFox–NightFock's — real discrimination, not a
   flat shared number
7. Open ShadowFox's persona profile → its own DNA strip renders with
   "based on post(s) #N · stylometry_v1"
8. Call `GET /api/personas/1/dna/compare/4` directly (ShadowFox vs
   RedGhost, assuming id 4 is RedGhost) → `overall_similarity` should be
   noticeably lower than any of the linked trio's comparisons
9. Call the same endpoint twice in a row → identical output both times
   (reproducibility — no randomness anywhere in the pipeline)
10. Run "investigate ShadowFox" → trace and report still work, explanation
    text uses real handles, confidence numbers match what the graph panel
    shows for the same relationships
11. Open the browser console throughout steps 1–10 → no red errors; if the
    backend is stopped, `[api] /api/...` warnings appear instead of
    uncaught promise rejections

## Known limitations (honest, not hidden)
- Each persona has exactly one seed post, so the DNA fingerprints are
  thin by statistical standards — real discrimination still comes through
  because the seed posts were written with deliberately different styles,
  but more posts per persona would make the numbers more robust. Worth
  saying out loud if a judge asks about sample size.
- Vocabulary richness (type-token ratio) is 1.0 for nearly every persona
  here, since none of the short posts repeat a word — it contributes
  equally to every comparison right now and isn't currently a
  discriminating dimension for this dataset specifically.

**Status: Phase 7 polish + Phase 8 complete.**

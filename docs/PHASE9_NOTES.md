# Phase 9 — Infrastructure Intelligence

## What was built
- **`backend/app/infrastructure.py`** — `get_persona_infrastructure()`
  resolves persona → forum → onion service → infrastructure record.
  `correlate()` computes a deterministic 0-1 score between two personas'
  infrastructure: +0.7 for an identical certificate/banner fingerprint,
  +0.2 for a matching server banner, +0.1 for a matching clearnet-hosting
  note, capped at 0.95. Every contributing reason is listed, not just the
  final number. This only correlates already-seeded records — no scanning,
  probing, or live network activity exists anywhere in this module, per
  the PS's ethical scope.
- **Attribution engine extended the same way as Phase 8** — `infra_correlation`
  evidence is now scored using this live computation instead of the seeded
  payload note, recomputed on every call.
- **Two new endpoints**: `GET /api/personas/{id}/infrastructure` and
  `GET /api/personas/{a}/infrastructure/compare/{b}` (works for any pair).
- **UI**: persona profile now shows an "infrastructure" card (onion
  address, server banner, cert fingerprint); the infra-correlation evidence
  card in "Why are these connected?" now shows the real computed score,
  the specific matched reasons, and both onion addresses being compared —
  replacing the old static sentence.

## Verification checklist
1. Restart backend, open ShadowFox's profile → infrastructure card shows
   its onion address and banner
2. Click ShadowFox–NightFox edge → infra evidence card shows "correlation
   score: ~90%" (0.7 fingerprint + 0.2 banner match) with both reasons listed
3. `GET /api/personas/1/infrastructure/compare/4` (ShadowFox vs RedGhost)
   → score should be 0.0, reasons: "no shared infrastructure signals found"
4. Confidence for ShadowFox–NightFox should still be in a similar range to
   before (infra was already a strong signal in the seed data — this
   replaces a static 0.82-equivalent with an actively computed ~0.9,
   consistent with the same underlying facts)
5. No console errors; panel overflow behavior unaffected

**Status: Phase 9 complete.**

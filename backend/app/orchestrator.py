"""
Investigation Orchestrator — a plain linear state machine, per the blueprint.
No autonomous agent loop: each stage is a deterministic function call whose
input/output is logged into the trace, so the whole run is inspectable and
reproducible. SIGNALS_COMPUTED / FUSED_SCORE now call the real Attribution
Engine (Phase 7, Noisy-OR fusion) instead of the seeded placeholder.
"""
import re
from datetime import datetime
from sqlalchemy.orm import Session
from . import models
from .explanation import TemplateProvider
from .attribution import compute_attribution

STAGES = [
    "QUERY_RECEIVED", "IDENTITY_RESOLVED", "RELATIONSHIPS_EXPANDED",
    "EVIDENCE_COLLECTED", "SIGNALS_COMPUTED", "FUSED_SCORE",
    "EXPLANATION_GENERATED", "REPORT_READY",
]

# Lightweight, deterministic query parsing — NOT an LLM. Strips a common
# lead-in phrase so "investigate ShadowFox" and "who is ShadowFox" both
# resolve the same way "ShadowFox" alone would.
_LEAD_IN_PATTERNS = [
    r"^investigate\s+", r"^who is\s+", r"^tell me about\s+",
    r"^show me\s+", r"^look up\s+", r"^find\s+",
]

def extract_handle(raw_query: str) -> str:
    q = raw_query.strip()
    for pat in _LEAD_IN_PATTERNS:
        q = re.sub(pat, "", q, flags=re.IGNORECASE)
    return q.strip().rstrip("?.! ")

def _label(db: Session, entity_type: str, entity_id: int) -> str:
    """Resolve an entity reference to a human-readable label for display and
    explanation text. Falls back to the raw ref if the type isn't known yet
    (only 'persona' exists today; this stays generic for future entity types)."""
    if entity_type == "persona":
        p = db.query(models.Persona).get(entity_id)
        if p:
            return p.handle
    return f"{entity_type}:{entity_id}"

def run_investigation(db: Session, raw_query: str, case_id: int = None) -> dict:
    trace = []
    def log(stage: str, detail: str):
        trace.append({"stage": stage, "at": datetime.utcnow().isoformat(), "detail": detail})

    handle = extract_handle(raw_query)
    log("QUERY_RECEIVED", f"query: '{raw_query}' → parsed handle: '{handle}'")

    persona = db.query(models.Persona).filter(models.Persona.handle.ilike(handle)).first()
    if not persona:
        log("IDENTITY_RESOLVED", "no matching persona found — pipeline stops here")
        if case_id is not None:
            db.add(models.InvestigationRun(case_id=case_id, query=raw_query, resolved_handle=None, summary=None))
            db.commit()
        return {"trace": trace, "result": None}
    log("IDENTITY_RESOLVED", f"resolved to persona #{persona.id} ({persona.handle})")

    rels = db.query(models.Relationship).filter(
        ((models.Relationship.from_type == "persona") & (models.Relationship.from_id == persona.id)) |
        ((models.Relationship.to_type == "persona") & (models.Relationship.to_id == persona.id))
    ).all()
    log("RELATIONSHIPS_EXPANDED", f"{len(rels)} relationship(s) found")

    all_ev_ids = set()
    for r in rels:
        all_ev_ids.update(r.evidence_ids or [])
    ev_rows = db.query(models.Evidence).filter(models.Evidence.id.in_(all_ev_ids)).all()
    ev_by_id = {e.id: e for e in ev_rows}
    evidence_by_rel = {r.id: [ev_by_id[i] for i in (r.evidence_ids or []) if i in ev_by_id] for r in rels}
    log("EVIDENCE_COLLECTED", f"{len(ev_rows)} evidence record(s) collected across {len(rels)} relationship(s)")

    # Real Attribution Engine — independent signal probabilities per relationship,
    # combined via Noisy-OR. Each call also persists an AttributionResult row,
    # so this run's exact scoring is reproducible afterward.
    attributions = {r.id: compute_attribution(db, r) for r in rels}
    log("SIGNALS_COMPUTED", f"per-evidence signal probabilities computed for {len(rels)} relationship(s)")
    log("FUSED_SCORE", "Noisy-OR fusion applied — " +
        ", ".join(f"{_label(db, r.from_type, r.from_id)}↔{_label(db, r.to_type, r.to_id)}="
                  f"{attributions[r.id]['confidence']}" for r in rels))

    rel_dicts = [{"id": r.id, "from": _label(db, r.from_type, r.from_id), "to": _label(db, r.to_type, r.to_id),
                  "strength": attributions[r.id]["confidence"],
                  "signal_breakdown": attributions[r.id]["signal_breakdown"]} for r in rels]
    ev_dicts_by_rel = {rid: [{"type": e.type} for e in evs] for rid, evs in evidence_by_rel.items()}

    explanation = TemplateProvider().explain(persona.handle, rel_dicts, ev_dicts_by_rel)
    log("EXPLANATION_GENERATED", "template-based explanation generated — no external LLM call made")

    result = {
        "persona": {"id": persona.id, "handle": persona.handle, "platform": persona.platform},
        "relationships": rel_dicts,
        "evidence_count": len(ev_rows),
        "explanation": explanation,
    }
    log("REPORT_READY", "investigation complete")

    if case_id is not None:
        summary = {"persona": result["persona"]["handle"],
                   "relationships": [{"with": r["to"] if r["from"] == persona.handle else r["from"],
                                       "confidence": r["strength"]} for r in rel_dicts],
                   "evidence_count": len(ev_rows)}
        db.add(models.InvestigationRun(case_id=case_id, query=raw_query,
                                        resolved_handle=persona.handle, summary=summary))
        db.commit()

    return {"trace": trace, "result": result}

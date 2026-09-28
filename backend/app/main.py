from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from sqlalchemy import inspect
from pydantic import BaseModel
import csv
import io

from .config import settings
from .database import engine, get_db, Base
from . import models
from .orchestrator import run_investigation, _label
from .attribution import compute_attribution
from .stylometry import compute_persona_dna, compare_dna
from .infrastructure import get_persona_infrastructure, correlate as infra_correlate

Base.metadata.create_all(bind=engine)

app = FastAPI(title="UNVEIL AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origins],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok", "tables": inspect(engine).get_table_names()}

@app.get("/api/cases")
def list_cases(db: Session = Depends(get_db)):
    cases = db.query(models.Case).order_by(models.Case.created_at.desc()).all()
    return [{"id": c.id, "name": c.name, "created_at": c.created_at} for c in cases]

class CreateCaseRequest(BaseModel):
    name: str

@app.post("/api/cases")
def create_case(req: CreateCaseRequest, db: Session = Depends(get_db)):
    if not req.name.strip():
        raise HTTPException(400, "name required")
    case = models.Case(name=req.name.strip())
    db.add(case)
    db.commit()
    db.refresh(case)
    return {"id": case.id, "name": case.name, "created_at": case.created_at}

@app.get("/api/cases/{case_id}")
def get_case(case_id: int, db: Session = Depends(get_db)):
    c = db.query(models.Case).get(case_id)
    if not c:
        raise HTTPException(404, "case not found")
    return {"id": c.id, "name": c.name, "created_at": c.created_at}

@app.get("/api/cases/{case_id}/investigations")
def list_case_investigations(case_id: int, db: Session = Depends(get_db)):
    runs = db.query(models.InvestigationRun).filter_by(case_id=case_id) \
        .order_by(models.InvestigationRun.created_at.desc()).all()
    return [{"id": r.id, "query": r.query, "resolved_handle": r.resolved_handle,
             "summary": r.summary, "created_at": r.created_at} for r in runs]

@app.get("/api/personas")
def list_personas(db: Session = Depends(get_db)):
    personas = db.query(models.Persona).all()
    return [{"id": p.id, "handle": p.handle, "platform": p.platform,
             "actor_id": p.actor_id, "created_at": p.created_at} for p in personas]

@app.get("/api/personas/{persona_id}")
def get_persona(persona_id: int, db: Session = Depends(get_db)):
    p = db.query(models.Persona).get(persona_id)
    if not p:
        raise HTTPException(404, "persona not found")
    pgp = db.query(models.PGPKey).filter_by(persona_id=persona_id).all()
    wallets = db.query(models.Wallet).filter_by(persona_id=persona_id).all()
    posts = db.query(models.Post).filter_by(persona_id=persona_id).all()
    all_dates = [p.created_at] + [k.observed_at for k in pgp] + \
                [w.last_tx for w in wallets] + [post.timestamp for post in posts]
    last_observed = max([d for d in all_dates if d is not None], default=None)
    return {
        "id": p.id, "handle": p.handle, "platform": p.platform,
        "created_at": p.created_at, "last_observed": last_observed,
        "pgp_keys": [{"fingerprint": k.fingerprint, "observed_at": k.observed_at} for k in pgp],
        "wallets": [{"address": w.address, "first_tx": w.first_tx, "last_tx": w.last_tx} for w in wallets],
        "posts": [{"content": post.content, "timestamp": post.timestamp,
                   "stylometric_features": post.stylometric_features} for post in posts],
    }

@app.get("/api/relationships")
def list_relationships(db: Session = Depends(get_db)):
    rels = db.query(models.Relationship).all()
    return [{"id": r.id, "from": f"{r.from_type}:{r.from_id}", "to": f"{r.to_type}:{r.to_id}",
             "from_label": _label(db, r.from_type, r.from_id), "to_label": _label(db, r.to_type, r.to_id),
             "rel_type": r.rel_type, "strength": r.strength, "evidence_ids": r.evidence_ids} for r in rels]

@app.get("/api/evidence")
def list_evidence(db: Session = Depends(get_db)):
    ev = db.query(models.Evidence).all()
    return [{"id": e.id, "type": e.type, "source": e.source, "reliability": e.reliability,
             "observed_at": e.observed_at, "payload": e.payload} for e in ev]

@app.get("/api/events")
def list_events(db: Session = Depends(get_db)):
    events = db.query(models.Event).order_by(models.Event.timestamp).all()
    return [{"id": ev.id, "entity_type": ev.entity_type, "entity_id": ev.entity_id,
             "event_type": ev.event_type, "timestamp": ev.timestamp, "description": ev.description} for ev in events]

class InvestigateRequest(BaseModel):
    handle: str
    case_id: int | None = None

@app.post("/api/investigate")
def investigate(req: InvestigateRequest, db: Session = Depends(get_db)):
    if not req.handle.strip():
        raise HTTPException(400, "handle required")
    return run_investigation(db, req.handle.strip(), req.case_id)

@app.get("/api/relationships/{rel_id}/attribution")
def get_attribution(rel_id: int, db: Session = Depends(get_db)):
    rel = db.query(models.Relationship).get(rel_id)
    if not rel:
        raise HTTPException(404, "relationship not found")
    return compute_attribution(db, rel)

@app.get("/api/personas/{persona_id}/dna")
def get_persona_dna(persona_id: int, db: Session = Depends(get_db)):
    if not db.query(models.Persona).get(persona_id):
        raise HTTPException(404, "persona not found")
    return compute_persona_dna(db, persona_id)

@app.get("/api/personas/{a_id}/dna/compare/{b_id}")
def compare_persona_dna(a_id: int, b_id: int, db: Session = Depends(get_db)):
    if not db.query(models.Persona).get(a_id) or not db.query(models.Persona).get(b_id):
        raise HTTPException(404, "persona not found")
    dna_a = compute_persona_dna(db, a_id)
    dna_b = compute_persona_dna(db, b_id)
    return {"persona_a": dna_a, "persona_b": dna_b, "comparison": compare_dna(dna_a, dna_b)}

@app.get("/api/personas/{persona_id}/infrastructure")
def get_infrastructure(persona_id: int, db: Session = Depends(get_db)):
    if not db.query(models.Persona).get(persona_id):
        raise HTTPException(404, "persona not found")
    result = get_persona_infrastructure(db, persona_id)
    if not result:
        raise HTTPException(404, "no infrastructure record found for this persona's platform")
    return result

@app.get("/api/personas/{a_id}/infrastructure/compare/{b_id}")
def compare_infrastructure(a_id: int, b_id: int, db: Session = Depends(get_db)):
    if not db.query(models.Persona).get(a_id) or not db.query(models.Persona).get(b_id):
        raise HTTPException(404, "persona not found")
    return infra_correlate(db, a_id, b_id)

class CreateNoteRequest(BaseModel):
    case_id: int | None = None
    entity_type: str
    entity_id: int
    content: str

@app.post("/api/notes")
def create_note(req: CreateNoteRequest, db: Session = Depends(get_db)):
    if not req.content.strip():
        raise HTTPException(400, "content required")
    note = models.Note(case_id=req.case_id, entity_type=req.entity_type,
                        entity_id=req.entity_id, content=req.content.strip())
    db.add(note)
    db.commit()
    db.refresh(note)
    return {"id": note.id, "case_id": note.case_id, "entity_type": note.entity_type,
            "entity_id": note.entity_id, "content": note.content, "created_at": note.created_at}

@app.get("/api/notes")
def list_notes(entity_type: str, entity_id: int, db: Session = Depends(get_db)):
    notes = db.query(models.Note).filter_by(entity_type=entity_type, entity_id=entity_id) \
        .order_by(models.Note.created_at.desc()).all()
    return [{"id": n.id, "case_id": n.case_id, "content": n.content, "created_at": n.created_at} for n in notes]

@app.get("/api/cases/{case_id}/export.json")
def export_case_json(case_id: int, db: Session = Depends(get_db)):
    case = db.query(models.Case).get(case_id)
    if not case:
        raise HTTPException(404, "case not found")
    runs = db.query(models.InvestigationRun).filter_by(case_id=case_id).all()
    notes = db.query(models.Note).filter_by(case_id=case_id).all()
    return {
        "case": {"id": case.id, "name": case.name, "created_at": case.created_at.isoformat()},
        "investigation_runs": [{"query": r.query, "resolved_handle": r.resolved_handle,
                                 "summary": r.summary, "created_at": r.created_at.isoformat()} for r in runs],
        "notes": [{"entity_type": n.entity_type, "entity_id": n.entity_id,
                   "content": n.content, "created_at": n.created_at.isoformat()} for n in notes],
    }

@app.get("/api/cases/{case_id}/export.csv")
def export_case_csv(case_id: int, db: Session = Depends(get_db)):
    case = db.query(models.Case).get(case_id)
    if not case:
        raise HTTPException(404, "case not found")
    runs = db.query(models.InvestigationRun).filter_by(case_id=case_id).all()
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["query", "resolved_handle", "related_persona", "confidence", "created_at"])
    for r in runs:
        rels = (r.summary or {}).get("relationships", [])
        if not rels:
            writer.writerow([r.query, r.resolved_handle, "", "", r.created_at.isoformat()])
        for rel in rels:
            writer.writerow([r.query, r.resolved_handle, rel["with"], rel["confidence"], r.created_at.isoformat()])
    return PlainTextResponse(buf.getvalue(), media_type="text/csv")

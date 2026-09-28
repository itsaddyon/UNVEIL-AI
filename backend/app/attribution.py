"""
Attribution Engine — explainable multi-signal scoring via Noisy-OR fusion.

Each piece of evidence gets an independent probability that it, on its own,
indicates the same underlying actor. Noisy-OR combines them:
    confidence = 1 - Π(1 - p_i)
This is transparent and inspectable (unlike an arbitrary weighted average
dressed up as a percentage) — every probability going in is visible in the
breakdown this module returns, and the method is versioned so a score can be
reproduced later even if the weights change.

This NEVER outputs 100%: the system reports potential attribution, not proof.
"""
from datetime import datetime
from . import models
from .stylometry import compute_persona_dna, compare_dna
from .infrastructure import correlate as infra_correlate

METHOD_VERSION = "noisy_or_v1"
MAX_CONFIDENCE = 0.97  # hard ceiling — never claim certainty

# Base probability that this evidence TYPE alone indicates the same actor,
# before reliability discounting. Tune these here — nowhere else.
SIGNAL_BASE_PROBABILITY = {
    "pgp_match": 0.75,              # reusing a private key is a strong OPSEC failure
    "wallet_reuse": 0.65,           # reusing a wallet is strong but could be a shared service
    "infra_correlation": 0.40,      # shared hosting/cert reuse is suggestive, not conclusive
    "stylometric_similarity": 0.55, # scaled further by the measured similarity value below
}

RELIABILITY_MULTIPLIER = {
    "verified": 1.0,
    "inferred": 0.8,
    "single-source": 0.5,
}

def signal_probability(evidence: models.Evidence, similarity_override: float = None, infra_override: float = None) -> float:
    base = SIGNAL_BASE_PROBABILITY.get(evidence.type, 0.3)
    payload = evidence.payload or {}
    if evidence.type == "stylometric_similarity":
        # Phase 8: real computed similarity takes priority over the seeded
        # payload value. The override is only absent if the relationship
        # doesn't connect two personas (nothing to compute DNA for yet).
        similarity = similarity_override if similarity_override is not None else float(payload.get("similarity", 0.5))
        base = base * similarity
    if evidence.type == "infra_correlation":
        # Phase 9: real computed infrastructure correlation replaces the
        # seeded payload note as the scaling factor, same pattern as above.
        multiplier = infra_override if infra_override is not None else 0.5
        base = base * multiplier
    reliability_mult = RELIABILITY_MULTIPLIER.get(evidence.reliability, 0.5)
    return max(0.0, min(base * reliability_mult, MAX_CONFIDENCE))

def fuse(evidence_rows: list[models.Evidence], relationship: models.Relationship = None, db=None) -> tuple[float, list[dict]]:
    """Noisy-OR fusion. Returns (confidence, per-signal breakdown).
    If `relationship` connects two personas, stylometric_similarity and
    infra_correlation evidence are scored using freshly computed Persona DNA
    (Phase 8) and Infrastructure Intelligence (Phase 9) comparisons instead
    of any static seeded value — recomputed every call."""
    if not evidence_rows:
        return 0.0, []

    dna_comparison = None
    infra_result = None
    if relationship is not None and db is not None and \
       relationship.from_type == "persona" and relationship.to_type == "persona":
        dna_a = compute_persona_dna(db, relationship.from_id)
        dna_b = compute_persona_dna(db, relationship.to_id)
        dna_comparison = compare_dna(dna_a, dna_b)
        infra_result = infra_correlate(db, relationship.from_id, relationship.to_id)

    prob_not_same_actor = 1.0
    breakdown = []
    for e in evidence_rows:
        similarity_override = dna_comparison["overall_similarity"] if (dna_comparison and e.type == "stylometric_similarity") else None
        infra_override = infra_result["score"] if (infra_result and e.type == "infra_correlation") else None
        p = signal_probability(e, similarity_override, infra_override)
        prob_not_same_actor *= (1 - p)
        item = {
            "evidence_id": e.id,
            "type": e.type,
            "reliability": e.reliability,
            "signal_probability": round(p, 3),
        }
        if similarity_override is not None:
            item["computed_similarity"] = dna_comparison["overall_similarity"]
            item["similarity_dimensions"] = dna_comparison["dimensions"]
        if infra_override is not None:
            item["computed_infra_score"] = infra_result["score"]
            item["infra_reasons"] = infra_result["reasons"]
        breakdown.append(item)
    confidence = min(1 - prob_not_same_actor, MAX_CONFIDENCE)
    return round(confidence, 3), breakdown

def compute_attribution(db, relationship: models.Relationship) -> dict:
    evidence_rows = db.query(models.Evidence).filter(
        models.Evidence.id.in_(relationship.evidence_ids or [])
    ).all()
    confidence, breakdown = fuse(evidence_rows, relationship, db)

    record = models.AttributionResult(
        relationship_id=relationship.id, confidence=confidence,
        method_version=METHOD_VERSION, signal_breakdown=breakdown,
        computed_at=datetime.utcnow(),
    )
    db.add(record)
    db.commit()

    return {"confidence": confidence, "method_version": METHOD_VERSION, "signal_breakdown": breakdown}

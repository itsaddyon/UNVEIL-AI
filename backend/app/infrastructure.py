"""
Infrastructure Intelligence — controlled-prototype correlation of onion
services and their hosting fingerprints (certificates, banners, descriptor
metadata). This module only CORRELATES already-collected, synthetic
intelligence records already in the database. It performs no scanning,
probing, or live network activity of any kind, per the PS's ethical scope.
"""
from . import models

def get_persona_infrastructure(db, persona_id: int):
    persona = db.query(models.Persona).get(persona_id)
    if not persona:
        return None
    forum = db.query(models.Forum).filter(models.Forum.name == persona.platform).first()
    if not forum:
        return None
    onion = db.query(models.OnionService).filter(
        models.OnionService.onion_address == forum.onion_address
    ).first()
    if not onion:
        return None
    infra = db.query(models.Infrastructure).filter(
        models.Infrastructure.onion_service_id == onion.id
    ).first()
    return {
        "forum": {"name": forum.name, "type": forum.type, "onion_address": forum.onion_address},
        "onion_service": {"onion_address": onion.onion_address, "first_indexed": onion.first_indexed,
                           "descriptor_meta": onion.descriptor_meta},
        "infrastructure": {"fingerprint": infra.fingerprint, "clearnet_correlation": infra.clearnet_correlation,
                            "confidence": infra.confidence} if infra else None,
    }

def correlate(db, persona_a_id: int, persona_b_id: int) -> dict:
    """Deterministic correlation score (0-1) between two personas' hosting
    infrastructure. Each contributing signal is independently reasoned
    about and listed — nothing here is a black-box number."""
    a = get_persona_infrastructure(db, persona_a_id)
    b = get_persona_infrastructure(db, persona_b_id)
    if not a or not b or not a["infrastructure"] or not b["infrastructure"]:
        return {"correlated": False, "score": 0.0, "reasons": ["insufficient infrastructure data on file"],
                "persona_a_infrastructure": a, "persona_b_infrastructure": b}

    reasons = []
    score = 0.0

    if a["infrastructure"]["fingerprint"] == b["infrastructure"]["fingerprint"]:
        score += 0.7
        reasons.append(f"identical certificate/banner fingerprint ({a['infrastructure']['fingerprint']})")

    banner_a = (a["onion_service"]["descriptor_meta"] or {}).get("server_banner")
    banner_b = (b["onion_service"]["descriptor_meta"] or {}).get("server_banner")
    if banner_a and banner_a == banner_b:
        score += 0.2
        reasons.append(f"matching server banner ({banner_a})")

    corr_a = a["infrastructure"]["clearnet_correlation"]
    corr_b = b["infrastructure"]["clearnet_correlation"]
    if corr_a and corr_a == corr_b:
        score += 0.1
        reasons.append("same recorded clearnet-hosting note")

    score = min(score, 0.95)
    return {
        "correlated": score > 0,
        "score": round(score, 3),
        "reasons": reasons or ["no shared infrastructure signals found"],
        "persona_a_infrastructure": a,
        "persona_b_infrastructure": b,
    }

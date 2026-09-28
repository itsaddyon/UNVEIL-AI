from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, JSON
from datetime import datetime
from .database import Base

class Case(Base):
    __tablename__ = "cases"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Actor(Base):
    """The underlying real identity — starts unresolved until Phase 7 attributes personas to it."""
    __tablename__ = "actors"
    id = Column(Integer, primary_key=True, index=True)
    canonical_name = Column(String, nullable=True)
    status = Column(String, default="unresolved")
    first_seen = Column(DateTime, nullable=True)
    last_seen = Column(DateTime, nullable=True)

class Persona(Base):
    __tablename__ = "personas"
    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, ForeignKey("actors.id"), nullable=True)
    handle = Column(String, nullable=False)
    platform = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=True)

class PGPKey(Base):
    __tablename__ = "pgp_keys"
    id = Column(Integer, primary_key=True, index=True)
    fingerprint = Column(String, nullable=False)
    persona_id = Column(Integer, ForeignKey("personas.id"))
    observed_at = Column(DateTime, nullable=True)

class Wallet(Base):
    __tablename__ = "wallets"
    id = Column(Integer, primary_key=True, index=True)
    address = Column(String, nullable=False)
    chain = Column(String, default="BTC")
    persona_id = Column(Integer, ForeignKey("personas.id"))
    first_tx = Column(DateTime, nullable=True)
    last_tx = Column(DateTime, nullable=True)

class Forum(Base):
    __tablename__ = "forums"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, default="forum")
    onion_address = Column(String, nullable=True)

class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True, index=True)
    persona_id = Column(Integer, ForeignKey("personas.id"))
    forum_id = Column(Integer, ForeignKey("forums.id"))
    content = Column(String, nullable=False)
    timestamp = Column(DateTime, nullable=True)
    stylometric_features = Column(JSON, nullable=True)

class OnionService(Base):
    __tablename__ = "onion_services"
    id = Column(Integer, primary_key=True, index=True)
    onion_address = Column(String, nullable=False)
    first_indexed = Column(DateTime, nullable=True)
    descriptor_meta = Column(JSON, nullable=True)

class Infrastructure(Base):
    __tablename__ = "infrastructure"
    id = Column(Integer, primary_key=True, index=True)
    fingerprint = Column(String, nullable=False)
    clearnet_correlation = Column(String, nullable=True)
    confidence = Column(Float, default=0.0)
    onion_service_id = Column(Integer, ForeignKey("onion_services.id"), nullable=True)

class Evidence(Base):
    __tablename__ = "evidence"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)
    source = Column(String, nullable=False)
    observed_at = Column(DateTime, nullable=True)
    reliability = Column(String, default="single-source")
    payload = Column(JSON, nullable=True)

class Relationship(Base):
    """A graph edge — always evidence-backed. from/to reference any entity type by name+id."""
    __tablename__ = "relationships"
    id = Column(Integer, primary_key=True, index=True)
    from_type = Column(String, nullable=False)
    from_id = Column(Integer, nullable=False)
    to_type = Column(String, nullable=False)
    to_id = Column(Integer, nullable=False)
    rel_type = Column(String, nullable=False)
    evidence_ids = Column(JSON, default=list)
    strength = Column(Float, default=0.0)

class Event(Base):
    """Powers the investigation timeline (Phase 5)."""
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String, nullable=False)
    entity_id = Column(Integer, nullable=False)
    event_type = Column(String, nullable=False)
    timestamp = Column(DateTime, nullable=True)
    description = Column(String, nullable=True)

class AttributionResult(Base):
    """Stores exactly which signals + method produced a confidence score,
    so any attribution can be reproduced and audited later, not just trusted."""
    __tablename__ = "attribution_results"
    id = Column(Integer, primary_key=True, index=True)
    relationship_id = Column(Integer, ForeignKey("relationships.id"), nullable=False)
    confidence = Column(Float, nullable=False)
    method_version = Column(String, default="noisy_or_v1")
    signal_breakdown = Column(JSON, nullable=True)
    computed_at = Column(DateTime, default=datetime.utcnow)

class Note(Base):
    """Investigator's own written annotation on a persona or relationship,
    optionally scoped to a case. This is the investigator's material, never
    generated — always plain freeform text they typed."""
    __tablename__ = "notes"
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=True)
    entity_type = Column(String, nullable=False)  # "persona" | "relationship"
    entity_id = Column(Integer, nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class InvestigationRun(Base):
    """One completed run of the orchestrator, optionally scoped to a case —
    this is what powers 'investigation history'. Cases organize investigation
    activity (runs + notes); the underlying intelligence dataset stays a
    shared global corpus, as it would in a real multi-case intel platform."""
    __tablename__ = "investigation_runs"
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=True)
    query = Column(String, nullable=False)
    resolved_handle = Column(String, nullable=True)
    summary = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

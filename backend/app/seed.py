"""
Seeds one controlled, synthetic investigation case.
Story: ShadowFox -> NightFox -> DarkWolf are the SAME underlying actor across
three rebrands (reused PGP key, reused wallet, correlated infra, matching
writing style). RedGhost is an unrelated control persona that shares nothing
with them, so later phases can prove the system doesn't over-correlate.
Run: python -m app.seed
"""
from datetime import datetime
from .database import SessionLocal, engine, Base
from . import models

def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # wipe existing seed data (idempotent re-runs)
    for model in [models.Note, models.InvestigationRun, models.AttributionResult,
                  models.Event, models.Relationship, models.Evidence,
                  models.Infrastructure, models.OnionService, models.Post,
                  models.Wallet, models.PGPKey, models.Persona,
                  models.Forum, models.Actor, models.Case]:
        db.query(model).delete()
    db.commit()

    # --- Demo case (Phase 11) — so the app never opens on an empty case list ---
    demo_case = models.Case(name="Operation Nightfall")
    db.add(demo_case)
    db.commit()

    # --- Forums / marketplaces ---
    f_cipher = models.Forum(name="CipherBazaar", type="marketplace", onion_address="cipherbz7x9k.onion")
    f_shadow = models.Forum(name="ShadowMarket", type="marketplace", onion_address="shdwmkt4qp2.onion")
    f_obscura = models.Forum(name="ObscuraForum", type="forum", onion_address="obscurafr8w.onion")
    f_ghost = models.Forum(name="GhostBoard", type="forum", onion_address="ghstbrd2n5.onion")
    db.add_all([f_cipher, f_shadow, f_obscura, f_ghost])
    db.commit()

    # --- Personas (all start unattributed — Phase 7 will resolve them) ---
    shadowfox = models.Persona(handle="ShadowFox", platform=f_cipher.name, created_at=datetime(2021, 3, 10))
    nightfox = models.Persona(handle="NightFox", platform=f_shadow.name, created_at=datetime(2023, 6, 1))
    darkwolf = models.Persona(handle="DarkWolf", platform=f_obscura.name, created_at=datetime(2024, 1, 15))
    redghost = models.Persona(handle="RedGhost", platform=f_ghost.name, created_at=datetime(2022, 5, 20))
    db.add_all([shadowfox, nightfox, darkwolf, redghost])
    db.commit()

    # --- PGP: same key reused across the three linked personas (OPSEC mistake) ---
    shared_fp = "9F3A 1122 3344 5566 7788 99AA BBCC DDEE FF00 C21E"
    db.add_all([
        models.PGPKey(fingerprint=shared_fp, persona_id=shadowfox.id, observed_at=datetime(2021, 4, 2)),
        models.PGPKey(fingerprint=shared_fp, persona_id=nightfox.id, observed_at=datetime(2023, 6, 10)),
        models.PGPKey(fingerprint=shared_fp, persona_id=darkwolf.id, observed_at=datetime(2024, 2, 1)),
        models.PGPKey(fingerprint="44CC 0099 8877 6655 4433 2211 00FF EEDD", persona_id=redghost.id,
                      observed_at=datetime(2022, 6, 1)),
    ])

    # --- Wallets: ShadowFox and NightFox reuse the same address ---
    shared_wallet = "1Lk8FhZzQmC9vXnR4pT7mQ8sJ4Qz9K2hWe"
    db.add_all([
        models.Wallet(address=shared_wallet, chain="BTC", persona_id=shadowfox.id,
                      first_tx=datetime(2021, 5, 1), last_tx=datetime(2022, 1, 20)),
        models.Wallet(address=shared_wallet, chain="BTC", persona_id=nightfox.id,
                      first_tx=datetime(2023, 7, 5), last_tx=datetime(2023, 11, 30)),
        models.Wallet(address="bc1qdw9f3a8k2m7x", chain="BTC", persona_id=darkwolf.id,
                      first_tx=datetime(2024, 2, 10), last_tx=datetime(2024, 8, 1)),
        models.Wallet(address="3RG8unrelated4pQz", chain="BTC", persona_id=redghost.id,
                      first_tx=datetime(2022, 6, 15), last_tx=datetime(2022, 12, 1)),
    ])
    db.commit()

    # --- Posts: near-identical writing style for the linked trio, distinct for RedGhost ---
    linked_style = {"avg_sentence_len": 6.2, "ttr": 0.71, "punctuation_rate": 0.04}
    ghost_style = {"avg_sentence_len": 14.8, "ttr": 0.52, "punctuation_rate": 0.13}
    db.add_all([
        models.Post(persona_id=shadowfox.id, forum_id=f_cipher.id,
                    content="Stock refreshed. Same terms. No middlemen.",
                    timestamp=datetime(2021, 6, 1), stylometric_features=linked_style),
        models.Post(persona_id=nightfox.id, forum_id=f_shadow.id,
                    content="Back online. Same terms. No middlemen.",
                    timestamp=datetime(2023, 7, 1), stylometric_features=linked_style),
        models.Post(persona_id=darkwolf.id, forum_id=f_obscura.id,
                    content="New listing up. Same terms as always.",
                    timestamp=datetime(2024, 3, 1), stylometric_features=linked_style),
        models.Post(persona_id=redghost.id, forum_id=f_ghost.id,
                    content="Hey everyone, just wanted to check in and see if anyone has updates on shipping times this week, thanks!",
                    timestamp=datetime(2022, 7, 1), stylometric_features=ghost_style),
    ])
    db.commit()

    # --- Onion services + infrastructure: shared hosting fingerprint for the linked trio ---
    os_cipher = models.OnionService(onion_address=f_cipher.onion_address, first_indexed=datetime(2021, 3, 1),
                                     descriptor_meta={"server_banner": "nginx/1.18.0 (leaked)"})
    os_shadow = models.OnionService(onion_address=f_shadow.onion_address, first_indexed=datetime(2023, 5, 1),
                                     descriptor_meta={"server_banner": "nginx/1.18.0 (leaked)"})
    os_obscura = models.OnionService(onion_address=f_obscura.onion_address, first_indexed=datetime(2024, 1, 1),
                                      descriptor_meta={"server_banner": "nginx/1.18.0 (leaked)"})
    os_ghost = models.OnionService(onion_address=f_ghost.onion_address, first_indexed=datetime(2022, 4, 1),
                                    descriptor_meta={"server_banner": "apache/2.4.41"})
    db.add_all([os_cipher, os_shadow, os_obscura, os_ghost])
    db.commit()

    shared_infra_note = "185.220.x.x leased VPS range — same TLS cert reused across services"
    db.add_all([
        models.Infrastructure(fingerprint="cert:7a1b...e91", clearnet_correlation=shared_infra_note,
                               confidence=0.82, onion_service_id=os_cipher.id),
        models.Infrastructure(fingerprint="cert:7a1b...e91", clearnet_correlation=shared_infra_note,
                               confidence=0.82, onion_service_id=os_shadow.id),
        models.Infrastructure(fingerprint="cert:7a1b...e91", clearnet_correlation=shared_infra_note,
                               confidence=0.82, onion_service_id=os_obscura.id),
        models.Infrastructure(fingerprint="cert:9c4f...002", clearnet_correlation="no correlation found",
                               confidence=0.10, onion_service_id=os_ghost.id),
    ])
    db.commit()

    # --- Evidence: one row per independently observed fact ---
    ev_pgp = models.Evidence(type="pgp_match", source="PGP keyserver crawl", observed_at=datetime(2024, 2, 1),
                              reliability="verified",
                              payload={"fingerprint": shared_fp, "personas": ["ShadowFox", "NightFox", "DarkWolf"]})
    ev_wallet = models.Evidence(type="wallet_reuse", source="blockchain explorer (synthetic)",
                                 observed_at=datetime(2023, 7, 5), reliability="verified",
                                 payload={"address": shared_wallet, "personas": ["ShadowFox", "NightFox"]})
    ev_infra = models.Evidence(type="infra_correlation", source="TLS certificate reuse",
                                observed_at=datetime(2024, 1, 1), reliability="inferred",
                                payload={"cert": "7a1b...e91", "note": shared_infra_note})
    ev_style = models.Evidence(type="stylometric_similarity", source="NLP stylometric analysis",
                                observed_at=datetime(2024, 3, 1), reliability="inferred",
                                payload={"similarity": 0.89, "personas": ["ShadowFox", "NightFox", "DarkWolf"]})
    db.add_all([ev_pgp, ev_wallet, ev_infra, ev_style])
    db.commit()

    # --- Relationships: graph edges, each pointing at the evidence that backs it ---
    all_ev = [ev_pgp.id, ev_infra.id, ev_style.id]
    db.add_all([
        models.Relationship(from_type="persona", from_id=shadowfox.id, to_type="persona", to_id=nightfox.id,
                             rel_type="same_actor_candidate", evidence_ids=[ev_pgp.id, ev_wallet.id, ev_infra.id, ev_style.id],
                             strength=0.91),
        models.Relationship(from_type="persona", from_id=nightfox.id, to_type="persona", to_id=darkwolf.id,
                             rel_type="same_actor_candidate", evidence_ids=all_ev, strength=0.84),
        models.Relationship(from_type="persona", from_id=shadowfox.id, to_type="persona", to_id=darkwolf.id,
                             rel_type="same_actor_candidate", evidence_ids=all_ev, strength=0.79),
    ])
    # RedGhost intentionally has zero relationship edges — the control case
    db.commit()

    # --- Events: powers the Phase 5 timeline, including the migration hypothesis ---
    db.add_all([
        models.Event(entity_type="persona", entity_id=shadowfox.id, event_type="persona_created",
                     timestamp=datetime(2021, 3, 10), description="ShadowFox alias created on CipherBazaar"),
        models.Event(entity_type="persona", entity_id=shadowfox.id, event_type="activity_stopped",
                     timestamp=datetime(2022, 2, 1), description="ShadowFox goes silent"),
        models.Event(entity_type="persona", entity_id=nightfox.id, event_type="persona_created",
                     timestamp=datetime(2023, 6, 1), description="NightFox alias created on ShadowMarket"),
        models.Event(entity_type="persona", entity_id=darkwolf.id, event_type="persona_created",
                     timestamp=datetime(2024, 1, 15), description="DarkWolf alias created on ObscuraForum"),
        models.Event(entity_type="persona", entity_id=redghost.id, event_type="persona_created",
                     timestamp=datetime(2022, 5, 20), description="RedGhost alias created on GhostBoard"),
    ])
    db.commit()
    print(f"Seed complete: case #{demo_case.id} 'Operation Nightfall', "
          "4 personas, 3 evidence-backed relationships, 1 control persona.")
    db.close()

if __name__ == "__main__":
    run()

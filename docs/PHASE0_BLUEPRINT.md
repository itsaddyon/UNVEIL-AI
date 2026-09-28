# UNVEIL AI — Phase 0 Blueprint
### SIH26151 — Dark Web Threat Actor De-anonymization
**U**nified **N**etwork for **V**eiled-actor **E**vidence & **I**dentity **L**inking

---

## 1. Product Blueprint

**What it is:** An investigator-facing platform that turns fragmented, synthetic dark-web intelligence (aliases, PGP keys, wallets, posts, infrastructure) into an explainable, evidence-backed map of probable threat-actor identities.

**Core loop:**
```
Investigator Query → Identity Resolution → Relationship Expansion →
Evidence Collection → Signal Analysis (stylometry / behaviour / infra) →
Evidence Fusion → Attribution Score → Explanation → Report
```

**Demo narrative:** Investigator types "Investigate ShadowFox" → system surfaces alias, PGP, wallet, posts → expands graph to reveal NightFox and DarkWolf as connected personas → Persona DNA comparison shows stylometric overlap → Attribution Engine outputs a confidence score with a "Why this score?" breakdown → investigator exports a case report.

**Differentiators (validated against 6 comparable public builds for this PS):**
1. Graph-first, evidence-first UI (investigation canvas, Persona DNA, narrative timeline) — none of the comparable builds do this; most default to generic dashboards.
2. Fusion via a **Noisy-OR probabilistic combination** rather than an arbitrary weighted average — defensible under judge questioning ("why 91% and not 85%?").
3. Explicit **evidence traceability** — every graph edge and every point of an attribution score links back to a source record, timestamp, and reliability rating.
4. Synthetic-data-only, clearly labelled as such — avoids the ethical/legal grey area some comparable projects invite by describing live scanning/crawling.

**Build discipline added after Phase 0 review:**
- Every backend capability must have a corresponding, demonstrable UI state before it counts as "done." No hidden/unused endpoints.
- Visual direction is explored (see `design-concepts/`) before any design tokens are locked in Phase 1.
- The LLM explanation layer must be provider-agnostic — see `LLM_PROVIDER_STRATEGY.md`.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────┐
│  React + TypeScript SPA (Investigation UI)   │
│  - Investigation canvas (Cytoscape.js)       │
│  - Persona DNA view, Timeline, Evidence panel│
└───────────────────┬───────────────────────────┘
                     │ REST/JSON (+ WebSocket for live graph updates)
┌───────────────────▼───────────────────────────┐
│           FastAPI Backend (Python)             │
│  ┌───────────────────────────────────────────┐│
│  │  Investigation Orchestrator (state machine)││
│  └───────┬───────┬───────┬───────┬────────────┘│
│  Identity  Graph   Evidence  Attribution        │
│  Resolver  Engine  Store     Engine             │
│  (alias    (NetworkX (SQLite) (stylometry +     │
│   matching) graph)            behaviour +       │
│                                Noisy-OR fusion) │
└───────────────────┬───────────────────────────┘
                     │
┌───────────────────▼───────────────────────────┐
│   SQLite (dev) → Postgres (later, same schema) │
│   Synthetic dataset: actors, aliases, PGP,      │
│   wallets, posts, infra, evidence, events       │
└─────────────────────────────────────────────────┘
```

- **No microservices, no queues, no Kubernetes** — single FastAPI process, single DB file. Runs on a laptop with `uvicorn` + `npm run dev`.
- **LLM layer** is optional and pluggable (Phase 6+): called only for summarization/explanation text, never for scoring — attribution numbers always come from the structured engine, and every LLM sentence must cite a structured evidence ID it was given. If no provider is configured, a template-based explanation generator produces the same structure without any external call — the demo never depends on network access or a paid key.

---

## 3. Data Model (entities & key relationships)

| Entity | Key Fields | Notes |
|---|---|---|
| **Actor** | id, canonical_name(nullable), status, first_seen, last_seen | The "real" underlying identity — may be unresolved |
| **Persona/Alias** | id, actor_id(nullable until attributed), handle, platform, created_at | Multiple personas may later collapse into one actor |
| **PGPKey** | id, fingerprint, persona_id, observed_at | |
| **Wallet** | id, address, chain, persona_id, first_tx, last_tx | Synthetic addresses only |
| **Post** | id, persona_id, forum_id, content, timestamp, stylometric_features(JSON) | |
| **Forum/Marketplace** | id, name, type, onion_address | |
| **OnionService** | id, onion_address, first_indexed, descriptor_meta(JSON) | |
| **Infrastructure** | id, ip/cert/banner fingerprint, clearnet_correlation, confidence | |
| **Evidence** | id, type, source, observed_at, reliability, payload(JSON) | Every relationship must reference ≥1 Evidence row |
| **Relationship** | id, from_entity, to_entity, type, evidence_ids[], strength | The graph edges — always evidence-backed |
| **Event** | id, entity_id, event_type, timestamp, description | Powers the timeline |
| **AttributionResult** | id, persona_a, persona_b, confidence, signal_breakdown(JSON), method_version | Reproducible — stores which signals + weights produced the score |

Design choice: relational tables model a **property graph** (nodes + typed edges + evidence-linked edges), so NetworkX can load it directly, and a future migration to Neo4j needs no conceptual rework.

---

## 4. AI/ML Strategy

| Module | Technique | Library |
|---|---|---|
| Stylometry | function-word frequency, sentence length distribution, punctuation habits, vocabulary richness (TTR) | scikit-learn, NLTK |
| Behavioural | posting-time histograms, response latency, category/topic distribution | pandas, NumPy |
| Relationship/graph | shared-neighbour scoring, community detection | NetworkX |
| Evidence fusion | **Noisy-OR** combination of independent signal probabilities into one confidence score (transparent, each signal's marginal contribution is inspectable) | custom, small and auditable |
| LLM Analyst layer | investigation summaries, natural-language explanation of *already-computed* evidence — never invents scores | pluggable — see `LLM_PROVIDER_STRATEGY.md` |

**Guardrail:** the Attribution Engine is pure Python/stats — deterministic, versioned, testable. The LLM is a narrator, not a judge.

---

## 5. Orchestration Design

A **linear state machine** per investigation, not an autonomous agent:

```
QUERY_RECEIVED → IDENTITY_RESOLVED → RELATIONSHIPS_EXPANDED →
EVIDENCE_COLLECTED → SIGNALS_COMPUTED → FUSED_SCORE →
EXPLANATION_GENERATED → REPORT_READY
```

Each state transition is a plain function call with logged input/output — easy to demo, easy to debug, no hidden agent loops. State is persisted per "Case" so an investigator can pause and resume.

Rule of thumb going forward: **if a state/module cannot be pointed at on screen during the demo, it does not get built yet.** Backend-only capability with no UI surface is deferred until the UI exists for it.

---

## 6. UI/UX Design System

**Status: NOT LOCKED.** Three distinctive directions are being explored in `design-concepts/concept-comparison.html` before any tokens are finalized:
1. Case File — evidence-board / dossier aesthetic
2. Signal Terminal — precision-instrument / SIGINT aesthetic
3. Editorial Report — data-journalism / long-form aesthetic

None of these are cyberpunk/neon. Once one is chosen (or a hybrid is agreed), its palette/type/layout tokens get written into this section and become the locked system for Phase 1 onward.

---

## 7. MVP vs Future Scope

**MVP (hackathon demo):**
- Fixed synthetic dataset (4–6 interconnected personas)
- Search → profile → graph → evidence → Persona DNA → attribution → explanation → export (JSON/CSV)
- One polished end-to-end scenario (ShadowFox → NightFox → DarkWolf)
- Every module above ships with a visible UI state — no invisible backend features

**Future / stretch (mention, don't build under time pressure):**
- Pluggable real intelligence-feed ingestion (still authorized-source only)
- Neo4j swap for graph store at scale
- Multi-case, multi-investigator collaboration
- RBAC + tamper-evident audit log

---

## 8. Phase-by-Phase Plan

Phase 1 Foundation → Phase 2 Data Model → Phase 3 Investigation UI → Phase 4 Intelligence Graph → Phase 5 Evidence + Timeline → Phase 6 Orchestrator → Phase 7 Attribution Engine → Phase 8 Persona DNA → Phase 9 Infrastructure Intelligence → Phase 10 Query + Cases → Phase 11 Demo Simulation → Phase 12 Polish.

Each phase ships small, testable, and stops for approval.

---

## 9. Recommended Technology Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + TypeScript + Vite | Fast dev loop, huge component ecosystem |
| Graph rendering | Cytoscape.js (or React Flow) | Purpose-built for interactive investigation graphs |
| Backend | Python + FastAPI | Best ML/stats ecosystem, async-ready, auto-docs |
| DB (dev) | SQLite via SQLAlchemy | Zero-setup, swappable to Postgres later, no schema rewrite |
| Graph engine | NetworkX | In-process, no ops overhead, sufficient at demo scale |
| AI/LLM | Pluggable interface (see LLM_PROVIDER_STRATEGY.md) | Provider-agnostic, no vendor lock-in |
| Styling | Tailwind CSS with custom design tokens | Fast, but only if paired with locked tokens — not default Tailwind look |

---

## 10. Risks & Time-Saving Decisions

| Risk | Mitigation |
|---|---|
| Team over-builds infra before UI exists | Explicitly deferred; NetworkX + SQLite first |
| Attribution score looks arbitrary to judges | Noisy-OR fusion + visible signal breakdown, versioned method |
| UI defaults to generic "AI dashboard" look | Three distinct directions explored before tokens are locked |
| Dataset feels unconvincing in demo | Deliberate cross-links so graph expansion is a real "aha," not staged |
| Scope creep across 12 phases | MVP defined narrowly; Phase 9 compresses first if time is short |
| LLM dependency breaks demo (no key/no network) | Template-based fallback explanation generator, no external call required |

**Status: Phase 0 updated. Awaiting visual-direction pick before Phase 1 design tokens are locked.**

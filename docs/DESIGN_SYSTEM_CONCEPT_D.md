# Concept D — The Casework Desk
### A unified visual language for UNVEIL AI

## The unifying idea

The three concepts weren't competing aesthetics — each was already doing a distinct *epistemic* job:
- **Case File** rendered raw, retrieved material (something that was actually observed)
- **Signal Terminal** rendered computed, derived values (something the system calculated)
- **Editorial Report** rendered human-readable interpretation (something being argued/explained)

Concept D keeps all three, but assigns each to a specific category of content instead of mixing them freely. **The interface's visual register tells you, at a glance, what kind of claim you're looking at** — a raw fact, a computed correlation, or an analytical interpretation. That distinction is the actual product (evidence-backed vs. asserted), so making it visible in the grammar itself is the differentiator — not a stylistic mashup, but the UI enacting the same discipline the Attribution Engine is built on.

Working metaphor: **an investigator's desk at night** — case papers laid out under a precise instrument lamp, with the investigator's own notes in the margins. Nothing glows for its own sake; light falls only where it's earned.

## Visual grammar — the three registers

| Register | Used for | Visual treatment |
|---|---|---|
| **Paper** (Case File) | Raw retrieved records: personas, evidence items, source documents | Warm off-white card, ink text, defined edge + soft shadow, corner "stamp" for reliability |
| **Instrument** (Signal Terminal) | Computed/derived values: correlation scores, stylometric metrics, graph edges | Dark ground, hairline rules, tabular mono figures, steel-blue as default active color |
| **Editorial** (Report) | Interpretation and argument: "why" explanations, summaries, captions | Serif type, generous line-height, pull-quote left rule, teal accent |

**Rule:** a component only ever uses the register that matches what kind of claim it's making. A wallet address is always Paper+Instrument (retrieved fact, shown in mono). A confidence percentage is always Instrument (computed). The sentence explaining *why* that percentage is what it is is always Editorial (interpretation). Nothing is styled "because it looks nice here" — the register is chosen by content type, every time, which is what keeps this from reading as three moods stitched together.

---

## Color system

One shared dark base, three reserved accents — each accent has exactly one job, never decorative:

| Token | Hex | Role |
|---|---|---|
| `--ink` | `#161512` | Base canvas — warm near-black, neither blue-cold nor pure black |
| `--paper` | `#E9E2D0` | Card surface for retrieved records only |
| `--text-on-ink` | `#E7E2D8` | Body text on dark canvas |
| `--text-on-paper` | `#241F19` | Text on paper cards |
| `--steel` | `#5B7C99` | Computed/instrument values, default graph edges, active states |
| `--amber` | `#C98A3D` | Reserved exclusively for the attribution confidence number, wherever it appears |
| `--thread` | `#8B4B3B` | Reserved exclusively for a confirmed, evidence-backed relationship (shared PGP/wallet/etc.) when selected |
| `--teal` | `#3E6E5E` | Reserved exclusively for explanatory/narrative accents ("why" rules, captions) |
| `--hairline` | `#26241F` | Structural dividers, grid lines |

No other accent colors exist in the system. If a new feature seems to need a new color, that's a signal the feature doesn't fit one of the three registers yet — resolve that before adding a color.

---

## Typography

Three families, each with one job — mirrors the three registers so type reinforces color rather than competing with it:

| Family | Role |
|---|---|
| **Space Grotesk** | UI chrome: nav, buttons, panel titles, section labels (sentence case, never all-caps) |
| **Source Serif 4** | Editorial register: headlines, "why" explanations, report/export prose |
| **JetBrains Mono** | Instrument + Paper data: identifiers, hashes, wallet addresses, timestamps, all computed metrics |

Type scale: 14/16px body, 13px mono data, 20–28px serif headlines depending on hierarchy, line length capped near 65–75 characters for serif prose per typographic convention.

---

## Interaction model

The canvas is the desk, not a page. Nothing about opening detail navigates away from it:

- **Selecting an entity** doesn't route to a new page — a panel slides in from the right edge, like pulling a folder across the desk. The canvas stays visible to the left, dimmed slightly, so spatial context is never lost.
- **Instrument rail** (bottom or right, persistent): shows live computed readouts for whatever is currently focused — Persona DNA strip, confidence number, signal breakdown. Content changes with focus; the rail itself never disappears, the way an instrument panel doesn't vanish between readings.
- **Evidence is pinned, not just listed.** Opening an evidence record offers a "pin to canvas" affordance — the record appears as a small paper tab attached to the relevant node/edge, so the investigator's own working case file accumulates visibly on the desk rather than living only in a side list.
- **"Why this score?" is progressive disclosure**, not a separate view: a one-line teaser sits next to every confidence number; clicking expands downward into the Editorial register in place.

---

## Graph behavior

- **Default state is quiet:** small mono-labeled node tabs, thin neutral-grey hairline edges. No glow, no force-directed jitter at rest.
- **Edges carry meaning through color, restrictively:**
  - Grey hairline = unexamined/weak statistical association
  - Steel-blue = computed correlation above a threshold (provisional)
  - Brick-red = confirmed, evidence-backed relationship (shared PGP/wallet/etc.), and only appears once the investigator has actually inspected that edge's evidence — the graph never asserts red on its own
- **Attributed personas cluster but don't merge.** When personas are attributed to one actor, their cards group under a shared faint outline ("folder"), but each card stays individually visible and readable — visually enforces "potential attribution," never a fused single identity, matching the requirement that the system never claims proof.
- **Expansion is one deliberate motion:** connected nodes ease outward along their thread paths when a node is expanded (150–250ms ease-out) — like pulling more pins onto a corkboard, not a physics simulation settling.

---

## Persona DNA visualization

Not progress bars. The strip is a literal small-multiples rendering of the actual underlying signals, styled as an instrument readout:

- **Sentence-rhythm** → a real waveform line (from actual sentence-length sequence, not decorative)
- **Vocabulary richness** → dot density along the strip
- **Punctuation habits** → tick marks at their true relative frequency

This keeps the "fingerprint" idea literal (it's built from real per-persona data, rendered small) rather than an abstract shape chosen for looks.

**Comparison mode:** two personas' strips are overlaid directly on top of each other. Where they align closely, the overlap highlights in amber (the confidence-reserved color, since alignment is feeding directly into the score); everywhere else stays steel-blue/grey. The numeric percentage sits beside the strip in mono, never floating alone as the only signal.

---

## Evidence treatment

- Every evidence record is a Paper-register card: warm card surface, ink text, a monospace metadata row (source · timestamp · reliability).
- **Reliability is a restrained corner stamp** — a small bordered word ("verified," "inferred," "single-source") in teal or neutral grey, not a colored badge system with many hues.
- **Pinning** (see Interaction model) makes evidence a spatial, accumulating part of the desk, not a passive list the investigator has to remember to re-open.

---

## Timeline

- Rendered as a horizontal instrument strip: steel-blue baseline, tick marks for time, in the Instrument register.
- Individual events are marked with small paper-tab corners (not colored dots) — merges the ruler's precision with the case-file's materiality.
- **Persona migration/rebrand events** (e.g., ShadowFox's timeline connecting to NightFox's) are shown as a **dashed brick-red bridge** arcing between two persona tracks. Dashed, specifically, because a migration is a hypothesis until evidence confirms it — the line style itself carries that epistemic caution.

---

## Motion language

One motion idea per interaction type. No idle animation, no hover glow, no per-card entrance stagger:

| Interaction | Motion |
|---|---|
| Expand a node | Connected cards ease outward along thread paths, 150–250ms ease-out |
| Select an edge | Thread animates grey → red/blue; a small pin-drop mark appears at the midpoint |
| Open a panel | Slides in from the right edge (translate, not fade/scale) |
| Expand "why this score?" | Vertical height reveal, no bounce or overshoot |
| Pin evidence to canvas | The card visibly travels from panel to its canvas position — reinforces that it's now part of the desk |

---

## Key screens (described, not built)

**1. Investigation Canvas (default view)**
The desk itself: a case's personas as quiet paper-tab nodes on the dark ground, connected by grey/steel hairlines. Instrument rail sits fixed at the bottom, currently showing nothing focused (idle state: case name, entity count, last-updated timestamp in mono). Top has minimal chrome — search field and case name, no sidebar of icons.

**2. Persona Profile + DNA Comparison (panel open)**
Investigator has selected ShadowFox and NightFox for comparison. Right panel slides in (Paper register for their identity facts: handles, PGP, wallets), instrument rail below now shows the overlaid Persona DNA strips with amber highlighting where they align, and the confidence number (amber, mono) with its one-line "why" teaser beneath it in serif italic, collapsed.

**3. Evidence Inspector + Timeline (both open)**
Investigator clicked the brick-red thread between ShadowFox and NightFox. Evidence Inspector panel shows the pinned evidence card (shared PGP fingerprint, source, timestamp, "verified" stamp). Below the canvas, the timeline strip is open, showing both personas' tracks with the dashed red migration bridge arcing between their timelines, and the "why this score?" teaser now expanded into a short Editorial-register paragraph with a pull-quote rule.

---

## What this deliberately avoids

- No generic sidebar-plus-cards SaaS layout — the canvas is the primary surface, panels are transient, not permanent chrome.
- No neon accents, no glassmorphism, no glow-on-hover — light is reserved for the three functional accents only.
- No single "AI confidence" number floating without its evidence — the amber number and its supporting strip/thread/paragraph always appear together.

**Status: Concept D defined. Not implemented. Awaiting approval before any code is written.**

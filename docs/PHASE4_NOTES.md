# Phase 4 — Intelligence Graph

## What was built
- **Real layout** (`lib/layout.ts`): a small force-directed simulation (repulsion + spring edges + center gravity, 300 iterations) computes node positions from actual graph structure — no hardcoded grid. RedGhost, having no edges, naturally drifts to the periphery, visually reinforcing that it's the unconnected control case.
- **Drag-to-reposition**: investigators can manually rearrange any persona card; position updates live via pointer events, no library needed.
- **Traversal highlighting**: selecting a persona highlights its real relationship neighbors (steel ring) and dims everything unconnected — the graph now visibly answers "what does this connect to?"
- **Edge grammar now matches Concept D exactly**: grey (unexamined) → steel-blue (correlation surfaced because you selected an endpoint) → brick-red (evidence actually inspected). Red is sticky for the session — once you've looked at a relationship's evidence, it stays marked as inspected, like a pinned case fact.

## Verification checklist
1. Reload `/case/1` — ShadowFox/NightFox/DarkWolf should cluster together; RedGhost sits apart with no lines touching it
2. Drag any card — it should move smoothly and stay where dropped
3. Click ShadowFox (don't click a line) — NightFox and DarkWolf get a steel ring, their edges turn steel-blue, RedGhost dims
4. Click the ShadowFox–NightFox edge — it turns brick-red and stays red even after you click elsewhere or select a different persona
5. Bottom rail shows "N correlated neighbor(s)" when a persona is selected, and an "inspected" count when idle

## Known gaps (expected at this phase)
- Layout re-runs from scratch on reload (positions aren't saved) — persistence isn't needed until real case-saving arrives (Phase 10)
- No zoom/pan yet — fine at this node count, would need it if Phase 9/10 add substantially more entities

**Status: Phase 4 complete. Awaiting verification + approval before Phase 5 (Evidence + Timeline).**

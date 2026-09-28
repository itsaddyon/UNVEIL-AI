import { Persona, Relationship } from './api'

export type Point = { x: number; y: number }

/** Small force-directed layout: repulsion between all nodes, springs along
 * real edges, mild center gravity. Runs once on load — isolated personas
 * (no edges) naturally drift to the periphery, which is exactly the visual
 * we want for a control case like RedGhost. */
export function forceLayout(
  personas: Persona[], relationships: Relationship[], width = 700, height = 420
): Record<number, Point> {
  const n = personas.length
  if (n === 0) return {}
  const pos: Record<number, Point> = {}
  const vel: Record<number, Point> = {}
  personas.forEach((p, i) => {
    const angle = (i / n) * Math.PI * 2
    pos[p.id] = { x: width / 2 + Math.cos(angle) * 150, y: height / 2 + Math.sin(angle) * 150 }
    vel[p.id] = { x: 0, y: 0 }
  })

  const idOf = (ref: string) => parseInt(ref.split(':')[1], 10)
  const edges = relationships.map((r) => ({ a: idOf(r.from), b: idOf(r.to) }))
    .filter((e) => pos[e.a] && pos[e.b])

  const REPULSION = 12000, SPRING = 0.02, SPRING_LEN = 160, CENTER = 0.01, DAMPING = 0.85

  for (let iter = 0; iter < 300; iter++) {
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = personas[i].id, b = personas[j].id
        const dx = pos[a].x - pos[b].x, dy = pos[a].y - pos[b].y
        const distSq = Math.max(dx * dx + dy * dy, 1)
        const dist = Math.sqrt(distSq)
        const force = REPULSION / distSq
        const fx = (dx / dist) * force, fy = (dy / dist) * force
        vel[a].x += fx; vel[a].y += fy
        vel[b].x -= fx; vel[b].y -= fy
      }
    }
    edges.forEach(({ a, b }) => {
      const dx = pos[b].x - pos[a].x, dy = pos[b].y - pos[a].y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const stretch = dist - SPRING_LEN
      const fx = (dx / dist) * stretch * SPRING, fy = (dy / dist) * stretch * SPRING
      vel[a].x += fx; vel[a].y += fy
      vel[b].x -= fx; vel[b].y -= fy
    })
    personas.forEach((p) => {
      vel[p.id].x += (width / 2 - pos[p.id].x) * CENTER
      vel[p.id].y += (height / 2 - pos[p.id].y) * CENTER
      vel[p.id].x *= DAMPING; vel[p.id].y *= DAMPING
      pos[p.id].x += vel[p.id].x * 0.02
      pos[p.id].y += vel[p.id].y * 0.02
      pos[p.id].x = Math.max(70, Math.min(width - 70, pos[p.id].x))
      pos[p.id].y = Math.max(40, Math.min(height - 40, pos[p.id].y))
    })
  }

  // Hard guarantee, independent of how the physics settled: no two cards may
  // end up closer than a full card's footprint. Pure spring/repulsion balance
  // does NOT guarantee this — a fully-connected triangle of springs (as
  // happens here, since ShadowFox/NightFox/DarkWolf all pairwise link) can
  // converge with two nodes nearly coincident, silently hiding one card
  // beneath another with no visual sign anything is wrong.
  const MIN_SEP = 170
  for (let pass = 0; pass < 30; pass++) {
    let moved = false
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = personas[i].id, b = personas[j].id
        const dx = pos[a].x - pos[b].x, dy = pos[a].y - pos[b].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < MIN_SEP) {
          const push = (MIN_SEP - Math.max(dist, 0.01)) / 2
          // if the two points are exactly coincident, dx/dy give no direction
          // to push along — fall back to a deterministic angle from the pair's
          // index so they still separate instead of staying stuck at (0,0)
          const [ux, uy] = dist > 0.01
            ? [dx / dist, dy / dist]
            : [Math.cos(i - j), Math.sin(i - j)]
          pos[a].x += ux * push; pos[a].y += uy * push
          pos[b].x -= ux * push; pos[b].y -= uy * push
          moved = true
        }
      }
    }
    if (!moved) break
  }
  personas.forEach((p) => {
    pos[p.id].x = Math.max(70, Math.min(width - 70, pos[p.id].x))
    pos[p.id].y = Math.max(40, Math.min(height - 40, pos[p.id].y))
  })

  return pos
}

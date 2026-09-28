import { useState } from 'react'
import { Persona, Relationship, TimelineEvent } from '../lib/api'

type Props = { events: TimelineEvent[]; personas: Persona[]; relationships: Relationship[] }
const parseId = (ref: string) => parseInt(ref.split(':')[1], 10)
const LANE_H = 56, LEFT_PAD = 130, WIDTH = 560, TOP_PAD = 26

export default function TimelineStrip({ events, personas, relationships }: Props) {
  const [expanded, setExpanded] = useState(false)
  if (personas.length === 0) return null

  const lanes = [...personas].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  const laneY = new Map(lanes.map((p, i) => [p.id, i * LANE_H + TOP_PAD]))

  const allTimes = events.map((e) => new Date(e.timestamp).getTime())
    .concat(personas.map((p) => new Date(p.created_at).getTime()))
  const min = Math.min(...allTimes), max = Math.max(...allTimes)
  const span = max - min || 1
  const x = (iso: string) => LEFT_PAD + ((new Date(iso).getTime() - min) / span) * WIDTH

  const lastKnown = (personaId: number) => {
    const own = events.filter((e) => e.entity_type === 'persona' && e.entity_id === personaId)
    const persona = personas.find((p) => p.id === personaId)!
    const times = own.map((e) => new Date(e.timestamp).getTime())
    return times.length ? new Date(Math.max(...times)).toISOString() : persona.created_at
  }

  // Bridge adjacency must be computed only among personas that actually
  // appear in a relationship — sorting the FULL lane list (including
  // unconnected control personas like RedGhost) can put an unrelated
  // persona chronologically between two linked ones and wrongly break
  // "adjacency", silently dropping a real, evidence-backed edge.
  const linkedIds = new Set<number>()
  relationships.forEach((r) => { linkedIds.add(parseId(r.from)); linkedIds.add(parseId(r.to)) })
  const chain = personas.filter((p) => linkedIds.has(p.id))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const bridges = []
  for (let i = 0; i < chain.length - 1; i++) {
    const a = chain[i], b = chain[i + 1]
    const linked = relationships.some((r) => {
      const ra = parseId(r.from), rb = parseId(r.to)
      return (ra === a.id && rb === b.id) || (ra === b.id && rb === a.id)
    })
    if (linked) bridges.push({ a, b })
  }

  const height = lanes.length * LANE_H + TOP_PAD + 24
  const fmtDate = (t: number) => new Date(t).toISOString().slice(0, 10)

  return (
    <div className="tour-timeline border-t border-hairline bg-ink flex flex-col">
      <button 
        onClick={() => setExpanded(!expanded)} 
        className="w-full flex items-center justify-between px-6 py-2 text-xs font-chrome text-steel hover:text-textOnInk hover:bg-white/5 transition-colors"
      >
        <span>timeline · {events.length} event(s) · {bridges.length} migration(s)</span>
        <span>{expanded ? '▼ collapse timeline' : '▲ expand timeline'}</span>
      </button>

      {expanded && (
        <div className="px-6 py-4 overflow-x-auto border-t border-hairline">
          <svg width={LEFT_PAD + WIDTH + 20} height={height} style={{ overflow: 'visible' }}>
            {lanes.map((p) => (
              <g key={p.id}>
                <text x={0} y={laneY.get(p.id)! + 4} className="font-mono fill-textOnInk font-medium" fontSize="11">
                  {p.handle}
                </text>
                <line x1={LEFT_PAD} y1={laneY.get(p.id)} x2={LEFT_PAD + WIDTH} y2={laneY.get(p.id)}
                      stroke="#5B7C99" strokeOpacity={0.35} />
              </g>
            ))}

            {bridges.map(({ a, b }, i) => {
              const x1 = x(lastKnown(a.id)), y1 = laneY.get(a.id)!
              const x2 = x(b.created_at), y2 = laneY.get(b.id)!
              return (
                <g key={i}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2}
                        stroke="#8B4B3B" strokeWidth={1.5} strokeDasharray="4 3">
                    <title>{`Possible migration: ${a.handle} → ${b.handle}`}</title>
                  </line>
                  <circle cx={x1} cy={y1} r={4} fill="#8B4B3B" stroke="#161512" strokeWidth={1} />
                  <circle cx={x2} cy={y2} r={4} fill="#8B4B3B" stroke="#161512" strokeWidth={1} />
                </g>
              )
            })}

            {events.filter((e) => e.entity_type === 'persona' && laneY.has(e.entity_id)).map((e) => (
              <rect key={e.id}
                x={x(e.timestamp) - 4} y={laneY.get(e.entity_id)! - 8}
                width={8} height={16} fill="#E9E2D0"
              >
                <title>{`${e.description} (${e.timestamp})`}</title>
              </rect>
            ))}

            <line x1={LEFT_PAD} y1={height - 16} x2={LEFT_PAD + WIDTH} y2={height - 16} stroke="#26241F" />
            <text x={LEFT_PAD} y={height - 4} className="font-mono fill-steel" fontSize="10">{fmtDate(min)}</text>
            <text x={LEFT_PAD + WIDTH} y={height - 4} textAnchor="end" className="font-mono fill-steel" fontSize="10">
              {fmtDate(max)}
            </text>
          </svg>

          <div className="flex items-center gap-4 font-mono text-[10px] text-steel mt-3">
            <span className="flex items-center gap-1">
              <svg width="14" height="10"><rect x="3" y="0" width="8" height="10" fill="#E9E2D0" /></svg>
              event
            </span>
            <span className="flex items-center gap-1">
              <svg width="20" height="10"><line x1="0" y1="5" x2="20" y2="5" stroke="#8B4B3B" strokeWidth="1.5" strokeDasharray="4 3" /></svg>
              possible migration
            </span>
            <span>hover a marker for detail</span>
          </div>
        </div>
      )}
    </div>
  )
}

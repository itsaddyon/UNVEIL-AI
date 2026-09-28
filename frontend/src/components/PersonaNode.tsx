import { Persona } from '../lib/api'

type Props = {
  persona: Persona
  x: number; y: number
  state: 'default' | 'selected' | 'neighbor'
  dimmed: boolean
  faded: boolean
  onSelect: () => void
  onDragStart: (e: React.PointerEvent) => void
}

export default function PersonaNode({ persona, x, y, state, dimmed, faded, onSelect, onDragStart }: Props) {
  const ring =
    state === 'selected' ? 'ring-4 ring-amber shadow-[0_0_18px_rgba(201,138,61,0.6)] scale-105 z-10' :
    state === 'neighbor' ? 'ring-4 ring-steel shadow-[0_0_16px_rgba(91,124,153,0.6)] z-10' : ''
  const fade = dimmed ? 'opacity-30 pointer-events-none' : faded ? 'opacity-70' : 'opacity-100'

  return (
    <button
      onClick={onSelect}
      onPointerDown={onDragStart}
      disabled={dimmed}
      style={{ left: x - 80, top: y - 20, transition: 'left 120ms ease-out, top 120ms ease-out, transform 120ms ease-out, opacity 150ms ease-out' }}
      className={`absolute w-40 text-left bg-paper text-textOnPaper px-3 py-2 rounded-sm
        shadow-md cursor-grab active:cursor-grabbing ${fade} ${ring}`}
    >
      <div className="font-editorial text-sm font-semibold truncate">{persona.handle}</div>
      <div className="font-mono text-[10px] text-textOnPaper/60 truncate">{persona.platform}</div>
    </button>
  )
}

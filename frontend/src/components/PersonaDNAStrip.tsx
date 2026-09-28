import { PersonaDNA } from '../lib/api'

type Props = { dnaA: PersonaDNA; dnaB?: PersonaDNA; labelA: string; labelB?: string }

/** Literal, data-driven fingerprint — every mark below comes directly from
 * the persona's own computed metrics, nothing decorative or invented. */
export default function PersonaDNAStrip({ dnaA, dnaB, labelA, labelB }: Props) {
  const seqToPoints = (seq: number[]) => {
    if (seq.length <= 1) return `0,15 200,15`
    return seq.map((v, i) => {
      const x = (i / (seq.length - 1)) * 200
      const y = 28 - Math.min(v, 22) * 1.1
      return `${x},${y}`
    }).join(' ')
  }

  const dotsA = Math.max(1, Math.round(dnaA.vocabulary_richness * 30))
  const dotsB = dnaB ? Math.max(1, Math.round(dnaB.vocabulary_richness * 30)) : 0
  const maxDots = Math.max(dotsA, dotsB, 1)

  const ticksA = Math.max(1, Math.round(dnaA.punctuation_rate * 300))
  const ticksB = dnaB ? Math.max(1, Math.round(dnaB.punctuation_rate * 300)) : 0

  return (
    <div className="font-mono text-[10px] text-steel min-w-0">
      <div className="mb-1 truncate">
        sentence rhythm{dnaB ? ` — ${labelA} (steel) vs ${labelB} (thread)` : ` — ${labelA}`}
      </div>
      <svg viewBox="0 0 200 30" width="100%" height="30" preserveAspectRatio="none" className="mb-3">
        <polyline points={seqToPoints(dnaA.sentence_length_sequence)} fill="none" stroke="#5B7C99" strokeWidth={1.5} />
        {dnaB && (
          <polyline points={seqToPoints(dnaB.sentence_length_sequence)} fill="none"
                     stroke="#8B4B3B" strokeWidth={1.5} strokeDasharray="3 2" />
        )}
      </svg>

      <div className="mb-1">vocabulary richness</div>
      <div className="flex gap-[3px] mb-3 flex-wrap">
        {Array.from({ length: maxDots }).map((_, i) => {
          const inA = i < dotsA, inB = i < dotsB
          const color = inA && inB ? '#C98A3D' : inA ? '#5B7C99' : inB ? '#8B4B3B' : '#26241F'
          return <span key={i} className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
        })}
      </div>

      <div className="mb-1">punctuation habits</div>
      <svg viewBox="0 0 200 12" width="100%" height="12" preserveAspectRatio="none">
        {Array.from({ length: ticksA }).map((_, i) => (
          <line key={`a${i}`} x1={(i / ticksA) * 200} y1={0} x2={(i / ticksA) * 200} y2={dnaB ? 5 : 12} stroke="#5B7C99" />
        ))}
        {dnaB && Array.from({ length: ticksB }).map((_, i) => (
          <line key={`b${i}`} x1={(i / ticksB) * 200} y1={7} x2={(i / ticksB) * 200} y2={12} stroke="#8B4B3B" />
        ))}
      </svg>
    </div>
  )
}

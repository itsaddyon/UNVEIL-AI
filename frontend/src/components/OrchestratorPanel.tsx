import { InvestigationResult } from '../lib/api'

const STAGE_LABELS: Record<string, string> = {
  QUERY_RECEIVED: 'query received',
  IDENTITY_RESOLVED: 'identity resolved',
  RELATIONSHIPS_EXPANDED: 'relationships expanded',
  EVIDENCE_COLLECTED: 'evidence collected',
  SIGNALS_COMPUTED: 'signals computed',
  FUSED_SCORE: 'fused score',
  EXPLANATION_GENERATED: 'explanation generated',
  REPORT_READY: 'report ready',
}

type Props = {
  data: InvestigationResult
  onClose: () => void
  onSelectRelationship: (relId: number) => void
}

export default function OrchestratorPanel({ data, onClose, onSelectRelationship }: Props) {
  return (
    <aside className="w-80 min-w-0 shrink-0 border-l border-hairline p-5 overflow-y-auto overflow-x-hidden bg-ink">
      <button onClick={onClose} className="font-chrome text-xs text-steel mb-4">close ✕</button>
      <h2 className="font-editorial text-lg mb-3">Investigation trace</h2>

      <ol className="mb-5">
        {data.trace.map((s, i) => (
          <li key={i} className="mb-2 pl-3 border-l border-steel/40 min-w-0">
            <div className="font-chrome text-xs text-textOnInk">{STAGE_LABELS[s.stage] || s.stage}</div>
            <div className="font-mono text-[10px] text-steel/70 break-words">{s.detail}</div>
          </li>
        ))}
      </ol>

      {data.result ? (
        <div className="bg-paper text-textOnPaper p-3 rounded-sm min-w-0">
          <div className="font-chrome text-xs font-semibold mb-1 truncate">{data.result.persona.handle} — report</div>
          <div className="font-mono text-[10px] text-textOnPaper/60 mb-2">
            {data.result.relationships.length} relationship(s) · {data.result.evidence_count} evidence record(s)
          </div>

          {data.result.relationships.length > 0 && (
            <div className="mb-2">
              {data.result.relationships.map((r) => (
                <button key={r.id} onClick={() => onSelectRelationship(r.id)}
                        className="block w-full text-left font-mono text-[10px] text-thread border border-thread/40 rounded-sm px-2 py-1 mb-1 hover:border-thread">
                  {r.from} ↔ {r.to} — {Math.round(r.strength * 100)}% · view on graph →
                </button>
              ))}
            </div>
          )}

          <p className="font-editorial text-sm italic break-words">{data.result.explanation}</p>
        </div>
      ) : (
        <p className="font-mono text-xs text-steel">no matching persona — pipeline stopped early</p>
      )}
    </aside>
  )
}

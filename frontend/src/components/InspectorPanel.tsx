import { useEffect, useState } from 'react'
import {
  Attribution, DNACompareResponse, Evidence, InfraCorrelation, Note, PersonaDNA, PersonaDetail,
  PersonaInfrastructure, Relationship,
  createNote, fetchAttribution, fetchDNAComparison, fetchInfraCorrelation, fetchNotes, fetchPersonaDNA, fetchPersonaInfrastructure,
} from '../lib/api'
import PersonaDNAStrip from './PersonaDNAStrip'

type Props = {
  personaDetail: PersonaDetail | null
  relationship: { rel: Relationship; evidence: Evidence[] } | null
  caseId?: number
  onClose: () => void
}

export default function InspectorPanel({ personaDetail, relationship, caseId, onClose }: Props) {
  if (!personaDetail && !relationship) return null
  return (
    <aside className="w-80 min-w-0 shrink-0 border-l border-hairline p-5 overflow-y-auto overflow-x-hidden bg-ink">
      <button onClick={onClose}
              className="font-chrome text-xs text-steel hover:text-textOnInk transition-colors mb-4">
        close ✕
      </button>
      {personaDetail && <PersonaProfile p={personaDetail} caseId={caseId} />}
      {relationship && <RelationshipEvidence data={relationship} caseId={caseId} />}
    </aside>
  )
}

/** Shape-matched loading placeholder — pulses in the Paper register so a
 * pending fact reads as "still retrieving," not as a missing feature. */
function Skeleton({ className = 'h-4' }: { className?: string }) {
  return <div className={`bg-paper/10 rounded-sm animate-pulse ${className}`} />
}

/** Freeform investigator annotation on any entity — case-file margin notes,
 * never generated, always the investigator's own words. */
function NotesSection({ entityType, entityId, caseId }: { entityType: string; entityId: number; caseId?: number }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => fetchNotes(entityType, entityId).then(setNotes).catch(() => {})
  useEffect(() => { setNotes([]); load() }, [entityType, entityId])

  function submit() {
    if (!draft.trim()) return
    setSaving(true)
    createNote(entityType, entityId, draft.trim(), caseId)
      .then(() => { setDraft(''); load() })
      .finally(() => setSaving(false))
  }

  return (
    <div className="mt-4 pt-3 border-t border-hairline min-w-0">
      <div className="font-chrome text-xs text-steel mb-2">notes</div>
      {notes.map((n) => (
        <div key={n.id} className="bg-paper text-textOnPaper p-2 mb-2 rounded-sm min-w-0">
          <div className="font-editorial text-sm break-words">{n.content}</div>
          <div className="font-mono text-[9px] text-textOnPaper/50 mt-1">{n.created_at}</div>
        </div>
      ))}
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="add an investigator note…"
        rows={2}
        className="w-full min-w-0 bg-transparent border border-hairline focus:border-steel outline-none px-2 py-1 text-xs font-mono resize-none transition-colors"
      />
      <button onClick={submit} disabled={saving || !draft.trim()}
              className="font-chrome text-[10px] border border-hairline text-steel px-2 py-1 rounded-sm mt-1
                         hover:border-steel hover:text-textOnInk disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        {saving ? 'saving…' : 'add note'}
      </button>
    </div>
  )
}

/** Deterministic, evidence-grounded "what was observed" sentence — no LLM,
 * so this never says more than the payload/computed data actually shows. */
function describeEvidence(e: Evidence, computedSimilarity?: number, computedInfraScore?: number): string {
  const p = e.payload || {}
  switch (e.type) {
    case 'pgp_match':
      return `The same PGP fingerprint (${p.fingerprint}) was observed across ${(p.personas || []).join(', ')}.`
    case 'wallet_reuse':
      return `Wallet ${p.address} was reused across ${(p.personas || []).join(', ')}.`
    case 'infra_correlation': {
      if (computedInfraScore !== undefined) {
        return `Infrastructure correlation computed at ${Math.round(computedInfraScore * 100)}% — see the shared signals below.`
      }
      return p.note || 'Correlated hosting infrastructure was observed.'
    }
    case 'stylometric_similarity': {
      const pct = Math.round((computedSimilarity ?? p.similarity ?? 0) * 100)
      return `Persona DNA comparison found ${pct}% overall stylometric similarity (computed live from post text — see below).`
    }
    default:
      return 'Observed correlation between entities.'
  }
}

function PersonaProfile({ p, caseId }: { p: PersonaDetail; caseId?: number }) {
  const [dna, setDna] = useState<PersonaDNA | null>(null)
  const [dnaLoading, setDnaLoading] = useState(true)
  const [infra, setInfra] = useState<PersonaInfrastructure | null>(null)
  const [infraLoading, setInfraLoading] = useState(true)

  useEffect(() => {
    setDna(null); setDnaLoading(true)
    setInfra(null); setInfraLoading(true)
    fetchPersonaDNA(p.id).then(setDna).catch(() => setDna(null)).finally(() => setDnaLoading(false))
    fetchPersonaInfrastructure(p.id).then(setInfra).catch(() => setInfra(null)).finally(() => setInfraLoading(false))
  }, [p.id])

  return (
    <div className="min-w-0">
      <h2 className="font-editorial text-xl mb-1 truncate">{p.handle}</h2>
      <p className="font-mono text-xs text-steel mb-1 truncate">{p.platform}</p>
      <p className="font-mono text-[10px] text-steel/70 mb-4 break-words">
        created {p.created_at} · last observed {p.last_observed || 'unknown'}
      </p>

      <div className="bg-paper text-textOnPaper p-3 mb-3 rounded-sm min-w-0">
        <div className="font-mono text-[10px] uppercase tracking-wide text-textOnPaper/50 mb-1">pgp keys</div>
        {p.pgp_keys.length ? p.pgp_keys.map((k, i) => (
          <div key={i} className="font-mono text-xs mb-1 min-w-0">
            <div className="break-all">{k.fingerprint}</div>
            <div className="text-textOnPaper/50 text-[10px]">observed {k.observed_at}</div>
          </div>
        )) : <div className="font-mono text-xs text-textOnPaper/50">none observed</div>}
      </div>

      <div className="bg-paper text-textOnPaper p-3 mb-3 rounded-sm min-w-0">
        <div className="font-mono text-[10px] uppercase tracking-wide text-textOnPaper/50 mb-1">wallets</div>
        {p.wallets.map((w, i) => (
          <div key={i} className="font-mono text-xs mb-1 min-w-0">
            <div className="break-all">{w.address}</div>
            <div className="text-textOnPaper/50 text-[10px] break-words">{w.first_tx} → {w.last_tx}</div>
          </div>
        ))}
      </div>

      {infraLoading ? (
        <div className="mb-3 space-y-1"><Skeleton /><Skeleton className="h-3 w-2/3" /></div>
      ) : infra && (
        <div className="bg-paper text-textOnPaper p-3 mb-3 rounded-sm min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-wide text-textOnPaper/50 mb-1">infrastructure</div>
          <div className="font-mono text-xs break-all">{infra.onion_service.onion_address}</div>
          <div className="text-textOnPaper/50 text-[10px] break-words">
            banner: {infra.onion_service.descriptor_meta?.server_banner || 'unknown'}
          </div>
          {infra.infrastructure && (
            <div className="text-textOnPaper/50 text-[10px] break-all mt-1">
              fingerprint: {infra.infrastructure.fingerprint}
            </div>
          )}
        </div>
      )}

      <div className="font-chrome text-xs text-steel mb-2">posts ({p.posts.length})</div>
      {p.posts.map((post, i) => (
        <div key={i} className="bg-paper text-textOnPaper p-3 mb-2 rounded-sm min-w-0">
          <div className="font-mono text-sm break-words">{post.content}</div>
          <div className="font-mono text-[10px] text-textOnPaper/50 mt-1">{post.timestamp}</div>
        </div>
      ))}

      {dnaLoading ? (
        <div className="mt-4 pt-3 border-t border-hairline space-y-1">
          <Skeleton className="h-3 w-24" /><Skeleton className="h-8" />
        </div>
      ) : dna && (
        <div className="mt-4 pt-3 border-t border-hairline min-w-0">
          <div className="font-chrome text-xs text-steel mb-2">persona dna</div>
          <PersonaDNAStrip dnaA={dna} labelA={p.handle} />
          <div className="font-mono text-[9px] text-steel/60 mt-1">
            based on post(s) #{dna.source_post_ids.join(', ')} · {dna.method_version}
          </div>
        </div>
      )}

      <NotesSection entityType="persona" entityId={p.id} caseId={caseId} />
    </div>
  )
}

const parseId = (ref: string) => parseInt(ref.split(':')[1], 10)

function RelationshipEvidence({ data, caseId }: { data: { rel: Relationship; evidence: Evidence[] }; caseId?: number }) {
  const { rel, evidence } = data
  const [attribution, setAttribution] = useState<Attribution | null>(null)
  const [dnaCompare, setDnaCompare] = useState<DNACompareResponse | null>(null)
  const [infraCorrelation, setInfraCorrelation] = useState<InfraCorrelation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setAttribution(null); setDnaCompare(null); setInfraCorrelation(null); setLoading(true)
    Promise.all([
      fetchAttribution(rel.id).then(setAttribution).catch(() => setAttribution(null)),
      fetchDNAComparison(parseId(rel.from), parseId(rel.to)).then(setDnaCompare).catch(() => setDnaCompare(null)),
      fetchInfraCorrelation(parseId(rel.from), parseId(rel.to)).then(setInfraCorrelation).catch(() => setInfraCorrelation(null)),
    ]).finally(() => setLoading(false))
  }, [rel.id])

  const probByEvidenceId = new Map(
    (attribution?.signal_breakdown || []).map((s) => [s.evidence_id, s.signal_probability])
  )

  return (
    <div className="min-w-0">
      <div className="font-mono text-xs text-thread mb-1 truncate">{rel.from_label} ↔ {rel.to_label}</div>
      <h2 className="font-editorial text-lg mb-1">Why are these connected?</h2>
      {loading ? (
        <Skeleton className="h-8 w-20 mb-1" />
      ) : (
        <p className="font-mono text-amber text-2xl mb-1">
          {attribution ? `${Math.round(attribution.confidence * 100)}%` : '—'}
        </p>
      )}
      <p className="font-mono text-[10px] text-steel/70 mb-4 break-words">
        potential attribution, not proof · Noisy-OR fusion
        {attribution ? ` (${attribution.method_version})` : ''} over the independent signals below
      </p>

      {evidence.map((e) => {
        const p = probByEvidenceId.get(e.id)
        const isStylometric = e.type === 'stylometric_similarity'
        const isInfra = e.type === 'infra_correlation'
        const breakdownItem = attribution?.signal_breakdown.find((s) => s.evidence_id === e.id)
        return (
          <div key={e.id} className="bg-paper text-textOnPaper p-3 mb-2 rounded-sm relative min-w-0">
            <span className="absolute top-2 right-2 border border-teal text-teal text-[9px] px-1.5 py-0.5 rounded-sm font-chrome">
              {e.reliability}
            </span>
            <div className="font-chrome text-xs font-semibold mb-1 pr-16">{e.type.replace(/_/g, ' ')}</div>
            <div className="font-editorial text-sm italic mb-2 pr-16 break-words">
              {describeEvidence(e, breakdownItem?.computed_similarity, breakdownItem?.computed_infra_score)}
            </div>

            {isStylometric && (loading ? (
              <div className="mb-2 space-y-1"><Skeleton className="h-8" /><Skeleton className="h-3 w-1/2" /></div>
            ) : dnaCompare && (
              <div className="mb-2 min-w-0">
                <PersonaDNAStrip
                  dnaA={dnaCompare.persona_a} dnaB={dnaCompare.persona_b}
                  labelA={rel.from_label} labelB={rel.to_label}
                />
                <div className="font-mono text-[9px] text-textOnPaper/60 mt-1 grid grid-cols-2 gap-x-2">
                  <span>rhythm: {Math.round(dnaCompare.comparison.dimensions.sentence_rhythm * 100)}%</span>
                  <span>vocab: {Math.round(dnaCompare.comparison.dimensions.vocabulary_richness * 100)}%</span>
                  <span>punctuation: {Math.round(dnaCompare.comparison.dimensions.punctuation_habits * 100)}%</span>
                  <span>function words: {Math.round(dnaCompare.comparison.dimensions.function_word_usage * 100)}%</span>
                </div>
                <div className="font-mono text-[9px] text-textOnPaper/50 mt-1">
                  provenance: posts #{dnaCompare.persona_a.source_post_ids.join(',')} vs
                  #{dnaCompare.persona_b.source_post_ids.join(',')} · {dnaCompare.comparison.method_version}
                </div>
              </div>
            ))}

            {isInfra && (loading ? (
              <div className="mb-2 space-y-1"><Skeleton className="h-3 w-1/3" /><Skeleton className="h-3 w-2/3" /></div>
            ) : infraCorrelation && (
              <div className="mb-2 min-w-0 font-mono text-[10px] text-textOnPaper/70">
                <div className="mb-1">correlation score: {Math.round(infraCorrelation.score * 100)}%</div>
                <ul className="list-disc list-inside">
                  {infraCorrelation.reasons.map((r, i) => <li key={i} className="break-words">{r}</li>)}
                </ul>
                {infraCorrelation.persona_a_infrastructure && infraCorrelation.persona_b_infrastructure && (
                  <div className="mt-1 text-textOnPaper/50 break-all">
                    {infraCorrelation.persona_a_infrastructure.onion_service.onion_address} vs{' '}
                    {infraCorrelation.persona_b_infrastructure.onion_service.onion_address}
                  </div>
                )}
              </div>
            ))}

            {loading ? (
              <Skeleton className="h-3 w-1/3 mb-1" />
            ) : p !== undefined && (
              <div className="font-mono text-[10px] text-amber mb-1">
                contributes {Math.round(p * 100)}% signal probability
              </div>
            )}
            <div className="font-mono text-[10px] text-textOnPaper/60 border-t border-textOnPaper/10 pt-1 break-words">
              {e.source} · observed {e.observed_at}
            </div>
          </div>
        )
      })}

      <NotesSection entityType="relationship" entityId={rel.id} caseId={caseId} />
    </div>
  )
}

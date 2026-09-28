const API = 'http://localhost:8000'
export const API_BASE = API

export type Case = { id: number; name: string; created_at: string }
export type InvestigationRunSummary = {
  id: number; query: string; resolved_handle: string | null
  summary: { persona: string; relationships: { with: string; confidence: number }[]; evidence_count: number } | null
  created_at: string
}
export type Note = { id: number; case_id: number | null; content: string; created_at: string }

export type Persona = { id: number; handle: string; platform: string; actor_id: number | null; created_at: string }
export type PersonaDetail = {
  id: number; handle: string; platform: string
  created_at: string; last_observed: string | null
  pgp_keys: { fingerprint: string; observed_at: string }[]
  wallets: { address: string; first_tx: string; last_tx: string }[]
  posts: { content: string; timestamp: string; stylometric_features: any }[]
}
export type Relationship = { id: number; from: string; to: string; from_label: string; to_label: string; rel_type: string; strength: number; evidence_ids: number[] }
export type Evidence = { id: number; type: string; source: string; reliability: string; observed_at: string; payload: any }
export type TimelineEvent = { id: number; entity_type: string; entity_id: number; event_type: string; timestamp: string; description: string }
export type SignalBreakdownItem = {
  evidence_id: number; type: string; reliability: string; signal_probability: number
  computed_similarity?: number
  similarity_dimensions?: { sentence_rhythm: number; vocabulary_richness: number; punctuation_habits: number; function_word_usage: number }
  computed_infra_score?: number
  infra_reasons?: string[]
}
export type Attribution = { confidence: number; method_version: string; signal_breakdown: SignalBreakdownItem[] }
export type PersonaDNA = {
  persona_id: number; method_version: string; source_post_ids: number[]
  avg_sentence_length: number; sentence_length_sequence: number[]
  vocabulary_richness: number; punctuation_rate: number
  function_word_freq: Record<string, number>
}
export type DNAComparison = {
  overall_similarity: number
  dimensions: { sentence_rhythm: number; vocabulary_richness: number; punctuation_habits: number; function_word_usage: number }
  method_version: string
}
export type DNACompareResponse = { persona_a: PersonaDNA; persona_b: PersonaDNA; comparison: DNAComparison }
export type PersonaInfrastructure = {
  forum: { name: string; type: string; onion_address: string }
  onion_service: { onion_address: string; first_indexed: string; descriptor_meta: Record<string, any> }
  infrastructure: { fingerprint: string; clearnet_correlation: string; confidence: number } | null
}
export type InfraCorrelation = {
  correlated: boolean; score: number; reasons: string[]
  persona_a_infrastructure: PersonaInfrastructure | null
  persona_b_infrastructure: PersonaInfrastructure | null
}
export type OrchestratorStage = { stage: string; at: string; detail: string }
export type InvestigationResult = {
  trace: OrchestratorStage[]
  result: {
    persona: { id: number; handle: string; platform: string }
    relationships: { id: number; from: string; to: string; strength: number }[]
    evidence_count: number
    explanation: string
  } | null
}

async function j<T>(path: string): Promise<T> {
  try {
    const res = await fetch(`${API}${path}`)
    if (!res.ok) throw new Error(`${path} failed: ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error(`[api] ${path}`, err)
    throw err
  }
}

export const fetchPersonas = () => j<Persona[]>('/api/personas')
export const fetchPersonaDetail = (id: number) => j<PersonaDetail>(`/api/personas/${id}`)
export const fetchRelationships = () => j<Relationship[]>('/api/relationships')
export const fetchEvidence = () => j<Evidence[]>('/api/evidence')
export const fetchEvents = () => j<TimelineEvent[]>('/api/events')
export const fetchAttribution = (relId: number) => j<Attribution>(`/api/relationships/${relId}/attribution`)
export const fetchPersonaDNA = (id: number) => j<PersonaDNA>(`/api/personas/${id}/dna`)
export const fetchDNAComparison = (aId: number, bId: number) => j<DNACompareResponse>(`/api/personas/${aId}/dna/compare/${bId}`)
export const fetchPersonaInfrastructure = (id: number) => j<PersonaInfrastructure>(`/api/personas/${id}/infrastructure`)
export const fetchInfraCorrelation = (aId: number, bId: number) => j<InfraCorrelation>(`/api/personas/${aId}/infrastructure/compare/${bId}`)

export const fetchCases = () => j<Case[]>('/api/cases')
export const fetchCase = (id: number) => j<Case>(`/api/cases/${id}`)
export const fetchCaseInvestigations = (id: number) => j<InvestigationRunSummary[]>(`/api/cases/${id}/investigations`)
export const fetchNotes = (entityType: string, entityId: number) =>
  j<Note[]>(`/api/notes?entity_type=${entityType}&entity_id=${entityId}`)

export async function createCase(name: string): Promise<Case> {
  const res = await fetch(`${API}/api/cases`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error(`create case failed: ${res.status}`)
  return res.json()
}

export async function createNote(entityType: string, entityId: number, content: string, caseId?: number): Promise<Note> {
  const res = await fetch(`${API}/api/notes`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entity_type: entityType, entity_id: entityId, content, case_id: caseId ?? null }),
  })
  if (!res.ok) throw new Error(`create note failed: ${res.status}`)
  return res.json()
}

export async function runInvestigation(handle: string, caseId?: number): Promise<InvestigationResult> {
  try {
    const res = await fetch(`${API}/api/investigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle, case_id: caseId ?? null }),
    })
    if (!res.ok) throw new Error(`investigate failed: ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('[api] /api/investigate', err)
    throw err
  }
}

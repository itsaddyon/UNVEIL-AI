import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Persona, PersonaDetail, Relationship, Evidence, TimelineEvent, InvestigationResult,
  Case, InvestigationRunSummary, API_BASE,
  fetchPersonas, fetchPersonaDetail, fetchRelationships, fetchEvidence, fetchEvents, runInvestigation,
  fetchCase, fetchCaseInvestigations,
} from '../lib/api'
import { forceLayout, Point } from '../lib/layout'
import PersonaNode from '../components/PersonaNode'
import InspectorPanel from '../components/InspectorPanel'
import TimelineStrip from '../components/TimelineStrip'
import OrchestratorPanel from '../components/OrchestratorPanel'
import ProductTour from '../components/ProductTour'

const GREY = '#454239', STEEL = '#5B7C99', THREAD = '#8B4B3B'
const parseId = (ref: string) => parseInt(ref.split(':')[1], 10)

export default function InvestigationCanvas() {
  const { caseId } = useParams()
  const numericCaseId = caseId ? parseInt(caseId, 10) : undefined
  const canvasRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [caseInfo, setCaseInfo] = useState<Case | null>(null)
  const [history, setHistory] = useState<InvestigationRunSummary[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [personas, setPersonas] = useState<Persona[]>([])
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [positions, setPositions] = useState<Record<number, Point>>({})
  const [search, setSearch] = useState('')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [selectedPersonaId, setSelectedPersonaId] = useState<number | null>(null)
  const [personaDetail, setPersonaDetail] = useState<PersonaDetail | null>(null)
  const [selectedRelId, setSelectedRelId] = useState<number | null>(null)
  const [inspectedRelIds, setInspectedRelIds] = useState<Set<number>>(new Set())
  const [hoveredRelId, setHoveredRelId] = useState<number | null>(null)
  const [investigation, setInvestigation] = useState<InvestigationResult | null>(null)
  const [investigating, setInvestigating] = useState(false)
  const [dataState, setDataState] = useState<'loading' | 'error' | 'ready'>('loading')

  function refreshHistory() {
    if (numericCaseId !== undefined) fetchCaseInvestigations(numericCaseId).then(setHistory).catch(() => {})
  }

  function investigate() {
    if (!search.trim()) return
    setSelectedPersonaId(null); setPersonaDetail(null); setSelectedRelId(null)
    setInvestigating(true)
    runInvestigation(search.trim(), numericCaseId)
      .then((res) => { setInvestigation(res); refreshHistory() })
      .catch(() => setInvestigation({ trace: [], result: null }))
      .finally(() => setInvestigating(false))
  }

  useEffect(() => {
    if (numericCaseId === undefined) return
    fetchCase(numericCaseId).then(setCaseInfo).catch(() => setCaseInfo(null))
    refreshHistory()
  }, [numericCaseId])

  useEffect(() => {
    Promise.all([fetchPersonas(), fetchRelationships(), fetchEvidence(), fetchEvents()])
      .then(([p, r, e, ev]) => { setPersonas(p); setRelationships(r); setEvidence(e); setEvents(ev); setDataState('ready') })
      .catch(() => setDataState('error'))
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      setSelectedPersonaId(null); setPersonaDetail(null); setSelectedRelId(null); setInvestigation(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const updateSize = () => setCanvasSize({ width: canvas.clientWidth, height: canvas.clientHeight })
    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [])

  // Keep the layout inside the space left after the timeline and inspector are rendered.
  useEffect(() => {
    if (personas.length === 0 || canvasSize.width === 0 || canvasSize.height === 0) return
    setPositions(forceLayout(personas, relationships, canvasSize.width, canvasSize.height))
  }, [personas, relationships, canvasSize])

  const platforms = useMemo(() => Array.from(new Set(personas.map((p) => p.platform))), [personas])

  const isDimmed = (p: Persona) => {
    const matchesSearch = search === '' || p.handle.toLowerCase().includes(search.toLowerCase())
    const matchesPlatform = platformFilter === 'all' || p.platform === platformFilter
    return !(matchesSearch && matchesPlatform)
  }

  // neighbors of the currently selected persona, via real relationship edges
  const neighborIds = useMemo(() => {
    if (!selectedPersonaId) return new Set<number>()
    const set = new Set<number>()
    relationships.forEach((r) => {
      const a = parseId(r.from), b = parseId(r.to)
      if (a === selectedPersonaId) set.add(b)
      if (b === selectedPersonaId) set.add(a)
    })
    return set
  }, [selectedPersonaId, relationships])

  function selectPersona(id: number) {
    setSelectedRelId(null)
    setInvestigation(null)
    setSelectedPersonaId(id)
    fetchPersonaDetail(id).then(setPersonaDetail).catch(() => setPersonaDetail(null))
  }

  function selectRelationship(rel: Relationship) {
    setSelectedPersonaId(null)
    setPersonaDetail(null)
    setInvestigation(null)
    setSelectedRelId(rel.id)
    // once inspected, the thread stays red for the rest of the session —
    // it's now a pinned, examined fact, per Concept D's graph grammar
    setInspectedRelIds((prev) => new Set(prev).add(rel.id))
  }

  function startDrag(id: number, e: React.PointerEvent) {
    const rect = canvasRef.current!.getBoundingClientRect()
    const start = positions[id]
    if (!start) return
    const offsetX = e.clientX - rect.left - start.x
    const offsetY = e.clientY - rect.top - start.y
    const onMove = (ev: PointerEvent) => {
      setPositions((prev) => ({
        ...prev,
        [id]: { x: ev.clientX - rect.left - offsetX, y: ev.clientY - rect.top - offsetY }
      }))
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const selectedRel = relationships.find((r) => r.id === selectedRelId)
  const relEvidence = selectedRel ? evidence.filter((e) => selectedRel.evidence_ids.includes(e.id)) : []

  function edgeColor(r: Relationship): string {
    if (inspectedRelIds.has(r.id)) return THREAD
    if (selectedPersonaId) {
      const a = parseId(r.from), b = parseId(r.to)
      if (a === selectedPersonaId || b === selectedPersonaId) return STEEL
    }
    return GREY
  }

  return (
    <div className="flex flex-col min-h-0 h-[calc(100vh-53px)] overflow-y-auto">
      <div className="px-6 py-3 border-b border-hairline flex items-center gap-3 flex-wrap">
        <span className="font-editorial text-lg truncate">{caseInfo ? caseInfo.name : `Case #${caseId}`}</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && investigate()}
          className="tour-search bg-transparent border border-hairline focus:border-steel outline-none px-3 py-1 text-sm font-mono w-56 transition-colors"
          placeholder="investigate ShadowFox, who is NightFox…"
        />
        <button
          onClick={investigate}
          disabled={investigating || !search.trim()}
          className="font-chrome text-xs border border-thread text-thread px-3 py-1 rounded-sm
                     disabled:opacity-40 disabled:cursor-not-allowed hover:bg-thread/10 transition-colors"
        >
          {investigating ? 'running…' : 'investigate'}
        </button>
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="bg-ink border border-hairline focus:border-steel outline-none px-2 py-1 text-xs font-chrome text-textOnInk transition-colors"
        >
          <option value="all">all platforms</option>
          {platforms.map((pl) => <option key={pl} value={pl}>{pl}</option>)}
        </select>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setShowHistory((v) => !v)}
                  className="font-chrome text-xs border border-hairline text-steel px-3 py-1 rounded-sm hover:border-steel hover:text-textOnInk transition-colors">
            history ({history.length})
          </button>
          {numericCaseId !== undefined && (
            <>
              <a href={`${API_BASE}/api/cases/${numericCaseId}/export.json`} target="_blank" rel="noreferrer"
                 className="font-chrome text-xs border border-hairline text-steel px-3 py-1 rounded-sm hover:border-steel hover:text-textOnInk transition-colors">
                export json
              </a>
              <a href={`${API_BASE}/api/cases/${numericCaseId}/export.csv`} target="_blank" rel="noreferrer"
                 className="font-chrome text-xs border border-hairline text-steel px-3 py-1 rounded-sm hover:border-steel hover:text-textOnInk transition-colors">
                export csv
              </a>
            </>
          )}
        </div>
      </div>

      {showHistory && (
        <div className="px-6 py-3 border-b border-hairline bg-paper text-textOnPaper">
          {history.length === 0 ? (
            <p className="font-mono text-xs text-textOnPaper/60">No investigations run in this case yet.</p>
          ) : history.map((h) => (
            <div key={h.id} className="font-mono text-xs mb-1 border-b border-textOnPaper/10 pb-1">
              <span className="font-chrome font-semibold">{h.query}</span>
              {h.resolved_handle ? ` → ${h.resolved_handle}` : ' → no match'}
              {h.summary && ` · ${h.summary.relationships.length} relationship(s), ${h.summary.evidence_count} evidence`}
              <span className="text-textOnPaper/50"> · {h.created_at}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 min-h-[260px] flex overflow-hidden">
        <div ref={canvasRef} className="tour-canvas flex-1 min-w-0 relative overflow-hidden select-none">
          {dataState === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="font-mono text-xs text-steel animate-pulse">loading investigation data…</p>
            </div>
          )}
          {dataState === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
              <div>
                <p className="font-editorial text-base text-thread mb-1">Couldn't load this case's data</p>
                <p className="font-mono text-xs text-steel">Check the backend is running, then reload the page.</p>
              </div>
            </div>
          )}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {relationships.map((r) => {
              const from = positions[parseId(r.from)], to = positions[parseId(r.to)]
              if (!from || !to) return null
              const isSelected = r.id === selectedRelId
              const isHovered = hoveredRelId === r.id
              const color = edgeColor(r)
              const midX = (from.x + to.x) / 2, midY = (from.y + to.y) / 2
              return (
                <g key={r.id}>
                  {/* wide invisible hit-target so the thin line is actually easy to click */}
                  <line
                    x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                    stroke="transparent" strokeWidth={16}
                    className="pointer-events-auto cursor-pointer"
                    onMouseEnter={() => setHoveredRelId(r.id)}
                    onMouseLeave={() => setHoveredRelId(null)}
                    onClick={() => selectRelationship(r)}
                  />
                  {/* visible thread */}
                  <line
                    x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                    stroke={color}
                    strokeWidth={isSelected || isHovered ? 3 : 1.5}
                    strokeOpacity={isSelected || inspectedRelIds.has(r.id) || isHovered ? 1 : 0.55}
                    className="pointer-events-none"
                    style={{ transition: 'stroke-width 100ms, stroke-opacity 100ms' }}
                  />
                  {/* pin marker — signals "there's evidence here" even before hover */}
                  <circle
                    cx={midX} cy={midY} r={isHovered ? 6 : 4}
                    fill={color} fillOpacity={isHovered ? 1 : 0.85}
                    className="pointer-events-none"
                    style={{ transition: 'r 100ms' }}
                  />
                </g>
              )
            })}
          </svg>

          {personas.map((p) => {
            const pos = positions[p.id]
            if (!pos) return null
            const state = p.id === selectedPersonaId ? 'selected' : neighborIds.has(p.id) ? 'neighbor' : 'default'
            const faded = selectedPersonaId !== null && state === 'default'
            return (
              <PersonaNode
                key={p.id} persona={p} x={pos.x} y={pos.y}
                state={state} dimmed={isDimmed(p)} faded={faded}
                onSelect={() => selectPersona(p.id)}
                onDragStart={(e) => startDrag(p.id, e)}
              />
            )
          })}
        </div>

        {investigation ? (
          <OrchestratorPanel
            data={investigation}
            onClose={() => setInvestigation(null)}
            onSelectRelationship={(relId) => {
              const rel = relationships.find((r) => r.id === relId)
              if (rel) selectRelationship(rel)
            }}
          />
        ) : (
          <InspectorPanel
            personaDetail={personaDetail}
            relationship={selectedRel ? { rel: selectedRel, evidence: relEvidence } : null}
            caseId={numericCaseId}
            onClose={() => { setSelectedPersonaId(null); setPersonaDetail(null); setSelectedRelId(null) }}
          />
        )}
      </div>

      <TimelineStrip events={events} personas={personas} relationships={relationships} />

      <div className="border-t border-hairline px-6 py-2 font-mono text-xs text-steel">
        {selectedPersonaId ? `focused: ${personaDetail?.handle || '…'} · ${neighborIds.size} correlated neighbor(s)` :
         selectedRel ? `focused: ${selectedRel.from_label} ↔ ${selectedRel.to_label}` :
         `instrument rail — idle · ${personas.length} persona(s) · ${relationships.length} relationship(s) · ${inspectedRelIds.size} inspected`}
      </div>
      <ProductTour />
    </div>
  )
}

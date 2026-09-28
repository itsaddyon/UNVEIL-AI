import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Case, createCase, fetchCases } from '../lib/api'

type LoadState = 'loading' | 'error' | 'ready'

export default function CaseList() {
  const navigate = useNavigate()
  const [cases, setCases] = useState<Case[]>([])
  const [state, setState] = useState<LoadState>('loading')
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    fetchCases()
      .then((data) => { setCases(data); setState('ready') })
      .catch(() => setState('error'))
  }, [])

  function handleCreate() {
    if (!name.trim()) return
    setCreating(true)
    setCreateError(null)
    createCase(name.trim())
      .then((c) => navigate(`/case/${c.id}`))
      .catch(() => { setCreating(false); setCreateError('Could not create the case — check the backend is running.') })
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-8">
        <div className="font-mono text-[10px] text-steel uppercase tracking-wide mb-2">investigation workspace</div>
        <h1 className="font-editorial text-3xl mb-2">Cases</h1>
        <p className="font-chrome text-sm text-steel/80">
          Each case tracks its own investigation history, notes, and exports
          against the shared intelligence dataset.
        </p>
      </div>

      <div className="mb-8">
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="e.g. Operation Nightfall"
            className="bg-transparent border border-hairline focus:border-steel outline-none px-3 py-2 text-sm font-mono flex-1 transition-colors"
          />
          <button
            onClick={handleCreate}
            disabled={creating || !name.trim()}
            className="font-chrome text-xs border border-thread text-thread px-4 py-2 rounded-sm
                       disabled:opacity-40 disabled:cursor-not-allowed hover:bg-thread/10 transition-colors"
          >
            {creating ? 'creating…' : 'new case'}
          </button>
        </div>
        {createError && <p className="font-mono text-[11px] text-thread mt-2">{createError}</p>}
      </div>

      {state === 'loading' && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 rounded-sm bg-paper/10 animate-pulse" />
          ))}
        </div>
      )}

      {state === 'error' && (
        <div className="border border-thread/50 bg-thread/10 p-4 rounded-sm font-mono text-xs text-thread">
          Couldn't load cases — the backend may not be running.
        </div>
      )}

      {state === 'ready' && cases.length === 0 && (
        <div className="border border-dashed border-hairline p-8 rounded-sm text-center">
          <p className="font-editorial text-base text-textOnInk/80 mb-1">No cases yet</p>
          <p className="font-mono text-xs text-steel">Create one above to open the investigation workspace.</p>
        </div>
      )}

      {state === 'ready' && cases.map((c) => (
        <button
          key={c.id}
          onClick={() => navigate(`/case/${c.id}`)}
          className="group block w-full text-left bg-paper text-textOnPaper p-4 mb-2 rounded-sm shadow-sm
                     hover:shadow-md hover:-translate-y-px transition-all duration-150 relative overflow-hidden"
        >
          <span className="absolute left-0 top-0 bottom-0 w-1 bg-steel/40 group-hover:bg-thread transition-colors" />
          <div className="pl-3 flex items-center justify-between">
            <div>
              <div className="font-editorial text-base">{c.name}</div>
              <div className="font-mono text-[10px] text-textOnPaper/50">opened {c.created_at}</div>
            </div>
            <span className="font-mono text-xs text-textOnPaper/40 group-hover:text-thread transition-colors">→</span>
          </div>
        </button>
      ))}
    </div>
  )
}

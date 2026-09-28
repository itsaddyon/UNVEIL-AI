import { useEffect, useState } from 'react'
import { API_BASE } from '../lib/api'

/** Real, designed error state — no silent blank screens if the backend
 * isn't running. Polls /health quietly; only ever visible when something
 * is actually wrong. */
export default function ConnectionStatus() {
  const [connected, setConnected] = useState(true)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function check() {
      try {
        const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) })
        if (!cancelled) setConnected(res.ok)
      } catch {
        if (!cancelled) setConnected(false)
      } finally {
        if (!cancelled) setChecked(true)
      }
    }
    check()
    const interval = setInterval(check, 8000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  if (!checked || connected) return null

  return (
    <div className="bg-thread/10 border-b border-thread px-6 py-2 flex items-center gap-2 flex-wrap">
      <span className="w-2 h-2 rounded-full bg-thread shrink-0 animate-pulse" />
      <span className="font-mono text-xs text-thread">
        Backend not reachable at {API_BASE} — run{' '}
        <code className="bg-ink/40 px-1 rounded-sm">uvicorn app.main:app --reload</code> in /backend
      </span>
    </div>
  )
}

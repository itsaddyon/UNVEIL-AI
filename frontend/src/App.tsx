import { Routes, Route, Link } from 'react-router-dom'
import CaseList from './pages/CaseList'
import InvestigationCanvas from './pages/InvestigationCanvas'
import ConnectionStatus from './components/ConnectionStatus'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-3 border-b border-hairline flex items-center justify-between">
        <Link to="/" className="font-chrome text-sm tracking-tight text-textOnInk hover:text-amber transition-colors">
          UNVEIL AI
        </Link>
        <span className="font-mono text-xs text-steel hidden sm:inline">
          Unified Network for Veiled-actor Evidence &amp; Identity Linking
        </span>
      </header>
      <ConnectionStatus />
      <main className="flex-1 min-h-0">
        <Routes>
          <Route path="/" element={<CaseList />} />
          <Route path="/case/:caseId" element={<InvestigationCanvas />} />
        </Routes>
      </main>
    </div>
  )
}

import { Download, Eraser, Info } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../app/store'
import { Card } from '../components/ui/Card'
import { APP_STORAGE_KEY, APP_VERSION } from '../lib/utils'

export function SettingsRoute() {
  const navigate = useNavigate()
  const { clearAllData, exportResearchData } = useAppStore()

  const handleExport = () => {
    const content = exportResearchData()
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `momentum-research-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleClear = () => {
    const confirmed = window.confirm('Clear all local Momentum data? This cannot be undone.')
    if (!confirmed) {
      return
    }

    clearAllData()
    navigate('/')
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <div className="flex items-center gap-2">
          <Info size={16} className="text-brand-300" />
          <h1 className="text-xl font-semibold text-slate-100">Settings & Data</h1>
        </div>
        <p className="text-sm text-slate-300">
          Momentum is a local-first prototype for HCI evaluation. No backend or cloud sync is used.
        </p>
      </Card>

      <Card className="space-y-3">
        <p className="text-sm text-slate-200">Export research data</p>
        <p className="text-xs text-slate-400">
          Download projects, tasks, sessions, and reflections as JSON for analysis.
        </p>
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-100 hover:bg-slate-800"
        >
          <Download size={14} />
          Export JSON
        </button>
      </Card>

      <Card className="space-y-3">
        <p className="text-sm text-slate-200">Danger zone</p>
        <button
          type="button"
          onClick={handleClear}
          className="inline-flex items-center gap-2 rounded-xl border border-rose-900 px-4 py-2 text-sm text-rose-300 hover:bg-rose-950/30"
        >
          <Eraser size={14} />
          Clear all local data
        </button>
      </Card>

      <Card className="space-y-1 text-xs text-slate-400">
        <p>App version: {APP_VERSION}</p>
        <p>Storage key: {APP_STORAGE_KEY}</p>
        <p>Prototype mode: local-only with optional AI enhancement fallback.</p>
      </Card>
    </div>
  )
}

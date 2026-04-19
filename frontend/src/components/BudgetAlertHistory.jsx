import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { getBudgetAlertHistory } from '../api'

const stageConfig = {
  0: { label: 'Safe',     color: 'text-green-700',  bg: 'bg-green-100'  },
  1: { label: 'Warning',  color: 'text-amber-700',  bg: 'bg-amber-100'  },
  2: { label: 'Critical', color: 'text-orange-700', bg: 'bg-orange-100' },
  3: { label: 'Breached', color: 'text-red-700',    bg: 'bg-red-100'    },
}

function formatTs(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return ts }
}

export default function BudgetAlertHistory() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await getBudgetAlertHistory()
        setAlerts(Array.isArray(res.data) ? res.data : [])
      } catch (err) {
        setError(err.message || 'Failed to load alert history')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4 card-hover animate-fade-in-up"
      style={{ animationDelay: '100ms' }}>

      <h2 className="font-semibold text-slate-800 text-base">Budget Alert History</h2>

      {loading && (
        <div className="flex flex-col gap-3">
          <div className="skeleton h-8 w-full rounded" />
          {[0, 1, 2].map(i => (
            <div key={i} className="skeleton h-10 w-full rounded" />
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 animate-fade-in">
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {!loading && !error && alerts.length === 0 && (
        <p className="text-sm text-slate-400 py-4 animate-fade-in">No budget alerts recorded yet</p>
      )}

      {!loading && !error && alerts.length > 0 && (
        <div className="overflow-x-auto animate-fade-in">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-slate-200">
                {['Timestamp', 'Stage', 'Amount Used', 'Budget', 'Overage', 'Message'].map(h => (
                  <th key={h} className="pb-3 text-xs font-medium text-slate-400 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alerts.map((a, i) => {
                const cfg = stageConfig[a.stage] || stageConfig[0]
                return (
                  <tr
                    key={i}
                    className="border-b border-slate-100 transition-colors duration-150 hover:bg-slate-50"
                    style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                  >
                    <td className="py-3 pr-4 text-slate-600 whitespace-nowrap">{formatTs(a.timestamp)}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-700">₹{a.amount_used?.toFixed(2) ?? '—'}</td>
                    <td className="py-3 pr-4 text-slate-700">₹{a.daily_budget?.toFixed(2) ?? '—'}</td>
                    <td className="py-3 pr-4 text-slate-700">
                      {a.overage != null ? `₹${a.overage.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3 text-slate-500 text-xs max-w-xs truncate">{a.message || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

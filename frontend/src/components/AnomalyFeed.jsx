import { useEffect, useState } from 'react'
import { Loader, AlertCircle, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getRecentAnomalies } from '../api'

const severityStyle = {
  LOW:    'bg-amber-100 text-amber-700',
  MEDIUM: 'bg-orange-100 text-orange-700',
  HIGH:   'bg-red-100 text-red-700',
}

function SeverityBadge({ severity }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium
      ${severityStyle[severity] || 'bg-slate-100 text-slate-600'}`}>
      {severity}
    </span>
  )
}

function formatTs(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    })
  } catch { return ts }
}

export default function AnomalyFeed() {
  const [anomalies, setAnomalies] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  async function load() {
    try {
      const res = await getRecentAnomalies(5)
      setAnomalies(Array.isArray(res.data) ? res.data : [])
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to load anomalies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4 card-hover animate-fade-in-up"
      style={{ animationDelay: '120ms' }}>

      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-800 text-base">Recent Anomalies</h2>
        {!loading && (
          <span className="text-xs text-slate-400 animate-fade-in">Live · 30s</span>
        )}
      </div>

      {loading && (
        <div className="flex flex-col gap-3 py-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex flex-col gap-2 py-2">
              <div className="skeleton h-3 w-24" />
              <div className="skeleton h-3 w-40" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 animate-fade-in">
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {!loading && !error && anomalies.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 h-40 text-slate-500 animate-scale-in">
          <CheckCircle size={24} className="text-green-500" />
          <span className="text-sm">No anomalies detected</span>
        </div>
      )}

      {!loading && !error && anomalies.length > 0 && (
        <div className="flex flex-col divide-y divide-slate-100">
          {anomalies.map((a, i) => (
            <div
              key={i}
              className="py-3 flex flex-col gap-1.5 animate-fade-in-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400">{formatTs(a.timestamp)}</span>
                <SeverityBadge severity={a.severity} />
              </div>
              <span className="font-mono text-xs text-slate-700 bg-slate-50 px-2 py-0.5 rounded w-fit">
                {a.rule_triggered || '—'}
              </span>
              {a.explanation && (
                <p className="text-xs text-slate-500 leading-relaxed">{a.explanation}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && !error && (
        <div className="pt-2 border-t border-slate-100">
          <Link
            to="/history"
            className="text-xs text-slate-500 hover:text-slate-800 transition-colors duration-150"
          >
            View all anomalies →
          </Link>
        </div>
      )}
    </div>
  )
}

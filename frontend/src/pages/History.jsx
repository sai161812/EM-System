import { useEffect, useState } from 'react'
import { AlertCircle, X, Filter } from 'lucide-react'
import { getAllAnomalies } from '../api'

const severityStyle = {
  LOW:    'bg-amber-100 text-amber-700',
  MEDIUM: 'bg-orange-100 text-orange-700',
  HIGH:   'bg-red-100 text-red-700',
}

const RULES = ['SPIKE', 'INACTIVE_HOUR', 'SUSTAINED_OVERLOAD', 'DROPOUT', 'WEEKEND_SURGE']

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
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return ts }
}

const selectCls = `border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white outline-none
                   focus:ring-2 focus:ring-slate-300 focus:border-slate-300
                   transition-all duration-150 hover:border-slate-300`

export default function History() {
  const [all, setAll]         = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const [severity, setSeverity] = useState('All')
  const [rule, setRule]         = useState('All')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate]     = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await getAllAnomalies()
        setAll(Array.isArray(res.data) ? res.data : [])
      } catch (err) {
        setError(err.message || 'Failed to load anomaly history')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function clearFilters() {
    setSeverity('All'); setRule('All'); setFromDate(''); setToDate('')
  }

  const filtered = all.filter(a => {
    if (severity !== 'All' && a.severity !== severity) return false
    if (rule !== 'All' && a.rule_triggered !== rule) return false
    if (fromDate && a.timestamp < fromDate) return false
    if (toDate && a.timestamp > toDate + 'T23:59:59') return false
    return true
  })

  const hasFilters = severity !== 'All' || rule !== 'All' || fromDate || toDate

  return (
    <div className="flex flex-col gap-7">

      <div className="animate-fade-in-up">
        <h1 className="text-xl font-semibold text-slate-800">Anomaly History</h1>
        <p className="text-sm text-slate-400 mt-1">All detected anomalies with filtering</p>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 card-hover animate-fade-in-up"
        style={{ animationDelay: '50ms' }}>
        <div className="flex items-center gap-2 mb-3 text-slate-500">
          <Filter size={14} />
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Filters</span>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400">Severity</label>
            <select value={severity} onChange={e => setSeverity(e.target.value)} className={selectCls}>
              {['All', 'LOW', 'MEDIUM', 'HIGH'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400">Rule</label>
            <select value={rule} onChange={e => setRule(e.target.value)} className={selectCls}>
              <option>All</option>
              {RULES.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400">From</label>
            <input
              type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              className={selectCls}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400">To</label>
            <input
              type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              className={selectCls}
            />
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm
                         text-slate-500 hover:bg-slate-50 hover:border-slate-300
                         transition-all duration-150 active:scale-95 animate-scale-in"
            >
              <X size={13} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 card-hover animate-fade-in-up"
        style={{ animationDelay: '100ms' }}>

        {loading && (
          <div className="flex flex-col gap-3">
            <div className="skeleton h-8 w-full rounded" />
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton h-12 w-full rounded" />
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 animate-fade-in">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-400 animate-fade-in">
                {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>

            {filtered.length === 0 ? (
              <p className="text-sm text-slate-400 py-10 text-center animate-fade-in">
                No anomalies match the selected filters
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-slate-200">
                      {['Timestamp', 'Rule Triggered', 'Consumption (kWh)', 'Severity', 'Explanation'].map(h => (
                        <th key={h} className="pb-3 text-xs font-medium text-slate-400 pr-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a, i) => (
                      <tr
                        key={i}
                        className="border-b border-slate-100 transition-colors duration-150 hover:bg-slate-50
                                   animate-fade-in-up"
                        style={{ animationDelay: `${Math.min(i, 10) * 35}ms` }}
                      >
                        <td className="py-3 pr-4 text-slate-600 whitespace-nowrap">{formatTs(a.timestamp)}</td>
                        <td className="py-3 pr-4">
                          <span className="font-mono text-xs text-slate-700 bg-slate-50 px-2 py-0.5 rounded">
                            {a.rule_triggered || '—'}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-slate-700">{a.consumption_kwh ?? '—'}</td>
                        <td className="py-3 pr-4"><SeverityBadge severity={a.severity} /></td>
                        <td className="py-3 text-slate-500 text-xs max-w-sm">{a.explanation || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

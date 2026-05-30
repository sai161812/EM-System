import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle, Info } from 'lucide-react'
import { getBudgetStatus } from '../api'

const stageConfig = {
  0: { label: 'Safe',     color: 'text-green-700',  bg: 'bg-green-100',  bar: 'bg-green-500',  border: 'border-green-200',  alertBg: 'bg-green-50'  },
  1: { label: 'Warning',  color: 'text-amber-700',  bg: 'bg-amber-100',  bar: 'bg-amber-500',  border: 'border-amber-200',  alertBg: 'bg-amber-50'  },
  2: { label: 'Critical', color: 'text-orange-700', bg: 'bg-orange-100', bar: 'bg-orange-500', border: 'border-orange-200', alertBg: 'bg-orange-50' },
  3: { label: 'Breached', color: 'text-red-700',    bg: 'bg-red-100',    bar: 'bg-red-500',    border: 'border-red-200',    alertBg: 'bg-red-50'    },
}

export default function BudgetStatus() {
  const [status, setStatus]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  // Separate display value so we can animate the bar from 0 → target
  const [displayPct, setDisplayPct] = useState(0)

  async function load() {
    try {
      const res = await getBudgetStatus()
      setStatus(res.data)
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to load budget status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [])

  // Animate progress bar to real value after a short delay
  const pct = Math.min(status?.percent_used ?? 0, 100)
  useEffect(() => {
    if (!loading && !error && status) {
      setDisplayPct(0)
      const t = setTimeout(() => setDisplayPct(pct), 80)
      return () => clearTimeout(t)
    }
  }, [loading, error, pct, status])

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="skeleton h-4 w-28" />
          <div className="skeleton h-6 w-16 rounded-full" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="skeleton h-8 w-32" />
          <div className="skeleton h-2 w-full rounded-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-center gap-2 text-red-600 animate-fade-in">
        <AlertCircle size={16} />
        <span className="text-sm">{error}</span>
      </div>
    )
  }

  const stage = status?.stage ?? 0
  const cfg   = stageConfig[stage] || stageConfig[0]

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5 card-hover animate-fade-in-up">

      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-800 text-base">Budget Status</h2>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${cfg.bg} ${cfg.color} animate-scale-in`}>
          {cfg.label}
        </span>
      </div>

      {stage === 0 && (
        <div className="flex items-center gap-2 text-green-700 animate-fade-in">
          <CheckCircle size={18} className="text-green-500" />
          <span className="text-sm font-medium">Within budget</span>
        </div>
      )}

      <div>
        <div className="flex items-baseline gap-1 mb-3">
          <span className="text-2xl font-semibold text-slate-800">
            ₹{status?.amount_used?.toFixed(2) ?? '—'}
          </span>
          <span className="text-slate-400 text-sm">
            of ₹{status?.daily_budget?.toFixed(2) ?? '—'}
          </span>
        </div>

        {/* Animated progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-2.5 rounded-full ${cfg.bar}`}
            style={{
              width: `${displayPct}%`,
              transition: 'width 800ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-slate-400">{pct.toFixed(1)}% used</span>
          <span className="text-xs text-slate-400">100%</span>
        </div>
      </div>

      {status?.message && (
        <div className={`rounded-lg border p-3 text-sm ${cfg.alertBg} ${cfg.border} ${cfg.color} animate-fade-in`}>
          {status.message}
        </div>
      )}

      {status?.contributing_anomaly && (
        <div className="flex items-start gap-2 text-slate-500 animate-fade-in">
          <Info size={14} className="mt-0.5 flex-shrink-0" />
          <span className="text-xs leading-relaxed">{status.contributing_anomaly}</span>
        </div>
      )}
    </div>
  )
}

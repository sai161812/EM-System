import { useEffect, useState } from 'react'
import {
  ArrowUpDown, Calendar, CalendarDays, TrendingDown, TrendingUp,
  Zap, AlertTriangle, AlertCircle,
} from 'lucide-react'
import { getInsights } from '../api'

const iconMap = {
  VS_YESTERDAY:  ArrowUpDown,
  VS_7DAY_AVG:   Calendar,
  VS_30DAY_AVG:  CalendarDays,
  WORST_DAY_WEEK: TrendingDown,
  BEST_DAY_WEEK:  TrendingUp,
  PEAK_HOUR_TODAY: Zap,
  ANOMALY_SUMMARY: AlertTriangle,
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3">
      <div className="skeleton w-8 h-8 rounded-lg flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="skeleton h-3 w-3/4" />
      </div>
      <div className="skeleton h-4 w-10 flex-shrink-0" />
    </div>
  )
}

export default function InsightsPanel() {
  const [insights, setInsights] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await getInsights()
        setInsights(Array.isArray(res.data?.insights) ? res.data.insights : [])
      } catch (err) {
        setError(err.message || 'Failed to load insights')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
        <div className="skeleton h-4 w-28 mb-5" />
        <div className="divide-y divide-slate-100">
          {[0, 1, 2, 3].map(i => <SkeletonRow key={i} />)}
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

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col card-hover animate-fade-in-up">
      <h2 className="font-semibold text-slate-800 text-base mb-4">Usage Insights</h2>

      {insights.length === 0 && (
        <p className="text-sm text-slate-400 animate-fade-in">No insights available</p>
      )}

      <div className="divide-y divide-slate-100">
        {insights.map((item, i) => {
          const Icon        = iconMap[item.type] || Zap
          const isPositive  = typeof item.value === 'number' && item.value > 0
          const isNegative  = typeof item.value === 'number' && item.value < 0
          const valueColor  = isPositive ? 'text-red-600' : isNegative ? 'text-green-600' : 'text-slate-700'

          return (
            <div
              key={i}
              className="flex items-center gap-4 py-3 animate-slide-in-left"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-lg flex-shrink-0">
                <Icon size={15} className="text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 leading-snug">{item.message || item.label || '—'}</p>
              </div>
              {item.value !== undefined && item.value !== null && (
                <span className={`text-sm font-medium flex-shrink-0 ${valueColor}`}>
                  {typeof item.value === 'number'
                    ? `${item.value > 0 ? '+' : ''}${item.value.toFixed(2)}`
                    : item.value}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

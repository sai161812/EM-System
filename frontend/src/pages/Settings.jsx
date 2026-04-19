import { useEffect, useState } from 'react'
import { Loader, AlertCircle, IndianRupee, Zap, TrendingUp, Calendar } from 'lucide-react'
import InsightsPanel from '../components/InsightsPanel'
import { getCostSummary } from '../api'

function CostItem({ label, value, icon: Icon }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-slate-400">
        <Icon size={13} />
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-xl font-semibold text-slate-800 tracking-tight">{value}</div>
    </div>
  )
}

function CostCard() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  useEffect(() => {
    getCostSummary()
      .then(r => setData(r.data))
      .catch(e => setError(e.message || 'Failed to load cost summary'))
      .finally(() => setLoading(false))
  }, [])

  const items = [
    { label: "Today's Cost",       value: `₹${data?.today_cost?.toFixed(2) ?? '—'}`,            icon: IndianRupee },
    { label: 'Month Cost',         value: `₹${data?.month_cost?.toFixed(2) ?? '—'}`,             icon: Calendar },
    { label: 'Projected Monthly',  value: `₹${data?.projected_month_cost?.toFixed(2) ?? '—'}`,   icon: TrendingUp },
    { label: 'Rate per Unit',      value: `₹${data?.rate_per_unit?.toFixed(2) ?? '—'}/kWh`,      icon: Zap },
  ]

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5 card-hover animate-fade-in-up"
      style={{ animationDelay: '80ms' }}>
      <h2 className="font-semibold text-slate-800 text-base">Cost Summary</h2>

      {loading && (
        <div className="grid grid-cols-2 gap-4">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="flex flex-col gap-2">
              <div className="skeleton h-3 w-20" />
              <div className="skeleton h-7 w-24" />
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

      {!loading && !error && (
        <div className="grid grid-cols-2 gap-5">
          {items.map(({ label, value, icon }, i) => (
            <div
              key={label}
              className="animate-fade-in-up"
              style={{ animationDelay: `${i * 60 + 80}ms` }}
            >
              <CostItem label={label} value={value} icon={icon} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Settings() {
  return (
    <div className="flex flex-col gap-7">

      <div className="animate-fade-in-up">
        <h1 className="text-xl font-semibold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Usage insights and cost breakdown</p>
      </div>

      <InsightsPanel />
      <CostCard />
    </div>
  )
}

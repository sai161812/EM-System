import { useEffect, useState } from 'react'
import { Zap, IndianRupee, TrendingUp, AlertTriangle, AlertCircle } from 'lucide-react'
import { getEnergySummary, getCostSummary, getRecentAnomalies } from '../api'

function StatCard({ icon: Icon, label, value, iconColor, valueColor, index = 0 }) {
  return (
    <div
      className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-3
                 card-hover animate-fade-in-up"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="flex items-center gap-2">
        <Icon size={16} className={iconColor || 'text-slate-400'} />
        <span className="text-sm text-slate-400">{label}</span>
      </div>
      <div className={`text-2xl font-semibold tracking-tight ${valueColor || 'text-slate-800'}`}>
        {value}
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-3">
      <div className="skeleton h-3 w-28" />
      <div className="skeleton h-7 w-20" />
    </div>
  )
}

export default function SummaryCards() {
  const [energy, setEnergy]     = useState(null)
  const [cost, setCost]         = useState(null)
  const [anomalies, setAnomalies] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [e, c, a] = await Promise.all([
          getEnergySummary(),
          getCostSummary(),
          getRecentAnomalies(100),
        ])
        setEnergy(e.data)
        setCost(c.data)
        setAnomalies(a.data)
      } catch (err) {
        setError(err.message || 'Failed to load summary')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 animate-fade-in">
        <AlertCircle size={16} />
        <span className="text-sm">{error}</span>
      </div>
    )
  }

  const anomalyCount = Array.isArray(anomalies) ? anomalies.length : 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard index={0} icon={Zap}           label="Total Consumption"    iconColor="text-slate-500"
        value={`${energy?.total_kwh?.toFixed(2) ?? '—'} kWh`} />
      <StatCard index={1} icon={IndianRupee}   label="Today's Cost"         iconColor="text-slate-500"
        value={`₹${cost?.today_cost?.toFixed(2) ?? '—'}`} />
      <StatCard index={2} icon={TrendingUp}    label="Projected Monthly"    iconColor="text-slate-500"
        value={`₹${cost?.projected_month_cost?.toFixed(2) ?? '—'}`} />
      <StatCard index={3} icon={AlertTriangle} label="Active Anomalies"
        iconColor={anomalyCount > 0 ? 'text-red-500' : 'text-slate-400'}
        valueColor={anomalyCount > 0 ? 'text-red-600' : 'text-slate-800'}
        value={anomalyCount} />
    </div>
  )
}

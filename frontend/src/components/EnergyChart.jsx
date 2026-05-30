import { useEffect, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { AlertCircle } from 'lucide-react'
import { getHourlyData, getDailyData, getRecentAnomalies } from '../api'

function today() { return new Date().toISOString().slice(0, 10) }
function currentMonth() { return new Date().toISOString().slice(0, 7) }

function currentWeekFilter(data) {
  if (!Array.isArray(data)) return []
  const now = new Date()
  const dayOfWeek = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  return data.filter(d => {
    const date = new Date(d.date || d.day || d.timestamp)
    return date >= monday && date <= now
  })
}

const CustomDot = ({ cx, cy, payload, anomalyHours }) => {
  if (!anomalyHours || !anomalyHours.has(payload.hour)) return null
  return <circle cx={cx} cy={cy} r={5} fill="#dc2626" stroke="white" strokeWidth={1.5} />
}

const TABS = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
]

function ChartSkeleton() {
  return (
    <div className="flex flex-col gap-3 pt-2">
      <div className="skeleton h-52 w-full rounded-lg" />
    </div>
  )
}

export default function EnergyChart() {
  const [tab, setTab]               = useState('today')
  const [hourlyData, setHourlyData] = useState([])
  const [dailyData, setDailyData]   = useState([])
  const [anomalyHours, setAnomalyHours] = useState(new Set())
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [chartKey, setChartKey]     = useState(0) // forces re-mount on tab change → re-animation

  useEffect(() => {
    async function load() {
      setLoading(true); setError(null)
      try {
        const [hourly, daily, anomalies] = await Promise.all([
          getHourlyData(today()),
          getDailyData(currentMonth()),
          getRecentAnomalies(100),
        ])

        const rawHourly = Array.isArray(hourly.data) ? hourly.data : []
        setHourlyData(rawHourly.map(r => ({
          hour: parseInt(r.timestamp?.slice(11, 13) || '0', 10),
          kwh: r.consumption_kwh,
        })))

        const rawDaily = Array.isArray(daily.data) ? daily.data : []
        setDailyData(rawDaily.map(r => ({ date: r.date, kwh: r.total_kwh })))

        const todayStr = today()
        const hours = new Set()
        if (Array.isArray(anomalies.data)) {
          anomalies.data.forEach(a => {
            const ts = a.timestamp || ''
            if (ts.startsWith(todayStr)) {
              const h = parseInt(ts.slice(11, 13), 10)
              if (!isNaN(h)) hours.add(h)
            }
          })
        }
        setAnomalyHours(hours)
      } catch (err) {
        setError(err.message || 'Failed to load chart data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function handleTabChange(key) {
    setTab(key)
    setChartKey(k => k + 1) // re-mount chart → fresh draw animation
  }

  const weekData = currentWeekFilter(dailyData)

  const tooltipStyle = {
    contentStyle: { fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4 card-hover animate-fade-in-up">

      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-800 text-base">Energy Consumption</h2>
        <div className="flex gap-1">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-all duration-200 ${
                tab === t.key
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <ChartSkeleton />}

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 animate-fade-in">
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {!loading && !error && (
        <div key={chartKey} className="animate-fade-in">
          {tab === 'today' && (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={hourlyData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={h => `${h}:00`} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} unit=" kWh" width={55} />
                <Tooltip {...tooltipStyle} formatter={v => [`${v} kWh`, 'Consumption']} labelFormatter={h => `Hour ${h}:00`} />
                <Line
                  type="monotone" dataKey="kwh" stroke="#1e293b" strokeWidth={2}
                  dot={(props) => <CustomDot {...props} anomalyHours={anomalyHours} />}
                  activeDot={{ r: 4 }}
                  isAnimationActive={true} animationDuration={700} animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {tab === 'week' && (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={weekData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} unit=" kWh" width={55} />
                <Tooltip {...tooltipStyle} formatter={v => [`${v} kWh`, 'Consumption']} />
                <Bar dataKey="kwh" fill="#1e293b" radius={[4, 4, 0, 0]}
                  isAnimationActive={true} animationDuration={600} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          )}

          {tab === 'month' && (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dailyData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} unit=" kWh" width={55} />
                <Tooltip {...tooltipStyle} formatter={v => [`${v} kWh`, 'Consumption']} />
                <Bar dataKey="kwh" fill="#1e293b" radius={[4, 4, 0, 0]}
                  isAnimationActive={true} animationDuration={600} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  )
}

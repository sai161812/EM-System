import SummaryCards from '../components/SummaryCards'
import EnergyChart from '../components/EnergyChart'
import AnomalyFeed from '../components/AnomalyFeed'

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-7">

      <div className="animate-fade-in-up">
        <h1 className="text-xl font-semibold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Real-time energy monitoring overview</p>
      </div>

      <SummaryCards />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <EnergyChart />
        </div>
        <div className="lg:col-span-2">
          <AnomalyFeed />
        </div>
      </div>
    </div>
  )
}

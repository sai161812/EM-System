import React from 'react'
import SummaryCards from '../components/SummaryCards'
import EnergyChart from '../components/EnergyChart'
import AnomalyFeed from '../components/AnomalyFeed'
import InsightsPanel from '../components/InsightsPanel'

export default function Dashboard() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <div className="p-8">
      <div className="flex justify-between items-end">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <div className="text-sm text-slate-500">{today}</div>
      </div>
      <div className="mt-6">
        <SummaryCards />
      </div>
      <div className="flex gap-6 mt-6">
        <div className="flex-[3]">
          <EnergyChart />
        </div>
        <div className="flex-[2]">
          <AnomalyFeed />
        </div>
      </div>
      <div className="mt-6">
        <InsightsPanel />
      </div>
    </div>
  )
}

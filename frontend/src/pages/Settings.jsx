import React from 'react'
import BudgetSettings from '../components/BudgetSettings'
import EnergyAdvisor from '../components/EnergyAdvisor'

export default function Settings() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
      <p className="text-sm text-slate-500 mt-1">Configure your electricity tariff, daily budget, and run AI analysis.</p>
      <div className="mt-6">
        <EnergyAdvisor />
      </div>
      <div className="mt-6 max-w-md">
        <BudgetSettings />
      </div>
    </div>
  )
}

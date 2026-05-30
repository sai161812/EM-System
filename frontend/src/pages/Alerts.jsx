import BudgetStatus from '../components/BudgetStatus'
import BudgetSettings from '../components/BudgetSettings'
import BudgetAlertHistory from '../components/BudgetAlertHistory'

export default function Alerts() {
  return (
    <div className="flex flex-col gap-7">

      <div className="animate-fade-in-up">
        <h1 className="text-xl font-semibold text-slate-800">Alerts</h1>
        <p className="text-sm text-slate-400 mt-1">Budget tracking and alert management</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BudgetStatus />
        <BudgetSettings />
      </div>

      <BudgetAlertHistory />
    </div>
  )
}

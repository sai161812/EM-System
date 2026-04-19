import React from 'react';
import BudgetStatus from '../components/BudgetStatus';
import BudgetSettings from '../components/BudgetSettings';
import BudgetAlertHistory from '../components/BudgetAlertHistory';

export default function Alerts() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Budget Alerts</h1>
      
      <div className="flex gap-6 mt-6">
        <div className="flex-1 flex flex-col">
          <BudgetStatus />
        </div>
        <div className="flex-1 flex flex-col">
          <BudgetSettings />
        </div>
      </div>
      
      <div className="w-full">
        <BudgetAlertHistory />
      </div>
    </div>
  );
}

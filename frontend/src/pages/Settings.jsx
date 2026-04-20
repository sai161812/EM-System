import React from 'react';
import BudgetSettings from '../components/BudgetSettings';

export default function Settings() {
  return (
    <div className="p-8 h-full flex flex-col">
      <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
      <p className="text-sm text-slate-500 mt-1">Configure your electricity tariff and daily budget.</p>

      <div className="flex gap-6 mt-6">
        {/* BudgetSettings moved here from Alerts (Section 3 restructuring) */}
        <div className="max-w-md w-full">
          <BudgetSettings />
        </div>

        {/* Placeholder for future notification preferences */}
        <div className="flex-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-dashed">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Notification Preferences</h2>
            <p className="text-sm text-slate-400">Email and SMS alert settings — coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

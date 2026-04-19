import React, { useState, useEffect } from 'react';
import { IndianRupee, Zap, Loader, Check, AlertCircle } from 'lucide-react';
import { getBudgetSettings, getSettings, updateBudget, updateSettings } from '../api';

export default function BudgetSettings() {
  const [dailyBudget, setDailyBudget] = useState('');
  const [ratePerUnit, setRatePerUnit] = useState('');
  
  const [globalLoading, setGlobalLoading] = useState(true);
  const [globalError, setGlobalError] = useState(null);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setGlobalLoading(true);
        setGlobalError(null);
        const [budgetRes, configRes] = await Promise.all([
          getBudgetSettings(),
          getSettings()
        ]);
        setDailyBudget(budgetRes.data.daily_budget);
        setRatePerUnit(configRes.data.rate_per_unit);
      } catch (err) {
        setGlobalError(err?.response?.data?.error || 'Failed to load data. Check that the backend is running.');
      } finally {
        setGlobalLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      await Promise.all([
        updateBudget(Number(dailyBudget)),
        updateSettings(Number(ratePerUnit))
      ]);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err?.response?.data?.error || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (globalLoading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex-1">
        <div className="flex items-center justify-center h-40">
          <Loader className="w-5 h-5 text-slate-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (globalError) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex-1">
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-sm">{globalError}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex-1">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Budget & Rate Settings</h2>

      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Daily Budget (&#8377;)</label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="number"
              value={dailyBudget}
              onChange={(e) => setDailyBudget(e.target.value)}
              className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Rate per kWh (&#8377;)</label>
          <div className="relative">
            <Zap className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="number"
              value={ratePerUnit}
              onChange={(e) => setRatePerUnit(e.target.value)}
              className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
        </div>
      </div>

      <div className="mt-6">
        {saveSuccess ? (
          <div className="w-full flex items-center justify-center gap-2 text-green-600 text-sm font-medium h-[38px]">
            <Check className="w-4 h-4" />
            <span>Settings saved</span>
          </div>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-slate-800 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 h-[38px]"
          >
            {saving ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        )}
      </div>

      {saveError && (
        <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-sm">{saveError}</span>
        </div>
      )}
    </div>
  );
}

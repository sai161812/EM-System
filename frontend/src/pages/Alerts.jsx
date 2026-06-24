import React, { useState, useEffect } from 'react';
import { Loader, AlertCircle } from 'lucide-react';
import BudgetStatus from '../components/BudgetStatus';
import BudgetAlertHistory from '../components/BudgetAlertHistory';
import { getCostSummary } from '../api';

export default function Alerts() {
  const [costData, setCostData] = useState(null);
  const [costLoading, setCostLoading] = useState(true);
  const [costError, setCostError] = useState(null);

  useEffect(() => {
    const fetchCost = async () => {
      try {
        setCostLoading(true);
        setCostError(null);
        const res = await getCostSummary();
        setCostData(res.data);
      } catch (err) {
        setCostError(err?.response?.data?.error || 'Failed to load cost data.');
      } finally {
        setCostLoading(false);
      }
    };
    fetchCost();

    // Re-fetch on system refresh
    const handleSystemRefresh = () => fetchCost();
    window.addEventListener('refresh-system', handleSystemRefresh);
    return () => window.removeEventListener('refresh-system', handleSystemRefresh);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Budget Alerts</h1>

      <div className="flex gap-6 mt-6">
        {/* Live budget status */}
        <div className="flex-1 flex flex-col">
          <BudgetStatus />
        </div>

        {/* Cost Overview — moved from Settings page (Section 3 restructuring) */}
        <div className="flex-1 flex flex-col">
          {costLoading ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex-1">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Cost Overview</h2>
              <div className="flex items-center justify-center h-40">
                <Loader className="w-5 h-5 text-slate-400 animate-spin" />
              </div>
            </div>
          ) : costError ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex-1">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Cost Overview</h2>
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="text-sm">{costError}</span>
              </div>
            </div>
          ) : costData && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex-1">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Cost Overview</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Today's Cost</div>
                  <div className="text-xl font-semibold text-slate-900">&#8377;{(costData.today_cost ?? 0).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Month Cost</div>
                  <div className="text-xl font-semibold text-slate-900">&#8377;{(costData.month_cost ?? 0).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Projected Bill</div>
                  <div className="text-xl font-semibold text-slate-900">&#8377;{(costData.projected_month_cost ?? 0).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Rate per Unit</div>
                  <div className="text-xl font-semibold text-slate-900">&#8377;{(costData.rate_per_unit ?? 0).toFixed(2)} / kWh</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="w-full">
        <BudgetAlertHistory />
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Loader, AlertCircle } from 'lucide-react';
import InsightsPanel from '../components/InsightsPanel';
import { getCostSummary } from '../api';

export default function Settings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getCostSummary();
        setData(res.data);
      } catch (err) {
        setError(err?.response?.data?.error || 'Failed to load data. Check that the backend is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-8 h-full flex flex-col">
      <h1 className="text-2xl font-semibold text-slate-900">Insights & Overview</h1>
      
      <div className="flex gap-6 mt-6">
        <div className="flex-[3]">
          <InsightsPanel />
        </div>
        
        <div className="flex-[2]">
          {loading ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Cost Overview</h2>
              <div className="flex items-center justify-center h-40">
                <Loader className="w-5 h-5 text-slate-400 animate-spin" />
              </div>
            </div>
          ) : error ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Cost Overview</h2>
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          ) : data && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Cost Overview</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Today's Cost</div>
                  <div className="text-xl font-semibold text-slate-900">&#8377;{data.today_cost.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Month Cost</div>
                  <div className="text-xl font-semibold text-slate-900">&#8377;{data.month_cost.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Projected Bill</div>
                  <div className="text-xl font-semibold text-slate-900">&#8377;{data.projected_month_cost.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Rate per Unit</div>
                  <div className="text-xl font-semibold text-slate-900">&#8377;{data.rate_per_unit.toFixed(2)} / kWh</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

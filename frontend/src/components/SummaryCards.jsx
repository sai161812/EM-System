import React, { useState, useEffect } from 'react';
import { Zap, IndianRupee, TrendingUp, AlertTriangle, Loader, AlertCircle } from 'lucide-react';
import { getEnergySummary, getCostSummary, getRecentAnomalies } from '../api';

export default function SummaryCards() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [energyRes, costRes, anomaliesRes] = await Promise.all([
          getEnergySummary(),
          getCostSummary(),
          getRecentAnomalies(100)
        ]);

        setData({
          summary: energyRes.data,
          cost: costRes.data,
          anomalies: anomaliesRes.data
        });
      } catch (err) {
        setError(err?.response?.data?.error || 'Failed to load data. Check that the backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Re-fetch when Refresh System button fires this event
    const handleSystemRefresh = () => fetchData();
    window.addEventListener('refresh-system', handleSystemRefresh);
    return () => window.removeEventListener('refresh-system', handleSystemRefresh);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader className="w-5 h-5 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  if (!data) return null;

  const { summary, cost, anomalies } = data;
  const anomalyCount = anomalies.length;

  return (
    <div className="grid grid-cols-4 gap-6">
      {/* Card 1 */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-start">
          <span className="text-sm text-slate-500">Total Consumption</span>
          <Zap className="w-[18px] h-[18px] text-slate-400" />
        </div>
        <div className="text-2xl font-semibold text-slate-900 mt-2">
          {summary.total_kwh.toFixed(2)} kWh
        </div>
        <div className="text-xs text-slate-400 mt-1">Last 30 days</div>
      </div>

      {/* Card 2 */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-start">
          <span className="text-sm text-slate-500">Today's Cost</span>
          <IndianRupee className="w-[18px] h-[18px] text-slate-400" />
        </div>
        <div className="text-2xl font-semibold text-slate-900 mt-2">
          &#8377;{cost.today_cost.toFixed(2)}
        </div>
        <div className="text-xs text-slate-400 mt-1">Based on current rate</div>
      </div>

      {/* Card 3 */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-start">
          <span className="text-sm text-slate-500">Projected Bill</span>
          <TrendingUp className="w-[18px] h-[18px] text-slate-400" />
        </div>
        <div className="text-2xl font-semibold text-slate-900 mt-2">
          &#8377;{cost.projected_month_cost.toFixed(2)}
        </div>
        <div className="text-xs text-slate-400 mt-1">End of month estimate</div>
      </div>

      {/* Card 4 */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-start">
          <span className="text-sm text-slate-500">Active Anomalies</span>
          <AlertTriangle className={`w-[18px] h-[18px] ${anomalyCount > 0 ? 'text-red-400' : 'text-green-400'}`} />
        </div>
        <div className={`text-2xl font-semibold mt-2 ${anomalyCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
          {anomalyCount}
        </div>
        <div className="text-xs text-slate-400 mt-1">Detected this month</div>
      </div>
    </div>
  );
}

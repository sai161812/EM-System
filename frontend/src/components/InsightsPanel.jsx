import React, { useState, useEffect } from 'react';
import { Loader, AlertCircle, ArrowUpDown, Calendar, CalendarDays, TrendingDown, TrendingUp, Zap, AlertTriangle, InboxIcon, Info } from 'lucide-react';
import { getInsights } from '../api';

const ICON_MAP = {
  'VS_YESTERDAY': ArrowUpDown,
  'VS_7DAY_AVG': Calendar,
  'VS_30DAY_AVG': CalendarDays,
  'WORST_DAY_WEEK': TrendingDown,
  'BEST_DAY_WEEK': TrendingUp,
  'PEAK_HOUR_TODAY': Zap,
  'ANOMALY_SUMMARY': AlertTriangle
};

export default function InsightsPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getInsights();
        setData(res.data);
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
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Consumption Insights</h2>
        <div className="flex items-center justify-center h-40">
          <Loader className="w-5 h-5 text-slate-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Consumption Insights</h2>
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  if (!data || !data.insights || data.insights.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Consumption Insights</h2>
        <div className="flex flex-col items-center justify-center h-40 text-slate-400">
          <InboxIcon className="w-8 h-8 mb-2" />
          <span className="text-sm">No insights available</span>
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full">
      <div className="flex justify-between items-baseline mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Consumption Insights</h2>
        <span className="text-sm text-slate-500">{today}</span>
      </div>

      <div className="flex flex-col">
        {data.insights.map((insight, idx) => {
          const Icon = ICON_MAP[insight.type] || Info;
          const isAnomaly = insight.type === 'ANOMALY_SUMMARY';
          
          let valueClass = 'text-slate-500 font-semibold text-sm';
          let valuePrefix = '';
          let valueSuffix = isAnomaly ? '' : '%';
          
          if (!isAnomaly) {
            if (insight.value > 0) {
              valueClass = 'text-red-600 font-semibold text-sm';
              valuePrefix = '+';
            } else if (insight.value < 0) {
              valueClass = 'text-green-600 font-semibold text-sm';
            }
          } else {
            valueClass = 'text-slate-800 font-semibold text-sm';
          }

          return (
            <div key={idx} className="flex items-center gap-4 py-4 border-b border-slate-100 last:border-0 last:pb-0">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-slate-600" />
              </div>
              <div className="text-sm text-slate-700 flex-1">
                {insight.message}
              </div>
              <div className={valueClass}>
                {insight.value === 0 && !isAnomaly ? '0%' : (
                  <span>{valuePrefix}{isAnomaly ? insight.value : insight.value.toFixed(1)}{valueSuffix}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

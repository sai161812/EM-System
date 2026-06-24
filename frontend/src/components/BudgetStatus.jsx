import React, { useState, useEffect } from 'react';
import { Loader, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { getBudgetStatus } from '../api';
import { getStageStyles } from '../utils/stageStyles';

export default function BudgetStatus() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let intervalId;

    const fetchData = async (isInitial = false) => {
      try {
        if (isInitial) setLoading(true);
        setError(null);
        const res = await getBudgetStatus();
        setData(res.data);
      } catch (err) {
        setError(err?.response?.data?.error || 'Failed to load data. Check that the backend is running.');
      } finally {
        if (isInitial) setLoading(false);
      }
    };

    fetchData(true);
    intervalId = setInterval(() => fetchData(false), 30000);

    // Re-fetch when Refresh System button fires this event
    const handleSystemRefresh = () => fetchData(false);
    window.addEventListener('refresh-system', handleSystemRefresh);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('refresh-system', handleSystemRefresh);
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex-1">
        <div className="flex items-center justify-center h-40">
          <Loader className="w-5 h-5 text-slate-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex-1">
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // BUG-09: Provide safe defaults so .toFixed() never crashes on null fields
  const {
    stage = 0,
    amount_used = 0,
    daily_budget = 0,
    percent_used = 0,
    message,
    contributing_anomaly,
    last_updated,
  } = data;

  const styles = getStageStyles(stage);
  // Normalize backend timestamp 'YYYY-MM-DD HH:MM:SS' to ISO format for cross-browser safety
  const normalizedTime = last_updated ? last_updated.replace(' ', 'T') : null;
  const formattedTime = normalizedTime
    ? new Date(normalizedTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Today's Budget Status</h2>
          <div className="text-xs text-slate-400 mt-1">Last updated {formattedTime}</div>
        </div>
        <div className={`rounded-full px-4 py-1.5 text-sm font-semibold ${styles.badge}`}>
          {styles.text}
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-3xl font-semibold text-slate-900">&#8377;{amount_used.toFixed(2)}</span>
        <span className="text-lg text-slate-400">/ &#8377;{daily_budget.toFixed(2)}</span>
      </div>

      <div className="w-full bg-slate-100 rounded-full h-2 mt-4 relative">
        <div
          className={`absolute left-0 top-0 h-full rounded-full ${styles.bar}`}
          style={{ width: `${Math.min(percent_used, 100)}%` }}
        ></div>
      </div>
      <div className="text-right mt-1">
        <span className="text-xs text-slate-500">{percent_used.toFixed(1)}% used</span>
      </div>

      {stage === 0 ? (
        <div className="mt-4 flex flex-col items-center justify-center py-4 bg-green-50 border border-green-100 rounded-lg">
          <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
          <span className="text-sm text-green-700">You are within your daily budget</span>
        </div>
      ) : (
        message && (
          <div className={`mt-4 p-3 rounded-lg border text-sm ${styles.alert}`}>
            {message}
          </div>
        )
      )}

      {contributing_anomaly && (
        <div className="mt-2 flex items-start gap-2 text-xs text-slate-500">
          <Info className="w-4 h-4 shrink-0" />
          <span>Anomaly affecting budget: {contributing_anomaly}</span>
        </div>
      )}
    </div>
  );
}

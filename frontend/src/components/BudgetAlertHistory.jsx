import React, { useState, useEffect } from 'react';
import { Loader, AlertCircle, InboxIcon } from 'lucide-react';
import { getBudgetAlertHistory } from '../api';
// LOGIC-03/05: Import shared utilities instead of duplicating them
import { formatDate } from '../utils/formatDate';
import { getStageStyles } from '../utils/stageStyles';

export default function BudgetAlertHistory() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getBudgetAlertHistory();
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
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Alert History</h2>
        <div className="flex items-center justify-center h-40">
          <Loader className="w-5 h-5 text-slate-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Alert History</h2>
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 mt-6 overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 m-0">Alert History</h2>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-slate-400">
          <InboxIcon className="w-8 h-8 mb-2" />
          <span className="text-sm">No budget alerts have been recorded yet</span>
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 bg-slate-50 border-b border-slate-200">Timestamp</th>
                <th className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 bg-slate-50 border-b border-slate-200">Stage</th>
                <th className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 bg-slate-50 border-b border-slate-200">Amount Used</th>
                <th className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 bg-slate-50 border-b border-slate-200">Daily Budget</th>
                <th className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 bg-slate-50 border-b border-slate-200">Overage</th>
                <th className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 bg-slate-50 border-b border-slate-200">Severity</th>
                <th className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 bg-slate-50 border-b border-slate-200">Message</th>
              </tr>
            </thead>
            <tbody>
              {data.map((alert, idx) => {
                const styles = getStageStyles(alert.stage);
                return (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100 whitespace-nowrap">
                      {formatDate(alert.timestamp)}
                    </td>
                    <td className="px-4 py-3 text-sm border-b border-slate-100 whitespace-nowrap">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles.badge}`}>
                        {styles.text}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100 whitespace-nowrap">
                      {/* BUG-08: Guard null amount_used */}
                      &#8377;{(alert.amount_used ?? 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100 whitespace-nowrap">
                      {/* BUG-08: Guard null daily_budget */}
                      &#8377;{(alert.daily_budget ?? 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm border-b border-slate-100 whitespace-nowrap">
                      {alert.overage ? (
                        <span className="text-red-600">&#8377;{alert.overage.toFixed(2)}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    {/* CONTRACT-06: Show the severity field from backend */}
                    <td className="px-4 py-3 text-sm border-b border-slate-100 whitespace-nowrap">
                      {alert.severity ? (
                        <span className="font-mono text-xs text-slate-600">{alert.severity}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100">
                      <div className="max-w-xs truncate" title={alert.message}>
                        {alert.message}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

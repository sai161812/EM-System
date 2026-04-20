import React, { useState, useEffect } from 'react';
import { Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { getRecentAnomalies } from '../api';
import { Link } from 'react-router-dom';
// LOGIC-03/04: Import shared utilities instead of duplicating them
import { formatDate } from '../utils/formatDate';
import { getSeverityStyles } from '../utils/severityStyles';

export default function AnomalyFeed() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let intervalId;

    const fetchData = async (isInitial = false) => {
      try {
        if (isInitial) setLoading(true);
        setError(null);
        const res = await getRecentAnomalies(5);
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Recent Anomalies</h2>
        </div>
        <div className="flex items-center justify-center h-40">
          <Loader className="w-5 h-5 text-slate-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex-1">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Recent Anomalies</h2>
        </div>
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex-1">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Recent Anomalies</h2>
        <Link to="/history" className="text-sm text-slate-500 hover:text-slate-800">
          View All
        </Link>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-slate-400">
          <CheckCircle className="w-8 h-8 mb-2 text-green-500" />
          <span className="text-sm">No anomalies detected</span>
        </div>
      ) : (
        <div className="flex flex-col">
          {data.map((anomaly, idx) => {
            const styles = getSeverityStyles(anomaly.severity);
            return (
              <div key={anomaly.id || idx} className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${styles.dot}`}></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-xs text-slate-500">{anomaly.rule_triggered}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles.badgeStr}`}>
                      {anomaly.severity}
                    </span>
                  </div>
                  <div className="text-sm text-slate-700">{anomaly.explanation}</div>
                </div>
                <div className="text-xs text-slate-400 whitespace-nowrap">
                  {formatDate(anomaly.timestamp)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

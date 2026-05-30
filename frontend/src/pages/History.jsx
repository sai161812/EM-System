import React, { useState, useEffect, useMemo } from 'react';
import { Loader, AlertCircle, InboxIcon } from 'lucide-react';
import { getAllAnomalies } from '../api';

export default function History() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filterSeverity, setFilterSeverity] = useState('All');
  const [filterRule, setFilterRule] = useState('All');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getAllAnomalies();
        setData(res.data);
      } catch (err) {
        setError(err?.response?.data?.error || 'Failed to load data. Check that the backend is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const clearFilters = () => {
    setFilterSeverity('All');
    setFilterRule('All');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterSeverity !== 'All') count++;
    if (filterRule !== 'All') count++;
    if (filterDateFrom) count++;
    if (filterDateTo) count++;
    return count;
  }, [filterSeverity, filterRule, filterDateFrom, filterDateTo]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (filterSeverity !== 'All' && item.severity !== filterSeverity) return false;
      if (filterRule !== 'All' && item.rule_triggered !== filterRule) return false;
      
      if (filterDateFrom) {
        const itemDate = new Date(item.timestamp).getTime();
        const fromDate = new Date(filterDateFrom).getTime();
        if (itemDate < fromDate) return false;
      }
      
      if (filterDateTo) {
        const itemDate = new Date(item.timestamp).getTime();
        const toDate = new Date(filterDateTo);
        toDate.setHours(23, 59, 59, 999);
        if (itemDate > toDate.getTime()) return false;
      }
      
      return true;
    });
  }, [data, filterSeverity, filterRule, filterDateFrom, filterDateTo]);

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-red-100 text-red-700';
      case 'MEDIUM':
        return 'bg-orange-100 text-orange-700';
      case 'LOW':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const formatDate = (dateStr) => {
    // Backend returns 'YYYY-MM-DD HH:MM:SS' — replace space with T for ISO 8601 compatibility
    const normalized = dateStr.replace(' ', 'T');
    const d = new Date(normalized);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-semibold text-slate-900 m-0">Anomaly History</h1>
        {activeFiltersCount > 0 && (
          <div className="bg-slate-800 text-white rounded-full px-2 py-0.5 text-xs">
            {activeFiltersCount} active
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-6 flex items-end gap-4 flex-wrap">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Severity</label>
          <select 
            value={filterSeverity} 
            onChange={e => setFilterSeverity(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 min-w-[150px]"
          >
            <option value="All">All</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Rule</label>
          <select 
            value={filterRule} 
            onChange={e => setFilterRule(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 min-w-[150px]"
          >
            <option value="All">All</option>
            <option value="SPIKE">SPIKE</option>
            <option value="INACTIVE_HOUR">INACTIVE_HOUR</option>
            <option value="SUSTAINED_OVERLOAD">SUSTAINED_OVERLOAD</option>
            <option value="DROPOUT">DROPOUT</option>
            <option value="WEEKEND_SURGE">WEEKEND_SURGE</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Date From</label>
          <input 
            type="date" 
            value={filterDateFrom}
            onChange={e => setFilterDateFrom(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Date To</label>
          <input 
            type="date" 
            value={filterDateTo}
            onChange={e => setFilterDateTo(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>

        <button 
          onClick={clearFilters}
          className="border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors h-[38px] ml-auto lg:ml-0"
        >
          Clear Filters
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mt-6 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader className="w-5 h-5 text-slate-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-slate-200 bg-slate-50/50">
              <span className="text-sm text-slate-500">{filteredData.length} of {data.length} anomalies</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 bg-slate-50 border-b border-slate-200">Timestamp</th>
                    <th className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 bg-slate-50 border-b border-slate-200">Rule</th>
                    <th className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 bg-slate-50 border-b border-slate-200">Consumption</th>
                    <th className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 bg-slate-50 border-b border-slate-200">Severity</th>
                    <th className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 bg-slate-50 border-b border-slate-200">Explanation</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-0 border-0">
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                          <InboxIcon className="w-8 h-8 mb-2" />
                          <span className="text-sm">No anomalies match the selected filters</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100 whitespace-nowrap">
                          {formatDate(item.timestamp)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100">
                          <span className="font-mono text-xs">{item.rule_triggered}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100 whitespace-nowrap">
                          {item.consumption_kwh.toFixed(2)} kWh
                        </td>
                        <td className="px-4 py-3 text-sm border-b border-slate-100 whitespace-nowrap">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getSeverityStyles(item.severity)}`}>
                            {item.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100">
                          <div className="max-w-xs truncate cursor-help" title={item.explanation}>
                            {item.explanation}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

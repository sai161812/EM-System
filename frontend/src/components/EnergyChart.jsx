import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceDot } from 'recharts';
import { Loader, AlertCircle } from 'lucide-react';
import { getHourlyData, getDailyData, getAllAnomalies } from '../api';

export default function EnergyChart() {
  const [activeTab, setActiveTab] = useState('Today'); // Today, This Week, This Month
  const [data, setData] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const now = new Date();
        const apiDate = now.toISOString().split('T')[0];
        const apiMonth = apiDate.substring(0, 7);

        let chartData = [];
        let anomalyData = [];

        if (activeTab === 'Today') {
          const [hourlyRes, anomalyRes] = await Promise.all([
            getHourlyData(apiDate),
            getAllAnomalies()
          ]);
          
          chartData = hourlyRes.data.map(d => ({
            ...d,
            hourLabel: (() => {
              const hour = parseInt(d.timestamp.split(' ')[1].split(':')[0]);
              const ampm = hour >= 12 ? 'PM' : 'AM';
              const display = hour % 12 || 12;
              return `${display} ${ampm}`;
            })()
          }));

          const todayAnomalies = anomalyRes.data.filter(a => a.timestamp.startsWith(apiDate));
          anomalyData = todayAnomalies.map(a => {
            const dateObj = new Date(a.timestamp);
            return {
              x: (() => {
                const hour = parseInt(a.timestamp.split(' ')[1].split(':')[0]);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const display = hour % 12 || 12;
                return `${display} ${ampm}`;
              })(),
              y: a.consumption_kwh,
              timestamp: a.timestamp
            };
          });

        } else if (activeTab === 'This Week') {
          const res = await getDailyData(apiMonth);
          const currentDay = now.getDay() === 0 ? 7 : now.getDay(); 
          const currentWeekMonday = new Date(now);
          currentWeekMonday.setDate(now.getDate() - currentDay + 1);
          
          chartData = res.data.filter(d => {
            const dataDate = new Date(d.date+ 'T00:00:00');
            return dataDate >= currentWeekMonday && dataDate <= now;
          }).map(d => ({
            ...d,
            dayLabel: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })
          }));

        } else if (activeTab === 'This Month') {
          const res = await getDailyData(apiMonth);
          chartData = res.data.map(d => ({
            ...d,
            dayLabel: new Date(d.date).getDate().toString()
          }));
        }

        setData(chartData);
        setAnomalies(anomalyData);
      } catch (err) {
        setError(err?.response?.data?.error || 'Failed to load chart data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Energy Consumption</h2>
        <div className="flex gap-2">
          {['Today', 'This Week', 'This Month'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={tab === activeTab 
                ? "bg-slate-800 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-700 transition-colors"
                : "border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              }
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[300px]">
          <Loader className="w-5 h-5 text-slate-400 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      ) : (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === 'Today' ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="hourLabel" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={val => val.toFixed(1)} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }} 
                  labelStyle={{ color: '#0f172a', fontWeight: 500, marginBottom: '4px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="consumption_kwh"
                  stroke="#1e293b" 
                  strokeWidth={2} 
                  dot={false} 
                  activeDot={{ r: 4, fill: '#1e293b' }} 
                />
                {anomalies.map((a, i) => (
                  <ReferenceDot key={i} x={a.x} y={a.y} r={4} fill="#dc2626" stroke="#ffffff" strokeWidth={1} />
                ))}
              </LineChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="dayLabel" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={val => val.toFixed(1)} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
                  labelStyle={{ color: '#0f172a', fontWeight: 500, marginBottom: '4px' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar 
                  dataKey="total_kwh"
                  fill="#1e293b" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={40}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

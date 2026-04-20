import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Zap, LayoutDashboard, History, Bell, Settings, RefreshCw, Loader, Check, AlertCircle } from 'lucide-react';
import { refreshSystem } from '../api';

export default function Sidebar() {
  const location = useLocation();
  const [refreshState, setRefreshState] = useState('idle'); // idle, loading, success, error

  const handleRefresh = async () => {
    try {
      setRefreshState('loading');
      await refreshSystem();
      setRefreshState('success');
      // Notify all components to re-fetch their data
      window.dispatchEvent(new CustomEvent('refresh-system'));
      setTimeout(() => setRefreshState('idle'), 2000);
    } catch {
      setRefreshState('error');
      setTimeout(() => setRefreshState('idle'), 2000);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'History', path: '/history', icon: History },
    { name: 'Alerts', path: '/alerts', icon: Bell },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="w-56 min-h-screen bg-white border-r border-slate-200 flex flex-col shrink-0">
      <div className="p-6 border-b border-slate-200 flex items-center gap-2">
        <Zap className="w-4 h-4 text-slate-800" />
        <span className="text-base font-semibold text-slate-900">EnergyIQ</span>
      </div>

      <nav className="flex-1 p-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive 
                  ? 'bg-slate-100 text-slate-900 font-medium' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <button
          onClick={handleRefresh}
          disabled={refreshState === 'loading'}
          title={refreshState === 'error' ? 'Refresh failed. Check backend connection.' : 'Refresh all system data'}
          className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {refreshState === 'loading' && <Loader className="w-4 h-4 animate-spin" />}
          {refreshState === 'success' && <Check className="w-4 h-4 text-green-600" />}
          {refreshState === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
          {refreshState === 'idle' && <RefreshCw className="w-4 h-4" />}
          Refresh System
        </button>
        {/* EDGE-10: Show a visible error message on refresh failure */}
        {refreshState === 'error' && (
          <p className="text-xs text-red-500 text-center mt-2">Refresh failed. Check backend connection.</p>
        )}
      </div>
    </div>
  );
}

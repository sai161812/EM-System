import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Zap, LayoutDashboard, History, Bell, Settings, RefreshCw } from 'lucide-react'
import { refreshSystem } from '../api'

const navItems = [
  { to: '/',         label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/history',  label: 'History',   icon: History },
  { to: '/alerts',   label: 'Alerts',    icon: Bell },
  { to: '/settings', label: 'Settings',  icon: Settings },
]

export default function Sidebar({ open, onToggle, width = 256, transition }) {
  const [refreshing, setRefreshing] = useState(false)

  async function handleRefresh() {
    setRefreshing(true)
    try { await refreshSystem() } catch { /* silent */ }
    finally { setRefreshing(false) }
  }

  return (
    <aside
      style={{
        width: `${width}px`,
        transform: open ? 'translateX(0)' : `translateX(-${width}px)`,
        transition: `transform ${transition}`,
        willChange: 'transform',
      }}
      className="fixed top-0 left-0 h-full bg-white border-r border-slate-200 flex flex-col z-20 shadow-sm"
    >
      {/* ── Brand header ─────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0">
          <Zap size={15} className="text-white" />
        </div>
        <span className="font-semibold text-slate-900 text-[15px] tracking-tight">
          EnergyIQ
        </span>
      </div>

      {/* ── Navigation ───────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }, i) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `animate-slide-in-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
               transition-all duration-200 group ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`
            }
            style={{ animationDelay: `${i * 45}ms` }}
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={17}
                  className={`flex-shrink-0 transition-transform duration-200 ${
                    !isActive ? 'group-hover:scale-110' : ''
                  }`}
                />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Footer: refresh ──────────────────────────────── */}
      <div className="px-3 pb-5 pt-2 border-t border-slate-100">
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-700
                     rounded-xl px-4 py-2.5 text-sm font-medium mt-3
                     hover:bg-slate-200 disabled:opacity-60
                     transition-all duration-200 active:scale-[0.98]"
        >
          <RefreshCw
            size={14}
            className={`transition-transform duration-300 ${refreshing ? 'animate-spin' : ''}`}
          />
          {refreshing ? 'Refreshing…' : 'Refresh System'}
        </button>
      </div>
    </aside>
  )
}

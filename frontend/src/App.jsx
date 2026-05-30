import { useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import Alerts from './pages/Alerts'
import Settings from './pages/Settings'

// Sidebar width in px — must match Sidebar component
const SIDEBAR_W = 256

/**
 * Wraps routes so each pathname change re-mounts with a fresh
 * animate-page-enter animation.
 */
function AnimatedRoutes() {
  const location = useLocation()
  return (
    <div key={location.pathname} className="animate-page-enter">
      <Routes location={location}>
        <Route path="/"         element={<Dashboard />} />
        <Route path="/history"  element={<History />} />
        <Route path="/alerts"   element={<Alerts />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  )
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Both sidebar (translateX) and main (marginLeft) use the EXACT same
  // duration + easing so they stay perfectly in sync.
  const TRANSITION = 'cubic-bezier(0.4, 0, 0.2, 1) 300ms'

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#f8fafc]">

        <Sidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen(p => !p)}
          width={SIDEBAR_W}
          transition={TRANSITION}
        />

        {/* Mobile backdrop — tap to close */}
        {sidebarOpen && (
          <div
            className="sidebar-overlay lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main
          style={{
            marginLeft: sidebarOpen ? `${SIDEBAR_W}px` : '0px',
            transition: `margin-left ${TRANSITION}`,
          }}
          className="min-h-screen flex flex-col"
        >
          {/* ── Sticky top bar ───────────────────────────────── */}
          <header className="sticky top-0 z-10 flex items-center gap-3 px-6 py-3 bg-[#f8fafc]/90 backdrop-blur-sm border-b border-slate-200/70">
            <button
              onClick={() => setSidebarOpen(p => !p)}
              aria-label="Toggle sidebar"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 transition-all duration-150"
            >
              <Menu size={20} />
            </button>
          </header>

          {/* ── Page content ─────────────────────────────────── */}
          <div className="flex-1 px-6 py-7 lg:px-8 lg:py-8">
            <AnimatedRoutes />
          </div>
        </main>
      </div>
    </BrowserRouter>
  )
}

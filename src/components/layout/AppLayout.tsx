import { AnimatePresence, motion } from 'framer-motion'
import { Rocket, Settings } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAppStore } from '../../app/store'
import { cn } from '../../lib/cn'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/wizard', label: 'Wizard' },
]

export function AppLayout() {
  const location = useLocation()
  const { state } = useAppStore()

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(56,189,248,0.08),transparent_32%),radial-gradient(circle_at_90%_80%,rgba(52,211,153,0.07),transparent_28%)]" />

      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-brand-900/60 p-2 text-brand-300">
              <Rocket size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide">Momentum</p>
              <p className="text-xs text-slate-400">Coach-mode project execution</p>
            </div>
          </div>

          <nav className="flex items-center gap-2" aria-label="Main">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'rounded-xl px-3 py-2 text-sm transition hover:bg-slate-800/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300',
                    isActive ? 'bg-slate-800 text-white' : 'text-slate-300',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            {state.activeProjectId ? (
              <NavLink
                to={`/dashboard/${state.activeProjectId}`}
                className={({ isActive }) =>
                  cn(
                    'rounded-xl px-3 py-2 text-sm transition hover:bg-slate-800/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300',
                    isActive ? 'bg-slate-800 text-white' : 'text-slate-300',
                  )
                }
              >
                Dashboard
              </NavLink>
            ) : null}
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                cn(
                  'rounded-xl px-3 py-2 text-sm transition hover:bg-slate-800/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300',
                  isActive ? 'bg-slate-800 text-white' : 'text-slate-300',
                )
              }
              aria-label="Settings"
            >
              <Settings size={16} />
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

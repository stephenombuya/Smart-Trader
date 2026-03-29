import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { logoutUser } from '@/store/slices/authSlice'
import NotificationBell from '@/components/ui/NotificationBell'

const NAV = [
  { to: '/dashboard', icon: '⬡', label: 'Dashboard'  },
  { to: '/earnings',  icon: '▶', label: 'Watch Ads'  },
  { to: '/spin',      icon: '◎', label: 'Spin Wheel' },
  { to: '/tasks',     icon: '✓', label: 'Tasks'      },
  { to: '/referrals', icon: '⬡', label: 'My Team'   },
  { to: '/wallet',    icon: '$', label: 'Wallet'     },
  { to: '/profile',   icon: '○', label: 'Profile'   },
]

export default function AppLayout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user }  = useSelector(s => s.auth)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await dispatch(logoutUser())
    navigate('/login')
  }

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-surface-900 border-r border-slate-800">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-black font-black text-sm">E</div>
          <span className="font-display font-bold text-lg tracking-tight gradient-text">Smart Trader</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto no-scrollbar">
        {NAV.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <span className="w-5 text-center font-mono text-xs">{icon}</span>
            {label}
          </NavLink>
        ))}
        {user?.is_staff && (
          <NavLink to="/admin" className={({ isActive }) => `nav-link mt-4 ${isActive ? 'active' : ''}`}>
            <span className="w-5 text-center font-mono text-xs">⚙</span>
            Admin Panel
          </NavLink>
        )}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-sm shrink-0">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.full_name || user?.email}</p>
            <p className="text-xs text-brand-400 font-mono">KES {parseFloat(user?.wallet_balance || 0).toFixed(2)}</p>
          </div>
          <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors text-xs" title="Logout">
            ⏻
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-surface-950">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-60 lg:flex-col shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 w-64 z-50 flex flex-col lg:hidden"
            >
              <Sidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 border-b border-slate-800 bg-surface-900/80 backdrop-blur flex items-center px-4 gap-4 shrink-0">
          <button
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setMobileOpen(true)}
          >
            ☰
          </button>
          <div className="flex-1" />
          <NotificationBell />
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}

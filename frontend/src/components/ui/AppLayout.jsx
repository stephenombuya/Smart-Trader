import { useLocation, Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { useMemo, useState, useEffect } from 'react'
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
  const location = useLocation()

  const initials = useMemo(() => {
    return user?.full_name
      ? user.full_name
          .split(' ')
          .map(n => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : user?.email?.[0]?.toUpperCase() || 'U'
  }, [user])

  // const greeting = useMemo(() => {
  //   const hour = new Date().getHours()

  //   if (hour >= 5 && hour < 12) return 'Good Morning'
  //   if (hour >= 12 && hour < 17) return 'Good Afternoon'
  //   if (hour >= 17 && hour < 21) return 'Good Evening'
  //   return 'Good Night'
  // }, [])

  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours()
      if (hour >= 5 && hour < 12) setGreeting('Good Morning')
      else if (hour >= 12 && hour < 17) setGreeting('Good Afternoon')
      else if (hour >= 17 && hour < 21) setGreeting('Good Evening')
      else setGreeting('Good Night')
    }

    updateGreeting()
    const interval = setInterval(updateGreeting, 60 * 1000) // update every minute
    return () => clearInterval(interval)
  }, [])


  const handleLogout = async () => {
    await dispatch(logoutUser())
    navigate('/login')
  }

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-surface-900 border-r border-slate-800">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-black font-black text-sm">ST</div>
          <span className="font-display font-bold text-lg tracking-tight gradient-text">Smart Trader</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto no-scrollbar">
        {NAV.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `nav-link group flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200
              ${isActive 
                ? 'bg-brand-500/10 text-brand-400' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}`
            }
            onClick={() => setMobileOpen(false)}
          >
            <span className="w-5 text-center text-sm transition-transform duration-200 group-hover:scale-110">
              {icon}
            </span>
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
        <div className="px-3 py-2 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-sm shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.full_name || user?.email}</p>
              <p className="text-xs text-brand-400 font-mono">KES {parseFloat(user?.wallet_balance || 0).toFixed(2)}</p>
            </div>
          </div>
          <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl 
                    bg-gradient-to-r from-red-500/10 to-red-600/10 
                    text-red-400 
                    hover:from-red-500/20 hover:to-red-600/20 
                    border border-red-500/20 
                    shadow-sm hover:shadow-md
                    transition-all duration-200 
                    text-sm font-semibold"
        >
          <span className="text-lg">⏻</span>
          Logout
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
          <div className="flex-1 flex items-center justify-end gap-4">
            <NotificationBell />

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-800 border border-slate-700">
              <div className="w-6 h-6 rounded-full bg-brand-500/20 flex items-center justify-center text-xs font-bold text-brand-400">
                {initials}
              </div>
              <span className="text-xs text-slate-300">{`${greeting}, ${user?.first_name || 'User'}`}</span>
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}

import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProfile, fetchWallet } from '@/store/slices/authSlice'
import { useNotificationSocket } from '@/hooks/useWebSocket'

// Layouts
import AppLayout   from '@/components/ui/AppLayout'
import AdminLayout from '@/components/ui/AdminLayout'

// Pages
import LandingPage      from '@/pages/LandingPage'
import LoginPage        from '@/pages/LoginPage'
import RegisterPage     from '@/pages/RegisterPage'
import VerifyEmailPage  from '@/pages/VerifyEmailPage'
import ForgotPassPage   from '@/pages/ForgotPassPage'
import ResetPassPage    from '@/pages/ResetPassPage'
import DashboardPage    from '@/pages/DashboardPage'
import EarningsPage     from '@/pages/EarningsPage'
import SpinWheelPage    from '@/pages/SpinWheelPage'
import TasksPage        from '@/pages/TasksPage'
import ReferralsPage    from '@/pages/ReferralsPage'
import ProfilePage      from '@/pages/ProfilePage'
import WalletPage       from '@/pages/WalletPage'
import AdminPage        from '@/pages/AdminPage'
import NotFoundPage     from '@/pages/NotFoundPage'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useSelector(s => s.auth)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { isAuthenticated, user } = useSelector(s => s.auth)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!user?.is_staff)  return <Navigate to="/dashboard" replace />
  return children
}

// Auth pages redirect logged-in users away
function PublicRoute({ children }) {
  const { isAuthenticated } = useSelector(s => s.auth)
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

// Landing page: always visible, but logged-in users skip to dashboard
function HomeRoute() {
  const { isAuthenticated } = useSelector(s => s.auth)
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />
}

export default function App() {
  const dispatch            = useDispatch()
  const { isAuthenticated } = useSelector(s => s.auth)

  useNotificationSocket(isAuthenticated)

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchProfile())
      dispatch(fetchWallet())
    }
  }, [isAuthenticated, dispatch])

  return (
    <Routes>
      {/* Landing page — public */}
      <Route path="/" element={<HomeRoute />} />

      {/* Auth pages — redirect if already logged in */}
      <Route path="/login"           element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register"        element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/verify-email"    element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPassPage />} />
      <Route path="/reset-password"  element={<ResetPassPage />} />

      {/* App — protected */}
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="earnings"  element={<EarningsPage />} />
        <Route path="spin"      element={<SpinWheelPage />} />
        <Route path="tasks"     element={<TasksPage />} />
        <Route path="referrals" element={<ReferralsPage />} />
        <Route path="wallet"    element={<WalletPage />} />
        <Route path="profile"   element={<ProfilePage />} />
      </Route>

      {/* Admin — staff only */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
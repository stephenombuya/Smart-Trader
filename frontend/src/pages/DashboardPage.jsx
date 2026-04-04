import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { fetchDashboard } from '@/store/slices/earningsSlice'
import { fetchReferralTree } from '@/store/slices/referralsSlice'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const item      = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

function StatCard({ label, value, sub, accent = 'green', icon }) {
  const colors = {
    green: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
    gold:  'text-gold-400  bg-gold-500/10  border-gold-500/20',
    blue:  'text-blue-400  bg-blue-500/10  border-blue-500/20',
    slate: 'text-slate-300 bg-slate-700/30 border-slate-700',
  }
  return (
    <motion.div variants={item} className="stat-card p-4 rounded-xl border border-slate-700 bg-surface-800 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <span className={`text-xl w-10 h-10 rounded-xl border flex items-center justify-center ${colors[accent]}`}>{icon}</span>
        <div>
          <p className="text-2xl font-display font-bold text-white">{value}</p>
          <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
      </div>
    </motion.div>
  )
}

// Mock chart data
const mockChartData = [
  { day: 'Mon', earned: 45, commissions: 12 },
  { day: 'Tue', earned: 82, commissions: 28 },
  { day: 'Wed', earned: 31, commissions: 8 },
  { day: 'Thu', earned: 120, commissions: 45 },
  { day: 'Fri', earned: 67, commissions: 22 },
  { day: 'Sat', earned: 150, commissions: 60 },
  { day: 'Sun', earned: 95, commissions: 35 },
]

const QUICK_ACTIONS = [
  { to: '/earnings', icon: '▶', label: 'Watch Ads',  desc: 'Earn per view',    accent: 'bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40' },
  { to: '/spin',     icon: '◎', label: 'Spin Wheel', desc: 'Daily free spin',  accent: 'bg-gold-500/10 border-gold-500/20 hover:border-gold-500/40' },
  { to: '/tasks',    icon: '✓', label: 'Do Tasks',   desc: 'Complete & earn', accent: 'bg-purple-500/10 border-purple-500/20 hover:border-purple-500/40' },
  { to: '/referrals',icon: '⬡', label: 'Refer Friends', desc: 'MLM commissions', accent: 'bg-brand-500/10 border-brand-500/20 hover:border-brand-500/40' },
]

export default function DashboardPage() {
  const dispatch  = useDispatch()
  const { user }  = useSelector(s => s.auth)
  const { dashboard } = useSelector(s => s.earnings)
  const { tree }  = useSelector(s => s.referrals)

  useEffect(() => {
    dispatch(fetchDashboard())
    dispatch(fetchReferralTree())
  }, [dispatch])

  const stats = dashboard || {}

  // Get user's initials
  const initials = useMemo(() => {
    if (!user) return 'U'
    if (user.full_name) return user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)
    return user.email?.[0]?.toUpperCase() || 'U'
  }, [user])

  // Greeting based on time
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return 'Good Morning 🌅'
    if (hour >= 12 && hour < 17) return 'Good Afternoon ☀️'
    if (hour >= 17 && hour < 21) return 'Good Evening 🌇'
    return 'Good Night 🌙'
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">
            {greeting}, {user?.first_name || 'User'}!
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Here's your earnings overview</p>
        </div>
        <Link to="/wallet" className="btn-primary text-sm px-4 py-2">Withdraw</Link>
      </div>

      {/* Stats grid */}
      <motion.div
        variants={container} initial="hidden" animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard icon="💰" label="Wallet Balance"  value={`KES ${parseFloat(stats.wallet_balance || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`} accent="green" />
        <StatCard icon="📈" label="Total Earned"    value={`KES ${parseFloat(stats.total_earned    || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`} accent="gold"  sub="All time" />
        <StatCard icon="⭐" label="Points"           value={(stats.points_balance || 0).toLocaleString()} sub="Redeemable" accent="blue" />
        <StatCard icon="👥" label="Team Size"        value={stats.downline_count || 0} sub="All levels" accent="slate" />
      </motion.div>

      {/* Chart + Quick actions */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Earnings chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="card lg:col-span-2 p-4 rounded-xl border border-slate-700 bg-surface-800 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-white">Earnings — Last 7 Days</h3>
            <span className="badge-green">
              Today: KES {parseFloat(stats.earnings_today || 0).toFixed(2)}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={mockChartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Area type="monotone" dataKey="earned" stroke="#22c55e" strokeWidth={2} fill="url(#earnGrad)" name="Earned" />
              <Area type="monotone" dataKey="commissions" stroke="#f59e0b" strokeWidth={2} fill="url(#commGrad)" name="Commissions" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-brand-400 rounded" /> Direct earnings</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-gold-400 rounded" /> Referral commissions</div>
          </div>
        </motion.div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="card p-4 rounded-xl border border-slate-700 bg-surface-800 shadow-sm"
        >
          <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {QUICK_ACTIONS.map(({ to, icon, label, desc, accent }) => (
              <Link
                key={to} to={to}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${accent}`}
              >
                <span className="text-lg">{icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Referral banner */}
      {tree && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="card bg-gradient-to-br from-brand-500/10 to-emerald-500/5 border border-brand-500/20 p-4 rounded-xl shadow-sm"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-1">Your Referral Link</h3>
              <p className="text-slate-400 text-sm">Share and earn commissions across 5 levels</p>
              <div className="mt-2 flex gap-2 items-center">
                <p className="font-mono text-xs text-brand-400 bg-brand-500/10 px-3 py-1.5 rounded-lg truncate">
                  {window.location.origin}/register?ref={user?.referral_code}
                </p>
                <button
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/register?ref=${user?.referral_code}`)}
                  className="text-xs text-white bg-slate-700/50 px-2 py-1 rounded hover:bg-slate-700/70 transition"
                >
                  Copy
                </button>
              </div>
            </div>
            <div className="flex gap-3 shrink-0">
              <div className="text-center">
                <p className="font-display font-bold text-2xl text-brand-400">{tree.team_stats?.total_team || 0}</p>
                <p className="text-xs text-slate-500">Team members</p>
              </div>
              <Link to="/referrals" className="btn-primary text-sm self-center">View Team</Link>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

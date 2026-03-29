import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { fetchTasks } from '@/store/slices/earningsSlice'
import { fetchProfile } from '@/store/slices/authSlice'
import { earningsAPI, usersAPI, adminAPI } from '@/utils/api'

// ─── TasksPage ───────────────────────────────────────────────────────────────
export function TasksPage() {
  const dispatch   = useDispatch()
  const { tasks }  = useSelector(s => s.earnings)
  const [submitting, setSubmitting] = useState(null)
  const [done, setDone]             = useState({})

  useEffect(() => { dispatch(fetchTasks()) }, [dispatch])

  const submit = async (taskId) => {
    setSubmitting(taskId)
    try {
      await earningsAPI.submitTask(taskId, {})
      setDone(d => ({ ...d, [taskId]: true }))
      toast.success('Task submitted for review!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed')
    } finally {
      setSubmitting(null)
    }
  }

  const typeIcon = { survey: '📝', signup: '🔗', social: '📣', download: '📲', custom: '⭐' }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-white">Complete Tasks</h1>
        <p className="text-slate-500 text-sm mt-0.5">Earn points and cash by completing partner tasks</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {tasks.map((task, i) => (
          <motion.div key={task.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className={`card transition-all ${task.is_completed_by_user || done[task.id] ? 'opacity-60' : 'hover:border-slate-700'}`}>
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl">{typeIcon[task.task_type] || '⭐'}</span>
              <div className="flex-1">
                <h4 className="font-semibold text-white">{task.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5 capitalize">{task.task_type.replace('_', ' ')}</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-4">{task.description}</p>
            <div className="flex items-center gap-2 mb-4">
              {task.reward_amount > 0 && <span className="badge-green">+KES {task.reward_amount}</span>}
              {task.reward_points > 0 && <span className="badge-gold">+{task.reward_points} pts</span>}
            </div>
            {task.action_url && (
              <a href={task.action_url} target="_blank" rel="noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 underline mb-3 block">
                Open task link ↗
              </a>
            )}
            {task.is_completed_by_user || done[task.id] ? (
              <div className="badge-green py-2 text-center w-full">✓ Submitted</div>
            ) : (
              <button onClick={() => submit(task.id)} disabled={submitting === task.id}
                className="btn-primary w-full text-sm">
                {submitting === task.id ? 'Submitting...' : 'Mark Complete'}
              </button>
            )}
          </motion.div>
        ))}
        {tasks.length === 0 && (
          <div className="col-span-full text-center py-16">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-slate-400 font-semibold">No tasks available right now</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── WalletPage ──────────────────────────────────────────────────────────────
export function WalletPage() {
  const { user }   = useSelector(s => s.auth)
  const [activity, setActivity] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()
  const dispatch = useDispatch()

  useEffect(() => {
    usersAPI.getActivity().then(r => setActivity(r.data.results || r.data)).finally(() => setLoading(false))
  }, [])

  const onWithdraw = async (data) => {
    try {
      await usersAPI.withdraw(data)
      toast.success('Withdrawal initiated! Check your M-Pesa.')
      setShowWithdraw(false)
      dispatch(fetchProfile())
    } catch (err) {
      toast.error(err.response?.data?.error || 'Withdrawal failed')
    }
  }

  const txnIcon = {
    ad_watch: '📺', spin_wheel: '🎰', task_completion: '✅',
    referral_commission: '💰', withdrawal: '💸', deposit: '⬆️', bonus: '🎁',
  }
  const txnColor = { completed: 'text-brand-400', pending: 'text-gold-400', failed: 'text-red-400' }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display font-bold text-2xl text-white">My Wallet</h1>

      {/* Balance card */}
      <div className="card bg-gradient-to-br from-brand-500/15 to-emerald-500/5 border-brand-500/20">
        <p className="text-slate-400 text-sm mb-1">Available Balance</p>
        <p className="font-display font-black text-4xl gradient-text">
          KES {parseFloat(user?.wallet_balance || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
        </p>
        <div className="flex gap-6 mt-4 text-sm">
          <div>
            <p className="text-slate-500">Total earned</p>
            <p className="font-semibold text-white">KES {parseFloat(user?.total_earned || 0).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-slate-500">Withdrawn</p>
            <p className="font-semibold text-white">KES {parseFloat(user?.total_withdrawn || 0).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-slate-500">Points</p>
            <p className="font-semibold text-white">{user?.points_balance || 0}</p>
          </div>
        </div>
        <button onClick={() => setShowWithdraw(true)} className="btn-primary mt-4">Withdraw via M-Pesa</button>
      </div>

      {/* Withdrawal form */}
      {showWithdraw && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="card border-gold-500/30">
          <h3 className="font-semibold text-white mb-4">Withdraw Funds</h3>
          <form onSubmit={handleSubmit(onWithdraw)} className="space-y-4">
            <div>
              <label className="label">M-Pesa Phone Number</label>
              <input {...register('phone', { required: 'Phone required' })}
                placeholder="0712345678" defaultValue={user?.phone} className="input" />
              {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="label">Amount (KES)</label>
              <input {...register('amount', { required: 'Amount required', min: { value: 100, message: 'Minimum KES 100' } })}
                type="number" placeholder="100" className="input" />
              {errors.amount && <p className="text-red-400 text-xs mt-1">{errors.amount.message}</p>}
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary flex-1">Confirm Withdrawal</button>
              <button type="button" onClick={() => setShowWithdraw(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Transaction history */}
      <div className="card">
        <h3 className="font-semibold text-white mb-4">Transaction History</h3>
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}
          </div>
        ) : activity.length === 0 ? (
          <p className="text-center text-slate-500 py-8">No transactions yet</p>
        ) : (
          <div className="space-y-1 divide-y divide-slate-800">
            {activity.map(txn => (
              <div key={txn.id} className="flex items-center gap-3 py-3">
                <span className="text-xl w-8 text-center">{txnIcon[txn.transaction_type] || '💳'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{txn.description || txn.transaction_type.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-slate-600">{new Date(txn.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-semibold ${txn.transaction_type === 'withdrawal' ? 'text-red-400' : 'text-brand-400'}`}>
                    {txn.transaction_type === 'withdrawal' ? '-' : '+'}KES {parseFloat(txn.amount).toFixed(2)}
                  </p>
                  <span className={`text-xs ${txnColor[txn.status] || 'text-slate-500'}`}>{txn.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── ProfilePage ─────────────────────────────────────────────────────────────
export function ProfilePage() {
  const dispatch = useDispatch()
  const { user } = useSelector(s => s.auth)
  const { register, handleSubmit, reset } = useForm()

  useEffect(() => { if (user) reset(user) }, [user, reset])

  const onSave = async (data) => {
    try {
      await usersAPI.updateProfile({ first_name: data.first_name, last_name: data.last_name, phone: data.phone })
      dispatch(fetchProfile())
      toast.success('Profile updated!')
    } catch {
      toast.error('Update failed')
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="font-display font-bold text-2xl text-white">Profile Settings</h1>
      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-2xl">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div>
            <p className="font-bold text-white text-lg">{user?.full_name}</p>
            <p className="text-slate-500 text-sm">{user?.email}</p>
            <p className="font-mono text-xs text-brand-400 mt-1">Code: {user?.referral_code}</p>
          </div>
        </div>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First name</label>
              <input {...register('first_name')} className="input" />
            </div>
            <div>
              <label className="label">Last name</label>
              <input {...register('last_name')} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input value={user?.email || ''} disabled className="input opacity-50 cursor-not-allowed" />
          </div>
          <div>
            <label className="label">Phone (M-Pesa)</label>
            <input {...register('phone')} placeholder="0712345678" className="input" />
          </div>
          <button type="submit" className="btn-primary">Save Changes</button>
        </form>
      </div>
    </div>
  )
}

// ─── AdminPage ───────────────────────────────────────────────────────────────
export function AdminPage() {
  const [dash, setDash] = useState(null)

  useEffect(() => {
    adminAPI.getDashboard().then(r => setDash(r.data))
  }, [])

  if (!dash) return <div className="skeleton h-64 rounded-2xl" />

  return (
    <div className="space-y-6">
      <h1 className="font-display font-bold text-2xl text-white">Admin Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users',    value: dash.users.total,          accent: 'text-white'       },
          { label: 'Verified',       value: dash.users.verified,       accent: 'text-brand-400'   },
          { label: 'New Today',      value: dash.users.new_today,      accent: 'text-gold-400'    },
          { label: 'Total Payouts',  value: `KES ${dash.financials.total_payouts?.toLocaleString()}`, accent: 'text-red-400' },
          { label: 'Commissions Paid', value: `KES ${dash.financials.total_commissions_paid?.toLocaleString()}`, accent: 'text-purple-400' },
          { label: 'Ad Rewards',     value: `KES ${dash.financials.total_ad_rewards?.toLocaleString()}`, accent: 'text-blue-400' },
          { label: 'Active Ads',     value: dash.platform.active_ads,  accent: 'text-white'       },
          { label: 'Pending Reviews',value: dash.platform.pending_task_reviews, accent: 'text-gold-400' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <p className={`text-2xl font-display font-bold ${s.accent}`}>{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Stub pages ───────────────────────────────────────────────────────────────
export function VerifyEmailPage()  {
  const [params] = [new URLSearchParams(window.location.search)]
  const [status, setStatus] = useState('verifying')
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token')
    if (!token) { setStatus('error'); return }
    import('@/utils/api').then(({ authAPI }) => {
      authAPI.verifyEmail({ token })
        .then(() => setStatus('success'))
        .catch(() => setStatus('error'))
    })
  }, [])
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950">
      <div className="text-center">
        {status === 'verifying' && <><p className="text-4xl mb-4">⏳</p><p className="text-white font-semibold">Verifying...</p></>}
        {status === 'success'   && <><p className="text-4xl mb-4">✅</p><p className="text-white font-semibold">Email verified!</p><a href="/login" className="btn-primary mt-4 inline-block">Sign In</a></>}
        {status === 'error'     && <><p className="text-4xl mb-4">❌</p><p className="text-white font-semibold">Invalid or expired token</p><a href="/register" className="btn-secondary mt-4 inline-block">Register again</a></>}
      </div>
    </div>
  )
}

export function ForgotPassPage() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit } = useForm()
  const onSubmit = async (d) => {
    await import('@/utils/api').then(({ authAPI }) => authAPI.forgotPassword(d))
    setSent(true)
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950 p-6">
      <div className="w-full max-w-sm">
        <h2 className="font-display font-bold text-2xl text-white mb-6">Reset Password</h2>
        {sent ? <p className="text-brand-400">Check your email for a reset link.</p> : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div><label className="label">Email</label><input {...register('email')} type="email" className="input" /></div>
            <button type="submit" className="btn-primary w-full">Send Reset Link</button>
          </form>
        )}
        <a href="/login" className="block text-center text-slate-500 text-sm mt-4 hover:text-white">← Back to login</a>
      </div>
    </div>
  )
}

export function ResetPassPage() {
  const { register, handleSubmit } = useForm()
  const [done, setDone] = useState(false)
  const token = new URLSearchParams(window.location.search).get('token')
  const onSubmit = async (d) => {
    await import('@/utils/api').then(({ authAPI }) => authAPI.resetPassword({ ...d, token }))
    setDone(true)
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950 p-6">
      <div className="w-full max-w-sm">
        <h2 className="font-display font-bold text-2xl text-white mb-6">New Password</h2>
        {done ? <><p className="text-brand-400 mb-4">Password reset! You can now log in.</p><a href="/login" className="btn-primary inline-block">Login</a></> : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div><label className="label">New Password</label><input {...register('new_password')} type="password" className="input" /></div>
            <button type="submit" className="btn-primary w-full">Reset Password</button>
          </form>
        )}
      </div>
    </div>
  )
}

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950">
      <div className="text-center">
        <p className="text-8xl font-display font-black text-slate-800 mb-4">404</p>
        <p className="text-white font-semibold text-xl mb-2">Page not found</p>
        <a href="/dashboard" className="btn-primary inline-block mt-4">Go Home</a>
      </div>
    </div>
  )
}

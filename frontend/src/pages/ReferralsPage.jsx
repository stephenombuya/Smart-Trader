import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { fetchReferralTree, fetchTeamPerformance } from '@/store/slices/referralsSlice'
import toast from 'react-hot-toast'

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => toast.success('Copied to clipboard!'))
}

function LevelBadge({ level }) {
  const colors = ['', 'badge-green', 'badge-gold', 'badge-blue', 'badge-slate', 'badge-slate']
  return <span className={colors[level] || 'badge-slate'}>Level {level}</span>
}

export default function ReferralsPage() {
  const dispatch = useDispatch()
  const { user } = useSelector(s => s.auth)
  const { tree, teamPerf } = useSelector(s => s.referrals)
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    dispatch(fetchReferralTree())
    dispatch(fetchTeamPerformance())
  }, [dispatch])

  const referralUrl = `${window.location.origin}/register?ref=${user?.referral_code}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-white">My Team & Referrals</h1>
        <p className="text-slate-500 text-sm mt-0.5">Earn commissions across 5 levels of your network</p>
      </div>

      {/* Referral link card */}
      <div className="card bg-gradient-to-br from-brand-500/10 to-transparent border-brand-500/20">
        <h3 className="font-semibold text-white mb-1">Your Referral Link</h3>
        <p className="text-slate-400 text-sm mb-4">Share this link to grow your team and earn commissions automatically</p>
        <div className="flex gap-2">
          <input
            readOnly
            value={referralUrl}
            className="input flex-1 font-mono text-sm text-brand-300 bg-brand-500/5"
          />
          <button onClick={() => copyToClipboard(referralUrl)} className="btn-primary shrink-0">Copy</button>
        </div>
        <div className="flex gap-3 mt-3">
          <span className="text-xs text-slate-500">Your code:</span>
          <span className="font-mono text-xs text-brand-400 font-bold">{user?.referral_code}</span>
          <button onClick={() => copyToClipboard(user?.referral_code)} className="text-xs text-slate-500 hover:text-white transition-colors">copy code</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-900 border border-slate-800 rounded-xl p-1 w-fit">
        {['overview', 'team', 'commissions'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              tab === t ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && teamPerf && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-card">
              <p className="text-2xl font-display font-bold gradient-text">{teamPerf.team_size}</p>
              <p className="text-xs text-slate-500">Total team members</p>
            </div>
            <div className="stat-card">
              <p className="text-2xl font-display font-bold gradient-text-gold">
                KES {parseFloat(teamPerf.total_commissions_all_time || 0).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">Lifetime commissions</p>
            </div>
          </div>

          {/* Level breakdown */}
          <div className="card">
            <h3 className="font-semibold text-white mb-5">Commission Levels (Last 30 Days)</h3>
            <div className="space-y-4">
              {(teamPerf.commissions_last_30_days || []).map(lvl => (
                <div key={lvl.level}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <LevelBadge level={lvl.level} />
                      <span className="text-sm text-slate-400">{lvl.count} transactions</span>
                    </div>
                    <span className="text-sm font-semibold text-white">
                      KES {parseFloat(lvl.total || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((lvl.total / (teamPerf.total_commissions_all_time || 1)) * 100, 100)}%` }}
                      transition={{ duration: 0.8, delay: lvl.level * 0.1 }}
                      className="h-full bg-brand-500 rounded-full"
                    />
                  </div>
                </div>
              ))}
              {(!teamPerf.commissions_last_30_days?.length) && (
                <p className="text-slate-500 text-sm text-center py-4">
                  No commissions yet — start referring people to earn!
                </p>
              )}
            </div>
          </div>

          {/* Commission rate table */}
          <div className="card">
            <h3 className="font-semibold text-white mb-4">Commission Structure</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-800">
                    <th className="pb-3 font-medium">Level</th>
                    <th className="pb-3 font-medium">Relationship</th>
                    <th className="pb-3 font-medium text-right">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {[
                    { level: 1, rel: 'Direct referral',      rate: '10%' },
                    { level: 2, rel: "Referral's referral",  rate: '5%'  },
                    { level: 3, rel: 'Level 3 downline',     rate: '3%'  },
                    { level: 4, rel: 'Level 4 downline',     rate: '2%'  },
                    { level: 5, rel: 'Level 5 downline',     rate: '1%'  },
                  ].map(row => (
                    <tr key={row.level} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3"><LevelBadge level={row.level} /></td>
                      <td className="py-3 text-slate-300">{row.rel}</td>
                      <td className="py-3 text-right font-bold text-brand-400">{row.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* Team tab */}
      {tab === 'team' && tree && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
          <h3 className="font-semibold text-white mb-4">
            Direct Referrals
            <span className="ml-2 badge-slate">{tree.direct_referrals?.length || 0}</span>
          </h3>
          {tree.direct_referrals?.length > 0 ? (
            <div className="space-y-2">
              {tree.direct_referrals.map((member, i) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/40 border border-slate-800"
                >
                  <div className="w-9 h-9 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-sm shrink-0">
                    {member.first_name?.[0]}{member.last_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{member.first_name} {member.last_name}</p>
                    <p className="text-xs text-slate-500 truncate">{member.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-brand-400">KES {parseFloat(member.total_earned || 0).toFixed(2)}</p>
                    <p className="text-xs text-slate-500">earned</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">👥</p>
              <p className="text-slate-400 font-semibold">No team members yet</p>
              <p className="text-slate-600 text-sm mt-1">Share your referral link to start building your team</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Commissions tab */}
      {tab === 'commissions' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <CommissionsTable />
        </motion.div>
      )}
    </div>
  )
}

function CommissionsTable() {
  const [commissions, setCommissions] = useState([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    import('@/utils/api').then(({ referralsAPI }) => {
      referralsAPI.getCommissions()
        .then(r => setCommissions(r.data.results || r.data))
        .finally(() => setLoading(false))
    })
  }, [])

  if (loading) return <div className="card skeleton h-40" />

  return (
    <div className="card">
      <h3 className="font-semibold text-white mb-4">Commission History</h3>
      {commissions.length === 0 ? (
        <p className="text-slate-500 text-center py-8">No commissions earned yet</p>
      ) : (
        <div className="space-y-2">
          {commissions.map(c => (
            <div key={c.id} className="flex items-center gap-3 py-2 border-b border-slate-800 last:border-0">
              <LevelBadge level={c.level} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-300">From {c.from_user_name}</p>
                <p className="text-xs text-slate-500">{c.activity_type.replace('_', ' ')}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-brand-400">+KES {parseFloat(c.commission_amount).toFixed(2)}</p>
                <p className="text-xs text-slate-600">{c.commission_rate}% of {parseFloat(c.source_amount).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

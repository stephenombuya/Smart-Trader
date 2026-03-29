import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchNotifications, markRead } from '@/store/slices/notifSlice'
import { formatDistanceToNow } from 'date-fns'

export default function NotificationBell() {
  const dispatch  = useDispatch()
  const { items, unreadCount } = useSelector(s => s.notifications)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => { dispatch(fetchNotifications()) }, [dispatch])

  // Close on outside click
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const typeIcon = {
    commission:        '💰',
    withdrawal_success:'✅',
    withdrawal_failed: '❌',
    spin_reward:       '🎰',
    task_approved:     '✔️',
    new_referral:      '👥',
    general:           '🔔',
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-surface-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-all"
      >
        🔔
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 rounded-full text-[10px] font-bold text-black flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 w-80 bg-surface-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <p className="font-semibold text-sm">Notifications</p>
              {unreadCount > 0 && (
                <span className="badge-green">{unreadCount} new</span>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto no-scrollbar divide-y divide-slate-800">
              {items.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">No notifications yet</p>
              ) : items.slice(0, 15).map(n => (
                <button
                  key={n.id}
                  onClick={() => { if (!n.is_read) dispatch(markRead(n.id)) }}
                  className={`w-full text-left px-4 py-3 hover:bg-slate-800/50 transition-colors ${!n.is_read ? 'bg-brand-500/5' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-base mt-0.5">{typeIcon[n.notification_type] || '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${!n.is_read ? 'text-white' : 'text-slate-300'}`}>{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{n.message}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.is_read && <div className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-2 shrink-0" />}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

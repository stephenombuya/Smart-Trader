// EarningsPage.jsx — YouTube Ad watching
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { fetchAds } from '@/store/slices/earningsSlice'
import { fetchProfile } from '@/store/slices/authSlice'
import { earningsAPI } from '@/utils/api'

export function EarningsPage() {
  const dispatch = useDispatch()
  const { ads }  = useSelector(s => s.earnings)
  const [watching, setWatching] = useState(null)   // { watchId, ad, startTime }
  const [progress, setProgress] = useState(0)
  const [rewarded, setRewarded] = useState(null)

  useEffect(() => { dispatch(fetchAds()) }, [dispatch])

  const startWatch = async (ad) => {
    try {
      const { data } = await earningsAPI.startWatch(ad.id)
      setWatching({ watchId: data.watch_id, ad, startTime: Date.now() })
      setProgress(0)
      setRewarded(null)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cannot start ad')
    }
  }

  // Progress timer
  useEffect(() => {
    if (!watching) return
    const interval = setInterval(() => {
      const elapsed = (Date.now() - watching.startTime) / 1000
      const pct     = Math.min((elapsed / watching.ad.duration_seconds) * 100, 100)
      setProgress(pct)
      if (pct >= 100) {
        clearInterval(interval)
        completeWatch(elapsed)
      }
    }, 500)
    return () => clearInterval(interval)
  }, [watching])

  const completeWatch = async (duration) => {
    if (!watching) return
    try {
      const { data } = await earningsAPI.completeWatch(watching.watchId, {
        duration_watched: Math.floor(duration),
      })
      setRewarded(data.reward)
      setWatching(null)
      dispatch(fetchProfile())
      dispatch(fetchAds())
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not credit reward')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-white">Watch Ads & Earn</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Earn KES and points for watching sponsored content
          <span className="ml-2 text-amber-400 text-xs">⚠ YouTube API integration required for production</span>
        </p>
      </div>

      {/* Active ad player */}
      <AnimatePresence>
        {watching && (
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="card border-brand-500/30 bg-brand-500/5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Now Playing: {watching.ad.title}</h3>
              <span className="badge-green">{Math.ceil(watching.ad.duration_seconds - ((progress / 100) * watching.ad.duration_seconds))}s left</span>
            </div>
            {/* Embedded YouTube iframe */}
            <div className="aspect-video rounded-xl overflow-hidden bg-black mb-4">
              <iframe
                src={watching.ad.embed_url}
                className="w-full h-full"
                allow="autoplay; fullscreen"
                title={watching.ad.title}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Progress</span><span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-brand-500 rounded-full transition-all duration-500"
                />
              </div>
              <p className="text-xs text-slate-600">
                Do not close this panel — reward will be credited automatically
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reward popup */}
      <AnimatePresence>
        {rewarded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="card border-brand-500/40 bg-brand-500/10 text-center"
          >
            <p className="text-4xl mb-2">🎉</p>
            <p className="font-display font-bold text-xl text-white">Reward Earned!</p>
            <div className="flex items-center justify-center gap-4 mt-3">
              {rewarded.amount > 0 && (
                <span className="badge-green text-base px-4 py-2">+KES {parseFloat(rewarded.amount).toFixed(2)}</span>
              )}
              {rewarded.points > 0 && (
                <span className="badge-gold text-base px-4 py-2">+{rewarded.points} pts</span>
              )}
            </div>
            <button onClick={() => setRewarded(null)} className="btn-secondary mt-4 text-sm">Continue</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ad cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ads.map((ad, i) => (
          <motion.div
            key={ad.id}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="card hover:border-slate-700 transition-all group"
          >
            <div className="aspect-video bg-slate-800 rounded-xl overflow-hidden mb-4 relative">
              <img
                src={ad.thumbnail_url || `https://img.youtube.com/vi/${ad.youtube_video_id}/hqdefault.jpg`}
                alt={ad.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white text-xl">▶</div>
              </div>
              <div className="absolute bottom-2 right-2">
                <span className="badge bg-black/70 text-white text-xs">{ad.duration_seconds}s</span>
              </div>
            </div>
            <h4 className="font-semibold text-white text-sm mb-3 line-clamp-2">{ad.title}</h4>
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                {ad.reward_amount > 0 && <span className="badge-green">+KES {ad.reward_amount}</span>}
                {ad.reward_points > 0 && <span className="badge-gold">+{ad.reward_points} pts</span>}
              </div>
            </div>
            <button
              onClick={() => startWatch(ad)}
              disabled={!!watching}
              className="btn-primary w-full text-sm"
            >
              Watch & Earn
            </button>
          </motion.div>
        ))}

        {ads.length === 0 && !watching && (
          <div className="col-span-full text-center py-16">
            <p className="text-4xl mb-3">📺</p>
            <p className="text-slate-400 font-semibold">No ads available right now</p>
            <p className="text-slate-600 text-sm mt-1">Check back later for new earning opportunities</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default EarningsPage

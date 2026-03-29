import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { earningsAPI } from '@/utils/api'
import { fetchSpinConfig } from '@/store/slices/earningsSlice'
import { fetchProfile } from '@/store/slices/authSlice'

export default function SpinWheelPage() {
  const dispatch      = useDispatch()
  const { spinConfig } = useSelector(s => s.earnings)
  const canvasRef     = useRef(null)
  const [spinning, setSpinning]     = useState(false)
  const [result, setResult]         = useState(null)
  const [rotation, setRotation]     = useState(0)
  const [totalRot, setTotalRot]     = useState(0)
  const animRef                     = useRef(null)

  useEffect(() => { dispatch(fetchSpinConfig()) }, [dispatch])
  useEffect(() => {
    if (spinConfig?.rewards?.length) drawWheel(spinConfig.rewards, totalRot)
  }, [spinConfig, totalRot])

  const drawWheel = (rewards, rot) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx    = canvas.getContext('2d')
    const cx     = canvas.width / 2
    const cy     = canvas.height / 2
    const radius = cx - 8
    const arc    = (2 * Math.PI) / rewards.length

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    rewards.forEach((reward, i) => {
      const start = arc * i + rot
      const end   = start + arc

      // Segment
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, radius, start, end)
      ctx.closePath()
      ctx.fillStyle = reward.color
      ctx.fill()
      ctx.strokeStyle = '#0f172a'
      ctx.lineWidth = 2
      ctx.stroke()

      // Label
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(start + arc / 2)
      ctx.textAlign = 'right'
      ctx.fillStyle = '#ffffff'
      ctx.font = `bold 12px "DM Sans", sans-serif`
      ctx.shadowColor = 'rgba(0,0,0,0.5)'
      ctx.shadowBlur = 4
      ctx.fillText(reward.label, radius - 16, 5)
      ctx.restore()
    })

    // Center hub
    ctx.beginPath()
    ctx.arc(cx, cy, 20, 0, 2 * Math.PI)
    ctx.fillStyle = '#0f172a'
    ctx.fill()
    ctx.strokeStyle = '#22c55e'
    ctx.lineWidth = 3
    ctx.stroke()
  }

  const spin = async (usePoints = false) => {
    if (spinning) return
    setSpinning(true)
    setResult(null)

    // Start visual spin animation
    const spinDuration = 4000
    const extraTurns   = 5 + Math.random() * 3
    const startRot     = totalRot
    const endRot       = startRot + extraTurns * 2 * Math.PI
    const startTime    = performance.now()

    // Call API
    let apiResult = null
    try {
      const { data } = await earningsAPI.executeSpin({ use_points: usePoints })
      apiResult = data
    } catch (err) {
      toast.error(err.response?.data?.error || 'Spin failed')
      setSpinning(false)
      return
    }

    // Animate wheel
    const animate = (now) => {
      const elapsed  = now - startTime
      const progress = Math.min(elapsed / spinDuration, 1)
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3)
      const currentRot = startRot + (endRot - startRot) * ease

      setTotalRot(currentRot)
      drawWheel(spinConfig.rewards, currentRot)

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate)
      } else {
        setSpinning(false)
        setResult(apiResult)
        dispatch(fetchProfile())          // refresh wallet
        dispatch(fetchSpinConfig())       // refresh spin count
        if (apiResult.reward.reward_type !== 'nothing') {
          toast.success(`🎉 ${apiResult.message}`, { duration: 4000 })
        } else {
          toast('Better luck next time!', { icon: '🎰' })
        }
      }
    }
    animRef.current = requestAnimationFrame(animate)
  }

  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current) }, [])

  const free  = spinConfig?.free_spins_remaining ?? 1
  const today = spinConfig?.spins_today ?? 0

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="font-display font-bold text-2xl text-white">Spin the Wheel</h1>
        <p className="text-slate-500 text-sm mt-0.5">1 free spin per day — extra spins cost 50 points</p>
      </div>

      {/* Spin counter */}
      <div className="flex gap-3">
        <div className="badge-green px-4 py-2 text-sm">
          {free > 0 ? `${free} free spin remaining` : 'No free spins today'}
        </div>
        <div className="badge-slate px-4 py-2 text-sm">
          {today} spins today
        </div>
      </div>

      {/* Wheel */}
      <div className="card flex flex-col items-center gap-6 py-10">
        <div className="relative">
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 z-10 text-2xl">
            ▼
          </div>

          <motion.canvas
            ref={canvasRef}
            width={320}
            height={320}
            className="rounded-full shadow-2xl"
            animate={spinning ? { filter: ['drop-shadow(0 0 20px #22c55e)', 'drop-shadow(0 0 40px #22c55e)', 'drop-shadow(0 0 20px #22c55e)'] } : {}}
            transition={{ duration: 0.8, repeat: Infinity }}
          />

          {/* Glow ring while spinning */}
          {spinning && (
            <div className="absolute inset-0 rounded-full border-2 border-brand-400/50 animate-ping" />
          )}
        </div>

        {/* Spin buttons */}
        <div className="flex gap-3">
          {free > 0 ? (
            <button
              onClick={() => spin(false)}
              disabled={spinning}
              className="btn-gold px-8 py-3 text-lg font-black"
            >
              {spinning ? '🎰 Spinning...' : '🎰 SPIN FREE'}
            </button>
          ) : (
            <button
              onClick={() => spin(true)}
              disabled={spinning}
              className="btn-secondary"
            >
              {spinning ? 'Spinning...' : '🎰 Spin (50 pts)'}
            </button>
          )}
        </div>

        {/* Result popup */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="text-center"
            >
              {result.reward.reward_type !== 'nothing' ? (
                <div className="bg-brand-500/10 border border-brand-500/30 rounded-2xl px-8 py-5">
                  <p className="text-4xl mb-2">🎉</p>
                  <p className="font-display font-bold text-xl text-white">{result.reward.label}</p>
                  <p className="text-brand-400 text-sm mt-1">{result.message}</p>
                </div>
              ) : (
                <div className="bg-slate-800 border border-slate-700 rounded-2xl px-8 py-5">
                  <p className="text-3xl mb-2">😔</p>
                  <p className="text-slate-300 font-semibold">No reward this time</p>
                  <p className="text-slate-500 text-sm mt-1">Keep spinning for your chance!</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rewards legend */}
      {spinConfig?.rewards && (
        <div className="card">
          <h3 className="font-semibold text-white mb-4">Prize Pool</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {spinConfig.rewards.map(r => (
              <div key={r.id} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: r.color }} />
                <span className="text-slate-300 truncate">{r.label}</span>
                <span className="text-slate-600 text-xs ml-auto">{(r.probability * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'

// ─── Animated ticker numbers ──────────────────────────────────────────────────
function CountUp({ end, prefix = '', suffix = '', duration = 2 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const steps = 60
        const increment = end / steps
        let current = 0
        const timer = setInterval(() => {
          current += increment
          if (current >= end) { setCount(end); clearInterval(timer) }
          else setCount(Math.floor(current))
        }, (duration * 1000) / steps)
      }
    })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration])

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  )
}

// ─── Floating candlestick background ─────────────────────────────────────────
function CandlestickBg() {
  const candles = Array.from({ length: 18 }, (_, i) => ({
    x: (i * 5.8) + Math.random() * 2,
    height: 30 + Math.random() * 50,
    bullish: Math.random() > 0.4,
    delay: Math.random() * 3,
    duration: 3 + Math.random() * 2,
  }))

  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.07]" preserveAspectRatio="none">
      {candles.map((c, i) => (
        <g key={i} transform={`translate(${c.x}%, 20%)`}>
          <line
            x1="0" y1={`-${c.height * 0.3}%`}
            x2="0" y2={`${c.height * 1.3}%`}
            stroke={c.bullish ? '#22c55e' : '#ef4444'}
            strokeWidth="1"
          />
          <rect
            x="-1.2%" y="0"
            width="2.4%" height={`${c.height}%`}
            fill={c.bullish ? '#22c55e' : '#ef4444'}
          />
        </g>
      ))}
      {/* Trend line */}
      <polyline
        points="0,75 15,60 30,65 45,45 60,50 75,30 90,35 100,20"
        fill="none" stroke="#f59e0b" strokeWidth="1.5"
        strokeDasharray="4 2" opacity="0.6"
      />
    </svg>
  )
}

// ─── Floating stat card ───────────────────────────────────────────────────────
function FloatingCard({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, accent, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="group relative bg-[#0d1f35] border border-slate-800 rounded-2xl p-7 overflow-hidden cursor-default"
    >
      {/* Hover glow */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${accent.glow}`} />
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-5 ${accent.bg}`}>
        {icon}
      </div>
      <h3 className="font-display font-bold text-white text-lg mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </motion.div>
  )
}

// ─── How it works step ────────────────────────────────────────────────────────
function Step({ num, title, desc, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6 }}
      className="flex gap-5"
    >
      <div className="shrink-0 w-10 h-10 rounded-full bg-brand-500/20 border border-brand-500/40 flex items-center justify-center">
        <span className="font-display font-bold text-brand-400 text-sm">{num}</span>
      </div>
      <div className="pt-1">
        <h4 className="font-semibold text-white mb-1">{title}</h4>
        <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  )
}

// ─── Testimonial ──────────────────────────────────────────────────────────────
function Testimonial({ name, location, amount, text, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="bg-[#0d1f35] border border-slate-800 rounded-2xl p-6"
    >
      <div className="flex gap-1 mb-4">
        {[1,2,3,4,5].map(s => <span key={s} className="text-gold-400 text-sm">★</span>)}
      </div>
      <p className="text-slate-300 text-sm leading-relaxed mb-5">"{text}"</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-sm">
            {name[0]}
          </div>
          <div>
            <p className="text-white text-sm font-semibold">{name}</p>
            <p className="text-slate-500 text-xs">{location}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-brand-400 font-bold text-sm">{amount}</p>
          <p className="text-slate-600 text-xs">earned</p>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function LandingPage() {
  const { scrollY } = useScroll()
  const heroY       = useTransform(scrollY, [0, 500], [0, -80])
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0])
  const [menuOpen, setMenuOpen] = useState(false)

  const FEATURES = [
    {
      icon: '📺', title: 'Watch & Earn',
      desc: 'Watch sponsored video content and get credited instantly — KES 2–5 per ad watched, up to 5 ads per day.',
      accent: { bg: 'bg-blue-500/15', glow: 'bg-gradient-to-br from-blue-500/5 to-transparent' },
      delay: 0,
    },
    {
      icon: '🎰', title: 'Spin the Wheel',
      desc: 'One free spin every day. Win cash up to KES 100, bonus points, or extra spins. More spins for 50 points.',
      accent: { bg: 'bg-gold-500/15', glow: 'bg-gradient-to-br from-gold-500/5 to-transparent' },
      delay: 0.1,
    },
    {
      icon: '✅', title: 'Complete Tasks',
      desc: 'Earn by completing simple partner tasks — surveys, social follows, app downloads. Reviewed and paid within 24h.',
      accent: { bg: 'bg-purple-500/15', glow: 'bg-gradient-to-br from-purple-500/5 to-transparent' },
      delay: 0.2,
    },
    {
      icon: '👥', title: '5-Level Referrals',
      desc: 'Refer friends and earn commissions 5 levels deep — 10%, 5%, 3%, 2%, 1%. Your network works for you 24/7.',
      accent: { bg: 'bg-brand-500/15', glow: 'bg-gradient-to-br from-brand-500/5 to-transparent' },
      delay: 0.3,
    },
    {
      icon: '📱', title: 'M-Pesa Withdrawals',
      desc: 'Withdraw your earnings directly to M-Pesa. Minimum KES 100. Funds arrive on your phone within minutes.',
      accent: { bg: 'bg-emerald-500/15', glow: 'bg-gradient-to-br from-emerald-500/5 to-transparent' },
      delay: 0.4,
    },
    {
      icon: '🔒', title: 'Secure & Trusted',
      desc: 'Bank-grade security, JWT authentication, encrypted data. Your wallet and personal info are always protected.',
      accent: { bg: 'bg-slate-500/15', glow: 'bg-gradient-to-br from-slate-500/5 to-transparent' },
      delay: 0.5,
    },
  ]

  const TESTIMONIALS = [
    {
      name: 'Grace Wanjiku', location: 'Nairobi, Kenya',
      amount: 'KES 8,240',
      text: 'I started with just watching ads. After referring my friends and building a team of 30 people, I now earn passively every single day.',
      delay: 0,
    },
    {
      name: 'Brian Otieno', location: 'Mombasa, Kenya',
      amount: 'KES 14,500',
      text: 'The M-Pesa withdrawals are instant. I withdrew KES 5,000 last Friday and it was on my phone before I closed the browser.',
      delay: 0.1,
    },
    {
      name: 'Amina Hassan', location: 'Kisumu, Kenya',
      amount: 'KES 3,800',
      text: 'The spin wheel is genuinely exciting. I won KES 100 on my third spin. Combined with my referrals, this has become a real income stream.',
      delay: 0.2,
    },
  ]

  return (
    <div className="min-h-screen bg-[#020b18] text-white overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#020b18]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-black font-black text-sm shadow-lg shadow-brand-500/30">
              ST
            </div>
            <span className="font-display font-bold text-lg tracking-tight">
              <span className="text-white">Smart</span>
              <span className="text-brand-400"> Trader</span>
            </span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'How It Works', 'Earnings', 'Testimonials'].map(label => (
              <a
                key={label}
                href={`#${label.toLowerCase().replace(/ /g, '-')}`}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                {label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden md:block text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5">
              Sign In
            </Link>
            <Link
              to="/register"
              className="bg-brand-500 hover:bg-brand-600 text-black font-bold text-sm px-5 py-2.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-brand-500/20"
            >
              Start Earning →
            </Link>
            {/* Mobile menu button */}
            <button className="md:hidden text-slate-400 hover:text-white ml-1" onClick={() => setMenuOpen(o => !o)}>
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-slate-800 bg-[#020b18] px-5 py-4 flex flex-col gap-3 overflow-hidden"
            >
              {['Features', 'How It Works', 'Earnings', 'Testimonials'].map(label => (
                <a key={label} href={`#${label.toLowerCase().replace(/ /g, '-')}`}
                  onClick={() => setMenuOpen(false)}
                  className="text-slate-400 hover:text-white text-sm py-1 transition-colors">
                  {label}
                </a>
              ))}
              <Link to="/login" className="text-slate-400 text-sm py-1" onClick={() => setMenuOpen(false)}>Sign In</Link>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <CandlestickBg />
          {/* Radial glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-brand-500/8 blur-[120px]" />
          <div className="absolute top-1/3 right-0 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[80px]" />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }} />
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 w-full max-w-6xl mx-auto px-5 py-20">
          <div className="max-w-3xl mx-auto text-center">

            {/* Badge */}
            <FloatingCard delay={0.1}>
              <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/25 rounded-full px-4 py-1.5 mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                <span className="text-brand-400 text-xs font-semibold tracking-wide uppercase">
                  Live Platform · KES 2M+ Paid Out
                </span>
              </div>
            </FloatingCard>

            {/* Headline */}
            <FloatingCard delay={0.2}>
              <h1 className="font-display font-extrabold text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight mb-6">
                <span className="text-white">Earn Real Money</span>
                <br />
                <span className="bg-gradient-to-r from-brand-400 via-emerald-300 to-brand-400 bg-clip-text text-transparent">
                  While You Sleep
                </span>
              </h1>
            </FloatingCard>

            {/* Sub */}
            <FloatingCard delay={0.35}>
              <p className="text-slate-400 text-lg sm:text-xl leading-relaxed mb-10 max-w-xl mx-auto">
                Watch ads, spin the wheel, complete tasks — then refer friends and
                earn commissions <strong className="text-slate-200">5 levels deep</strong>. Withdraw anytime via M-Pesa.
              </p>
            </FloatingCard>

            {/* CTAs */}
            <FloatingCard delay={0.5}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/register"
                  className="w-full sm:w-auto bg-brand-500 hover:bg-brand-400 text-black font-black text-base px-8 py-4 rounded-xl transition-all active:scale-95 shadow-2xl shadow-brand-500/30 flex items-center justify-center gap-2"
                >
                  Create Free Account
                  <span className="text-lg">→</span>
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white font-semibold text-base px-8 py-4 rounded-xl border border-white/10 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  Sign In
                </Link>
              </div>
              <p className="text-slate-600 text-xs mt-4">
                Free to join · No credit card required · Withdraw from KES 100
              </p>
            </FloatingCard>
          </div>

          {/* Floating stats */}
          <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { label: 'Members',          end: 52000,  prefix: '',     suffix: '+' },
              { label: 'Total Paid Out',   end: 2100000,prefix: 'KES ', suffix: '+' },
              { label: 'Daily Earners',    end: 3800,   prefix: '',     suffix: '+' },
              { label: 'Avg. Monthly Earn',end: 4200,   prefix: 'KES ', suffix: '' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.1, duration: 0.6 }}
                className="bg-white/3 border border-white/8 rounded-2xl p-5 text-center backdrop-blur-sm"
              >
                <p className="font-display font-black text-2xl text-white mb-1">
                  <CountUp end={s.end} prefix={s.prefix} suffix={s.suffix} />
                </p>
                <p className="text-slate-500 text-xs">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-600 text-xs flex flex-col items-center gap-2"
        >
          <span>Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-slate-600 to-transparent" />
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-28 px-5 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">How You Earn</p>
          <h2 className="font-display font-extrabold text-4xl lg:text-5xl text-white mb-4">
            Multiple Income Streams
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Stack your earnings from several sources. The more you engage, the more you make.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(f => <FeatureCard key={f.title} {...f} />)}
        </div>
      </section>

      {/* ── Earnings Showcase ── */}
      <section id="earnings" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-500/3 to-transparent" />
        <div className="max-w-6xl mx-auto px-5 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">The Numbers</p>
              <h2 className="font-display font-extrabold text-4xl text-white mb-5">
                Real Earnings,<br />Real Withdrawals
              </h2>
              <p className="text-slate-400 leading-relaxed mb-8">
                Our commission engine pays out automatically across 5 levels of your network.
                Every time someone in your team earns, you get a cut — even while you sleep.
              </p>
              <div className="space-y-4">
                {[
                  { level: 'Level 1 (Direct)', rate: '10%', color: 'bg-brand-500', width: '100%' },
                  { level: 'Level 2',           rate: '5%',  color: 'bg-emerald-500', width: '50%' },
                  { level: 'Level 3',           rate: '3%',  color: 'bg-blue-500',    width: '30%' },
                  { level: 'Level 4',           rate: '2%',  color: 'bg-purple-500',  width: '20%' },
                  { level: 'Level 5',           rate: '1%',  color: 'bg-slate-500',   width: '10%' },
                ].map((row, i) => (
                  <div key={row.level}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-300">{row.level}</span>
                      <span className="text-white font-bold">{row.rate} commission</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: row.width }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1, duration: 0.8 }}
                        className={`h-full ${row.color} rounded-full`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Earning example card */}
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="bg-[#0d1f35] border border-slate-800 rounded-3xl p-8"
            >
              <p className="text-slate-400 text-sm mb-6">Example: You refer 5 friends, each earns KES 500/month</p>

              <div className="space-y-3 mb-8">
                {[
                  { level: 'L1 × 5 members',   earn: '250', color: 'text-brand-400' },
                  { level: 'L2 × 12 members',  earn: '300', color: 'text-emerald-400' },
                  { level: 'L3 × 30 members',  earn: '450', color: 'text-blue-400' },
                  { level: 'L4 × 60 members',  earn: '600', color: 'text-purple-400' },
                  { level: 'L5 × 100 members', earn: '500', color: 'text-slate-300' },
                ].map((row, i) => (
                  <motion.div
                    key={row.level}
                    initial={{ opacity: 0, x: 16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center justify-between py-2.5 border-b border-slate-800/50"
                  >
                    <span className="text-slate-400 text-sm">{row.level}</span>
                    <span className={`font-bold font-mono ${row.color}`}>+KES {row.earn}</span>
                  </motion.div>
                ))}
              </div>

              <div className="bg-brand-500/10 border border-brand-500/30 rounded-2xl p-5 text-center">
                <p className="text-slate-400 text-sm mb-1">Passive monthly earnings</p>
                <p className="font-display font-black text-4xl text-brand-400">KES 2,100</p>
                <p className="text-slate-500 text-xs mt-2">Just from your referral network</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-28 px-5 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">Simple Process</p>
            <h2 className="font-display font-extrabold text-4xl text-white mb-4">
              Up and Earning<br />in 3 Minutes
            </h2>
            <p className="text-slate-400 leading-relaxed mb-12">
              No experience needed. No investment required. Just sign up and start.
            </p>

            <div className="space-y-8">
              <Step num="01" delay={0}
                title="Create Your Free Account"
                desc="Register with your email and phone number. Verify your email and you're in — takes under 2 minutes."
              />
              <Step num="02" delay={0.15}
                title="Start Earning Immediately"
                desc="Watch your first ad, spin the wheel, or complete a task. Rewards are credited to your wallet instantly."
              />
              <Step num="03" delay={0.3}
                title="Share Your Referral Link"
                desc="Get your unique link and share it. Every person who joins under you grows your passive income network."
              />
              <Step num="04" delay={0.45}
                title="Withdraw to M-Pesa"
                desc="Hit KES 100 minimum and request a withdrawal. Funds arrive on your phone within minutes."
              />
            </div>
          </motion.div>

          {/* Dashboard preview mock */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="relative"
          >
            <div className="bg-[#0d1f35] border border-slate-700 rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
              {/* Mock topbar */}
              <div className="bg-[#0a1628] border-b border-slate-800 px-5 py-3 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-gold-500/60" />
                <div className="w-3 h-3 rounded-full bg-brand-500/60" />
                <div className="flex-1 mx-4 bg-slate-800 rounded-full px-3 py-1 text-xs text-slate-500 text-center">
                  smarttrader.app/dashboard
                </div>
              </div>

              {/* Mock dashboard */}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Wallet Balance', value: 'KES 4,280', color: 'text-brand-400' },
                    { label: 'Total Earned',   value: 'KES 9,150', color: 'text-gold-400' },
                    { label: 'Points',         value: '1,240 pts', color: 'text-blue-400' },
                    { label: 'Team Size',      value: '47 members', color: 'text-white' },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
                      <p className={`font-bold text-lg ${s.color}`}>{s.value}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Mock chart bars */}
                <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-4">
                  <p className="text-slate-400 text-xs mb-3">Earnings — Last 7 Days</p>
                  <div className="flex items-end gap-1.5 h-16">
                    {[40, 65, 30, 80, 55, 90, 70].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05, duration: 0.5 }}
                        className="flex-1 bg-brand-500/60 rounded-t-sm"
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2">
                    {['M','T','W','T','F','S','S'].map((d,i) => (
                      <span key={i} className="flex-1 text-center text-slate-600 text-[10px]">{d}</span>
                    ))}
                  </div>
                </div>

                {/* Mock recent activity */}
                <div className="space-y-2">
                  {[
                    { icon: '💰', label: 'Level 1 commission from Brian', amount: '+KES 50' },
                    { icon: '📺', label: 'Ad watch reward',               amount: '+KES 3' },
                    { icon: '🎰', label: 'Spin wheel — 50 Points',        amount: '+50 pts' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs py-1.5 border-b border-slate-800 last:border-0">
                      <span>{item.icon}</span>
                      <span className="text-slate-400 flex-1">{item.label}</span>
                      <span className="text-brand-400 font-semibold">{item.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="absolute -right-4 top-16 bg-brand-500 text-black font-bold text-xs px-4 py-2 rounded-full shadow-xl shadow-brand-500/30"
            >
              ✓ Just withdrew KES 500
            </motion.div>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut', delay: 1 }}
              className="absolute -left-4 bottom-20 bg-[#1e293b] border border-slate-700 text-white text-xs px-4 py-2.5 rounded-2xl shadow-xl"
            >
              <span className="text-brand-400 font-bold">+KES 120</span>
              <span className="text-slate-400 ml-1.5">from your team today</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-28 px-5 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">Real Members</p>
          <h2 className="font-display font-extrabold text-4xl text-white mb-4">People Are Earning</h2>
          <p className="text-slate-400">Join thousands of Kenyans building income on Smart Trader</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TESTIMONIALS.map(t => <Testimonial key={t.name} {...t} />)}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-28 px-5">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="bg-gradient-to-br from-brand-500/15 via-emerald-500/5 to-transparent border border-brand-500/20 rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent" />
            <div className="relative z-10">
              <div className="text-5xl mb-6">💹</div>
              <h2 className="font-display font-extrabold text-4xl text-white mb-4">
                Ready to Start Earning?
              </h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Join over 52,000 members already earning on Smart Trader.
                It's free, it's fast, and your first reward is waiting.
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-black font-black text-lg px-10 py-4 rounded-xl transition-all active:scale-95 shadow-2xl shadow-brand-500/30"
              >
                Create Free Account →
              </Link>
              <p className="text-slate-600 text-xs mt-4">
                No credit card · No minimum deposit · Withdraw from KES 100
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800 py-10 px-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center text-black font-black text-xs">ST</div>
            <span className="font-display font-bold text-slate-300">Smart Trader</span>
          </div>
          <p className="text-slate-600 text-xs text-center">
            © 2026 Smart Trader. All rights reserved. Earn responsibly.
          </p>
          <div className="flex gap-5 text-xs text-slate-600">
            <a href="#" className="hover:text-slate-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Support</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
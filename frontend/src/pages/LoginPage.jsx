import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { GoogleLogin } from '@react-oauth/google'
import toast from 'react-hot-toast'
import api from '@/utils/api'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { loginUser, clearError } from '@/store/slices/authSlice'

export default function LoginPage() {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const { loading, error } = useSelector(s => s.auth)
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    dispatch(clearError())
    const res = await dispatch(loginUser(data))
    if (loginUser.fulfilled.match(res)) navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex bg-surface-950">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-surface-900 border-r border-slate-800 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `repeating-linear-gradient(0deg, #22c55e 0, #22c55e 1px, transparent 0, transparent 50%),
                            repeating-linear-gradient(90deg, #22c55e 0, #22c55e 1px, transparent 0, transparent 50%)`,
          backgroundSize: '40px 40px',
        }} />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="relative z-10 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center text-black font-black text-3xl mx-auto mb-6 shadow-lg shadow-brand-500/30">
            ST
          </div>
          <h1 className="font-display font-extrabold text-4xl text-white mb-3">Smart Trader</h1>
          <p className="text-slate-400 text-lg max-w-xs mx-auto leading-relaxed">
            Trade smarter, earn through referrals, watching ads, spinning the wheel, and more.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { value: '50K+', label: 'Members'     },
              { value: 'KES 2M+', label: 'Paid Out' },
              { value: '5 Levels', label: 'MLM Tree' },
            ].map(({ value, label }) => (
              <div key={label} className="bg-surface-800 border border-slate-700 rounded-xl p-4 text-center">
                <p className="font-display font-bold text-brand-400 text-lg">{value}</p>
                <p className="text-xs text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-black font-black text-sm">ST</div>
            <span className="font-display font-bold text-lg gradient-text">Smart Trader</span>
          </div>

          <h2 className="font-display font-bold text-3xl text-white mb-1">Welcome back</h2>
          <p className="text-slate-400 text-sm mb-8">Sign in to continue earning</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                {...register('email', { required: 'Email is required' })}
                type="email"
                placeholder="you@example.com"
                className="input"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <input
                {...register('password', { required: 'Password is required' })}
                type="password"
                placeholder="••••••••"
                className="input"
              />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-slate-400 hover:text-brand-400 transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-slate-600 text-xs">or</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            <div className="w-full flex justify-center">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  if (!credentialResponse?.credential) {
                    return toast.error('Google login failed: no ID token received')
                  }

                  try {
                    const { data } = await api.post('/auth/google/', {
                      token: credentialResponse.credential, // ✅ THIS is the ID token
                    })

                    localStorage.setItem('access_token', data.access)
                    localStorage.setItem('refresh_token', data.refresh)

                    toast.success(
                      data.created
                        ? 'Account created! Welcome 🎉'
                        : 'Welcome back!'
                    )
                    console.log('Google response:', data)
                    window.location.href = '/dashboard'
                  } catch (err) {
                    console.error(err)
                    toast.error('Google sign-in failed. Please try again.')
                  }
                }}
                onError={() => toast.error('Google sign-in was cancelled')}
              />
            </div>

            
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
              Sign up free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

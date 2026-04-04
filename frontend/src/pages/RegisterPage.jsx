import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'

import { GoogleLogin } from '@react-oauth/google'
import toast from 'react-hot-toast'
import api from '@/utils/api'

import { registerUser, clearError } from '@/store/slices/authSlice'

export default function RegisterPage() {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const [params]  = useSearchParams()
  const { loading, error } = useSelector(s => s.auth)
  const [success, setSuccess] = useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { referral_code: params.get('ref') || '' }
  })

  const onSubmit = async (data) => {
    dispatch(clearError())
    const res = await dispatch(registerUser(data))
    if (registerUser.fulfilled.match(res)) setSuccess(true)
  }

  if (success) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950 p-6">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm">
        <div className="text-6xl mb-6">📧</div>
        <h2 className="font-display font-bold text-2xl text-white mb-3">Check your inbox!</h2>
        <p className="text-slate-400 mb-6">We sent a verification link to your email. Click it to activate your account and start earning.</p>
        <Link to="/login" className="btn-primary inline-block">Back to Login</Link>
      </motion.div>
    </div>
  )

  // const handleGoogleSuccess = async (tokenResponse) => {
  //   if (!tokenResponse?.credential) {
  //     return toast.error('Google login failed: no ID token received');
  //   }

  //   try {
  //     const { data } = await api.post('/auth/google/', {
  //       token: tokenResponse.credential,
  //       // If on register page, pass referral code:
  //       referral_code: params?.get('ref') || '',
  //     })
  //     localStorage.setItem('access_token',  data.access)
  //     localStorage.setItem('refresh_token', data.refresh)
  //     toast.success(data.created ? 'Account created! Welcome 🎉' : 'Welcome back!')
  //     navigate('/dashboard')
  //   } catch (err) {
  //     toast.error('Google sign-in failed. Please try again.')
  //   }
  // }


  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-black font-black text-sm">ST</div>
          <span className="font-display font-bold text-lg gradient-text">Smart Trader</span>
        </div>

        <h2 className="font-display font-bold text-3xl text-white mb-1">Create account</h2>
        <p className="text-slate-400 text-sm mb-8">Join thousands earning with Smart Trader</p>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First name</label>
              <input {...register('first_name', { required: 'Required' })} placeholder="Jane" className="input" />
              {errors.first_name && <p className="text-red-400 text-xs mt-1">{errors.first_name.message}</p>}
            </div>
            <div>
              <label className="label">Last name</label>
              <input {...register('last_name', { required: 'Required' })} placeholder="Doe" className="input" />
              {errors.last_name && <p className="text-red-400 text-xs mt-1">{errors.last_name.message}</p>}
            </div>
          </div>

          <div>
            <label className="label">Email address</label>
            <input {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/, message: 'Invalid email' } })}
              type="email" placeholder="you@example.com" className="input" />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="label">Phone (for M-Pesa)</label>
            <input {...register('phone')} type="tel" placeholder="0712345678" className="input" />
          </div>

          <div>
            <label className="label">Password</label>
            <input {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } })}
              type="password" placeholder="••••••••" className="input" />
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="label">Confirm password</label>
            <input {...register('password2', { required: 'Please confirm password', validate: v => v === watch('password') || 'Passwords do not match' })}
              type="password" placeholder="••••••••" className="input" />
            {errors.password2 && <p className="text-red-400 text-xs mt-1">{errors.password2.message}</p>}
          </div>

          <div>
            <label className="label">Referral code <span className="text-slate-600">(optional)</span></label>
            <input {...register('referral_code')} placeholder="e.g. ABC12345" className="input font-mono uppercase" />
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
                    referral_code: params?.get('ref') || '',
                  })

                  localStorage.setItem('access_token', data.access)
                  localStorage.setItem('refresh_token', data.refresh)

                  toast.success(
                    data.created
                      ? 'Account created! Welcome 🎉'
                      : 'Welcome back!'
                  )

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
            {loading ? 'Creating account...' : 'Create Account — It\'s Free'}
          </button>
        </form>

        <p className="text-center text-slate-500 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}

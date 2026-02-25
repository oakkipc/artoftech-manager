'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, User, Mail, Lock, UserPlus, Loader2, CheckCircle2, AlertCircle, ChevronLeft } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (formData.password !== formData.confirmPassword) { setError('รหัสผ่านไม่ตรงกัน'); return }
    if (formData.password.length < 6) { setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'สมัครไม่สำเร็จ'); return }
      setSuccess(data.message)
      setTimeout(() => router.push('/login'), 2000)
    } catch { setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#060612]">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/[0.07] rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full max-w-[440px] relative z-10">
        <div className="mb-8">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 mb-5 shadow-lg shadow-violet-600/25">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Account</h1>
          <p className="text-sm text-slate-500 mt-1">Join AOT Manager</p>
        </div>

        <div className="bg-[#0c0c1d] border border-white/[0.06] rounded-2xl p-8">
          {error && (
            <div className="flex items-start gap-2.5 bg-red-500/[0.08] border border-red-500/20 text-red-400 text-sm p-3.5 rounded-xl mb-6">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2.5 bg-emerald-500/[0.08] border border-emerald-500/20 text-emerald-400 text-sm p-3.5 rounded-xl mb-6">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /><span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input type="text" name="name" value={formData.name} onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                  placeholder="Your name" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input type="email" name="email" value={formData.email} onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                  placeholder="name@company.com" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input type="password" name="password" value={formData.password} onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                    placeholder="••••••••" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Confirm</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                    placeholder="••••••••" required />
                </div>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 mt-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Creating...</> : <><UserPlus className="w-4 h-4" />Create Account</>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium">Sign In</Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-700 mt-8">© {new Date().getFullYear()} Art of Tech</p>
      </div>
    </div>
  )
}

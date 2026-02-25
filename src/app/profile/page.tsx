'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import {
  User,
  Mail,
  Shield,
  Lock,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      setCurrentUser(user)
    } else {
      router.push('/login')
    }
    setLoading(false)
  }, [])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setError('')

    if (passwords.new !== passwords.confirm) {
      setError('รหัสผ่านใหม่ไม่ตรงกัน')
      return
    }

    if (passwords.new.length < 6) {
      setError('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร')
      return
    }

    setSaving(true)

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          currentPassword: passwords.current,
          newPassword: passwords.new
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'เปลี่ยนรหัสผ่านไม่สำเร็จ')
        return
      }

      setMessage('เปลี่ยนรหัสผ่านสำเร็จ!')
      setPasswords({ current: '', new: '', confirm: '' })
    } catch (err) {
      setError('เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-midnight-400 font-medium animate-pulse">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-midnight-950 flex">
      <Sidebar />

      <main className="flex-1 p-10 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2 text-glow">
              Account Settings
            </h1>
            <p className="text-midnight-400 font-medium text-lg">
              Manage your profile and security credentials
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Profile Info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="glass-dark rounded-[2.5rem] p-8 border border-white/10 relative overflow-hidden text-center">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 to-indigo-600 opacity-50" />

                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 p-1 mx-auto mb-6 shadow-xl shadow-violet-600/20">
                  <div className="w-full h-full rounded-full bg-midnight-900 flex items-center justify-center text-white text-3xl font-bold border-2 border-white/10 overflow-hidden">
                    {currentUser?.name?.charAt(0)}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-1">{currentUser?.name}</h3>
                <p className="text-midnight-500 text-sm font-medium mb-6">{currentUser?.email}</p>

                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-600/10 text-violet-400 text-xs font-bold rounded-full border border-violet-600/20 uppercase tracking-widest">
                  <Shield className="w-3.5 h-3.5" />
                  <span>{currentUser?.role}</span>
                </div>
              </div>

              <div className="glass-dark rounded-[2.5rem] p-8 border border-white/10 space-y-6">
                <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Account Details</h4>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-midnight-500">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-midnight-500 font-bold uppercase tracking-tighter">Full Name</p>
                      <p className="text-white font-medium">{currentUser?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-midnight-500">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-midnight-500 font-bold uppercase tracking-tighter">Email Address</p>
                      <p className="text-white font-medium">{currentUser?.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Security/Forms */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-dark rounded-[2.5rem] p-10 border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-30" />

                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-violet-600/10 rounded-xl flex items-center justify-center">
                    <Lock className="w-5 h-5 text-violet-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Update Password</h3>
                </div>

                {message && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl mb-8 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-medium">{message}</span>
                  </div>
                )}

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl mb-8 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-full space-y-2">
                      <label className="block text-sm font-bold text-midnight-300 ml-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwords.current}
                        onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                        className="w-full px-5 py-4 bg-midnight-950/50 border border-white/5 rounded-2xl text-white placeholder-midnight-700 focus:outline-none focus:border-violet-500/50 transition-all shadow-inner"
                        placeholder="••••••••"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-midnight-300 ml-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwords.new}
                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                        className="w-full px-5 py-4 bg-midnight-950/50 border border-white/5 rounded-2xl text-white placeholder-midnight-700 focus:outline-none focus:border-violet-500/50 transition-all shadow-inner"
                        placeholder="••••••••"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-midnight-300 ml-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                        className="w-full px-5 py-4 bg-midnight-950/50 border border-white/5 rounded-2xl text-white placeholder-midnight-700 focus:outline-none focus:border-violet-500/50 transition-all shadow-inner"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full md:w-auto px-10 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-2xl hover:scale-105 transition-all shadow-lg shadow-violet-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

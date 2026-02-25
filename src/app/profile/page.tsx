'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from '@/components/Sidebar'
import {
  User,
  Mail,
  Shield,
  Lock,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  ArrowRight
} from 'lucide-react'

interface UserProject {
  project_id: string
  role: string
  projects: {
    id: string
    name: string
    description: string | null
    status: string
  }
}

export default function ProfilePage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [userProjects, setUserProjects] = useState<UserProject[]>([])

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      setCurrentUser(user)
      fetchUserProjects(user.id)
    } else {
      router.push('/login')
    }
    setLoading(false)
  }, [])

  const fetchUserProjects = async (userId: string) => {
    try {
      const res = await fetch(`/api/profile/projects?userId=${userId}`)
      const data = await res.json()
      if (data.projects) setUserProjects(data.projects)
    } catch (err) {
      console.error(err)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setError('')
    if (passwords.new !== passwords.confirm) { setError('รหัสผ่านใหม่ไม่ตรงกัน'); return }
    if (passwords.new.length < 6) { setError('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, currentPassword: passwords.current, newPassword: passwords.new })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'เปลี่ยนรหัสผ่านไม่สำเร็จ'); return }
      setMessage('เปลี่ยนรหัสผ่านสำเร็จ!')
      setPasswords({ current: '', new: '', confirm: '' })
    } catch { setError('เกิดข้อผิดพลาด') }
    finally { setSaving(false) }
  }

  const getRoleColor = (role: string) => {
    const map: Record<string, string> = {
      SUPERADMIN: 'bg-red-500/10 text-red-400 border-red-500/20',
      ADMIN: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
      OFFICER: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      MEMBER: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      VIEWER: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    }
    return map[role] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-midnight-950 flex">
      <Sidebar />

      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <div className="sticky top-0 z-20 bg-midnight-950/80 backdrop-blur-xl border-b border-white/[0.04] px-8 py-4">
          <h1 className="text-xl font-bold text-white">Account Settings</h1>
          <p className="text-sm text-midnight-500">Manage your profile and security</p>
        </div>

        <div className="p-8 max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 text-center">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg shadow-violet-600/20">
                  {currentUser?.name?.charAt(0)?.toUpperCase()}
                </div>
                <h3 className="text-base font-bold text-white mb-0.5">{currentUser?.name}</h3>
                <p className="text-sm text-midnight-500 mb-4">{currentUser?.email}</p>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getRoleColor(currentUser?.role)}`}>
                  <Shield className="w-3 h-3" />
                  {currentUser?.role}
                </span>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 space-y-4">
                <h4 className="text-[11px] font-bold text-midnight-500 uppercase tracking-wider">Details</h4>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center"><User className="w-4 h-4 text-midnight-500" /></div>
                  <div><p className="text-[11px] text-midnight-600 uppercase">Name</p><p className="text-sm text-white font-medium">{currentUser?.name}</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center"><Mail className="w-4 h-4 text-midnight-500" /></div>
                  <div><p className="text-[11px] text-midnight-600 uppercase">Email</p><p className="text-sm text-white font-medium">{currentUser?.email}</p></div>
                </div>
              </div>

              {/* Projects Section */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <LayoutGrid className="w-4 h-4 text-violet-400" />
                  <h4 className="text-[11px] font-bold text-midnight-500 uppercase tracking-wider">My Projects</h4>
                  <span className="text-xs text-midnight-600 bg-white/[0.04] px-2 py-0.5 rounded-md font-medium ml-auto">
                    {userProjects.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {userProjects.map((up) => (
                    <Link
                      key={up.project_id}
                      href={`/projects/${up.projects.id}`}
                      className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg border border-white/[0.04] hover:border-violet-500/20 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                          <LayoutGrid className="w-4 h-4 text-violet-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{up.projects.name}</p>
                          <p className="text-[11px] text-midnight-600">{up.projects.description || 'No description'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase ${getRoleColor(up.role)}`}>
                          {up.role}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-midnight-700 group-hover:text-violet-400 transition-colors" />
                      </div>
                    </Link>
                  ))}
                  {userProjects.length === 0 && (
                    <p className="text-center text-midnight-600 text-sm py-4">No projects assigned</p>
                  )}
                </div>
              </div>
            </div>

            {/* Password Section */}
            <div className="lg:col-span-3">
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Lock className="w-4 h-4 text-violet-400" />
                  <h3 className="text-base font-bold text-white">Change Password</h3>
                </div>

                {message && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg mb-5 flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />{message}
                  </div>
                )}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-5 flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />{error}
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-midnight-300 mb-1.5">Current Password</label>
                    <input type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white text-sm placeholder-midnight-700 focus:outline-none focus:border-violet-500/40" placeholder="••••••••" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-midnight-300 mb-1.5">New Password</label>
                      <input type="password" value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white text-sm placeholder-midnight-700 focus:outline-none focus:border-violet-500/40" placeholder="••••••••" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-midnight-300 mb-1.5">Confirm</label>
                      <input type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white text-sm placeholder-midnight-700 focus:outline-none focus:border-violet-500/40" placeholder="••••••••" required />
                    </div>
                  </div>
                  <button type="submit" disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 mt-2">
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Save className="w-4 h-4" />Save Changes</>}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

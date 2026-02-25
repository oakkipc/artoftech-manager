'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/login')
  }

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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">กำลังโหลด...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-white">AOT Manager</h1>
          </div>
          <div className="flex items-center gap-4">
            <a href="/admin/users" className="text-slate-300 hover:text-white text-sm">จัดการผู้ใช้</a>
            <button onClick={handleLogout} className="text-slate-400 hover:text-white text-sm">
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-6 py-8">
        <h2 className="text-xl font-semibold text-white mb-6">โปรไฟล์</h2>

        {/* User Info */}
        <div className="bg-slate-800 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-medium text-white mb-4">ข้อมูลผู้ใช้</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">ชื่อ</span>
              <span className="text-white">{currentUser?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">อีเมล</span>
              <span className="text-white">{currentUser?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">สถานะ</span>
              <span className="text-white">{currentUser?.role}</span>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-medium text-white mb-4">เปลี่ยนรหัสผ่าน</h3>
          
          {message && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-lg mb-4 text-sm">
              {message}
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleChangePassword}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                รหัสผ่านปัจจุบัน
              </label>
              <input
                type="password"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                รหัสผ่านใหม่
              </label>
              <input
                type="password"
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                ยืนยันรหัสผ่านใหม่
              </label>
              <input
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-violet-600 text-white py-3 rounded-lg font-medium hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

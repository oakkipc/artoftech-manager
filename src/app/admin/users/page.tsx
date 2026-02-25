'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  name: string
  role: string
  avatar: string | null
  created_at: string
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      setCurrentUser(user)
      if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN') {
        router.push('/dashboard')
      }
    } else {
      router.push('/login')
    }
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (data.users) {
        setUsers(data.users)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (userId: string, role: string = 'MEMBER') => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newRole: role })
      })
      
      if (res.ok) {
        fetchUsers()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/login')
  }

  const getRoleBadge = (role: string) => {
    const styles: any = {
      SUPERADMIN: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      ADMIN: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      MEMBER: 'bg-green-500/20 text-green-400 border-green-500/30',
      PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    }
    return styles[role] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-white">AOT Manager</h1>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/profile"
              className="text-slate-300 hover:text-white text-sm"
            >
              โปรไฟล์
            </a>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-white text-sm"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-xl font-semibold text-white mb-6">จัดการผู้ใช้งาน</h2>

        {/* Users Table */}
        <div className="bg-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="text-left px-6 py-4 text-slate-300 text-sm font-medium">ชื่อ</th>
                <th className="text-left px-6 py-4 text-slate-300 text-sm font-medium">อีเมล</th>
                <th className="text-left px-6 py-4 text-slate-300 text-sm font-medium">สถานะ</th>
                <th className="text-left px-6 py-4 text-slate-300 text-sm font-medium">วันที่สมัคร</th>
                <th className="text-right px-6 py-4 text-slate-300 text-sm font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-700/30">
                  <td className="px-6 py-4 text-white">{user.name}</td>
                  <td className="px-6 py-4 text-slate-300">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadge(user.role)}`}>
                      {user.role === 'PENDING' ? 'รออนุมัติ' : user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm">
                    {new Date(user.created_at).toLocaleDateString('th-TH')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {user.role === 'PENDING' ? (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleApprove(user.id, 'MEMBER')}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg"
                        >
                          อนุมัติ
                        </button>
                        <button
                          onClick={() => handleApprove(user.id, 'ADMIN')}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
                        >
                          ทำเป็น Admin
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-500 text-sm">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {users.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              ไม่มีผู้ใช้งาน
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

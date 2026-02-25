'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Search,
  ChevronDown,
  Shield,
  MoreHorizontal
} from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  role: string
  created_at: string
}

const ROLES = ['SUPERADMIN', 'ADMIN', 'OFFICER', 'MEMBER', 'PENDING']

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      setCurrentUser(user)
      if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN') {
        router.push('/profile')
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
      if (data.users) setUsers(data.users)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRole = async () => {
    if (!selectedUser || !selectedRole) return
    try {
      await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, role: selectedRole })
      })
      setShowRoleModal(false)
      fetchUsers()
    } catch (err) {
      console.error(err)
    }
  }

  const openRoleModal = (user: User) => {
    setSelectedUser(user)
    setSelectedRole(user.role)
    setShowRoleModal(true)
  }

  const getRoleBadge = (role: string) => {
    const map: Record<string, string> = {
      SUPERADMIN: 'bg-red-500/10 text-red-400 border-red-500/20',
      ADMIN: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
      OFFICER: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      MEMBER: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    }
    return map[role] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  }

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = [
    { label: 'Total Users', value: users.length, icon: Users, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'Approved', value: users.filter(u => u.role !== 'PENDING').length, icon: UserCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Pending', value: users.filter(u => u.role === 'PENDING').length, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ]

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">User Management</h1>
              <p className="text-sm text-midnight-500">Manage team members and roles</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-600" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 bg-white/[0.04] border border-white/[0.06] rounded-lg text-sm text-white placeholder-midnight-600 focus:outline-none focus:border-violet-500/40 transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 flex items-center gap-4">
                <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-midnight-500 font-medium">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-midnight-500 uppercase tracking-wider">User</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-midnight-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-midnight-500 uppercase tracking-wider">Joined</th>
                  <th className="text-right px-6 py-3 text-[11px] font-semibold text-midnight-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/10 flex items-center justify-center text-violet-400 text-xs font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{user.name}</p>
                          <p className="text-xs text-midnight-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getRoleBadge(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-midnight-500">
                      {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openRoleModal(user)}
                        className="px-3 py-1.5 text-xs font-medium text-midnight-400 hover:text-white bg-white/[0.04] hover:bg-violet-600 border border-white/[0.06] hover:border-violet-600 rounded-lg transition-all"
                      >
                        Edit Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="py-16 text-center">
                <UserX className="w-8 h-8 text-midnight-700 mx-auto mb-3" />
                <p className="text-midnight-500 text-sm">No users found</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Role Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f0f23] border border-white/[0.08] rounded-2xl p-8 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Change Role</h3>
            <p className="text-sm text-midnight-500 mb-6">{selectedUser.name}</p>

            <div className="space-y-2 mb-8">
              {ROLES.map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all border ${selectedRole === role
                      ? 'bg-violet-600/10 text-violet-400 border-violet-500/30'
                      : 'text-midnight-400 hover:bg-white/[0.04] border-transparent hover:border-white/[0.06]'
                    }`}
                >
                  <span>{role}</span>
                  {selectedRole === role && <div className="w-2 h-2 rounded-full bg-violet-400" />}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRoleModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-midnight-400 border border-white/[0.08] rounded-xl hover:bg-white/[0.04] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateRole}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-xl transition-colors"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import {
  UserPlus,
  Search,
  MoreVertical,
  CheckCircle2,
  Clock,
  UserCog,
  ShieldCheck,
  Filter
} from 'lucide-react'

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
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState('MEMBER')
  const [searchQuery, setSearchQuery] = useState('')

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
      if (data.users) {
        setUsers(data.users)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (user: User) => {
    setSelectedUser(user)
    setSelectedRole('MEMBER')
    setShowRoleModal(true)
  }

  const confirmApprove = async () => {
    if (!selectedUser) return

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, newRole: selectedRole })
      })

      if (res.ok) {
        fetchUsers()
        setShowRoleModal(false)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const getRoleStyle = (role: string) => {
    const styles: any = {
      SUPERADMIN: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30',
      ADMIN: 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30',
      OFFICER: 'from-cyan-500/20 to-teal-500/20 text-cyan-400 border-cyan-500/30',
      MEMBER: 'from-emerald-500/20 to-green-500/20 text-emerald-400 border-emerald-500/30',
      PENDING: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30'
    }
    return styles[role] || 'from-gray-500/20 to-slate-500/20 text-gray-400 border-gray-500/30'
  }

  const getRoleLabel = (role: string) => {
    const labels: any = {
      SUPERADMIN: 'Super Admin',
      ADMIN: 'Admin',
      OFFICER: 'Officer',
      MEMBER: 'Member',
      PENDING: 'Pending'
    }
    return labels[role] || role
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-midnight-400 font-medium animate-pulse">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-midnight-950 flex">
      <Sidebar />

      <main className="flex-1 p-10 overflow-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2 text-glow">
              User Management
            </h1>
            <p className="text-midnight-400 font-medium">
              Manage permissions and approve new members
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="glass-dark px-6 py-3 rounded-2xl text-white font-semibold flex items-center gap-2 hover:bg-white/5 transition-all border border-white/10">
              <Filter className="w-5 h-5 text-midnight-500" />
              <span>Filter</span>
            </button>
            <button className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 rounded-2xl text-white font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-violet-600/20">
              <UserPlus className="w-5 h-5" />
              <span>Add User</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: 'Total Users', value: users.length, icon: UserCog, color: 'text-blue-400' },
            { label: 'Verified', value: users.filter(u => u.role !== 'PENDING').length, icon: ShieldCheck, color: 'text-emerald-400' },
            { label: 'Pending Approval', value: users.filter(u => u.role === 'PENDING').length, icon: Clock, color: 'text-amber-400' },
          ].map((stat, i) => (
            <div key={i} className="glass-dark rounded-[2rem] p-6 border border-white/5">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl bg-white/5 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-midnight-500 text-sm font-semibold uppercase tracking-wider">{stat.label}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Table Container */}
        <div className="glass-dark rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-30" />

          {/* Table Toolbar */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
            <div className="relative w-full max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-midnight-500 group-focus-within:text-violet-500 transition-colors" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-midnight-950/50 border border-white/5 rounded-2xl text-white placeholder-midnight-600 focus:outline-none focus:border-violet-500/50 transition-all text-sm"
              />
            </div>
          </div>

          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left px-8 py-5 text-midnight-400 text-xs font-bold uppercase tracking-widest">User</th>
                <th className="text-left px-8 py-5 text-midnight-400 text-xs font-bold uppercase tracking-widest">Role</th>
                <th className="text-left px-8 py-5 text-midnight-400 text-xs font-bold uppercase tracking-widest">Joined Date</th>
                <th className="text-right px-8 py-5 text-midnight-400 text-xs font-bold uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-midnight-800 to-midnight-900 border border-white/10 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full rounded-2xl object-cover" />
                        ) : (
                          user.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <p className="text-white font-bold group-hover:text-violet-400 transition-colors">{user.name}</p>
                        <p className="text-midnight-500 text-sm font-medium">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-4 py-1.5 rounded-xl text-xs font-bold border bg-gradient-to-br ${getRoleStyle(user.role)} shadow-lg`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-midnight-400 text-sm font-medium">
                    {new Date(user.created_at).toLocaleDateString('th-TH', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-8 py-5 text-right">
                    {user.role === 'PENDING' ? (
                      <button
                        onClick={() => handleApprove(user)}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center gap-2 ml-auto"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve
                      </button>
                    ) : (
                      <button className="p-2.5 text-midnight-500 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-24">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-midnight-700" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No users found</h3>
              <p className="text-midnight-500 max-w-xs mx-auto">
                Try adjusting your search or filters to find what you&apos;re looking for.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Role Selection Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-midnight-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="glass-dark rounded-[2.5rem] p-10 w-full max-w-md border border-white/10 shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-t-full" />

            <h3 className="text-2xl font-bold text-white mb-2">Update User Role</h3>
            <p className="text-midnight-400 mb-8 font-medium">
              Grant permissions to <span className="text-white font-bold">{selectedUser?.name}</span>
            </p>

            <div className="space-y-4 mb-10">
              {['MEMBER', 'OFFICER', 'ADMIN'].map((role) => (
                <label
                  key={role}
                  className={`flex items-center justify-between p-5 rounded-[1.5rem] border cursor-pointer transition-all duration-300 ${selectedRole === role
                      ? 'border-violet-500 bg-violet-500/10 shadow-[0_0_20px_rgba(139,92,246,0.1)]'
                      : 'border-white/5 hover:border-white/20 bg-white/5'
                    }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={selectedRole === role}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedRole === role ? 'bg-violet-600' : 'bg-midnight-800'
                      }`}>
                      <ShieldCheck className={`w-5 h-5 ${selectedRole === role ? 'text-white' : 'text-midnight-500'}`} />
                    </div>
                    <span className={`font-bold ${selectedRole === role ? 'text-white' : 'text-midnight-400'}`}>
                      {getRoleLabel(role)}
                    </span>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedRole === role ? 'border-violet-500 bg-violet-500' : 'border-midnight-700'
                    }`}>
                    {selectedRole === role && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowRoleModal(false)}
                className="flex-1 px-6 py-4 rounded-[1.5rem] border border-white/10 text-midnight-400 font-bold hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmApprove}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-[1.5rem] hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-600/20 active:scale-95"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

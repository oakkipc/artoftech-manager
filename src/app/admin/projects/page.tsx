'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import {
  FolderPlus,
  Search,
  Users,
  LayoutGrid,
  Clock,
  Trash2,
  X,
  Plus,
  Pin,
  PinOff,
  ArrowRight
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  pinned: boolean
  created_at: string
}

interface User {
  id: string
  name: string
  email: string
}

interface UserProject {
  id: string
  user_id: string
  project_id: string
  role: string
  users: User
}

export default function AdminProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [projectUsers, setProjectUsers] = useState<UserProject[]>([])
  const [newProject, setNewProject] = useState({ name: '', description: '' })
  const [assignUser, setAssignUser] = useState({ userId: '', role: 'VIEWER' })
  const [searchQuery, setSearchQuery] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [projectsRes, usersRes] = await Promise.all([
        fetch('/api/admin/projects'),
        fetch('/api/admin/users')
      ])
      const projectsData = await projectsRes.json()
      const usersData = await usersRes.json()
      if (projectsData.projects) setProjects(projectsData.projects)
      if (usersData.users) setUsers(usersData.users)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjectUsers = async (projectId: string) => {
    try {
      const res = await fetch(`/api/admin/projects/users?projectId=${projectId}`)
      const data = await res.json()
      if (data.userProjects) setProjectUsers(data.userProjects)
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProject.name, description: newProject.description, ownerId: currentUser?.id })
      })
      if (res.ok) {
        setShowCreateModal(false)
        setNewProject({ name: '', description: '' })
        fetchData()
      }
    } catch (err) { console.error(err) }
    finally { setSubmitting(false) }
  }

  const handleTogglePin = async (project: Project) => {
    // Optimistic update
    setProjects(prev => prev.map(p => p.id === project.id ? { ...p, pinned: !p.pinned } : p))
    try {
      await fetch('/api/admin/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, pinned: !project.pinned })
      })
    } catch (err) {
      // Revert on error
      setProjects(prev => prev.map(p => p.id === project.id ? { ...p, pinned: project.pinned } : p))
    }
  }

  const handleAssignUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/projects/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: assignUser.userId, projectId: selectedProject?.id, role: assignUser.role })
      })
      if (res.ok) {
        setAssignUser({ userId: '', role: 'VIEWER' })
        if (selectedProject) fetchProjectUsers(selectedProject.id)
      }
    } catch (err) { console.error(err) }
    finally { setSubmitting(false) }
  }

  const handleRemoveUser = async (userProjectId: string) => {
    if (!confirm('ต้องการลบสมาชิกออกจากโปรเจคนี้จริงหรือไม่?')) return
    try {
      const res = await fetch(`/api/admin/projects/users?id=${userProjectId}`, { method: 'DELETE' })
      if (res.ok && selectedProject) fetchProjectUsers(selectedProject.id)
    } catch (err) { console.error(err) }
  }

  const openUserModal = (project: Project) => {
    setSelectedProject(project)
    setShowUserModal(true)
    fetchProjectUsers(project.id)
  }

  const getRoleBadge = (role: string) => {
    const map: Record<string, string> = {
      ADMIN: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
      OFFICER: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      VIEWER: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
    return map[role] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  }

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Sort: pinned first, then by created_at
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

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
        <div className="sticky top-0 z-20 bg-midnight-950/80 backdrop-blur-xl border-b border-white/[0.04] px-4 sm:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white pl-12 lg:pl-0">Projects</h1>
              <p className="text-sm text-midnight-500 pl-12 lg:pl-0">Manage team projects and members</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-600" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full sm:w-56 bg-white/[0.04] border border-white/[0.06] rounded-lg text-sm text-white placeholder-midnight-600 focus:outline-none focus:border-violet-500/40 transition-colors"
                />
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Project
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-8">
          {/* Project Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedProjects.map((project) => (
              <div key={project.id} className={`bg-white/[0.02] border rounded-xl p-6 transition-all group ${project.pinned ? 'border-amber-500/20 ring-1 ring-amber-500/10' : 'border-white/[0.06] hover:border-violet-500/20'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-violet-500/10 rounded-lg flex items-center justify-center">
                    <LayoutGrid className="w-5 h-5 text-violet-400" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleTogglePin(project)}
                      className={`p-1.5 rounded-md transition-all ${project.pinned
                        ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                        : 'text-midnight-700 hover:text-amber-400 hover:bg-amber-500/10 opacity-0 group-hover:opacity-100'
                        }`}
                      title={project.pinned ? 'Unpin' : 'Pin to top'}
                    >
                      {project.pinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
                    </button>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-md border border-emerald-500/20 uppercase">
                      {project.status}
                    </span>
                  </div>
                </div>
                <h3
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="text-base font-bold text-white mb-1 flex items-center gap-2 cursor-pointer hover:text-violet-400 transition-colors"
                >
                  {project.name}
                  {project.pinned && <Pin className="w-3 h-3 text-amber-400" />}
                </h3>
                <p className="text-sm text-midnight-500 mb-5 line-clamp-2">
                  {project.description || 'No description'}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-white/[0.04]">
                  <div className="flex items-center gap-1.5 text-midnight-600 text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openUserModal(project)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-midnight-400 hover:text-white rounded-lg transition-all"
                    >
                      <Users className="w-3.5 h-3.5" />
                      Team
                    </button>
                    <button
                      onClick={() => router.push(`/projects/${project.id}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-xs font-medium text-white rounded-lg transition-all"
                    >
                      Manage
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredProjects.length === 0 && (
            <div className="py-24 text-center">
              <FolderPlus className="w-10 h-10 text-midnight-700 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">No projects yet</h3>
              <p className="text-midnight-500 text-sm">Create your first project to get started.</p>
            </div>
          )}
        </div>
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f0f23] border border-white/[0.08] rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">New Project</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-midnight-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-midnight-300 mb-1.5">Name</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white text-sm placeholder-midnight-600 focus:outline-none focus:border-violet-500/40"
                  placeholder="Project name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-midnight-300 mb-1.5">Description</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white text-sm placeholder-midnight-600 h-24 resize-none focus:outline-none focus:border-violet-500/40"
                  placeholder="Brief description..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-midnight-400 border border-white/[0.08] rounded-lg hover:bg-white/[0.04]">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{submitting ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Modal */}
      {showUserModal && selectedProject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f0f23] border border-white/[0.08] rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Team Members</h3>
                <p className="text-sm text-midnight-500">{selectedProject.name}</p>
              </div>
              <button onClick={() => setShowUserModal(false)} className="p-1 text-midnight-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAssignUser} className="flex gap-2 mb-6 p-4 bg-white/[0.03] border border-white/[0.04] rounded-xl">
              <select
                value={assignUser.userId}
                onChange={(e) => setAssignUser({ ...assignUser, userId: e.target.value })}
                className="flex-1 px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white text-sm focus:outline-none appearance-none"
                required
              >
                <option value="" className="bg-[#0f0f23]">Select user...</option>
                {users.map((u) => <option key={u.id} value={u.id} className="bg-[#0f0f23]">{u.name}</option>)}
              </select>
              <select
                value={assignUser.role}
                onChange={(e) => setAssignUser({ ...assignUser, role: e.target.value })}
                className="px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white text-sm focus:outline-none appearance-none"
              >
                <option value="VIEWER">Viewer</option>
                <option value="OFFICER">Officer</option>
                <option value="ADMIN">Admin</option>
              </select>
              <button type="submit" className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg"><Plus className="w-4 h-4" /></button>
            </form>

            <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
              {projectUsers.map((pu) => (
                <div key={pu.id} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg border border-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-midnight-800 flex items-center justify-center text-white text-xs font-bold">
                      {pu.users?.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{pu.users?.name}</p>
                      <p className="text-xs text-midnight-600">{pu.users?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase ${getRoleBadge(pu.role)}`}>{pu.role}</span>
                    <button onClick={() => handleRemoveUser(pu.id)} className="p-1.5 text-midnight-600 hover:text-red-400 rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
              {projectUsers.length === 0 && (
                <p className="text-center text-midnight-600 text-sm py-8">No members assigned yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

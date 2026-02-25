'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import {
  FolderPlus,
  Search,
  Users,
  LayoutGrid,
  Settings2,
  Clock,
  UserPlus,
  Trash2,
  X,
  ChevronRight,
  Plus
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string | null
  status: string
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
    try {
      const res = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProject.name,
          description: newProject.description,
          ownerId: currentUser?.id
        })
      })

      if (res.ok) {
        setShowCreateModal(false)
        setNewProject({ name: '', description: '' })
        fetchData()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleAssignUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/projects/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: assignUser.userId,
          projectId: selectedProject?.id,
          role: assignUser.role
        })
      })

      if (res.ok) {
        setAssignUser({ userId: '', role: 'VIEWER' })
        if (selectedProject) fetchProjectUsers(selectedProject.id)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleRemoveUser = async (userProjectId: string) => {
    try {
      const res = await fetch(`/api/admin/projects/users?id=${userProjectId}`, {
        method: 'DELETE'
      })

      if (res.ok && selectedProject) {
        fetchProjectUsers(selectedProject.id)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const openUserModal = (project: Project) => {
    setSelectedProject(project)
    setShowUserModal(true)
    fetchProjectUsers(project.id)
  }

  const getRoleBadge = (role: string) => {
    const styles: any = {
      ADMIN: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      OFFICER: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      VIEWER: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
    return styles[role] || 'bg-slate-500/10 text-slate-400 border-white/5'
  }

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-midnight-400 font-medium animate-pulse">Loading projects...</p>
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
            <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2 text-glow text-edge-outline">
              Project Hub
            </h1>
            <p className="text-midnight-400 font-medium text-lg">
              Oversee and orchestrate team initiatives
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group min-w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-midnight-500 group-focus-within:text-violet-500 transition-colors" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-midnight-600 focus:outline-none focus:border-violet-500/50 transition-all text-sm backdrop-blur-sm"
              />
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 rounded-2xl text-white font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-violet-600/20 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="glass-dark rounded-[2.5rem] p-8 border border-white/10 hover:border-violet-500/30 transition-all duration-500 group relative overflow-hidden flex flex-col"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 rounded-full blur-3xl group-hover:bg-violet-600/10 transition-colors" />

              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="w-14 h-14 glass bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <LayoutGrid className="w-7 h-7 text-violet-500" />
                </div>
                <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                  {project.status}
                </span>
              </div>

              <div className="relative z-10 flex-1">
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-glow transition-all">{project.name}</h3>
                <p className="text-midnight-400 text-sm leading-relaxed mb-8 line-clamp-3 font-medium">
                  {project.description || 'No description provided for this project.'}
                </p>
              </div>

              <div className="pt-6 border-t border-white/5 flex items-center justify-between relative z-10 mt-auto">
                <div className="flex items-center gap-2 text-midnight-500 text-xs font-bold uppercase tracking-wider">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
                <button
                  onClick={() => openUserModal(project)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-violet-600 text-white text-xs font-bold rounded-xl transition-all group/btn"
                >
                  <Users className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                  <span>Team</span>
                  <ChevronRight className="w-3 h-3 text-white/30 group-hover/btn:text-white" />
                </button>
              </div>
            </div>
          ))}

          {filteredProjects.length === 0 && (
            <div className="col-span-full py-32 text-center glass-dark rounded-[3rem] border border-dashed border-white/10">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <FolderPlus className="w-10 h-10 text-midnight-800" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">No projects found</h3>
              <p className="text-midnight-500 max-w-sm mx-auto font-medium">
                Ready to launch something new? Click &quot;New Project&quot; to begin your next initiative.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-midnight-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="glass-dark rounded-[3rem] p-12 w-full max-w-xl border border-white/10 shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600" />
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-8 right-8 p-2 text-midnight-500 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Launch Project</h3>
            <p className="text-midnight-400 mb-10 font-medium">Define the core vision for your new team initiative.</p>

            <form onSubmit={handleCreateProject} className="space-y-8">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-midnight-300 ml-1">Project Name</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-6 py-4 bg-midnight-950/50 border border-white/5 rounded-2xl text-white placeholder-midnight-700 focus:outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/5 transition-all outline-none"
                  placeholder="e.g., Enterprise Architecture Rewrite"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-midnight-300 ml-1">Mission Description</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full px-6 py-4 bg-midnight-950/50 border border-white/5 rounded-2xl text-white placeholder-midnight-700 h-40 focus:outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/5 transition-all resize-none outline-none"
                  placeholder="Outline the objectives and scope..."
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-8 py-4 rounded-2xl border border-white/10 text-midnight-400 font-bold hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-2xl hover:scale-105 transition-all shadow-lg shadow-violet-600/20 active:scale-95"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Project Users Modal */}
      {showUserModal && selectedProject && (
        <div className="fixed inset-0 bg-midnight-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="glass-dark rounded-[3rem] p-10 w-full max-w-2xl border border-white/10 shadow-2xl relative">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-extrabold text-white tracking-tight">Project Team</h3>
                <p className="text-midnight-500 font-medium">{selectedProject.name}</p>
              </div>
              <button
                onClick={() => setShowUserModal(false)}
                className="p-2 text-midnight-500 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Add User Section */}
            <div className="p-6 bg-white/5 rounded-3xl border border-white/5 mb-8">
              <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-violet-400" />
                Assign Member
              </h4>
              <form onSubmit={handleAssignUser} className="flex gap-4">
                <div className="relative flex-1">
                  <select
                    value={assignUser.userId}
                    onChange={(e) => setAssignUser({ ...assignUser, userId: e.target.value })}
                    className="w-full px-4 py-3 bg-midnight-950/50 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500/50 transition-all appearance-none cursor-pointer"
                    required
                  >
                    <option value="" className="bg-midnight-900">Choose team member...</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id} className="bg-midnight-900">{user.name} ({user.email})</option>
                    ))}
                  </select>
                </div>
                <select
                  value={assignUser.role}
                  onChange={(e) => setAssignUser({ ...assignUser, role: e.target.value })}
                  className="px-4 py-3 bg-midnight-950/50 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="VIEWER">Viewer</option>
                  <option value="OFFICER">Officer</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <button type="submit" className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </form>
            </div>

            {/* Member List */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {projectUsers.map((pu) => (
                <div key={pu.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group transition-colors hover:bg-white/10">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-midnight-800 flex items-center justify-center text-white font-bold border border-white/5 shadow-inner">
                      {pu.users?.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold">{pu.users?.name}</p>
                      <p className="text-midnight-500 text-xs font-medium">{pu.users?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-widest ${getRoleBadge(pu.role)}`}>
                      {pu.role}
                    </span>
                    <button
                      onClick={() => handleRemoveUser(pu.id)}
                      className="p-2 text-midnight-600 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all"
                      title="Remove Member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {projectUsers.length === 0 && (
                <div className="text-center py-12 text-midnight-600 font-medium italic border border-dashed border-white/5 rounded-2xl">
                  No members assigned to this mission yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

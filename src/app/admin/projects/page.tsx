'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
      ADMIN: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      OFFICER: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      VIEWER: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
    return styles[role] || 'bg-gray-500/20 text-gray-400'
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-white">AOT Manager</h1>
          </div>
          <div className="flex items-center gap-4">
            <a href="/admin/users" className="text-slate-300 hover:text-white text-sm">จัดการผู้ใช้</a>
            <a href="/admin/projects" className="text-violet-400 hover:text-violet-300 text-sm">จัดการโปรเจค</a>
            <a href="/profile" className="text-slate-300 hover:text-white text-sm">โปรไฟล์</a>
            <button onClick={() => { localStorage.removeItem('user'); router.push('/login') }} className="text-slate-400 hover:text-white text-sm">
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">จัดการโปรเจค</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm"
          >
            + สร้างโปรเจค
          </button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div key={project.id} className="bg-slate-800 rounded-xl p-5">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-white font-medium">{project.name}</h3>
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                  {project.status}
                </span>
              </div>
              <p className="text-slate-400 text-sm mb-4">{project.description || '-'}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => openUserModal(project)}
                  className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg"
                >
                  จัดการสมาชิก
                </button>
              </div>
            </div>
          ))}
          
          {projects.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-400">
              ไม่มีโปรเจค
            </div>
          )}
        </div>
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">สร้างโปรเจคใหม่</h3>
            <form onSubmit={handleCreateProject}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">ชื่อโปรเจค</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">รายละเอียด</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white h-24"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg"
                >
                  สร้าง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Project Users Modal */}
      {showUserModal && selectedProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-white mb-2">จัดการสมาชิกโปรเจค</h3>
            <p className="text-slate-400 text-sm mb-4">{selectedProject.name}</p>
            
            {/* Add User Form */}
            <form onSubmit={handleAssignUser} className="mb-4 p-4 bg-slate-900 rounded-lg">
              <div className="flex gap-2">
                <select
                  value={assignUser.userId}
                  onChange={(e) => setAssignUser({ ...assignUser, userId: e.target.value })}
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                  required
                >
                  <option value="">เลือกผู้ใช้</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                  ))}
                </select>
                <select
                  value={assignUser.role}
                  onChange={(e) => setAssignUser({ ...assignUser, role: e.target.value })}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                >
                  <option value="VIEWER">Viewer</option>
                  <option value="OFFICER">Officer</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <button type="submit" className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm">
                  เพิ่ม
                </button>
              </div>
            </form>

            {/* User List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {projectUsers.map((pu) => (
                <div key={pu.id} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
                  <div>
                    <p className="text-white text-sm">{pu.users?.name}</p>
                    <p className="text-slate-400 text-xs">{pu.users?.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs border ${getRoleBadge(pu.role)}`}>
                      {pu.role}
                    </span>
                    <button
                      onClick={() => handleRemoveUser(pu.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              ))}
              {projectUsers.length === 0 && (
                <p className="text-center text-slate-400 py-4">ยังไม่มีสมาชิก</p>
              )}
            </div>

            <button
              onClick={() => setShowUserModal(false)}
              className="w-full mt-4 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg"
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

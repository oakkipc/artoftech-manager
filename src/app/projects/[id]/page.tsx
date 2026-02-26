'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from '@/components/Sidebar'
import {
    ArrowLeft,
    Plus,
    X,
    GripVertical,
    Trash2,
    Calendar,
    CheckSquare,
    Square,
    UserPlus,
    Users,
    ListTodo,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Link2,
    ExternalLink,
    Tag,
    Settings
} from 'lucide-react'

interface ChecklistItem {
    id: string
    title: string
    completed: boolean
    position: number
}

interface Task {
    id: string
    title: string
    description: string | null
    status: string
    position: number
    due_date: string | null
    assigned_to: string | null
    assigned_user: { id: string; name: string; email: string } | null
    category_id: string | null
    created_at: string
    checklists?: ChecklistItem[]
}

interface TaskCategory {
    id: string
    project_id: string
    name: string
    color: string
}

interface Project {
    id: string
    name: string
    description: string | null
    status: string
}

interface UserProject {
    id: string
    user_id: string
    role: string
    users: { id: string; name: string; email: string }
}

interface ProjectLink {
    id: string
    label: string
    url: string
    type: string
}

const COLUMNS = [
    { key: 'TODO', label: 'To Do', color: 'border-blue-500/30', dotColor: 'bg-blue-400', bgHover: 'bg-blue-500/5' },
    { key: 'IN_PROGRESS', label: 'In Progress', color: 'border-amber-500/30', dotColor: 'bg-amber-400', bgHover: 'bg-amber-500/5' },
    { key: 'DONE', label: 'Done', color: 'border-emerald-500/30', dotColor: 'bg-emerald-400', bgHover: 'bg-emerald-500/5' },
]

export default function ProjectDetailPage() {
    const router = useRouter()
    const params = useParams()
    const projectId = params.id as string

    const [project, setProject] = useState<Project | null>(null)
    const [tasks, setTasks] = useState<Task[]>([])
    const [members, setMembers] = useState<UserProject[]>([])
    const [loading, setLoading] = useState(true)
    const [newTaskTitle, setNewTaskTitle] = useState('')
    const [addingTo, setAddingTo] = useState<string | null>(null)

    // Project links
    const [projectLinks, setProjectLinks] = useState<ProjectLink[]>([])
    const [showAddLink, setShowAddLink] = useState(false)
    const [newLink, setNewLink] = useState({ label: '', url: '', type: 'WEBSITE' })

    // Categories
    const [categories, setCategories] = useState<TaskCategory[]>([])
    const [filterCategory, setFilterCategory] = useState<string | null>(null)
    const [newTaskCategory, setNewTaskCategory] = useState<string>('')
    const [showCategoryModal, setShowCategoryModal] = useState(false)
    const [newCatName, setNewCatName] = useState('')
    const [newCatColor, setNewCatColor] = useState('#8b5cf6')

    // Drag state
    const [draggedTask, setDraggedTask] = useState<Task | null>(null)
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

    // Task detail modal
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [taskChecklists, setTaskChecklists] = useState<ChecklistItem[]>([])
    const [newChecklistTitle, setNewChecklistTitle] = useState('')
    const [editingDescription, setEditingDescription] = useState(false)
    const [tempDescription, setTempDescription] = useState('')

    useEffect(() => {
        const userStr = localStorage.getItem('user')
        if (!userStr) { router.push('/login'); return }
        fetchAll()
    }, [projectId])

    const fetchAll = async () => {
        try {
            const [projectRes, tasksRes, membersRes, linksRes, catsRes] = await Promise.all([
                fetch(`/api/admin/projects?id=${projectId}`),
                fetch(`/api/tasks?projectId=${projectId}`),
                fetch(`/api/admin/projects/users?projectId=${projectId}`),
                fetch(`/api/projects/links?projectId=${projectId}`),
                fetch(`/api/projects/categories?projectId=${projectId}`)
            ])
            const projectData = await projectRes.json()
            const tasksData = await tasksRes.json()
            const membersData = await membersRes.json()
            const linksData = await linksRes.json()
            const catsData = await catsRes.json()

            if (projectData.project) setProject(projectData.project)
            if (tasksData.tasks) setTasks(tasksData.tasks)
            if (membersData.userProjects) setMembers(membersData.userProjects)
            if (linksData.links) setProjectLinks(linksData.links)
            if (catsData.categories) setCategories(catsData.categories)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const getColumnTasks = (status: string) => {
        return tasks
            .filter(t => t.status === status)
            .filter(t => !filterCategory || t.category_id === filterCategory)
            .sort((a, b) => a.position - b.position)
    }

    const handleAddTask = async (status: string) => {
        if (!newTaskTitle.trim()) return
        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, title: newTaskTitle, status, categoryId: newTaskCategory || null })
            })
            const data = await res.json()
            if (data.task) {
                setTasks(prev => [...prev, data.task])
                setNewTaskTitle('')
                setNewTaskCategory('')
                setAddingTo(null)
            }
        } catch (err) { console.error(err) }
    }

    const handleDeleteTask = async (taskId: string, e?: React.MouseEvent) => {
        e?.stopPropagation()
        if (!confirm('ต้องการลบ task นี้จริงหรือไม่?')) return
        try {
            await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
            setTasks(prev => prev.filter(t => t.id !== taskId))
            if (selectedTask?.id === taskId) setSelectedTask(null)
        } catch (err) { console.error(err) }
    }

    // Task Detail Modal
    const openTaskDetail = async (task: Task) => {
        setSelectedTask(task)
        setTempDescription(task.description || '')
        setEditingDescription(false)
        // Fetch checklists
        try {
            const res = await fetch(`/api/checklists?taskId=${task.id}`)
            const data = await res.json()
            if (data.checklists) setTaskChecklists(data.checklists)
            else setTaskChecklists([])
        } catch { setTaskChecklists([]) }
    }

    const updateTask = async (taskId: string, updates: any) => {
        try {
            const res = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            })
            const data = await res.json()
            if (data.task) {
                setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...data.task } : t))
                if (selectedTask?.id === taskId) setSelectedTask(prev => prev ? { ...prev, ...data.task } : null)
            }
        } catch (err) { console.error(err) }
    }

    const handleSaveDescription = async () => {
        if (!selectedTask) return
        await updateTask(selectedTask.id, { description: tempDescription })
        setEditingDescription(false)
    }

    const handleSetDueDate = async (date: string) => {
        if (!selectedTask) return
        await updateTask(selectedTask.id, { dueDate: date || null })
    }

    const handleAssignMember = async (userId: string) => {
        if (!selectedTask) return
        await updateTask(selectedTask.id, { assignedTo: userId || null })
    }

    // Checklist actions
    const handleAddChecklist = async () => {
        if (!newChecklistTitle.trim() || !selectedTask) return
        try {
            const res = await fetch('/api/checklists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId: selectedTask.id, title: newChecklistTitle })
            })
            const data = await res.json()
            if (data.checklist) {
                setTaskChecklists(prev => [...prev, data.checklist])
                setNewChecklistTitle('')
            }
        } catch (err) { console.error(err) }
    }

    const handleToggleChecklist = async (item: ChecklistItem) => {
        // Optimistic
        setTaskChecklists(prev => prev.map(c => c.id === item.id ? { ...c, completed: !c.completed } : c))
        try {
            await fetch('/api/checklists', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: item.id, completed: !item.completed })
            })
        } catch (err) { console.error(err) }
    }

    const handleDeleteChecklist = async (id: string) => {
        if (!confirm('ต้องการลบ checklist item นี้จริงหรือไม่?')) return
        setTaskChecklists(prev => prev.filter(c => c.id !== id))
        try {
            await fetch(`/api/checklists?id=${id}`, { method: 'DELETE' })
        } catch (err) { console.error(err) }
    }

    // Drag & Drop
    const handleDragStart = (e: React.DragEvent, task: Task) => {
        setDraggedTask(task)
        e.dataTransfer.effectAllowed = 'move'
        setTimeout(() => (e.currentTarget as HTMLElement).style.opacity = '0.5', 0)
    }
    const handleDragEnd = (e: React.DragEvent) => {
        (e.currentTarget as HTMLElement).style.opacity = '1'
        setDraggedTask(null)
        setDragOverColumn(null)
    }
    const handleDragOver = (e: React.DragEvent, column: string) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setDragOverColumn(column)
    }
    const handleDragLeave = () => setDragOverColumn(null)

    const handleDrop = async (e: React.DragEvent, newStatus: string) => {
        e.preventDefault()
        setDragOverColumn(null)
        if (!draggedTask || draggedTask.status === newStatus) { setDraggedTask(null); return }
        const updatedTasks = tasks.map(t =>
            t.id === draggedTask.id ? { ...t, status: newStatus, position: getColumnTasks(newStatus).length } : t
        )
        setTasks(updatedTasks)
        try {
            await fetch(`/api/tasks/${draggedTask.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus, position: getColumnTasks(newStatus).length })
            })
        } catch { fetchAll() }
        setDraggedTask(null)
    }

    // Project links
    const handleAddLink = async () => {
        if (!newLink.label.trim() || !newLink.url.trim()) return
        try {
            const res = await fetch('/api/projects/links', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, label: newLink.label, url: newLink.url, type: newLink.type })
            })
            const data = await res.json()
            if (data.link) setProjectLinks(prev => [...prev, data.link])
            setNewLink({ label: '', url: '', type: 'WEBSITE' }); setShowAddLink(false)
        } catch (err) { console.error(err) }
    }

    const handleDeleteLink = async (id: string) => {
        if (!confirm('ต้องการลบลิ้งค์นี้จริงหรือไม่?')) return
        setProjectLinks(prev => prev.filter(l => l.id !== id))
        try { await fetch(`/api/projects/links?id=${id}`, { method: 'DELETE' }) } catch { }
    }

    // Helpers
    const getDueDateColor = (dueDate: string | null) => {
        if (!dueDate) return ''
        const d = new Date(dueDate)
        const now = new Date()
        const diff = d.getTime() - now.getTime()
        const days = diff / (1000 * 60 * 60 * 24)
        if (days < 0) return 'text-red-400'
        if (days < 3) return 'text-amber-400'
        return 'text-midnight-500'
    }

    const checklistProgress = () => {
        if (taskChecklists.length === 0) return 0
        return Math.round((taskChecklists.filter(c => c.completed).length / taskChecklists.length) * 100)
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

            <main className="flex-1 min-w-0 flex flex-col">
                {/* Top bar */}
                <div className="sticky top-0 z-20 bg-midnight-950/80 backdrop-blur-xl border-b border-white/[0.04] px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="p-1.5 text-midnight-500 hover:text-white rounded-lg hover:bg-white/[0.04] transition-all">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-white">{project?.name || 'Project'}</h1>
                                <p className="text-sm text-midnight-500">{project?.description || 'Kanban Board'}</p>
                            </div>
                        </div>
                        {members.length > 0 && (
                            <div className="flex items-center gap-3">
                                <span className="text-[11px] font-bold text-midnight-600 uppercase tracking-wider">Team</span>
                                <div className="flex items-center -space-x-2">
                                    {members.slice(0, 5).map((m) => (
                                        <div key={m.id} className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border-2 border-[#0a0a1a] flex items-center justify-center text-violet-400 text-xs font-bold cursor-default" title={`${m.users?.name} (${m.role})`}>
                                            {m.users?.name?.charAt(0)?.toUpperCase()}
                                        </div>
                                    ))}
                                    {members.length > 5 && (
                                        <div className="w-8 h-8 rounded-lg bg-white/[0.06] border-2 border-[#0a0a1a] flex items-center justify-center text-midnight-500 text-xs font-bold">+{members.length - 5}</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Kanban Board */}
                <div className="flex-1 p-6 overflow-x-auto">
                    {/* Project Overview Mini-Dashboard */}
                    {(() => {
                        const total = tasks.length
                        const todo = tasks.filter(t => t.status === 'TODO').length
                        const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length
                        const done = tasks.filter(t => t.status === 'DONE').length
                        const now = new Date()
                        const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'DONE').length
                        const completion = total > 0 ? Math.round((done / total) * 100) : 0

                        return (
                            <div className="mb-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 flex items-center gap-2.5">
                                    <div className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center shrink-0">
                                        <ListTodo className="w-4 h-4 text-cyan-400" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-white leading-none">{total}</p>
                                        <p className="text-[10px] text-midnight-600 font-medium uppercase">Total</p>
                                    </div>
                                </div>
                                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 flex items-center gap-2.5">
                                    <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0">
                                        <ListTodo className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-white leading-none">{todo}</p>
                                        <p className="text-[10px] text-midnight-600 font-medium uppercase">To Do</p>
                                    </div>
                                </div>
                                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 flex items-center gap-2.5">
                                    <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center shrink-0">
                                        <Clock className="w-4 h-4 text-amber-400" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-white leading-none">{inProgress}</p>
                                        <p className="text-[10px] text-midnight-600 font-medium uppercase">Active</p>
                                    </div>
                                </div>
                                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 flex items-center gap-2.5">
                                    <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-white leading-none">{done}</p>
                                        <p className="text-[10px] text-midnight-600 font-medium uppercase">Done</p>
                                    </div>
                                </div>
                                {overdue > 0 && (
                                    <div className="bg-white/[0.02] border border-red-500/20 rounded-xl p-3 flex items-center gap-2.5">
                                        <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center shrink-0">
                                            <AlertTriangle className="w-4 h-4 text-red-400" />
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-white leading-none">{overdue}</p>
                                            <p className="text-[10px] text-midnight-600 font-medium uppercase">Overdue</p>
                                        </div>
                                    </div>
                                )}
                                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 flex items-center gap-2.5">
                                    <div className="w-8 h-8 bg-violet-500/10 rounded-lg flex items-center justify-center shrink-0">
                                        <Users className="w-4 h-4 text-violet-400" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-white leading-none">{members.length}</p>
                                        <p className="text-[10px] text-midnight-600 font-medium uppercase">Members</p>
                                    </div>
                                </div>
                                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <p className="text-[10px] text-midnight-600 font-medium uppercase">Progress</p>
                                        <p className="text-sm font-bold text-white">{completion}%</p>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500" style={{ width: `${completion}%` }} />
                                    </div>
                                </div>
                            </div>
                        )
                    })()}

                    {/* Category Pie Chart */}
                    {tasks.length > 0 && categories.length > 0 && (() => {
                        const catData = categories.map(cat => ({
                            name: cat.name,
                            color: cat.color,
                            count: tasks.filter(t => t.category_id === cat.id).length
                        })).filter(d => d.count > 0)
                        const uncategorized = tasks.filter(t => !t.category_id).length
                        if (uncategorized > 0) catData.push({ name: 'Uncategorized', color: '#4b5563', count: uncategorized })

                        const total = catData.reduce((s, d) => s + d.count, 0)
                        if (total === 0) return null

                        // Build SVG donut segments
                        const radius = 50
                        const cx = 60, cy = 60
                        const circumference = 2 * Math.PI * radius
                        let offset = 0

                        return (
                            <div className="mb-5 bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex items-center gap-6">
                                <div className="shrink-0">
                                    <svg width="120" height="120" viewBox="0 0 120 120">
                                        {catData.map((d, i) => {
                                            const pct = d.count / total
                                            const dashLen = pct * circumference
                                            const dashOffset = -offset
                                            offset += dashLen
                                            return (
                                                <circle key={i} cx={cx} cy={cy} r={radius} fill="none"
                                                    stroke={d.color} strokeWidth="18"
                                                    strokeDasharray={`${dashLen} ${circumference - dashLen}`}
                                                    strokeDashoffset={dashOffset}
                                                    transform={`rotate(-90 ${cx} ${cy})`}
                                                    className="transition-all duration-500" />
                                            )
                                        })}
                                        <text x={cx} y={cy - 4} textAnchor="middle" className="fill-white text-lg font-bold">{total}</text>
                                        <text x={cx} y={cy + 10} textAnchor="middle" className="fill-gray-500 text-[9px]">tasks</text>
                                    </svg>
                                </div>
                                <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2">
                                    {catData.map((d, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                                            <span className="text-xs text-white font-medium truncate">{d.name}</span>
                                            <span className="text-xs text-midnight-500 ml-auto">{d.count}</span>
                                            <span className="text-[10px] text-midnight-600">{Math.round((d.count / total) * 100)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })()}
                    {/* Project Links */}
                    <div className="mb-5 flex flex-wrap items-center gap-2">
                        {projectLinks.map((link) => (
                            <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                                className="group flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg hover:border-violet-500/20 transition-all text-sm">
                                <Link2 className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                                <span className="text-white font-medium">{link.label}</span>
                                <ExternalLink className="w-3 h-3 text-midnight-600 group-hover:text-violet-400" />
                                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteLink(link.id) }}
                                    className="ml-1 p-0.5 text-midnight-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                    <X className="w-3 h-3" />
                                </button>
                            </a>
                        ))}
                        {showAddLink ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-violet-500/20 rounded-lg">
                                <select value={newLink.type} onChange={(e) => setNewLink({ ...newLink, type: e.target.value })}
                                    className="bg-transparent text-xs text-midnight-400 focus:outline-none [color-scheme:dark]">
                                    <option value="WEBSITE" className="bg-[#0f0f23]">Website</option>
                                    <option value="FILE" className="bg-[#0f0f23]">File</option>
                                    <option value="REPO" className="bg-[#0f0f23]">Repo</option>
                                    <option value="DESIGN" className="bg-[#0f0f23]">Design</option>
                                    <option value="OTHER" className="bg-[#0f0f23]">Other</option>
                                </select>
                                <input type="text" value={newLink.label} onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                                    className="w-24 bg-transparent text-white text-sm placeholder-midnight-600 focus:outline-none" placeholder="Label" />
                                <input type="url" value={newLink.url} onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddLink() }}
                                    className="w-40 bg-transparent text-white text-sm placeholder-midnight-600 focus:outline-none" placeholder="https://..." />
                                <button onClick={handleAddLink} className="text-violet-400 hover:text-violet-300"><Plus className="w-4 h-4" /></button>
                                <button onClick={() => setShowAddLink(false)} className="text-midnight-500 hover:text-white"><X className="w-3.5 h-3.5" /></button>
                            </div>
                        ) : (
                            <button onClick={() => setShowAddLink(true)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs text-midnight-500 hover:text-violet-400 border border-dashed border-white/[0.06] hover:border-violet-500/20 rounded-lg transition-all">
                                <Plus className="w-3.5 h-3.5" /> Add Link
                            </button>
                        )}
                    </div>

                    {/* Category Filter Bar */}
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                        <Tag className="w-4 h-4 text-midnight-500" />
                        <button onClick={() => setFilterCategory(null)}
                            className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${!filterCategory ? 'bg-violet-600 border-violet-500 text-white' : 'border-white/[0.08] text-midnight-500 hover:text-white hover:border-white/[0.15]'
                                }`}>All</button>
                        {categories.map(cat => (
                            <button key={cat.id} onClick={() => setFilterCategory(filterCategory === cat.id ? null : cat.id)}
                                className={`px-3 py-1 text-xs font-medium rounded-full border transition-all flex items-center gap-1.5 ${filterCategory === cat.id ? 'text-white border-white/20' : 'text-midnight-400 border-white/[0.06] hover:border-white/[0.15] hover:text-white'
                                    }`}
                                style={filterCategory === cat.id ? { backgroundColor: cat.color + '30', borderColor: cat.color + '60' } : {}}>
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                {cat.name}
                            </button>
                        ))}
                        <button onClick={() => setShowCategoryModal(true)}
                            className="px-2 py-1 text-midnight-600 hover:text-violet-400 transition-colors">
                            <Settings className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="flex gap-4 min-h-[calc(100vh-120px)]" style={{ minWidth: 'max-content' }}>
                        {COLUMNS.map((column) => {
                            const columnTasks = getColumnTasks(column.key)
                            const isDragOver = dragOverColumn === column.key
                            return (
                                <div key={column.key}
                                    className={`w-[340px] flex flex-col rounded-xl border transition-colors ${isDragOver ? `border-2 ${column.color} ${column.bgHover}` : 'border-white/[0.04] bg-white/[0.01]'}`}
                                    onDragOver={(e) => handleDragOver(e, column.key)} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, column.key)}
                                >
                                    {/* Column Header */}
                                    <div className="px-4 py-3 border-b border-white/[0.04] flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${column.dotColor}`} />
                                            <span className="text-sm font-bold text-white">{column.label}</span>
                                            <span className="text-xs text-midnight-600 bg-white/[0.04] px-2 py-0.5 rounded-md font-medium">{columnTasks.length}</span>
                                        </div>
                                        <button onClick={() => { setAddingTo(column.key); setNewTaskTitle('') }} className="p-1 text-midnight-600 hover:text-violet-400 rounded-md hover:bg-white/[0.04] transition-all">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Cards */}
                                    <div className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
                                        {addingTo === column.key && (
                                            <div className="bg-white/[0.04] border border-violet-500/20 rounded-lg p-3">
                                                <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddTask(column.key); if (e.key === 'Escape') setAddingTo(null) }}
                                                    className="w-full bg-transparent text-white text-sm placeholder-midnight-600 focus:outline-none" placeholder="Task title..." autoFocus />
                                                {categories.length > 0 && (
                                                    <select value={newTaskCategory} onChange={(e) => setNewTaskCategory(e.target.value)}
                                                        className="w-full mt-2 px-2 py-1 bg-white/[0.04] border border-white/[0.06] rounded text-xs text-midnight-400 focus:outline-none [color-scheme:dark]">
                                                        <option value="" className="bg-[#0f0f23]">No category</option>
                                                        {categories.map(c => <option key={c.id} value={c.id} className="bg-[#0f0f23]">{c.name}</option>)}
                                                    </select>
                                                )}
                                                <div className="flex items-center gap-2 mt-2">
                                                    <button onClick={() => handleAddTask(column.key)} className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium rounded-md transition-colors">Add</button>
                                                    <button onClick={() => setAddingTo(null)} className="p-1 text-midnight-500 hover:text-white"><X className="w-3.5 h-3.5" /></button>
                                                </div>
                                            </div>
                                        )}

                                        {columnTasks.map((task) => (
                                            <div key={task.id} draggable onDragStart={(e) => handleDragStart(e, task)} onDragEnd={handleDragEnd}
                                                onClick={() => openTaskDetail(task)}
                                                className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-white/[0.12] transition-all group"
                                            >
                                                <div className="flex items-start gap-2">
                                                    <GripVertical className="w-4 h-4 text-midnight-700 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <div className="flex-1 min-w-0">
                                                        {(() => {
                                                            const cat = categories.find(c => c.id === task.category_id); return cat ? (
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium mb-1" style={{ backgroundColor: cat.color + '20', color: cat.color, border: `1px solid ${cat.color}30` }}>
                                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                                                                    {cat.name}
                                                                </span>
                                                            ) : null
                                                        })()}
                                                        <p className="text-sm text-white font-medium">{task.title}</p>
                                                        {task.description && <p className="text-xs text-midnight-500 mt-1 line-clamp-1">{task.description}</p>}
                                                    </div>
                                                    <button onClick={(e) => handleDeleteTask(task.id, e)} className="p-1 text-midnight-700 hover:text-red-400 rounded opacity-0 group-hover:opacity-100 transition-all">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                {/* Meta row */}
                                                <div className="flex items-center gap-2 mt-2 ml-6 flex-wrap">
                                                    {task.due_date && (
                                                        <span className={`flex items-center gap-1 text-[11px] ${getDueDateColor(task.due_date)}`}>
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    )}
                                                    {task.assigned_user && (
                                                        <div className="flex items-center gap-1">
                                                            <div className="w-4 h-4 rounded bg-violet-500/20 flex items-center justify-center">
                                                                <span className="text-[8px] font-bold text-violet-400">{task.assigned_user.name.charAt(0)}</span>
                                                            </div>
                                                            <span className="text-[11px] text-midnight-500">{task.assigned_user.name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {columnTasks.length === 0 && addingTo !== column.key && (
                                            <div className="text-center py-8"><p className="text-xs text-midnight-700">No tasks</p></div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </main>

            {/* Task Detail Modal */}
            {selectedTask && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedTask(null)}>
                    <div className="bg-[#0f0f23] border border-white/[0.08] rounded-2xl w-full max-w-xl shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="px-6 pt-6 pb-4 border-b border-white/[0.04] flex items-start justify-between">
                            <div className="flex-1 min-w-0 mr-4">
                                <h2 className="text-lg font-bold text-white">{selectedTask.title}</h2>
                                <p className="text-xs text-midnight-600 mt-1">
                                    {COLUMNS.find(c => c.key === selectedTask.status)?.label}
                                </p>
                            </div>
                            <button onClick={() => setSelectedTask(null)} className="p-1.5 text-midnight-500 hover:text-white rounded-lg hover:bg-white/[0.04]">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Description */}
                            <div>
                                <h4 className="text-[11px] font-bold text-midnight-500 uppercase tracking-wider mb-2">Description</h4>
                                {editingDescription ? (
                                    <div>
                                        <textarea value={tempDescription} onChange={(e) => setTempDescription(e.target.value)}
                                            className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white text-sm placeholder-midnight-700 focus:outline-none focus:border-violet-500/40 h-20 resize-none" placeholder="Add description..." autoFocus />
                                        <div className="flex gap-2 mt-2">
                                            <button onClick={handleSaveDescription} className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium rounded-md">Save</button>
                                            <button onClick={() => setEditingDescription(false)} className="px-3 py-1 text-midnight-500 hover:text-white text-xs">Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div onClick={() => { setEditingDescription(true); setTempDescription(selectedTask.description || '') }}
                                        className="px-3 py-2 bg-white/[0.03] border border-white/[0.04] rounded-lg text-sm text-midnight-400 cursor-pointer hover:border-white/[0.08] min-h-[40px] transition-colors">
                                        {selectedTask.description || 'Click to add description...'}
                                    </div>
                                )}
                            </div>

                            {/* Due Date, Assignee & Category row */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <h4 className="text-[11px] font-bold text-midnight-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" /> Due Date
                                    </h4>
                                    <input type="date" value={selectedTask.due_date?.split('T')[0] || ''}
                                        onChange={(e) => handleSetDueDate(e.target.value)}
                                        className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white text-sm focus:outline-none focus:border-violet-500/40 [color-scheme:dark]" />
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-bold text-midnight-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <UserPlus className="w-3.5 h-3.5" /> Assignee
                                    </h4>
                                    <select value={selectedTask.assigned_to || ''}
                                        onChange={(e) => handleAssignMember(e.target.value)}
                                        className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white text-sm focus:outline-none focus:border-violet-500/40 [color-scheme:dark]">
                                        <option value="" className="bg-[#0f0f23]">Unassigned</option>
                                        {members.map((m) => (
                                            <option key={m.user_id} value={m.user_id} className="bg-[#0f0f23]">{m.users?.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-bold text-midnight-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Tag className="w-3.5 h-3.5" /> Category
                                    </h4>
                                    <select value={selectedTask.category_id || ''}
                                        onChange={async (e) => {
                                            const categoryId = e.target.value || null
                                            setSelectedTask({ ...selectedTask, category_id: categoryId })
                                            setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, category_id: categoryId } : t))
                                            await fetch(`/api/tasks/${selectedTask.id}`, {
                                                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ categoryId })
                                            })
                                        }}
                                        className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white text-sm focus:outline-none focus:border-violet-500/40 [color-scheme:dark]">
                                        <option value="" className="bg-[#0f0f23]">No category</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id} className="bg-[#0f0f23]">{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Checklists */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-[11px] font-bold text-midnight-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <CheckSquare className="w-3.5 h-3.5" /> Checklist
                                        {taskChecklists.length > 0 && (
                                            <span className="text-midnight-600 ml-1">
                                                ({taskChecklists.filter(c => c.completed).length}/{taskChecklists.length})
                                            </span>
                                        )}
                                    </h4>
                                    {taskChecklists.length > 0 && (
                                        <span className="text-xs text-midnight-500 font-medium">{checklistProgress()}%</span>
                                    )}
                                </div>

                                {/* Progress bar */}
                                {taskChecklists.length > 0 && (
                                    <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden mb-3">
                                        <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-300" style={{ width: `${checklistProgress()}%` }} />
                                    </div>
                                )}

                                {/* Checklist items */}
                                <div className="space-y-1.5">
                                    {taskChecklists.map((item) => (
                                        <div key={item.id} className="flex items-center gap-2 group px-2 py-1.5 rounded-lg hover:bg-white/[0.03] transition-colors">
                                            <button onClick={() => handleToggleChecklist(item)} className="shrink-0">
                                                {item.completed
                                                    ? <CheckSquare className="w-4 h-4 text-violet-400" />
                                                    : <Square className="w-4 h-4 text-midnight-600 hover:text-violet-400 transition-colors" />
                                                }
                                            </button>
                                            <span className={`text-sm flex-1 ${item.completed ? 'line-through text-midnight-600' : 'text-white'}`}>
                                                {item.title}
                                            </span>
                                            <button onClick={() => handleDeleteChecklist(item.id)} className="p-0.5 text-midnight-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Add checklist item */}
                                <div className="flex gap-2 mt-3">
                                    <input type="text" value={newChecklistTitle} onChange={(e) => setNewChecklistTitle(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddChecklist() }}
                                        className="flex-1 px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white text-sm placeholder-midnight-700 focus:outline-none focus:border-violet-500/40"
                                        placeholder="Add item..." />
                                    <button onClick={handleAddChecklist} className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium rounded-lg transition-colors">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Category Management Modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0f0f23] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2"><Tag className="w-5 h-5 text-violet-400" /> Categories</h3>
                            <button onClick={() => setShowCategoryModal(false)} className="p-1 text-midnight-500 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>

                        {/* Add new category */}
                        <div className="flex gap-2 mb-4">
                            <input type="color" value={newCatColor} onChange={(e) => setNewCatColor(e.target.value)}
                                className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-white/[0.06]" />
                            <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
                                onKeyDown={async (e) => {
                                    if (e.key === 'Enter' && newCatName.trim()) {
                                        const res = await fetch('/api/projects/categories', {
                                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ projectId, name: newCatName.trim(), color: newCatColor })
                                        })
                                        const data = await res.json()
                                        if (data.category) { setCategories(prev => [...prev, data.category]); setNewCatName('') }
                                    }
                                }}
                                className="flex-1 px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white text-sm placeholder-midnight-600 focus:outline-none focus:border-violet-500/40" placeholder="Category name..." />
                            <button onClick={async () => {
                                if (!newCatName.trim()) return
                                const res = await fetch('/api/projects/categories', {
                                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ projectId, name: newCatName.trim(), color: newCatColor })
                                })
                                const data = await res.json()
                                if (data.category) { setCategories(prev => [...prev, data.category]); setNewCatName('') }
                            }} className="px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg"><Plus className="w-4 h-4" /></button>
                        </div>

                        {/* List */}
                        <div className="space-y-2">
                            {categories.length === 0 && (
                                <p className="text-sm text-midnight-600 text-center py-4">No categories yet</p>
                            )}
                            {categories.map(cat => (
                                <div key={cat.id} className="flex items-center justify-between px-3 py-2 bg-white/[0.03] border border-white/[0.04] rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                                        <span className="text-sm text-white font-medium">{cat.name}</span>
                                        <span className="text-[10px] text-midnight-600">{tasks.filter(t => t.category_id === cat.id).length} tasks</span>
                                    </div>
                                    <button onClick={async () => {
                                        if (!confirm(`ต้องการลบ category "${cat.name}" จริงหรือไม่?`)) return
                                        await fetch(`/api/projects/categories?id=${cat.id}`, { method: 'DELETE' })
                                        setCategories(prev => prev.filter(c => c.id !== cat.id))
                                        if (filterCategory === cat.id) setFilterCategory(null)
                                    }} className="p-1 text-midnight-700 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from '@/components/Sidebar'
import {
    ArrowLeft,
    Plus,
    X,
    GripVertical,
    Trash2,
    User,
    MoreHorizontal
} from 'lucide-react'

interface Task {
    id: string
    title: string
    description: string | null
    status: string
    position: number
    assigned_to: string | null
    assigned_user: { id: string; name: string; email: string } | null
    created_at: string
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

    // Drag state
    const [draggedTask, setDraggedTask] = useState<Task | null>(null)
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

    useEffect(() => {
        const userStr = localStorage.getItem('user')
        if (!userStr) { router.push('/login'); return }
        fetchAll()
    }, [projectId])

    const fetchAll = async () => {
        try {
            const [projectRes, tasksRes, membersRes] = await Promise.all([
                fetch('/api/admin/projects'),
                fetch(`/api/tasks?projectId=${projectId}`),
                fetch(`/api/admin/projects/users?projectId=${projectId}`)
            ])
            const projectsData = await projectRes.json()
            const tasksData = await tasksRes.json()
            const membersData = await membersRes.json()

            const proj = projectsData.projects?.find((p: any) => p.id === projectId)
            if (proj) setProject(proj)
            if (tasksData.tasks) setTasks(tasksData.tasks)
            if (membersData.userProjects) setMembers(membersData.userProjects)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const getColumnTasks = (status: string) => {
        return tasks
            .filter(t => t.status === status)
            .sort((a, b) => a.position - b.position)
    }

    const handleAddTask = async (status: string) => {
        if (!newTaskTitle.trim()) return
        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, title: newTaskTitle, status })
            })
            const data = await res.json()
            if (data.task) {
                setTasks(prev => [...prev, data.task])
                setNewTaskTitle('')
                setAddingTo(null)
            }
        } catch (err) { console.error(err) }
    }

    const handleDeleteTask = async (taskId: string) => {
        try {
            await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
            setTasks(prev => prev.filter(t => t.id !== taskId))
        } catch (err) { console.error(err) }
    }

    // Drag & Drop handlers
    const handleDragStart = (e: React.DragEvent, task: Task) => {
        setDraggedTask(task)
        e.dataTransfer.effectAllowed = 'move'
        // Make drag image slightly transparent
        const el = e.currentTarget as HTMLElement
        setTimeout(() => el.style.opacity = '0.5', 0)
    }

    const handleDragEnd = (e: React.DragEvent) => {
        const el = e.currentTarget as HTMLElement
        el.style.opacity = '1'
        setDraggedTask(null)
        setDragOverColumn(null)
    }

    const handleDragOver = (e: React.DragEvent, column: string) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setDragOverColumn(column)
    }

    const handleDragLeave = () => {
        setDragOverColumn(null)
    }

    const handleDrop = async (e: React.DragEvent, newStatus: string) => {
        e.preventDefault()
        setDragOverColumn(null)

        if (!draggedTask || draggedTask.status === newStatus) {
            setDraggedTask(null)
            return
        }

        // Optimistically update UI
        const updatedTasks = tasks.map(t => {
            if (t.id === draggedTask.id) {
                return { ...t, status: newStatus, position: getColumnTasks(newStatus).length }
            }
            return t
        })
        setTasks(updatedTasks)

        // Persist to server
        try {
            await fetch(`/api/tasks/${draggedTask.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: newStatus,
                    position: getColumnTasks(newStatus).length
                })
            })
        } catch (err) {
            console.error(err)
            // Revert on error
            fetchAll()
        }

        setDraggedTask(null)
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

                        {/* Team Members */}
                        {members.length > 0 && (
                            <div className="flex items-center gap-3">
                                <span className="text-[11px] font-bold text-midnight-600 uppercase tracking-wider">Team</span>
                                <div className="flex items-center -space-x-2">
                                    {members.slice(0, 5).map((m) => (
                                        <div
                                            key={m.id}
                                            className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border-2 border-[#0a0a1a] flex items-center justify-center text-violet-400 text-xs font-bold cursor-default"
                                            title={`${m.users?.name} (${m.role || 'MEMBER'})`}
                                        >
                                            {m.users?.name?.charAt(0)?.toUpperCase()}
                                        </div>
                                    ))}
                                    {members.length > 5 && (
                                        <div className="w-8 h-8 rounded-lg bg-white/[0.06] border-2 border-[#0a0a1a] flex items-center justify-center text-midnight-500 text-xs font-bold">
                                            +{members.length - 5}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Kanban Board */}
                <div className="flex-1 p-6 overflow-x-auto">
                    <div className="flex gap-4 min-h-[calc(100vh-120px)]" style={{ minWidth: 'max-content' }}>
                        {COLUMNS.map((column) => {
                            const columnTasks = getColumnTasks(column.key)
                            const isDragOver = dragOverColumn === column.key

                            return (
                                <div
                                    key={column.key}
                                    className={`w-[340px] flex flex-col rounded-xl border transition-colors ${isDragOver
                                        ? `border-2 ${column.color} ${column.bgHover}`
                                        : 'border-white/[0.04] bg-white/[0.01]'
                                        }`}
                                    onDragOver={(e) => handleDragOver(e, column.key)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, column.key)}
                                >
                                    {/* Column Header */}
                                    <div className="px-4 py-3 border-b border-white/[0.04] flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${column.dotColor}`} />
                                            <span className="text-sm font-bold text-white">{column.label}</span>
                                            <span className="text-xs text-midnight-600 bg-white/[0.04] px-2 py-0.5 rounded-md font-medium">
                                                {columnTasks.length}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => { setAddingTo(column.key); setNewTaskTitle('') }}
                                            className="p-1 text-midnight-600 hover:text-violet-400 rounded-md hover:bg-white/[0.04] transition-all"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Cards */}
                                    <div className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
                                        {/* Add card inline */}
                                        {addingTo === column.key && (
                                            <div className="bg-white/[0.04] border border-violet-500/20 rounded-lg p-3">
                                                <input
                                                    type="text"
                                                    value={newTaskTitle}
                                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleAddTask(column.key)
                                                        if (e.key === 'Escape') setAddingTo(null)
                                                    }}
                                                    className="w-full bg-transparent text-white text-sm placeholder-midnight-600 focus:outline-none"
                                                    placeholder="Task title..."
                                                    autoFocus
                                                />
                                                <div className="flex items-center gap-2 mt-2">
                                                    <button
                                                        onClick={() => handleAddTask(column.key)}
                                                        className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium rounded-md transition-colors"
                                                    >
                                                        Add
                                                    </button>
                                                    <button
                                                        onClick={() => setAddingTo(null)}
                                                        className="p-1 text-midnight-500 hover:text-white"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {columnTasks.map((task) => (
                                            <div
                                                key={task.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, task)}
                                                onDragEnd={handleDragEnd}
                                                className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-white/[0.12] transition-all group"
                                            >
                                                <div className="flex items-start gap-2">
                                                    <GripVertical className="w-4 h-4 text-midnight-700 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-white font-medium">{task.title}</p>
                                                        {task.description && (
                                                            <p className="text-xs text-midnight-500 mt-1 line-clamp-2">{task.description}</p>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteTask(task.id)}
                                                        className="p-1 text-midnight-700 hover:text-red-400 rounded opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                {task.assigned_user && (
                                                    <div className="flex items-center gap-1.5 mt-2 ml-6">
                                                        <div className="w-4 h-4 rounded bg-violet-500/20 flex items-center justify-center">
                                                            <span className="text-[8px] font-bold text-violet-400">{task.assigned_user.name.charAt(0)}</span>
                                                        </div>
                                                        <span className="text-[11px] text-midnight-500">{task.assigned_user.name}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {columnTasks.length === 0 && addingTo !== column.key && (
                                            <div className="text-center py-8">
                                                <p className="text-xs text-midnight-700">No tasks</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </main>
        </div>
    )
}

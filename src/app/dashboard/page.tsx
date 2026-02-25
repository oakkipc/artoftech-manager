'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from '@/components/Sidebar'
import {
    LayoutGrid,
    CheckCircle2,
    Clock,
    ListTodo,
    ArrowRight,
    FolderPlus,
    AlertTriangle,
    TrendingUp,
    Users,
    Calendar,
    User,
    CircleDot
} from 'lucide-react'

interface TaskItem {
    id: string
    title: string
    due_date: string
    status: string
    project_id: string
    projectName: string
    assigned_user: { id: string; name: string } | null
}

interface ProjectWithCounts {
    id: string
    name: string
    description: string | null
    status: string
    pinned: boolean
    created_at: string
    memberCount: number
    taskCounts: {
        total: number
        done: number
        inProgress: number
        todo: number
        overdue: number
    }
}

interface DashboardStats {
    totalProjects: number
    totalTasks: number
    totalDone: number
    totalInProgress: number
    totalTodo: number
    totalOverdue: number
    completionRate: number
}

export default function DashboardPage() {
    const router = useRouter()
    const [projects, setProjects] = useState<ProjectWithCounts[]>([])
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [upcomingTasks, setUpcomingTasks] = useState<TaskItem[]>([])
    const [overdueTasks, setOverdueTasks] = useState<TaskItem[]>([])
    const [myTasks, setMyTasks] = useState<TaskItem[]>([])
    const [loading, setLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<any>(null)

    useEffect(() => {
        const userStr = localStorage.getItem('user')
        if (!userStr) { router.push('/login'); return }
        const user = JSON.parse(userStr)
        setCurrentUser(user)
        fetchDashboard(user)
    }, [])

    const fetchDashboard = async (user: any) => {
        try {
            const res = await fetch(`/api/dashboard?userId=${user.id}&role=${user.role}`)
            const data = await res.json()
            if (data.projects) setProjects(data.projects)
            if (data.stats) setStats(data.stats)
            if (data.upcomingTasks) setUpcomingTasks(data.upcomingTasks)
            if (data.overdueTasks) setOverdueTasks(data.overdueTasks)
            if (data.myTasks) setMyTasks(data.myTasks)
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }

    const getProgress = (counts: ProjectWithCounts['taskCounts']) => {
        if (counts.total === 0) return 0
        return Math.round((counts.done / counts.total) * 100)
    }

    const sortedProjects = [...projects].sort((a, b) => {
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
                <div className="sticky top-0 z-20 bg-midnight-950/80 backdrop-blur-xl border-b border-white/[0.04] px-8 py-4">
                    <h1 className="text-xl font-bold text-white">Dashboard</h1>
                    <p className="text-sm text-midnight-500">
                        {currentUser?.name ? `Welcome back, ${currentUser.name}` : 'Overview of your projects'}
                    </p>
                </div>

                <div className="p-8">
                    {/* Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex items-center gap-3">
                            <div className="w-9 h-9 bg-violet-500/10 rounded-lg flex items-center justify-center shrink-0">
                                <LayoutGrid className="w-4 h-4 text-violet-400" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-white">{stats?.totalProjects ?? 0}</p>
                                <p className="text-[10px] text-midnight-500 font-medium uppercase">Projects</p>
                            </div>
                        </div>
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex items-center gap-3">
                            <div className="w-9 h-9 bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0">
                                <ListTodo className="w-4 h-4 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-white">{stats?.totalTodo ?? 0}</p>
                                <p className="text-[10px] text-midnight-500 font-medium uppercase">To Do</p>
                            </div>
                        </div>
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex items-center gap-3">
                            <div className="w-9 h-9 bg-amber-500/10 rounded-lg flex items-center justify-center shrink-0">
                                <Clock className="w-4 h-4 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-white">{stats?.totalInProgress ?? 0}</p>
                                <p className="text-[10px] text-midnight-500 font-medium uppercase">Active</p>
                            </div>
                        </div>
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex items-center gap-3">
                            <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-white">{stats?.totalDone ?? 0}</p>
                                <p className="text-[10px] text-midnight-500 font-medium uppercase">Done</p>
                            </div>
                        </div>
                        <div className={`bg-white/[0.02] border rounded-xl p-4 flex items-center gap-3 ${(stats?.totalOverdue ?? 0) > 0 ? 'border-red-500/20' : 'border-white/[0.06]'}`}>
                            <div className="w-9 h-9 bg-red-500/10 rounded-lg flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-4 h-4 text-red-400" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-white">{stats?.totalOverdue ?? 0}</p>
                                <p className="text-[10px] text-midnight-500 font-medium uppercase">Overdue</p>
                            </div>
                        </div>
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex items-center gap-3">
                            <div className="w-9 h-9 bg-indigo-500/10 rounded-lg flex items-center justify-center shrink-0">
                                <TrendingUp className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-white">{stats?.completionRate ?? 0}%</p>
                                <p className="text-[10px] text-midnight-500 font-medium uppercase">Complete</p>
                            </div>
                        </div>
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex items-center gap-3">
                            <div className="w-9 h-9 bg-cyan-500/10 rounded-lg flex items-center justify-center shrink-0">
                                <ListTodo className="w-4 h-4 text-cyan-400" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-white">{stats?.totalTasks ?? 0}</p>
                                <p className="text-[10px] text-midnight-500 font-medium uppercase">All Tasks</p>
                            </div>
                        </div>
                    </div>

                    {/* My Tasks */}
                    {myTasks.length > 0 && (
                        <div className="bg-gradient-to-r from-violet-600/[0.06] to-indigo-600/[0.04] border border-violet-500/15 rounded-xl p-5 mb-8">
                            <div className="flex items-center gap-2 mb-4">
                                <User className="w-4 h-4 text-violet-400" />
                                <h3 className="text-sm font-bold text-white">My Tasks</h3>
                                <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">{myTasks.length}</span>
                            </div>
                            <div className="space-y-2">
                                {myTasks.map((task) => {
                                    const isOverdue = task.due_date && new Date(task.due_date) < new Date()
                                    return (
                                        <Link key={task.id} href={`/projects/${task.project_id}`}
                                            className={`flex items-center justify-between p-3 rounded-lg border transition-all hover:border-violet-500/30 ${isOverdue ? 'bg-red-500/[0.04] border-red-500/15' : 'bg-white/[0.03] border-white/[0.04]'
                                                }`}>
                                            <div className="flex items-center gap-3 flex-1 min-w-0 mr-3">
                                                <CircleDot className={`w-4 h-4 shrink-0 ${task.status === 'IN_PROGRESS' ? 'text-amber-400' : 'text-blue-400'}`} />
                                                <div className="min-w-0">
                                                    <p className="text-sm text-white font-medium truncate">{task.title}</p>
                                                    <p className="text-[11px] text-midnight-600">{task.projectName}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${task.status === 'IN_PROGRESS'
                                                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                    }`}>{task.status === 'IN_PROGRESS' ? 'Active' : 'To Do'}</span>
                                                {task.due_date && (
                                                    <span className={`text-[11px] flex items-center gap-1 ${isOverdue ? 'text-red-400' : 'text-midnight-500'}`}>
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Overdue & Upcoming */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Overdue Tasks */}
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <AlertTriangle className="w-4 h-4 text-red-400" />
                                <h3 className="text-sm font-bold text-white">Overdue Tasks</h3>
                                {overdueTasks.length > 0 && (
                                    <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">{overdueTasks.length}</span>
                                )}
                            </div>
                            {overdueTasks.length > 0 ? (
                                <div className="space-y-2">
                                    {overdueTasks.map((task) => (
                                        <Link key={task.id} href={`/projects/${task.project_id}`}
                                            className="flex items-center justify-between p-3 bg-red-500/[0.03] border border-red-500/10 rounded-lg hover:border-red-500/20 transition-all group">
                                            <div className="flex-1 min-w-0 mr-3">
                                                <p className="text-sm text-white font-medium truncate">{task.title}</p>
                                                <p className="text-[11px] text-midnight-600">{task.projectName}</p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-[11px] text-red-400 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </span>
                                                {task.assigned_user && (
                                                    <div className="w-5 h-5 rounded bg-red-500/20 flex items-center justify-center">
                                                        <span className="text-[9px] font-bold text-red-300">{task.assigned_user.name.charAt(0)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-midnight-600 text-center py-6">No overdue tasks 🎉</p>
                            )}
                        </div>

                        {/* Upcoming Deadlines */}
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Calendar className="w-4 h-4 text-amber-400" />
                                <h3 className="text-sm font-bold text-white">Upcoming (7 days)</h3>
                            </div>
                            {upcomingTasks.length > 0 ? (
                                <div className="space-y-2">
                                    {upcomingTasks.map((task) => (
                                        <Link key={task.id} href={`/projects/${task.project_id}`}
                                            className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.04] rounded-lg hover:border-amber-500/20 transition-all">
                                            <div className="flex-1 min-w-0 mr-3">
                                                <p className="text-sm text-white font-medium truncate">{task.title}</p>
                                                <p className="text-[11px] text-midnight-600">{task.projectName}</p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-[11px] text-amber-400 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </span>
                                                {task.assigned_user && (
                                                    <div className="w-5 h-5 rounded bg-violet-500/20 flex items-center justify-center">
                                                        <span className="text-[9px] font-bold text-violet-400">{task.assigned_user.name.charAt(0)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-midnight-600 text-center py-6">No upcoming deadlines</p>
                            )}
                        </div>
                    </div>

                    {/* Project Cards */}
                    <h2 className="text-sm font-bold text-midnight-500 uppercase tracking-wider mb-4">Your Projects</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {sortedProjects.map((project) => {
                            const progress = getProgress(project.taskCounts)
                            return (
                                <Link key={project.id} href={`/projects/${project.id}`}
                                    className={`bg-white/[0.02] border rounded-xl p-6 hover:border-violet-500/20 transition-all group block ${project.pinned ? 'border-amber-500/15' : 'border-white/[0.06]'}`}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-10 h-10 bg-violet-500/10 rounded-lg flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                                            <LayoutGrid className="w-5 h-5 text-violet-400" />
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-midnight-700 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
                                    </div>

                                    <h3 className="text-base font-bold text-white mb-1">{project.name}</h3>
                                    <p className="text-sm text-midnight-500 mb-4 line-clamp-1">{project.description || 'No description'}</p>

                                    {/* Progress */}
                                    <div className="mb-3">
                                        <div className="flex items-center justify-between text-xs mb-1.5">
                                            <span className="text-midnight-500 font-medium">Progress</span>
                                            <span className="text-white font-bold">{progress}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                                        </div>
                                    </div>

                                    {/* Task counts + members */}
                                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                                        <div className="flex items-center gap-3 text-xs text-midnight-500">
                                            <span className="flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" /> {project.taskCounts.todo}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" /> {project.taskCounts.inProgress}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {project.taskCounts.done}
                                            </span>
                                            {project.taskCounts.overdue > 0 && (
                                                <span className="flex items-center gap-1 text-red-400">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" /> {project.taskCounts.overdue}
                                                </span>
                                            )}
                                        </div>
                                        <span className="flex items-center gap-1 text-xs text-midnight-600">
                                            <Users className="w-3 h-3" /> {project.memberCount}
                                        </span>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>

                    {projects.length === 0 && (
                        <div className="py-24 text-center">
                            <FolderPlus className="w-10 h-10 text-midnight-700 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-white mb-1">No projects assigned</h3>
                            <p className="text-midnight-500 text-sm">Ask an admin to assign you to a project.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

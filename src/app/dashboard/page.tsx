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
    FolderPlus
} from 'lucide-react'

interface ProjectWithCounts {
    id: string
    name: string
    description: string | null
    status: string
    created_at: string
    taskCounts: {
        total: number
        done: number
        inProgress: number
        todo: number
    }
}

export default function DashboardPage() {
    const router = useRouter()
    const [projects, setProjects] = useState<ProjectWithCounts[]>([])
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
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const getProgress = (counts: ProjectWithCounts['taskCounts']) => {
        if (counts.total === 0) return 0
        return Math.round((counts.done / counts.total) * 100)
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

            <main className="flex-1 min-w-0">
                {/* Top bar */}
                <div className="sticky top-0 z-20 bg-midnight-950/80 backdrop-blur-xl border-b border-white/[0.04] px-8 py-4">
                    <h1 className="text-xl font-bold text-white">Dashboard</h1>
                    <p className="text-sm text-midnight-500">
                        {currentUser?.name ? `Welcome back, ${currentUser.name}` : 'Overview of your projects'}
                    </p>
                </div>

                <div className="p-8">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 flex items-center gap-4">
                            <div className="w-10 h-10 bg-violet-500/10 rounded-lg flex items-center justify-center">
                                <LayoutGrid className="w-5 h-5 text-violet-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{projects.length}</p>
                                <p className="text-xs text-midnight-500 font-medium">Projects</p>
                            </div>
                        </div>
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                <ListTodo className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{projects.reduce((a, p) => a + p.taskCounts.todo, 0)}</p>
                                <p className="text-xs text-midnight-500 font-medium">To Do</p>
                            </div>
                        </div>
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 flex items-center gap-4">
                            <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                                <Clock className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{projects.reduce((a, p) => a + p.taskCounts.inProgress, 0)}</p>
                                <p className="text-xs text-midnight-500 font-medium">In Progress</p>
                            </div>
                        </div>
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{projects.reduce((a, p) => a + p.taskCounts.done, 0)}</p>
                                <p className="text-xs text-midnight-500 font-medium">Completed</p>
                            </div>
                        </div>
                    </div>

                    {/* Project Cards */}
                    <h2 className="text-sm font-bold text-midnight-500 uppercase tracking-wider mb-4">Your Projects</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {projects.map((project) => {
                            const progress = getProgress(project.taskCounts)
                            return (
                                <Link
                                    key={project.id}
                                    href={`/projects/${project.id}`}
                                    className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 hover:border-violet-500/20 transition-all group block"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-10 h-10 bg-violet-500/10 rounded-lg flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                                            <LayoutGrid className="w-5 h-5 text-violet-400" />
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-midnight-700 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
                                    </div>

                                    <h3 className="text-base font-bold text-white mb-1">{project.name}</h3>
                                    <p className="text-sm text-midnight-500 mb-5 line-clamp-2">
                                        {project.description || 'No description'}
                                    </p>

                                    {/* Progress */}
                                    <div className="mb-3">
                                        <div className="flex items-center justify-between text-xs mb-1.5">
                                            <span className="text-midnight-500 font-medium">Progress</span>
                                            <span className="text-white font-bold">{progress}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Task counts */}
                                    <div className="flex items-center gap-4 text-xs text-midnight-500 pt-3 border-t border-white/[0.04]">
                                        <span className="flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                            {project.taskCounts.todo} todo
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                            {project.taskCounts.inProgress} active
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                            {project.taskCounts.done} done
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

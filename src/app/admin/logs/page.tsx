'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { useSidebar } from '@/context/SidebarContext'
import {
    Activity,
    Clock,
    User,
    Filter,
    Search,
    ChevronDown,
    LayoutGrid,
    CheckCircle2,
    Plus,
    Trash2,
    Edit2,
    Pin,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
    StickyNote,
    Link2,
    Tag,
    ListTodo
} from 'lucide-react'

interface ActivityLog {
    id: string
    user_id: string
    action: string
    entity_type: string
    entity_id: string
    details: any
    created_at: string
    users: { name: string, email: string }
}

export default function AdminLogsPage() {
    const router = useRouter()
    const { isCollapsed } = useSidebar()
    const [logs, setLogs] = useState<ActivityLog[]>([])
    const [loading, setLoading] = useState(true)
    const [filterEntity, setFilterEntity] = useState('')
    const [filterAction, setFilterAction] = useState('')
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        const userStr = localStorage.getItem('user')
        if (userStr) {
            const user = JSON.parse(userStr)
            if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN') {
                router.push('/profile')
                return
            }
            fetchLogs()
        } else {
            router.push('/login')
        }
    }, [])

    const fetchLogs = async () => {
        setLoading(true)
        try {
            let url = '/api/admin/logs?limit=100'
            if (filterEntity) url += `&entityType=${filterEntity}`
            const res = await fetch(url)
            const data = await res.json()
            if (data.logs) setLogs(data.logs)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
    }, [filterEntity])

    const getActionBadge = (action: string) => {
        switch (action) {
            case 'CREATE': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            case 'UPDATE': return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            case 'DELETE': return 'bg-red-500/10 text-red-400 border-red-500/20'
            case 'PIN': return 'bg-violet-500/10 text-violet-400 border-violet-500/20'
            case 'REORDER': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
            default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
        }
    }

    const getEntityIcon = (type: string) => {
        switch (type) {
            case 'PROJECT': return <LayoutGrid className="w-4 h-4" />
            case 'TASK': return <ListTodo className="w-4 h-4" />
            case 'BUDGET': return <Wallet className="w-4 h-4" />
            case 'LINK': return <Link2 className="w-4 h-4" />
            case 'NOTE': return <StickyNote className="w-4 h-4" />
            case 'CATEGORY': return <Tag className="w-4 h-4" />
            default: return <Activity className="w-4 h-4" />
        }
    }

    const filteredLogs = logs.filter(log => {
        const matchesSearch = !searchQuery ||
            log.users?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.entity_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            JSON.stringify(log.details).toLowerCase().includes(searchQuery.toLowerCase())
        const matchesAction = !filterAction || log.action === filterAction
        return matchesSearch && matchesAction
    })

    return (
        <div className="flex h-screen bg-[#02020a] text-zinc-400 overflow-hidden">
            <Sidebar />

            <main className={`flex-1 overflow-y-auto transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
                <div className="p-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Activity className="w-8 h-8 text-violet-500" />
                                <h1 className="text-3xl font-bold text-white tracking-tight">Activity Logs</h1>
                            </div>
                            <p className="text-zinc-500 ml-11">Monitor user actions and system events across the platform.</p>
                        </div>
                    </div>

                    {/* Stats Overiew (Placeholder) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-[#0a0a1a]/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -translate-y-16 translate-x-16" />
                            <p className="text-sm text-zinc-500 mb-1">Total Events (Latest 100)</p>
                            <h3 className="text-3xl font-bold text-white mb-2">{logs.length}</h3>
                            <div className="flex items-center gap-2 text-xs text-emerald-400/80">
                                <Clock className="w-3 h-3" />
                                <span>Updated just now</span>
                            </div>
                        </div>
                        <div className="bg-[#0a0a1a]/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 blur-3xl rounded-full -translate-y-16 translate-x-16" />
                            <p className="text-sm text-zinc-500 mb-1">Active Monitors</p>
                            <h3 className="text-3xl font-bold text-white mb-2">Enabled</h3>
                            <div className="flex items-center gap-2 text-xs text-violet-400/80">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Real-time tracking active</span>
                            </div>
                        </div>
                        <div className="bg-[#0a0a1a]/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full -translate-y-16 translate-x-16" />
                            <p className="text-sm text-zinc-500 mb-1">Last Action</p>
                            <h3 className="text-xl font-bold text-white mb-2 truncate">{logs[0]?.action || 'N/A'}</h3>
                            <p className="text-xs text-zinc-500">{logs[0] ? new Date(logs[0].created_at).toLocaleString() : ''}</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="flex-1 relative group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500 group-focus-within:text-violet-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search logs by user, action, type..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#0a0a1a]/60 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all placeholder:text-zinc-600"
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <select
                                    value={filterEntity}
                                    onChange={(e) => setFilterEntity(e.target.value)}
                                    className="bg-[#0a0a1a]/60 border border-white/10 rounded-xl py-2.5 pl-10 pr-8 text-white focus:outline-none focus:border-violet-500/50 transition-all appearance-none cursor-pointer hover:bg-white/5"
                                >
                                    <option value="">All Entities</option>
                                    <option value="PROJECT">Projects</option>
                                    <option value="TASK">Tasks</option>
                                    <option value="BUDGET">Budget</option>
                                    <option value="LINK">Links</option>
                                    <option value="NOTE">Notes</option>
                                    <option value="CATEGORY">Categories</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                            </div>
                            <div className="relative">
                                <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <select
                                    value={filterAction}
                                    onChange={(e) => setFilterAction(e.target.value)}
                                    className="bg-[#0a0a1a]/60 border border-white/10 rounded-xl py-2.5 pl-10 pr-8 text-white focus:outline-none focus:border-violet-500/50 transition-all appearance-none cursor-pointer hover:bg-white/5"
                                >
                                    <option value="">All Actions</option>
                                    <option value="CREATE">Create</option>
                                    <option value="UPDATE">Update</option>
                                    <option value="DELETE">Delete</option>
                                    <option value="PIN">Pin</option>
                                    <option value="REORDER">Reorder</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Logs Table */}
                    <div className="bg-[#0a0a1a]/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/[0.02] border-b border-white/5 transition-colors">
                                        <th className="py-4 px-6 text-[11px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Timestamp</th>
                                        <th className="py-4 px-6 text-[11px] font-bold text-zinc-500 uppercase tracking-widest leading-none">User</th>
                                        <th className="py-4 px-6 text-[11px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Action</th>
                                        <th className="py-4 px-6 text-[11px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Entity</th>
                                        <th className="py-4 px-6 text-[11px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="w-10 h-10 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                                                    <p className="text-zinc-500 text-sm animate-pulse tracking-wide font-medium">Loading activity logs...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center">
                                                <div className="flex flex-col items-center gap-4 opacity-40">
                                                    <Activity className="w-12 h-12 text-zinc-500" />
                                                    <p className="text-zinc-500 text-sm font-medium tracking-wide">No activity logs found matching your criteria.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredLogs.map((log) => (
                                            <tr key={log.id} className="group hover:bg-white/[0.02] transition-all duration-300 border-white/5">
                                                <td className="py-4 px-6 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-3.5 h-3.5 text-zinc-600 transition-colors group-hover:text-violet-400" />
                                                        <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors">
                                                            {new Date(log.created_at).toLocaleString('th-TH', {
                                                                day: '2-digit', month: '2-digit', year: 'numeric',
                                                                hour: '2-digit', minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center group-hover:bg-violet-500/20 transition-all duration-500 overflow-hidden shadow-inner">
                                                            <User className="w-4 h-4 text-violet-400 drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]" />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-semibold text-white group-hover:text-violet-100 transition-colors duration-300 tracking-tight">{log.users?.name || 'Unknown'}</div>
                                                            <div className="text-xs text-zinc-600 group-hover:text-zinc-500 transition-colors">{log.users?.email || 'N/A'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all duration-300 shadow-sm ${getActionBadge(log.action)}`}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-2 text-zinc-400 group-hover:text-zinc-100 transition-colors">
                                                        <div className="p-1.5 rounded-lg bg-white/5 border border-white/5 group-hover:border-white/10 transition-all">
                                                            {getEntityIcon(log.entity_type)}
                                                        </div>
                                                        <span className="text-xs font-bold uppercase tracking-wider opacity-60 group-hover:opacity-100 transition-opacity">{log.entity_type}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 max-w-md">
                                                    <div className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors line-clamp-2 leading-relaxed font-mono bg-black/20 p-2 rounded-lg border border-white/5 group-hover:border-white/10 shadow-inner overflow-hidden">
                                                        {log.details && Object.keys(log.details).length > 0 ? (
                                                            Object.entries(log.details).map(([key, value]) => (
                                                                <div key={key} className="flex gap-2">
                                                                    <span className="text-zinc-600 font-bold">{key}:</span>
                                                                    <span className="text-zinc-400 truncate tracking-tight">{String(value)}</span>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <span className="italic opacity-30">No details available</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

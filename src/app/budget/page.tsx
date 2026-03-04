'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { useSidebar } from '@/context/SidebarContext'
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    Plus,
    Search,
    Filter,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Trash2,
    X,
    LayoutGrid,
    MoreHorizontal,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Users,
    Building2,
    ChevronDown,
    ArrowRight,
    Edit2
} from 'lucide-react'

interface Transaction {
    id: string
    project_id: string
    vendor_id: string | null
    amount: number
    type: 'INCOME' | 'EXPENSE'
    description: string
    date: string
    frequency: 'ONCE' | 'MONTHLY' | 'YEARLY'
    created_at: string
    projects: { name: string }
    vendors?: { name: string } | null
    clients?: { name: string } | null
}

interface Project {
    id: string
    name: string
}

export default function BudgetPage() {
    const router = useRouter()
    const { isCollapsed } = useSidebar()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [vendors, setVendors] = useState<any[]>([])
    const [clients, setClients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
    const [timeFilter, setTimeFilter] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'all'>('all')
    const [currentMonth, setCurrentMonth] = useState(new Date())

    // Filters
    const [filterProject, setFilterProject] = useState('')
    const [filterVendor, setFilterVendor] = useState('')
    const [filterClient, setFilterClient] = useState('')
    const [filterType, setFilterType] = useState('')
    const [searchQuery, setSearchQuery] = useState('')

    // Form
    const [formData, setFormData] = useState({
        projectId: '',
        vendorId: '',
        clientId: '',
        frequency: 'ONCE',
        amount: '',
        type: 'EXPENSE',
        description: '',
        date: new Date().toISOString().split('T')[0],
        endDate: ''
    })

    useEffect(() => {
        const userStr = localStorage.getItem('user')
        if (!userStr) { router.push('/login'); return }
        const urlParams = new URLSearchParams(window.location.search)
        const vId = urlParams.get('vendorId')
        const cId = urlParams.get('clientId')
        if (vId) setFilterVendor(vId)
        if (cId) setFilterClient(cId)
    }, [])

    useEffect(() => {
        fetchInitialData()
    }, [timeFilter, currentMonth])

    const fetchInitialData = async () => {
        setLoading(true)
        try {
            let url = '/api/budgets?'

            // Calculate range based on filter
            let start: string | null = null
            let end: string | null = null

            if (timeFilter === 'daily') {
                const d = new Date()
                start = d.toISOString().split('T')[0]
                end = start
            } else if (timeFilter === 'weekly') {
                const now = new Date()
                const startDay = new Date(now.setDate(now.getDate() - now.getDay()))
                const endDay = new Date(now.setDate(now.getDate() - now.getDay() + 6))
                start = startDay.toISOString().split('T')[0]
                end = endDay.toISOString().split('T')[0]
            } else if (timeFilter === 'monthly') {
                const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
                const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
                start = firstDay.toISOString().split('T')[0]
                end = lastDay.toISOString().split('T')[0]
            } else if (timeFilter === 'yearly') {
                const firstDay = new Date(currentMonth.getFullYear(), 0, 1)
                const lastDay = new Date(currentMonth.getFullYear(), 11, 31)
                start = firstDay.toISOString().split('T')[0]
                end = lastDay.toISOString().split('T')[0]
            }

            if (start) url += `startDate=${start}&`
            if (end) url += `endDate=${end}&`

            const [transRes, projRes, vendorRes, clientRes] = await Promise.all([
                fetch(url),
                fetch('/api/admin/projects'),
                fetch('/api/vendors'),
                fetch('/api/clients')
            ])
            const transData = await transRes.json()
            const projData = await projRes.json()
            const vendorData = await vendorRes.json()
            const clientData = await clientRes.json()
            if (transData.transactions) setTransactions(transData.transactions)
            if (projData.projects) setProjects(projData.projects)
            if (vendorData.vendors) setVendors(vendorData.vendors)
            if (clientData.clients) setClients(clientData.clients)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const [editingId, setEditingId] = useState<string | null>(null)

    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.projectId || !formData.amount || submitting) return
        setSubmitting(true)
        try {
            const res = await fetch('/api/budgets', {
                method: editingId ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingId ? { ...formData, id: editingId } : formData)
            })
            if (res.ok) {
                setShowModal(false)
                setEditingId(null)
                setFormData({
                    ...formData,
                    frequency: 'ONCE',
                    amount: '',
                    description: '',
                    date: new Date().toISOString().split('T')[0],
                    endDate: ''
                })
                fetchInitialData()
            } else {
                const errorData = await res.json()
                alert(`ล้มเหลว: ${errorData.error || 'ไม่สามารถบันทึกข้อมูลได้'}`)
            }
        } catch (err) {
            console.error(err)
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์')
        } finally {
            setSubmitting(false)
        }
    }

    const startEdit = (t: Transaction) => {
        // Use originalId for recurring (virtual) transactions, otherwise use id
        const realId = (t as any).originalId || t.id
        setEditingId(realId)
        setFormData({
            projectId: t.project_id,
            vendorId: t.vendor_id || '',
            clientId: (t as any).client_id || '',
            frequency: t.frequency || 'ONCE',
            amount: t.amount.toString(),
            type: t.type,
            description: t.description || '',
            date: t.date,
            endDate: (t as any).end_date || ''
        })
        setShowModal(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('ยืนยันการลบรายการนี้?')) return
        try {
            await fetch(`/api/budgets?id=${id}`, { method: 'DELETE' })
            fetchInitialData()
        } catch (err) {
            console.error(err)
        }
    }

    const filteredTransactions = transactions.filter(t => {
        const matchProject = !filterProject || t.project_id === filterProject
        const matchVendor = !filterVendor || t.vendor_id === filterVendor
        const matchClient = !filterClient || (t as any).client_id === filterClient
        const matchType = !filterType || t.type === filterType
        const matchSearch = !searchQuery ||
            t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.projects?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.vendors?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.clients?.name?.toLowerCase().includes(searchQuery.toLowerCase())
        return matchProject && matchVendor && matchClient && matchType && matchSearch
    })

    const totalIncome = filteredTransactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0)
    const totalExpense = filteredTransactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0)
    const balance = totalIncome - totalExpense

    // Calendar Utilities
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const days = []

        // Fill leading empty days
        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(null)
        }

        // Fill real days
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i))
        }

        return days
    }

    const days = getDaysInMonth(currentMonth)
    const monthYear = currentMonth.toLocaleString('th-TH', { month: 'long', year: 'numeric' })

    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))

    if (loading) {
        return (
            <div className="min-h-screen bg-midnight-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-midnight-950 flex">
            <Sidebar />

            <main className="flex-1 min-w-0 transition-all duration-300">
                {/* Top bar */}
                <div className="sticky top-0 z-20 bg-midnight-950/80 backdrop-blur-xl border-b border-white/[0.04] px-4 sm:px-8 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="pl-12 lg:pl-0">
                            <h1 className="text-xl font-bold text-white">Budget & Cashflow</h1>
                            <p className="text-sm text-midnight-500">Track income and expenses across all projects</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex bg-white/[0.04] p-1 rounded-lg border border-white/10">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'text-midnight-500 hover:text-white'}`}
                                >
                                    <LayoutGrid className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('calendar')}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'calendar' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'text-midnight-500 hover:text-white'}`}
                                >
                                    <Calendar className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <button onClick={() => setShowModal(true)}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-violet-600/20 active:scale-95">
                                <Plus className="w-4 h-4" /> Add Transaction
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4 sm:p-8 space-y-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 relative overflow-hidden group pl-12 lg:pl-6">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <Wallet className="w-16 h-16 text-white" />
                            </div>
                            <p className="text-xs font-bold text-midnight-500 uppercase tracking-wider mb-1">Total Balance</p>
                            <h3 className={`text-2xl font-bold ${balance >= 0 ? 'text-white' : 'text-red-400'}`}>
                                ฿{balance.toLocaleString()}
                            </h3>
                            <div className="mt-4 flex items-center gap-2 text-[10px] text-midnight-600">
                                <span className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">All Projects</span>
                            </div>
                        </div>

                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 relative overflow-hidden group pl-12 lg:pl-6">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <TrendingUp className="w-16 h-16 text-emerald-500" />
                            </div>
                            <p className="text-xs font-bold text-emerald-500/60 uppercase tracking-wider mb-1">Total Income</p>
                            <h3 className="text-2xl font-bold text-emerald-400">
                                +฿{totalIncome.toLocaleString()}
                            </h3>
                            <div className="mt-4 flex items-center gap-2 text-[10px] text-emerald-500/40">
                                <ArrowUpRight className="w-3 h-3" />
                                <span>Based on filtered results</span>
                            </div>
                        </div>

                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 relative overflow-hidden group pl-12 lg:pl-6">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <TrendingDown className="w-16 h-16 text-red-500" />
                            </div>
                            <p className="text-xs font-bold text-red-500/60 uppercase tracking-wider mb-1">Total Expenses</p>
                            <h3 className="text-2xl font-bold text-red-400">
                                -฿{totalExpense.toLocaleString()}
                            </h3>
                            <div className="mt-4 flex items-center gap-2 text-[10px] text-red-500/40">
                                <ArrowDownRight className="w-3 h-3" />
                                <span>Based on filtered results</span>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 flex flex-col lg:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-600" />
                            <input
                                type="text"
                                placeholder="Search transactions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white text-sm focus:outline-none focus:border-violet-500/40"
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-lg text-xs">
                                <LayoutGrid className="w-3.5 h-3.5 text-midnight-600" />
                                <select
                                    value={filterProject}
                                    onChange={(e) => setFilterProject(e.target.value)}
                                    className="bg-transparent text-midnight-300 focus:outline-none"
                                >
                                    <option value="">All Projects</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id} className="bg-[#0f0f23]">{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-lg text-xs">
                                <Users className="w-3.5 h-3.5 text-midnight-600" />
                                <select
                                    value={filterVendor}
                                    onChange={(e) => setFilterVendor(e.target.value)}
                                    className="bg-transparent text-midnight-300 focus:outline-none"
                                >
                                    <option value="">All Vendors</option>
                                    {vendors.map(v => (
                                        <option key={v.id} value={v.id} className="bg-[#0f0f23]">{v.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-lg text-xs">
                                <Building2 className="w-3.5 h-3.5 text-midnight-600" />
                                <select
                                    value={filterClient}
                                    onChange={(e) => setFilterClient(e.target.value)}
                                    className="bg-transparent text-midnight-300 focus:outline-none"
                                >
                                    <option value="">All Clients</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id} className="bg-[#0f0f23]">{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-lg text-xs">
                                <Filter className="w-3.5 h-3.5 text-midnight-600" />
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="bg-transparent text-midnight-300 focus:outline-none"
                                >
                                    <option value="">All Types</option>
                                    <option value="INCOME">Income Only</option>
                                    <option value="EXPENSE">Expense Only</option>
                                </select>
                            </div>

                            <div className="flex bg-white/[0.04] p-1 rounded-lg border border-white/10 ml-auto">
                                {[
                                    { id: 'all', label: 'All' },
                                    { id: 'daily', label: 'Day' },
                                    { id: 'weekly', label: 'Week' },
                                    { id: 'monthly', label: 'Month' },
                                    { id: 'yearly', label: 'Year' }
                                ].map(f => (
                                    <button
                                        key={f.id}
                                        onClick={() => setTimeFilter(f.id as any)}
                                        className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${timeFilter === f.id ? 'bg-violet-600 text-white' : 'text-midnight-500 hover:text-white'}`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {viewMode === 'list' ? (
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/[0.04] bg-white/[0.01]">
                                            <th className="px-6 py-4 text-[10px] font-bold text-midnight-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-midnight-500 uppercase tracking-wider">Description</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-midnight-500 uppercase tracking-wider">Project</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-midnight-500 uppercase tracking-wider text-right">Amount</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-midnight-500 uppercase tracking-wider text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.02]">
                                        {filteredTransactions.map((t) => (
                                            <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-3.5 h-3.5 text-midnight-600" />
                                                        <span className="text-sm text-white">{new Date(t.date).toLocaleDateString('th-TH')}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-white font-medium">{t.description || '-'}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-violet-500/40" />
                                                            <span className="text-xs text-midnight-300">{t.projects?.name}</span>
                                                        </div>
                                                        {t.vendors?.name && (
                                                            <div className="flex items-center gap-2 ml-4">
                                                                <Users className="w-3 h-3 text-midnight-600" />
                                                                <span className="text-[10px] text-midnight-500">{t.vendors.name}</span>
                                                            </div>
                                                        )}
                                                        {t.clients?.name && (
                                                            <div className="flex items-center gap-2 ml-4">
                                                                <Building2 className="w-3 h-3 text-emerald-500/60" />
                                                                <span className="text-[10px] text-emerald-500/60 font-medium uppercase tracking-wider">{t.clients.name}</span>
                                                            </div>
                                                        )}
                                                        {t.frequency && t.frequency !== 'ONCE' && (
                                                            <div className="flex items-center gap-2 ml-4">
                                                                <Calendar className="w-3 h-3 text-violet-500/60" />
                                                                <span className="text-[10px] text-violet-500/60 font-bold uppercase tracking-wider">{t.frequency}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`text-sm font-bold ${t.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {t.type === 'INCOME' ? '+' : '-'}฿{Number(t.amount).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center gap-2">
                                                        <button onClick={() => startEdit(t)} className="p-2 text-midnight-700 hover:text-violet-400 transition-colors">
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDelete(t.id)} className="p-2 text-midnight-700 hover:text-red-400 transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <h2 className="text-xl font-bold text-white capitalize">{monthYear}</h2>
                                <div className="flex items-center gap-2 bg-white/[0.04] p-1 rounded-lg border border-white/10">
                                    <button onClick={prevMonth} className="p-2 text-midnight-500 hover:text-white transition-colors">
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setCurrentMonth(new Date())} className="px-3 py-1.5 text-xs font-bold text-white hover:bg-white/5 rounded-md transition-all">Today</button>
                                    <button onClick={nextMonth} className="p-2 text-midnight-500 hover:text-white transition-colors">
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-px bg-white/[0.04] border border-white/[0.04] rounded-xl overflow-hidden">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <div key={day} className="bg-midnight-950/40 p-3 text-center text-[10px] font-bold text-midnight-600 uppercase tracking-widest">{day}</div>
                                ))}
                                {days.map((date, i) => {
                                    if (!date) return <div key={`empty-${i}`} className="bg-midnight-950/20 min-h-[100px]" />

                                    const dateStr = date.toISOString().split('T')[0]
                                    const dayTransactions = filteredTransactions.filter(t => t.date === dateStr)
                                    const dayIncome = dayTransactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0)
                                    const dayExpense = dayTransactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0)
                                    const isToday = new Date().toISOString().split('T')[0] === dateStr

                                    return (
                                        <div key={dateStr} className={`bg-midnight-900/40 min-h-[120px] p-3 border-t border-l border-white/[0.02] transition-colors hover:bg-white/[0.02] ${isToday ? 'relative ring-1 ring-violet-500 ring-inset' : ''}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`text-xs font-bold ${isToday ? 'text-violet-400' : 'text-midnight-500'}`}>{date.getDate()}</span>
                                                {dayTransactions.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-violet-500/40" />}
                                            </div>
                                            <div className="space-y-1">
                                                {dayIncome > 0 && (
                                                    <div className="flex flex-col">
                                                        <p className="text-[10px] font-bold text-emerald-500/60 uppercase">Income</p>
                                                        <p className="text-[11px] font-bold text-emerald-400 leading-tight">฿{dayIncome.toLocaleString()}</p>
                                                    </div>
                                                )}
                                                {dayExpense > 0 && (
                                                    <div className="flex flex-col">
                                                        <p className="text-[10px] font-bold text-red-500/60 uppercase">Expense</p>
                                                        <p className="text-[11px] font-bold text-red-400 leading-tight">฿{dayExpense.toLocaleString()}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </main >

            {/* Add Transaction Modal */}
            {
                showModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-[#0f0f23] border border-white/[0.08] rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    {editingId ? <Edit2 className="w-5 h-5 text-violet-400" /> : <Plus className="w-5 h-5 text-violet-400" />}
                                    {editingId ? 'Edit Transaction' : 'Add Transaction'}
                                </h3>
                                <button onClick={() => { setShowModal(false); setEditingId(null) }} className="p-1 text-midnight-500 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleAddTransaction} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'INCOME' })}
                                        className={`py-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${formData.type === 'INCOME' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-white/[0.02] border-white/[0.08] text-midnight-500 hover:border-emerald-500/30'}`}
                                    >
                                        <TrendingUp className="w-5 h-5" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Income</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'EXPENSE' })}
                                        className={`py-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${formData.type === 'EXPENSE' ? 'bg-red-500/10 border-red-500 text-red-400' : 'bg-white/[0.02] border-white/[0.08] text-midnight-500 hover:border-red-500/30'}`}
                                    >
                                        <TrendingDown className="w-5 h-5" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Expense</span>
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-midnight-500 uppercase tracking-wider mb-1.5 ml-1">Project</label>
                                        <select
                                            required
                                            value={formData.projectId}
                                            onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-violet-500/40"
                                        >
                                            <option value="" className="bg-[#0f0f23]">Select Project</option>
                                            {projects.map(p => (
                                                <option key={p.id} value={p.id} className="bg-[#0f0f23]">{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-midnight-500 uppercase tracking-wider mb-1.5 ml-1">Vendor / Supplier (Optional)</label>
                                        <select
                                            value={formData.vendorId}
                                            onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-violet-500/40"
                                        >
                                            <option value="" className="bg-[#0f0f23]">No Vendor</option>
                                            {vendors.map(v => (
                                                <option key={v.id} value={v.id} className="bg-[#0f0f23]">{v.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-midnight-500 uppercase tracking-wider mb-1.5 ml-1">Client (Optional)</label>
                                        <select
                                            value={formData.clientId}
                                            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-violet-500/40"
                                        >
                                            <option value="" className="bg-[#0f0f23]">No Client</option>
                                            {clients.map(c => (
                                                <option key={c.id} value={c.id} className="bg-[#0f0f23]">{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-midnight-500 uppercase tracking-wider mb-1.5 ml-1">Payment Frequency</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { id: 'ONCE', label: 'One-time' },
                                                { id: 'MONTHLY', label: 'Monthly' },
                                                { id: 'YEARLY', label: 'Yearly' }
                                            ].map(freq => (
                                                <button
                                                    key={freq.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, frequency: freq.id as any })}
                                                    className={`py-2 px-1 rounded-lg border text-[10px] font-bold uppercase transition-all ${formData.frequency === freq.id ? 'bg-violet-500/10 border-violet-500 text-violet-400' : 'bg-white/[0.02] border-white/[0.08] text-midnight-500 hover:border-white/20'}`}
                                                >
                                                    {freq.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-midnight-500 uppercase tracking-wider mb-1.5 ml-1">Amount</label>
                                            <input
                                                type="number"
                                                required
                                                value={formData.amount}
                                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                placeholder="0.00"
                                                className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-violet-500/40"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-midnight-500 uppercase tracking-wider mb-1.5 ml-1">Start Date</label>
                                            <input
                                                type="date"
                                                required
                                                value={formData.date}
                                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-violet-500/40 [color-scheme:dark]"
                                            />
                                        </div>
                                    </div>
                                    {formData.frequency !== 'ONCE' && (
                                        <div className="animate-in slide-in-from-top-2 duration-200">
                                            <label className="block text-[10px] font-bold text-midnight-500 uppercase tracking-wider mb-1.5 ml-1">End Date (Optional)</label>
                                            <input
                                                type="date"
                                                value={formData.endDate}
                                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-violet-500/40 [color-scheme:dark]"
                                            />
                                            <p className="text-[9px] text-midnight-600 mt-1 ml-1">Leave empty for infinite recurring</p>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-[10px] font-bold text-midnight-500 uppercase tracking-wider mb-1.5 ml-1">Description</label>
                                        <input
                                            type="text"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Note for this transaction..."
                                            className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-violet-500/40"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!formData.projectId || !formData.amount || !formData.date || submitting}
                                    className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-600/20"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : editingId ? 'Update Transaction' : 'Add Transaction'}
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    )
}

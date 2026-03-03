'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/Sidebar'
import {
    TrendingUp,
    TrendingDown,
    Users,
    Building2,
    DollarSign,
    Star,
    PieChart,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    ChevronRight,
    Search
} from 'lucide-react'
import Link from 'next/link'

interface ClientStat {
    id: string
    name: string
    revenue: number
    rating: number
    transactionCount: number
}

interface VendorStat {
    id: string
    name: string
    expense: number
    category: string
    rating: number
    transactionCount: number
}

interface DashboardData {
    summary: {
        totalRevenue: number
        totalExpense: number
        netProfit: number
        clientCount: number
        vendorCount: number
    }
    clientStats: ClientStat[]
    vendorStats: VendorStat[]
    categoryStats: { name: string; value: number }[]
}

export default function StakeholdersDashboard() {
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const res = await fetch('/api/admin/dashboard/stakeholders')
            const result = await res.json()
            setData(result)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-midnight-950 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            </div>
        )
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(val).replace('฿', '฿ ')
    }

    return (
        <div className="min-h-screen bg-midnight-950 flex">
            <Sidebar />

            <main className="flex-1 min-w-0 transition-all duration-300">
                <div className="sticky top-0 z-20 bg-midnight-950/80 backdrop-blur-xl border-b border-white/[0.04] px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-white flex items-center gap-2">
                                <Activity className="w-5 h-5 text-emerald-400" />
                                Stakeholders Dashboard
                            </h1>
                            <p className="text-sm text-midnight-500">Financial performance and analysis</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <TrendingUp className="w-16 h-16 text-emerald-400" />
                            </div>
                            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Total Revenue</p>
                            <h2 className="text-3xl font-black text-white">{formatCurrency(data?.summary.totalRevenue || 0)}</h2>
                            <div className="flex items-center gap-2 mt-4 text-xs font-medium text-emerald-400/60">
                                <Users className="w-3.5 h-3.5" />
                                From {data?.summary.clientCount} Clients
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-red-500/10 to-orange-500/5 border border-red-500/20 rounded-2xl p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <TrendingDown className="w-16 h-16 text-red-400" />
                            </div>
                            <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Total Expenses</p>
                            <h2 className="text-3xl font-black text-white">{formatCurrency(data?.summary.totalExpense || 0)}</h2>
                            <div className="flex items-center gap-2 mt-4 text-xs font-medium text-red-400/60">
                                <Building2 className="w-3.5 h-3.5" />
                                To {data?.summary.vendorCount} Vendors
                            </div>
                        </div>

                        <div className={`bg-gradient-to-br from-violet-500/10 to-indigo-500/5 border rounded-2xl p-6 relative overflow-hidden group ${(data?.summary.netProfit || 0) >= 0 ? 'border-violet-500/20' : 'border-red-500/20'}`}>
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <DollarSign className="w-16 h-16 text-violet-400" />
                            </div>
                            <p className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-2">Net Profit</p>
                            <h2 className="text-3xl font-black text-white">{formatCurrency(data?.summary.netProfit || 0)}</h2>
                            <div className="flex items-center gap-2 mt-4 text-xs font-medium text-violet-400/60">
                                <BarChart3 className="w-3.5 h-3.5" />
                                Cash Flow Performance
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {/* Top Clients Table */}
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-white/[0.04] bg-white/[0.01] flex items-center justify-between">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                                    Top Revenue Sources (Clients)
                                </h3>
                                <Link href="/admin/clients" className="text-[10px] font-bold text-emerald-400 hover:underline uppercase">View All</Link>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/[0.04]">
                                            <th className="px-6 py-3 text-[10px] font-bold text-midnight-500 uppercase">Client Name</th>
                                            <th className="px-6 py-3 text-[10px] font-bold text-midnight-500 uppercase text-center">Rating</th>
                                            <th className="px-6 py-3 text-[10px] font-bold text-midnight-500 uppercase text-right">Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.02]">
                                        {data?.clientStats.map(client => (
                                            <tr key={client.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-white font-medium">{client.name}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-0.5">
                                                        {[1, 2, 3, 4, 5].map(s => (
                                                            <Star key={s} className={`w-2.5 h-2.5 ${s <= client.rating ? 'text-yellow-400 fill-yellow-400' : 'text-midnight-700'}`} />
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-sm font-bold text-emerald-400">{formatCurrency(client.revenue)}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Top Vendors Table */}
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-white/[0.04] bg-white/[0.01] flex items-center justify-between">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <ArrowDownRight className="w-4 h-4 text-red-400" />
                                    Top Expense Channels (Vendors)
                                </h3>
                                <Link href="/admin/vendors" className="text-[10px] font-bold text-red-400 hover:underline uppercase">View All</Link>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/[0.04]">
                                            <th className="px-6 py-3 text-[10px] font-bold text-midnight-500 uppercase">Vendor Name</th>
                                            <th className="px-6 py-3 text-[10px] font-bold text-midnight-500 uppercase">Category</th>
                                            <th className="px-6 py-3 text-[10px] font-bold text-midnight-500 uppercase text-right">Expense</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.02]">
                                        {data?.vendorStats.map(vendor => (
                                            <tr key={vendor.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-6 py-4 text-sm text-white font-medium">{vendor.name}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 text-[10px] font-bold uppercase">
                                                        {vendor.category || 'Other'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-sm font-bold text-red-400">{formatCurrency(vendor.expense)}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Category Summary */}
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <PieChart className="w-4 h-4 text-indigo-400" />
                            <h3 className="text-sm font-bold text-white">Expense Distribution by Category</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {data?.categoryStats.map(cat => {
                                const percentage = ((cat.value / (data.summary.totalExpense || 1)) * 100).toFixed(1)
                                return (
                                    <div key={cat.name} className="p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl hover:border-indigo-500/30 transition-all">
                                        <p className="text-[10px] font-bold text-midnight-500 uppercase mb-1 truncate">{cat.name}</p>
                                        <p className="text-lg font-black text-white">{percentage}%</p>
                                        <p className="text-[11px] text-midnight-600 mt-1">{formatCurrency(cat.value)}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

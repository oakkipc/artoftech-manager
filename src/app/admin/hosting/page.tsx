'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import {
    Server,
    Globe,
    Plus,
    Trash2,
    X,
    AlertTriangle,
    Clock,
    ChevronDown,
    ChevronRight,
    Shield,
    Calendar,
    ExternalLink
} from 'lucide-react'

interface Domain {
    id: string; name: string; expiry_date: string | null; ssl_expiry: string | null; registrar: string | null; notes: string | null
}
interface Host {
    id: string; provider_id: string; name: string; ip_address: string | null; plan: string | null; expiry_date: string | null; notes: string | null; domains: Domain[]
}
interface Provider {
    id: string; name: string; website: string | null; notes: string | null; hosts: Host[]
}
interface Stats {
    totalProviders: number; totalHosts: number; totalDomains: number
    expiringDomains: number; expiredDomains: number; expiringHosts: number; expiredHosts: number
}

export default function HostingPage() {
    const router = useRouter()
    const [providers, setProviders] = useState<Provider[]>([])
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState<Record<string, boolean>>({})
    const [expandedHosts, setExpandedHosts] = useState<Record<string, boolean>>({})

    const [showModal, setShowModal] = useState<'provider' | 'host' | 'domain' | null>(null)
    const [modalParentId, setModalParentId] = useState('')
    const [formData, setFormData] = useState<Record<string, string>>({})
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        const userStr = localStorage.getItem('user')
        if (userStr) {
            const user = JSON.parse(userStr)
            if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN') { router.push('/dashboard'); return }
        } else { router.push('/login'); return }
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const res = await fetch('/api/admin/hosting')
            const data = await res.json()
            if (data.providers) setProviders(data.providers)
            if (data.stats) setStats(data.stats)
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }

    const handleAddProvider = async () => {
        if (!formData.name?.trim() || submitting) return
        setSubmitting(true)
        try {
            await fetch('/api/admin/hosting', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: formData.name, website: formData.website, notes: formData.notes })
            })
            setShowModal(null); setFormData({}); fetchData()
        } finally { setSubmitting(false) }
    }

    const handleAddHost = async () => {
        if (!formData.name?.trim() || submitting) return
        setSubmitting(true)
        try {
            await fetch('/api/admin/hosting/hosts', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ providerId: modalParentId, name: formData.name, ipAddress: formData.ipAddress, plan: formData.plan, expiryDate: formData.expiryDate, notes: formData.notes })
            })
            setShowModal(null); setFormData({}); setModalParentId(''); fetchData()
        } finally { setSubmitting(false) }
    }

    const handleAddDomain = async () => {
        if (!formData.name?.trim() || submitting) return
        setSubmitting(true)
        try {
            await fetch('/api/admin/hosting/domains', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hostId: modalParentId, name: formData.name, expiryDate: formData.expiryDate, sslExpiry: formData.sslExpiry, registrar: formData.registrar, notes: formData.notes })
            })
            setShowModal(null); setFormData({}); setModalParentId(''); fetchData()
        } finally { setSubmitting(false) }
    }

    const handleDelete = async (type: 'providers' | 'hosts' | 'domains', id: string) => {
        const urlMap = { providers: '/api/admin/hosting', hosts: '/api/admin/hosting/hosts', domains: '/api/admin/hosting/domains' }
        await fetch(`${urlMap[type]}?id=${id}`, { method: 'DELETE' })
        fetchData()
    }

    const getExpiryStatus = (date: string | null) => {
        if (!date) return { label: 'N/A', color: 'text-midnight-600' }
        const d = new Date(date)
        const now = new Date()
        const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        if (diff < 0) return { label: `Expired ${Math.abs(Math.floor(diff))}d ago`, color: 'text-red-400' }
        if (diff < 30) return { label: `${Math.floor(diff)}d left`, color: 'text-amber-400' }
        return { label: `${Math.floor(diff)}d left`, color: 'text-emerald-400' }
    }

    const toggleProvider = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
    const toggleHost = (id: string) => setExpandedHosts(prev => ({ ...prev, [id]: !prev[id] }))

    if (loading) {
        return (<div className="min-h-screen bg-midnight-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" /></div>)
    }

    return (
        <div className="min-h-screen bg-midnight-950 flex">
            <Sidebar />
            <main className="flex-1 min-w-0">
                {/* Top bar */}
                <div className="sticky top-0 z-20 bg-midnight-950/80 backdrop-blur-xl border-b border-white/[0.04] px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-white">Host & Domain</h1>
                            <p className="text-sm text-midnight-500">Manage hosting providers, servers, and domains</p>
                        </div>
                        <button onClick={() => { setShowModal('provider'); setFormData({}) }}
                            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors">
                            <Plus className="w-4 h-4" /> Add Provider
                        </button>
                    </div>
                </div>

                <div className="p-8">
                    {/* Dashboard Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex items-center gap-3">
                            <div className="w-9 h-9 bg-violet-500/10 rounded-lg flex items-center justify-center shrink-0"><Shield className="w-4 h-4 text-violet-400" /></div>
                            <div><p className="text-xl font-bold text-white">{stats?.totalProviders ?? 0}</p><p className="text-[10px] text-midnight-500 font-medium uppercase">Providers</p></div>
                        </div>
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex items-center gap-3">
                            <div className="w-9 h-9 bg-cyan-500/10 rounded-lg flex items-center justify-center shrink-0"><Server className="w-4 h-4 text-cyan-400" /></div>
                            <div><p className="text-xl font-bold text-white">{stats?.totalHosts ?? 0}</p><p className="text-[10px] text-midnight-500 font-medium uppercase">Hosts</p></div>
                        </div>
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex items-center gap-3">
                            <div className="w-9 h-9 bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0"><Globe className="w-4 h-4 text-blue-400" /></div>
                            <div><p className="text-xl font-bold text-white">{stats?.totalDomains ?? 0}</p><p className="text-[10px] text-midnight-500 font-medium uppercase">Domains</p></div>
                        </div>
                        <div className={`bg-white/[0.02] border rounded-xl p-4 flex items-center gap-3 ${(stats?.expiringHosts ?? 0) > 0 ? 'border-amber-500/20' : 'border-white/[0.06]'}`}>
                            <div className="w-9 h-9 bg-amber-500/10 rounded-lg flex items-center justify-center shrink-0"><Clock className="w-4 h-4 text-amber-400" /></div>
                            <div><p className="text-xl font-bold text-white">{stats?.expiringHosts ?? 0}</p><p className="text-[10px] text-midnight-500 font-medium uppercase">Host Exp.</p></div>
                        </div>
                        <div className={`bg-white/[0.02] border rounded-xl p-4 flex items-center gap-3 ${(stats?.expiredHosts ?? 0) > 0 ? 'border-red-500/20' : 'border-white/[0.06]'}`}>
                            <div className="w-9 h-9 bg-red-500/10 rounded-lg flex items-center justify-center shrink-0"><AlertTriangle className="w-4 h-4 text-red-400" /></div>
                            <div><p className="text-xl font-bold text-white">{stats?.expiredHosts ?? 0}</p><p className="text-[10px] text-midnight-500 font-medium uppercase">Host Exp'd</p></div>
                        </div>
                        <div className={`bg-white/[0.02] border rounded-xl p-4 flex items-center gap-3 ${(stats?.expiringDomains ?? 0) > 0 ? 'border-amber-500/20' : 'border-white/[0.06]'}`}>
                            <div className="w-9 h-9 bg-amber-500/10 rounded-lg flex items-center justify-center shrink-0"><Clock className="w-4 h-4 text-amber-400" /></div>
                            <div><p className="text-xl font-bold text-white">{stats?.expiringDomains ?? 0}</p><p className="text-[10px] text-midnight-500 font-medium uppercase">Domain Exp.</p></div>
                        </div>
                        <div className={`bg-white/[0.02] border rounded-xl p-4 flex items-center gap-3 ${(stats?.expiredDomains ?? 0) > 0 ? 'border-red-500/20' : 'border-white/[0.06]'}`}>
                            <div className="w-9 h-9 bg-red-500/10 rounded-lg flex items-center justify-center shrink-0"><AlertTriangle className="w-4 h-4 text-red-400" /></div>
                            <div><p className="text-xl font-bold text-white">{stats?.expiredDomains ?? 0}</p><p className="text-[10px] text-midnight-500 font-medium uppercase">Domain Exp'd</p></div>
                        </div>
                    </div>

                    {/* Expiring / Expired Lists */}
                    {(() => {
                        const now = new Date()
                        const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

                        const allHosts = providers.flatMap(p => p.hosts.map(h => ({ ...h, providerName: p.name })))
                        const allDomains = providers.flatMap(p => p.hosts.flatMap(h => h.domains.map(d => ({ ...d, hostName: h.name, providerName: p.name }))))

                        const expiringHosts = allHosts.filter(h => h.expiry_date && new Date(h.expiry_date) <= in30).sort((a, b) => new Date(a.expiry_date!).getTime() - new Date(b.expiry_date!).getTime())
                        const expiringDomains = allDomains.filter(d => d.expiry_date && new Date(d.expiry_date) <= in30).sort((a, b) => new Date(a.expiry_date!).getTime() - new Date(b.expiry_date!).getTime())

                        if (expiringHosts.length === 0 && expiringDomains.length === 0) return null

                        return (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                                {/* Expiring Hosts */}
                                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Server className="w-4 h-4 text-amber-400" />
                                        <h3 className="text-sm font-bold text-white">Hosts — Expiring / Expired</h3>
                                        {expiringHosts.length > 0 && (
                                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">{expiringHosts.length}</span>
                                        )}
                                    </div>
                                    {expiringHosts.length > 0 ? (
                                        <div className="space-y-2">
                                            {expiringHosts.map(h => {
                                                const status = getExpiryStatus(h.expiry_date)
                                                const isExpired = h.expiry_date && new Date(h.expiry_date) < now
                                                return (
                                                    <div key={h.id} className={`flex items-center justify-between p-3 rounded-lg border ${isExpired ? 'bg-red-500/[0.04] border-red-500/15' : 'bg-amber-500/[0.03] border-amber-500/10'}`}>
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <Server className={`w-4 h-4 shrink-0 ${isExpired ? 'text-red-400' : 'text-amber-400'}`} />
                                                            <div className="min-w-0">
                                                                <p className="text-sm text-white font-medium truncate">{h.name}</p>
                                                                <p className="text-[11px] text-midnight-600">{h.providerName}{h.ip_address ? ` · ${h.ip_address}` : ''}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <span className={`text-[11px] flex items-center gap-1 ${status.color}`}>
                                                                <Calendar className="w-3 h-3" />
                                                                {new Date(h.expiry_date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </span>
                                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isExpired ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}>
                                                                {status.label}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-midnight-600 text-center py-4">No expiring hosts 🎉</p>
                                    )}
                                </div>

                                {/* Expiring Domains */}
                                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Globe className="w-4 h-4 text-amber-400" />
                                        <h3 className="text-sm font-bold text-white">Domains — Expiring / Expired</h3>
                                        {expiringDomains.length > 0 && (
                                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">{expiringDomains.length}</span>
                                        )}
                                    </div>
                                    {expiringDomains.length > 0 ? (
                                        <div className="space-y-2">
                                            {expiringDomains.map(d => {
                                                const status = getExpiryStatus(d.expiry_date)
                                                const isExpired = d.expiry_date && new Date(d.expiry_date) < now
                                                return (
                                                    <div key={d.id} className={`flex items-center justify-between p-3 rounded-lg border ${isExpired ? 'bg-red-500/[0.04] border-red-500/15' : 'bg-amber-500/[0.03] border-amber-500/10'}`}>
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <Globe className={`w-4 h-4 shrink-0 ${isExpired ? 'text-red-400' : 'text-amber-400'}`} />
                                                            <div className="min-w-0">
                                                                <p className="text-sm text-white font-medium truncate">{d.name}</p>
                                                                <p className="text-[11px] text-midnight-600">{d.providerName} · {d.hostName}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <span className={`text-[11px] flex items-center gap-1 ${status.color}`}>
                                                                <Calendar className="w-3 h-3" />
                                                                {new Date(d.expiry_date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </span>
                                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isExpired ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}>
                                                                {status.label}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-midnight-600 text-center py-4">No expiring domains 🎉</p>
                                    )}
                                </div>
                            </div>
                        )
                    })()}

                    {/* Providers List */}
                    <div className="space-y-4">
                        {providers.map((provider) => (
                            <div key={provider.id} className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
                                {/* Provider Header */}
                                <div className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors" onClick={() => toggleProvider(provider.id)}>
                                    <div className="flex items-center gap-3">
                                        {expanded[provider.id] ? <ChevronDown className="w-4 h-4 text-midnight-500" /> : <ChevronRight className="w-4 h-4 text-midnight-500" />}
                                        <div className="w-9 h-9 bg-violet-500/10 rounded-lg flex items-center justify-center"><Shield className="w-4 h-4 text-violet-400" /></div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                                {provider.name}
                                                {provider.website && (
                                                    <a href={provider.website} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} className="text-midnight-600 hover:text-violet-400"><ExternalLink className="w-3.5 h-3.5" /></a>
                                                )}
                                            </h3>
                                            <p className="text-[11px] text-midnight-600">{provider.hosts.length} host{provider.hosts.length !== 1 ? 's' : ''} · {provider.hosts.reduce((s, h) => s + h.domains.length, 0)} domain{provider.hosts.reduce((s, h) => s + h.domains.length, 0) !== 1 ? 's' : ''}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                        <button onClick={() => { setShowModal('host'); setModalParentId(provider.id); setFormData({}) }}
                                            className="px-3 py-1.5 text-xs font-medium text-midnight-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg border border-white/[0.06] transition-all">
                                            <Plus className="w-3.5 h-3.5 inline mr-1" />Host
                                        </button>
                                        <button onClick={() => handleDelete('providers', provider.id)} className="p-1.5 text-midnight-700 hover:text-red-400 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>

                                {/* Hosts */}
                                {expanded[provider.id] && provider.hosts.length > 0 && (
                                    <div className="border-t border-white/[0.04]">
                                        {provider.hosts.map((host) => (
                                            <div key={host.id}>
                                                {/* Host Row */}
                                                <div className="px-5 py-3 ml-6 flex items-center justify-between border-b border-white/[0.03] hover:bg-white/[0.02] cursor-pointer" onClick={() => toggleHost(host.id)}>
                                                    <div className="flex items-center gap-3">
                                                        {expandedHosts[host.id] ? <ChevronDown className="w-3.5 h-3.5 text-midnight-600" /> : <ChevronRight className="w-3.5 h-3.5 text-midnight-600" />}
                                                        <Server className="w-4 h-4 text-cyan-400" />
                                                        <div>
                                                            <p className="text-sm font-medium text-white flex items-center gap-2">
                                                                {host.name}
                                                                {host.ip_address && <span className="text-[11px] text-midnight-600 font-mono">{host.ip_address}</span>}
                                                            </p>
                                                            <div className="flex items-center gap-3 text-[11px]">
                                                                {host.plan && <span className="text-midnight-500">{host.plan}</span>}
                                                                <span className={getExpiryStatus(host.expiry_date).color}>
                                                                    <Calendar className="w-3 h-3 inline mr-0.5" />
                                                                    {host.expiry_date ? new Date(host.expiry_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'No expiry'}
                                                                    {' '}({getExpiryStatus(host.expiry_date).label})
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                        <span className="text-xs text-midnight-600">{host.domains.length} domains</span>
                                                        <button onClick={() => { setShowModal('domain'); setModalParentId(host.id); setFormData({}) }}
                                                            className="px-2 py-1 text-xs font-medium text-midnight-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md border border-white/[0.06] transition-all">
                                                            <Plus className="w-3 h-3 inline mr-0.5" />Domain
                                                        </button>
                                                        <button onClick={() => handleDelete('hosts', host.id)} className="p-1 text-midnight-700 hover:text-red-400 rounded"><Trash2 className="w-3 h-3" /></button>
                                                    </div>
                                                </div>

                                                {/* Domains */}
                                                {expandedHosts[host.id] && host.domains.length > 0 && (
                                                    <div className="ml-16 py-1">
                                                        {host.domains.map((domain) => (
                                                            <div key={domain.id} className="px-4 py-2.5 flex items-center justify-between hover:bg-white/[0.02] rounded-lg mx-2 group">
                                                                <div className="flex items-center gap-3">
                                                                    <Globe className="w-4 h-4 text-blue-400" />
                                                                    <div>
                                                                        <p className="text-sm text-white font-medium">{domain.name}</p>
                                                                        <div className="flex items-center gap-3 text-[11px]">
                                                                            {domain.registrar && <span className="text-midnight-600">{domain.registrar}</span>}
                                                                            <span className={getExpiryStatus(domain.expiry_date).color}>
                                                                                Domain: {domain.expiry_date ? new Date(domain.expiry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                                                                {' '}({getExpiryStatus(domain.expiry_date).label})
                                                                            </span>
                                                                            {domain.ssl_expiry && (
                                                                                <span className={getExpiryStatus(domain.ssl_expiry).color}>
                                                                                    SSL: {new Date(domain.ssl_expiry).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <button onClick={() => handleDelete('domains', domain.id)} className="p-1 text-midnight-700 hover:text-red-400 opacity-0 group-hover:opacity-100 rounded"><Trash2 className="w-3 h-3" /></button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {expanded[provider.id] && provider.hosts.length === 0 && (
                                    <div className="px-5 py-4 border-t border-white/[0.04] text-center text-sm text-midnight-600">No hosts yet</div>
                                )}
                            </div>
                        ))}
                    </div>

                    {providers.length === 0 && (
                        <div className="py-24 text-center">
                            <Server className="w-10 h-10 text-midnight-700 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-white mb-1">No providers yet</h3>
                            <p className="text-midnight-500 text-sm">Add your first hosting provider to get started.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0f0f23] border border-white/[0.08] rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold text-white">
                                {showModal === 'provider' ? 'Add Provider' : showModal === 'host' ? 'Add Host' : 'Add Domain'}
                            </h3>
                            <button onClick={() => setShowModal(null)} className="p-1 text-midnight-500 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-midnight-300 mb-1">Name *</label>
                                <input type="text" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white text-sm placeholder-midnight-600 focus:outline-none focus:border-violet-500/40"
                                    placeholder={showModal === 'domain' ? 'example.com' : showModal === 'host' ? 'Server name' : 'Provider name'} />
                            </div>

                            {showModal === 'provider' && (
                                <div>
                                    <label className="block text-sm font-medium text-midnight-300 mb-1">Website</label>
                                    <input type="url" value={formData.website || ''} onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white text-sm placeholder-midnight-600 focus:outline-none focus:border-violet-500/40"
                                        placeholder="https://provider.com" />
                                </div>
                            )}

                            {showModal === 'host' && (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-midnight-300 mb-1">IP Address</label>
                                            <input type="text" value={formData.ipAddress || ''} onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white text-sm placeholder-midnight-600 focus:outline-none focus:border-violet-500/40 font-mono"
                                                placeholder="192.168.1.1" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-midnight-300 mb-1">Plan</label>
                                            <input type="text" value={formData.plan || ''} onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white text-sm placeholder-midnight-600 focus:outline-none focus:border-violet-500/40"
                                                placeholder="VPS 2GB" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-midnight-300 mb-1">Expiry Date</label>
                                        <input type="date" value={formData.expiryDate || ''} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white text-sm focus:outline-none focus:border-violet-500/40 [color-scheme:dark]" />
                                    </div>
                                </>
                            )}

                            {showModal === 'domain' && (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-midnight-300 mb-1">Expiry Date</label>
                                            <input type="date" value={formData.expiryDate || ''} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white text-sm focus:outline-none focus:border-violet-500/40 [color-scheme:dark]" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-midnight-300 mb-1">SSL Expiry</label>
                                            <input type="date" value={formData.sslExpiry || ''} onChange={(e) => setFormData({ ...formData, sslExpiry: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white text-sm focus:outline-none focus:border-violet-500/40 [color-scheme:dark]" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-midnight-300 mb-1">Registrar</label>
                                        <input type="text" value={formData.registrar || ''} onChange={(e) => setFormData({ ...formData, registrar: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white text-sm placeholder-midnight-600 focus:outline-none focus:border-violet-500/40"
                                            placeholder="Namecheap, GoDaddy..." />
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-midnight-300 mb-1">Notes</label>
                                <input type="text" value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white text-sm placeholder-midnight-600 focus:outline-none focus:border-violet-500/40"
                                    placeholder="Optional notes..." />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-midnight-400 border border-white/[0.08] rounded-lg hover:bg-white/[0.04]">Cancel</button>
                                <button type="button" onClick={() => { showModal === 'provider' ? handleAddProvider() : showModal === 'host' ? handleAddHost() : handleAddDomain() }}
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{submitting ? 'Adding...' : 'Add'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

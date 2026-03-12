'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from '@/components/Sidebar'
import {
    Banknote, Plus, Search, Trash2, X, Loader2,
    TrendingUp, Calendar, Building2, FileText, CreditCard, Wallet
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Payment {
    id: string
    document_id: string | null
    client_id: string | null
    project_id: string | null
    amount: number
    payment_date: string
    payment_method: string
    reference: string | null
    notes: string | null
    created_at: string
    documents: { id: string; doc_number: string; doc_type: string; total: number } | null
    clients: { id: string; name: string } | null
    projects: { id: string; name: string } | null
}

const METHOD_LABEL: Record<string, string> = {
    TRANSFER: 'โอนเงิน', CASH: 'เงินสด', CHEQUE: 'เช็ค', CREDIT_CARD: 'บัตรเครดิต', OTHER: 'อื่นๆ'
}
const METHOD_COLOR: Record<string, string> = {
    TRANSFER: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    CASH: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    CHEQUE: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    CREDIT_CARD: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    OTHER: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
}

export default function PaymentsPage() {
    const router = useRouter()
    const [payments, setPayments] = useState<Payment[]>([])
    const [clients, setClients] = useState<any[]>([])
    const [projects, setProjects] = useState<any[]>([])
    const [documents, setDocuments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null)

    // Filters
    const [searchQuery, setSearchQuery] = useState('')
    const [filterClient, setFilterClient] = useState('')
    const [filterMethod, setFilterMethod] = useState('')
    const [filterMonth, setFilterMonth] = useState('')

    // Form
    const [form, setForm] = useState({
        document_id: '', client_id: '', project_id: '',
        amount: '', payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'TRANSFER', reference: '', notes: ''
    })

    useEffect(() => {
        const userStr = localStorage.getItem('user')
        if (!userStr) { router.push('/login'); return }
        setUser(JSON.parse(userStr))
        fetchAll()
    }, [])

    const fetchAll = async () => {
        setLoading(true)
        const [payRes, clientsRes, projectsRes, docsRes] = await Promise.all([
            fetch('/api/payments'),
            fetch('/api/clients'),
            fetch('/api/admin/projects'),
            fetch('/api/documents?type=INVOICE'),
        ])
        const [payData, clientsData, projectsData, docsData] = await Promise.all([payRes.json(), clientsRes.json(), projectsRes.json(), docsRes.json()])
        if (payData.payments) setPayments(payData.payments)
        if (clientsData.clients) setClients(clientsData.clients)
        if (projectsData.projects) setProjects(projectsData.projects)
        if (docsData.documents) setDocuments(docsData.documents)
        setLoading(false)
    }

    const filtered = useMemo(() => payments.filter(p => {
        if (filterClient && p.client_id !== filterClient) return false
        if (filterMethod && p.payment_method !== filterMethod) return false
        if (filterMonth && !p.payment_date.startsWith(filterMonth)) return false
        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            return p.clients?.name.toLowerCase().includes(q) ||
                p.documents?.doc_number.toLowerCase().includes(q) ||
                p.reference?.toLowerCase().includes(q) || false
        }
        return true
    }), [payments, filterClient, filterMethod, filterMonth, searchQuery])

    // Stats
    const totalReceived = useMemo(() => payments.reduce((s, p) => s + parseFloat(String(p.amount)), 0), [payments])

    const thisMonthStr = new Date().toISOString().slice(0, 7)
    const thisMonth = useMemo(() => payments.filter(p => p.payment_date.startsWith(thisMonthStr)).reduce((s, p) => s + parseFloat(String(p.amount)), 0), [payments, thisMonthStr])

    const byMethod = useMemo(() => {
        const m: Record<string, number> = {}
        payments.forEach(p => { m[p.payment_method] = (m[p.payment_method] || 0) + parseFloat(String(p.amount)) })
        return m
    }, [payments])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (submitting) return
        setSubmitting(true)
        try {
            const res = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, userId: user?.id })
            })
            if (res.ok) {
                setShowModal(false)
                resetForm()
                fetchAll()
            } else {
                const err = await res.json()
                alert(err.error || 'Failed')
            }
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        await fetch(`/api/payments?id=${deleteTarget.id}`, { method: 'DELETE' })
        setDeleteTarget(null)
        setPayments(prev => prev.filter(p => p.id !== deleteTarget.id))
    }

    const resetForm = () => setForm({
        document_id: '', client_id: '', project_id: '',
        amount: '', payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'TRANSFER', reference: '', notes: ''
    })

    // Auto-fill from selected document
    const handleDocSelect = (docId: string) => {
        const doc = documents.find(d => d.id === docId)
        if (doc) {
            setForm(f => ({
                ...f, document_id: docId,
                client_id: doc.client_id || '',
                project_id: doc.project_id || '',
                amount: String(doc.total - (doc.paid_amount || 0))
            }))
        } else {
            setForm(f => ({ ...f, document_id: '' }))
        }
    }

    if (loading) return <div className="min-h-screen bg-midnight-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-violet-500 animate-spin" /></div>

    const inputCls = "w-full px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/40"
    const labelCls = "block text-[10px] font-bold text-midnight-500 uppercase tracking-wider mb-1.5 ml-1"

    return (
        <div className="min-h-screen bg-midnight-950 flex">
            <Sidebar />
            <main className="flex-1 min-w-0 transition-all duration-300">
                {/* Header */}
                <div className="sticky top-0 z-20 bg-midnight-950/80 backdrop-blur-xl border-b border-white/[0.04] px-4 sm:px-8 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-xl font-bold text-white flex items-center gap-2">
                                <Banknote className="w-5 h-5 text-emerald-400" />
                                การชำระเงิน
                            </h1>
                            <p className="text-sm text-midnight-500">บันทึกและติดตามการรับ-จ่ายเงิน</p>
                        </div>
                        <button
                            onClick={() => { resetForm(); setShowModal(true) }}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                        >
                            <Plus className="w-4 h-4" /> บันทึกการชำระเงิน
                        </button>
                    </div>
                </div>

                <div className="p-4 sm:p-8 space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <Wallet className="w-4 h-4 text-midnight-500" />
                                <span className="text-[10px] font-bold text-midnight-500 uppercase tracking-wider">รับรวมทั้งหมด</span>
                            </div>
                            <p className="text-2xl font-black font-mono text-white">{totalReceived.toLocaleString('th-TH', { minimumFractionDigits: 0 })}</p>
                            <p className="text-xs text-midnight-600 mt-0.5">บาท</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-4 h-4 text-midnight-500" />
                                <span className="text-[10px] font-bold text-midnight-500 uppercase tracking-wider">เดือนนี้</span>
                            </div>
                            <p className="text-2xl font-black font-mono text-emerald-400">{thisMonth.toLocaleString('th-TH', { minimumFractionDigits: 0 })}</p>
                            <p className="text-xs text-midnight-600 mt-0.5">บาท</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="w-4 h-4 text-midnight-500" />
                                <span className="text-[10px] font-bold text-midnight-500 uppercase tracking-wider">รายการทั้งหมด</span>
                            </div>
                            <p className="text-2xl font-black text-white">{payments.length}</p>
                            <p className="text-xs text-midnight-600 mt-0.5">รายการ</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <CreditCard className="w-4 h-4 text-midnight-500" />
                                <span className="text-[10px] font-bold text-midnight-500 uppercase tracking-wider">วิธีชำระ</span>
                            </div>
                            <div className="space-y-1">
                                {Object.entries(byMethod).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([method, amt]) => (
                                    <div key={method} className="flex justify-between text-xs">
                                        <span className="text-midnight-500">{METHOD_LABEL[method] || method}</span>
                                        <span className="font-mono text-midnight-300">{amt.toLocaleString('th-TH', { maximumFractionDigits: 0 })}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-3">
                        <div className="relative flex-1 min-w-48 max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-600" />
                            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="ค้นหาลูกค้า, เลขเอกสาร..."
                                className="w-full pl-9 pr-4 py-2 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/40" />
                        </div>
                        <select value={filterClient} onChange={e => setFilterClient(e.target.value)}
                            className="px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-xl text-midnight-400 text-sm focus:outline-none">
                            <option value="">ลูกค้าทั้งหมด</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)}
                            className="px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-xl text-midnight-400 text-sm focus:outline-none">
                            <option value="">วิธีชำระทั้งหมด</option>
                            {Object.entries(METHOD_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                        <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
                            className="px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-xl text-midnight-400 text-sm focus:outline-none" />
                    </div>

                    {/* Table */}
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/[0.04]">
                                        {['วันที่', 'ลูกค้า', 'โปรเจค', 'เอกสารอ้างอิง', 'วิธีชำระ', 'อ้างอิง', 'จำนวนเงิน', ''].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-midnight-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 && (
                                        <tr><td colSpan={8} className="px-4 py-12 text-center text-midnight-600 text-sm">ยังไม่มีรายการชำระเงิน</td></tr>
                                    )}
                                    {filtered.map(pay => (
                                        <tr key={pay.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                                            <td className="px-4 py-3 text-sm text-midnight-400 whitespace-nowrap">{pay.payment_date}</td>
                                            <td className="px-4 py-3 text-sm text-midnight-300">{pay.clients?.name || <span className="text-midnight-700">—</span>}</td>
                                            <td className="px-4 py-3 text-sm text-midnight-500">{pay.projects?.name || <span className="text-midnight-700">—</span>}</td>
                                            <td className="px-4 py-3">
                                                {pay.documents ? (
                                                    <Link href={`/admin/documents/${pay.document_id}`} className="font-mono text-xs text-violet-400 hover:text-violet-300">
                                                        {pay.documents.doc_number}
                                                    </Link>
                                                ) : <span className="text-midnight-700">—</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold border ${METHOD_COLOR[pay.payment_method] || 'text-slate-400 bg-slate-500/10 border-slate-500/20'}`}>
                                                    {METHOD_LABEL[pay.payment_method] || pay.payment_method}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs font-mono text-midnight-500">{pay.reference || '—'}</td>
                                            <td className="px-4 py-3 font-mono font-bold text-emerald-400 whitespace-nowrap">
                                                +{parseFloat(String(pay.amount)).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button onClick={() => setDeleteTarget(pay)} className="p-1.5 text-midnight-700 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                {filtered.length > 0 && (
                                    <tfoot>
                                        <tr className="border-t border-white/[0.06]">
                                            <td colSpan={6} className="px-4 py-3 text-xs font-bold text-midnight-500 uppercase tracking-wider">รวม {filtered.length} รายการ</td>
                                            <td className="px-4 py-3 font-mono font-black text-emerald-400">
                                                +{filtered.reduce((s, p) => s + parseFloat(String(p.amount)), 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>
                </div>
            </main>

            {/* ─── Create Modal ─── */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0f0f23] border border-white/[0.08] rounded-2xl w-full max-w-lg shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
                            <h3 className="text-base font-bold text-white flex items-center gap-2"><Banknote className="w-4 h-4 text-emerald-400" /> บันทึกการชำระเงิน</h3>
                            <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-midnight-500" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className={labelCls}>เอกสารอ้างอิง (Invoice)</label>
                                <select value={form.document_id} onChange={e => handleDocSelect(e.target.value)} className={inputCls}>
                                    <option value="">— เลือก Invoice (ไม่บังคับ) —</option>
                                    {documents.map(d => (
                                        <option key={d.id} value={d.id}>
                                            {d.doc_number} — {d.clients?.name || 'ไม่ระบุ'} ({(d.total - (d.paid_amount || 0)).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท)
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>ลูกค้า</label>
                                    <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} className={inputCls}>
                                        <option value="">— เลือกลูกค้า —</option>
                                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>โปรเจค</label>
                                    <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} className={inputCls}>
                                        <option value="">— เลือกโปรเจค —</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>จำนวนเงิน (บาท) *</label>
                                <input type="number" min="0.01" step="any" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className={inputCls} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>วันที่ชำระ *</label>
                                    <input type="date" required value={form.payment_date} onChange={e => setForm({ ...form, payment_date: e.target.value })} className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>วิธีชำระ</label>
                                    <select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })} className={inputCls}>
                                        {Object.entries(METHOD_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>เลขอ้างอิง / สลิป</label>
                                <input type="text" value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} placeholder="เลขที่โอน, เช็ค..."
                                    className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>หมายเหตุ</label>
                                <input type="text" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputCls} />
                            </div>
                            <button type="submit" disabled={submitting} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 text-sm">
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'บันทึกชำระเงิน'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── Delete Confirm ─── */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#0f0f23] border border-red-500/30 rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
                        <Trash2 className="w-10 h-10 text-red-400 mx-auto mb-4" />
                        <h3 className="text-white font-bold text-lg mb-1">ยืนยันการลบ</h3>
                        <p className="text-midnight-500 text-sm mb-6">รายการชำระเงิน {parseFloat(String(deleteTarget.amount)).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-midnight-300 text-sm font-bold hover:bg-white/[0.08]">ยกเลิก</button>
                            <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-600 border border-red-500 text-white text-sm font-bold hover:bg-red-500">ลบ</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

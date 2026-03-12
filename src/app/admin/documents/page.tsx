'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from '@/components/Sidebar'
import {
    FileText, FilePlus, Search, Filter, Trash2, Eye,
    Loader2, X, Plus, Minus, ChevronRight, ArrowRight,
    Receipt, FileCheck, FileSpreadsheet, CreditCard,
    Building2, FolderKanban, Calendar, CheckCircle2, Clock, Ban, AlertCircle
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
type DocType = 'QUOTATION' | 'INVOICE' | 'RECEIPT' | 'TAX_INVOICE'
type DocStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'PAID' | 'PARTIAL' | 'CANCELLED'

interface LineItem { description: string; quantity: string; unit: string; unit_price: string }
interface Document {
    id: string; doc_number: string; doc_type: DocType; status: DocStatus
    client_id: string | null; project_id: string | null
    issue_date: string; due_date: string | null
    subtotal: number; discount: number; vat_rate: number; vat_amount: number; total: number; paid_amount: number
    notes: string | null; ref_doc_id: string | null; created_at: string
    clients: { id: string; name: string } | null
    projects: { id: string; name: string } | null
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TYPE_LABEL: Record<DocType, string> = {
    QUOTATION: 'ใบเสนอราคา', INVOICE: 'ใบแจ้งหนี้',
    RECEIPT: 'ใบเสร็จรับเงิน', TAX_INVOICE: 'ใบกำกับภาษี'
}
const TYPE_COLOR: Record<DocType, string> = {
    QUOTATION: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    INVOICE: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    RECEIPT: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    TAX_INVOICE: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
}
const TYPE_ICON: Record<DocType, any> = {
    QUOTATION: FileSpreadsheet, INVOICE: FileText,
    RECEIPT: Receipt, TAX_INVOICE: FileCheck
}
const STATUS_LABEL: Record<DocStatus, string> = {
    DRAFT: 'ร่าง', SENT: 'ส่งแล้ว', APPROVED: 'อนุมัติ',
    REJECTED: 'ปฏิเสธ', PAID: 'ชำระแล้ว', PARTIAL: 'ชำระบางส่วน', CANCELLED: 'ยกเลิก'
}
const STATUS_COLOR: Record<DocStatus, string> = {
    DRAFT: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
    SENT: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    APPROVED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    REJECTED: 'text-red-400 bg-red-500/10 border-red-500/20',
    PAID: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    PARTIAL: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    CANCELLED: 'text-slate-500 bg-slate-700/20 border-slate-700/30',
}
const CONVERT_NEXT: Partial<Record<DocType, DocType>> = {
    QUOTATION: 'INVOICE', INVOICE: 'RECEIPT'
}
const CONVERT_LABEL: Partial<Record<DocType, string>> = {
    QUOTATION: 'แปลงเป็น Invoice', INVOICE: 'แปลงเป็น Receipt'
}

const EMPTY_ITEM: LineItem = { description: '', quantity: '1', unit: 'งาน', unit_price: '' }

// ─── Component ────────────────────────────────────────────────────────────────
export default function DocumentsPage() {
    const router = useRouter()
    const [documents, setDocuments] = useState<Document[]>([])
    const [clients, setClients] = useState<any[]>([])
    const [projects, setProjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [user, setUser] = useState<any>(null)

    // filters
    const [tabType, setTabType] = useState<DocType | 'ALL'>('ALL')
    const [filterStatus, setFilterStatus] = useState('')
    const [filterClient, setFilterClient] = useState('')
    const [searchQuery, setSearchQuery] = useState('')

    // delete confirm
    const [deleteTarget, setDeleteTarget] = useState<Document | null>(null)

    // form
    const [form, setForm] = useState({
        doc_type: 'QUOTATION' as DocType,
        client_id: '', project_id: '',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: '', discount: '0', vat_rate: '7', notes: ''
    })
    const [items, setItems] = useState<LineItem[]>([{ ...EMPTY_ITEM }])

    // totals preview
    const subtotal = useMemo(() => items.reduce((s, i) => s + (parseFloat(i.unit_price) || 0) * (parseFloat(i.quantity) || 1), 0), [items])
    const discAmt = parseFloat(form.discount) || 0
    const vatAmt = ((subtotal - discAmt) * (parseFloat(form.vat_rate) || 0)) / 100
    const total = subtotal - discAmt + vatAmt

    useEffect(() => {
        const userStr = localStorage.getItem('user')
        if (!userStr) { router.push('/login'); return }
        setUser(JSON.parse(userStr))
        fetchAll()
    }, [])

    const fetchAll = async () => {
        setLoading(true)
        const [docsRes, clientsRes, projectsRes] = await Promise.all([
            fetch('/api/documents'),
            fetch('/api/clients'),
            fetch('/api/admin/projects'),
        ])
        const [docsData, clientsData, projectsData] = await Promise.all([docsRes.json(), clientsRes.json(), projectsRes.json()])
        if (docsData.documents) setDocuments(docsData.documents)
        if (clientsData.clients) setClients(clientsData.clients)
        if (projectsData.projects) setProjects(projectsData.projects)
        setLoading(false)
    }

    const filtered = useMemo(() => documents.filter(d => {
        if (tabType !== 'ALL' && d.doc_type !== tabType) return false
        if (filterStatus && d.status !== filterStatus) return false
        if (filterClient && d.client_id !== filterClient) return false
        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            return d.doc_number.toLowerCase().includes(q) ||
                d.clients?.name.toLowerCase().includes(q) ||
                d.projects?.name.toLowerCase().includes(q)
        }
        return true
    }), [documents, tabType, filterStatus, filterClient, searchQuery])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (submitting) return
        if (items.every(i => !i.description)) return
        setSubmitting(true)
        try {
            const res = await fetch('/api/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, items, userId: user?.id })
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

    const handleConvert = async (doc: Document) => {
        const nextType = CONVERT_NEXT[doc.doc_type]
        if (!nextType) return
        if (!confirm(`แปลง ${doc.doc_number} เป็น ${TYPE_LABEL[nextType]}?`)) return
        const res = await fetch('/api/documents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                doc_type: nextType, client_id: doc.client_id, project_id: doc.project_id,
                issue_date: new Date().toISOString().split('T')[0],
                due_date: doc.due_date, discount: doc.discount,
                vat_rate: doc.vat_rate, notes: doc.notes,
                ref_doc_id: doc.id, userId: user?.id,
                items: [] // caller should add items separately via detail page
            })
        })
        if (res.ok) { fetchAll() }
    }

    const handleStatusChange = async (doc: Document, status: DocStatus) => {
        await fetch('/api/documents', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: doc.id, status, userId: user?.id })
        })
        fetchAll()
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        await fetch(`/api/documents?id=${deleteTarget.id}`, { method: 'DELETE' })
        setDeleteTarget(null)
        setDocuments(prev => prev.filter(d => d.id !== deleteTarget.id))
    }

    const updateItem = (idx: number, field: keyof LineItem, val: string) => {
        setItems(prev => { const n = [...prev]; n[idx] = { ...n[idx], [field]: val }; return n })
    }

    const resetForm = () => {
        setForm({ doc_type: 'QUOTATION', client_id: '', project_id: '', issue_date: new Date().toISOString().split('T')[0], due_date: '', discount: '0', vat_rate: '7', notes: '' })
        setItems([{ ...EMPTY_ITEM }])
    }

    // summary counts
    const counts = useMemo(() => ({
        ALL: documents.length,
        QUOTATION: documents.filter(d => d.doc_type === 'QUOTATION').length,
        INVOICE: documents.filter(d => d.doc_type === 'INVOICE').length,
        RECEIPT: documents.filter(d => d.doc_type === 'RECEIPT').length,
        TAX_INVOICE: documents.filter(d => d.doc_type === 'TAX_INVOICE').length,
    }), [documents])

    const pendingAmt = useMemo(() => documents.filter(d => d.doc_type === 'INVOICE' && ['SENT', 'PARTIAL', 'APPROVED'].includes(d.status)).reduce((s, d) => s + d.total - d.paid_amount, 0), [documents])

    if (loading) return <div className="min-h-screen bg-midnight-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-violet-500 animate-spin" /></div>

    const inputCls = "w-full px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-violet-500/40"
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
                                <FileText className="w-5 h-5 text-violet-400" />
                                เอกสาร
                            </h1>
                            <p className="text-sm text-midnight-500">ใบเสนอราคา · ใบแจ้งหนี้ · ใบเสร็จ · ใบกำกับภาษี</p>
                        </div>
                        <button
                            onClick={() => { resetForm(); setShowModal(true) }}
                            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-violet-600/20 active:scale-95"
                        >
                            <FilePlus className="w-4 h-4" /> สร้างเอกสาร
                        </button>
                    </div>
                </div>

                <div className="p-4 sm:p-8 space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {(['QUOTATION', 'INVOICE', 'RECEIPT', 'TAX_INVOICE'] as DocType[]).map(t => {
                            const Icon = TYPE_ICON[t]
                            return (
                                <div key={t} onClick={() => setTabType(t)} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 cursor-pointer hover:border-white/[0.12] transition-all">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Icon className="w-4 h-4 text-midnight-500" />
                                        <span className="text-[10px] font-bold text-midnight-500 uppercase tracking-wider">{TYPE_LABEL[t]}</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white">{counts[t]}</p>
                                </div>
                            )
                        })}
                    </div>

                    {/* Pending banner */}
                    {pendingAmt > 0 && (
                        <div className="flex items-center gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-amber-400">ค้างชำระ</p>
                                <p className="text-xs text-midnight-500">Invoice ที่ยังไม่ได้ชำระครบ: <span className="text-white font-mono font-bold">{pendingAmt.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span></p>
                            </div>
                        </div>
                    )}

                    {/* Tabs + Filters */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex gap-1 bg-white/[0.02] border border-white/[0.06] rounded-xl p-1">
                            {(['ALL', 'QUOTATION', 'INVOICE', 'RECEIPT', 'TAX_INVOICE'] as const).map(t => (
                                <button key={t} onClick={() => setTabType(t)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${tabType === t ? 'bg-violet-600 text-white shadow-md' : 'text-midnight-500 hover:text-white'}`}>
                                    {t === 'ALL' ? `ทั้งหมด (${counts.ALL})` : `${TYPE_LABEL[t]} (${counts[t]})`}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2 flex-1">
                            <div className="relative flex-1 max-w-xs">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-600" />
                                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="ค้นหาเลขที่, ลูกค้า..."
                                    className="w-full pl-9 pr-4 py-2 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-violet-500/40" />
                            </div>
                            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                                className="px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-xl text-midnight-400 text-sm focus:outline-none">
                                <option value="">สถานะทั้งหมด</option>
                                {(Object.keys(STATUS_LABEL) as DocStatus[]).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                            </select>
                            <select value={filterClient} onChange={e => setFilterClient(e.target.value)}
                                className="px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-xl text-midnight-400 text-sm focus:outline-none">
                                <option value="">ลูกค้าทั้งหมด</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/[0.04]">
                                        {['เลขที่', 'ประเภท', 'ลูกค้า', 'โปรเจค', 'วันที่', 'ครบกำหนด', 'ยอดรวม', 'ชำระแล้ว', 'สถานะ', ''].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-midnight-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 && (
                                        <tr><td colSpan={10} className="px-4 py-12 text-center text-midnight-600 text-sm">ไม่พบเอกสาร</td></tr>
                                    )}
                                    {filtered.map(doc => {
                                        const Icon = TYPE_ICON[doc.doc_type]
                                        const isOverdue = doc.due_date && new Date(doc.due_date) < new Date() && !['PAID', 'CANCELLED'].includes(doc.status)
                                        return (
                                            <tr key={doc.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                                                <td className="px-4 py-3">
                                                    <Link href={`/admin/documents/${doc.id}`} className="font-mono text-sm font-bold text-violet-400 hover:text-violet-300 transition-colors">
                                                        {doc.doc_number}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${TYPE_COLOR[doc.doc_type]}`}>
                                                        <Icon className="w-3 h-3" />{TYPE_LABEL[doc.doc_type]}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-midnight-400">{doc.clients?.name || '—'}</td>
                                                <td className="px-4 py-3 text-sm text-midnight-400">{doc.projects?.name || '—'}</td>
                                                <td className="px-4 py-3 text-sm text-midnight-400 whitespace-nowrap">{doc.issue_date}</td>
                                                <td className="px-4 py-3 text-sm whitespace-nowrap">
                                                    {doc.due_date ? <span className={isOverdue ? 'text-red-400 font-bold' : 'text-midnight-400'}>{doc.due_date}</span> : <span className="text-midnight-700">—</span>}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-mono font-bold text-white whitespace-nowrap">{doc.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                                                <td className="px-4 py-3 text-sm font-mono text-emerald-400 whitespace-nowrap">
                                                    {doc.paid_amount > 0 ? doc.paid_amount.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : <span className="text-midnight-700">—</span>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold border ${STATUS_COLOR[doc.status]}`}>
                                                        {STATUS_LABEL[doc.status]}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1 justify-end">
                                                        <Link href={`/admin/documents/${doc.id}`} className="p-1.5 text-midnight-600 hover:text-white hover:bg-white/5 rounded-lg transition-colors" title="ดูเอกสาร">
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </Link>
                                                        {CONVERT_NEXT[doc.doc_type] && ['APPROVED', 'SENT'].includes(doc.status) && (
                                                            <button onClick={() => handleConvert(doc)} className="p-1.5 text-midnight-600 hover:text-blue-400 hover:bg-blue-500/5 rounded-lg transition-colors" title={CONVERT_LABEL[doc.doc_type]}>
                                                                <ArrowRight className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                        <button onClick={() => setDeleteTarget(doc)} className="p-1.5 text-midnight-600 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>

            {/* ─── Create Modal ─── */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0f0f23] border border-white/[0.08] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2"><FilePlus className="w-5 h-5 text-violet-400" /> สร้างเอกสารใหม่</h3>
                            <button onClick={() => setShowModal(false)} className="p-1 text-midnight-500 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Row 1: type + client + project */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className={labelCls}>ประเภทเอกสาร *</label>
                                    <select value={form.doc_type} onChange={e => setForm({ ...form, doc_type: e.target.value as DocType })} className={inputCls}>
                                        {(Object.entries(TYPE_LABEL) as [DocType, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                    </select>
                                </div>
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

                            {/* Row 2: dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>วันที่ออก</label>
                                    <input type="date" value={form.issue_date} onChange={e => setForm({ ...form, issue_date: e.target.value })} className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>ครบกำหนด</label>
                                    <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className={inputCls} />
                                </div>
                            </div>

                            {/* Line items */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className={labelCls + ' !mb-0'}>รายการสินค้า / บริการ</label>
                                    <button type="button" onClick={() => setItems(p => [...p, { ...EMPTY_ITEM }])} className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-bold">
                                        <Plus className="w-3 h-3" /> เพิ่มรายการ
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    <div className="grid grid-cols-12 gap-2 text-[9px] font-bold text-midnight-600 uppercase tracking-wider px-1">
                                        <span className="col-span-5">รายละเอียด</span>
                                        <span className="col-span-2">จำนวน</span>
                                        <span className="col-span-2">หน่วย</span>
                                        <span className="col-span-2">ราคา/หน่วย</span>
                                        <span className="col-span-1"></span>
                                    </div>
                                    {items.map((item, idx) => (
                                        <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                                            <input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} placeholder="ชื่อสินค้า/บริการ" className={inputCls + ' col-span-5'} required={idx === 0} />
                                            <input value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} type="number" min="0" step="any" className={inputCls + ' col-span-2'} />
                                            <input value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)} placeholder="หน่วย" className={inputCls + ' col-span-2'} />
                                            <input value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', e.target.value)} type="number" min="0" step="any" placeholder="0.00" className={inputCls + ' col-span-2'} />
                                            <button type="button" onClick={() => setItems(p => p.filter((_, i) => i !== idx))} disabled={items.length === 1} className="col-span-1 p-1 text-midnight-600 hover:text-red-400 disabled:opacity-20 flex justify-center">
                                                <Minus className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Discount + VAT */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>ส่วนลด (บาท)</label>
                                    <input type="number" min="0" step="any" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>VAT (%)</label>
                                    <input type="number" min="0" max="100" step="any" value={form.vat_rate} onChange={e => setForm({ ...form, vat_rate: e.target.value })} className={inputCls} />
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className={labelCls}>หมายเหตุ</label>
                                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className={inputCls + ' resize-none'} />
                            </div>

                            {/* Summary */}
                            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-2">
                                <div className="flex justify-between text-sm text-midnight-400"><span>ยอดก่อน VAT</span><span className="font-mono text-white">{subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span></div>
                                {discAmt > 0 && <div className="flex justify-between text-sm text-midnight-400"><span>ส่วนลด</span><span className="font-mono text-red-400">-{discAmt.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span></div>}
                                <div className="flex justify-between text-sm text-midnight-400"><span>VAT {form.vat_rate}%</span><span className="font-mono text-white">{vatAmt.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span></div>
                                <div className="flex justify-between text-base font-bold text-white border-t border-white/[0.06] pt-2"><span>ยอดรวมทั้งสิ้น</span><span className="font-mono text-violet-400">{total.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span></div>
                            </div>

                            <button type="submit" disabled={submitting} className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 text-sm">
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'สร้างเอกสาร'}
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
                        <p className="text-midnight-500 text-sm mb-2">{deleteTarget.doc_number}</p>
                        <p className="text-xs text-midnight-600 mb-6">การลบจะไม่สามารถกู้คืนได้</p>
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

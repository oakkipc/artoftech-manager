'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from '@/components/Sidebar'
import {
    ArrowLeft, Printer, ChevronDown, Loader2, Plus, CreditCard,
    CheckCircle2, Clock, Ban, FileText, X, Banknote
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
type DocType = 'QUOTATION' | 'INVOICE' | 'RECEIPT' | 'TAX_INVOICE'
type DocStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'PAID' | 'PARTIAL' | 'CANCELLED'

interface DocumentDetail {
    id: string; doc_number: string; doc_type: DocType; status: DocStatus
    client_id: string | null; project_id: string | null
    issue_date: string; due_date: string | null
    subtotal: number; discount: number; vat_rate: number; vat_amount: number; wht_rate: number; wht_amount: number; total: number; paid_amount: number
    notes: string | null; ref_doc_id: string | null; created_at: string
    clients: { id: string; name: string; address: string | null; company_tax_id: string | null; contact_person: string | null; email: string | null; phone: string | null } | null
    projects: { id: string; name: string } | null
    document_items: { id: string; description: string; quantity: number; unit: string; unit_price: number; amount: number; sort_order: number }[]
}

interface Payment {
    id: string; amount: number; payment_date: string
    payment_method: string; reference: string | null; notes: string | null; created_at: string
    documents: { doc_number: string; doc_type: string } | null
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TYPE_LABEL: Record<DocType, string> = {
    QUOTATION: 'ใบเสนอราคา', INVOICE: 'ใบแจ้งหนี้',
    RECEIPT: 'ใบเสร็จรับเงิน', TAX_INVOICE: 'ใบกำกับภาษี'
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
const METHOD_LABEL: Record<string, string> = {
    TRANSFER: 'โอนเงิน', CASH: 'เงินสด', CHEQUE: 'เช็ค', CREDIT_CARD: 'บัตรเครดิต', OTHER: 'อื่นๆ'
}
const NEXT_STATUSES: Record<DocStatus, DocStatus[]> = {
    DRAFT: ['SENT', 'CANCELLED'],
    SENT: ['APPROVED', 'REJECTED', 'CANCELLED'],
    APPROVED: ['PAID', 'CANCELLED'],
    REJECTED: ['DRAFT'],
    PAID: [],
    PARTIAL: ['PAID', 'CANCELLED'],
    CANCELLED: ['DRAFT'],
}

// ─── Company Info (แก้ให้ตรงกับบริษัท) ──────────────────────────────────────
const COMPANY = {
    name: 'Art of Tech Co., Ltd.',
    nameТh: 'บริษัท อาร์ต ออฟ เทค จำกัด',
    address: '— กรุณาระบุที่อยู่บริษัท —',
    taxId: '— เลขประจำตัวผู้เสียภาษี —',
    phone: '— โทรศัพท์ —',
    email: '— อีเมล —',
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function DocumentDetailPage() {
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    const [doc, setDoc] = useState<DocumentDetail | null>(null)
    const [payments, setPayments] = useState<Payment[]>([])
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [showPayModal, setShowPayModal] = useState(false)
    const [submittingPay, setSubmittingPay] = useState(false)

    const [payForm, setPayForm] = useState({
        amount: '', payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'TRANSFER', reference: '', notes: ''
    })

    useEffect(() => {
        const userStr = localStorage.getItem('user')
        if (!userStr) { router.push('/login'); return }
        setUser(JSON.parse(userStr))
        fetchDoc()
    }, [id])

    const fetchDoc = async () => {
        setLoading(true)
        const [docRes, payRes] = await Promise.all([
            fetch(`/api/documents?id=${id}`),
            fetch(`/api/payments?documentId=${id}`),
        ])
        const [docData, payData] = await Promise.all([docRes.json(), payRes.json()])
        if (docData.document) setDoc(docData.document)
        if (payData.payments) setPayments(payData.payments)
        setLoading(false)
    }

    const handleStatusChange = async (status: DocStatus) => {
        await fetch('/api/documents', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status, userId: user?.id })
        })
        fetchDoc()
    }

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (submittingPay) return
        setSubmittingPay(true)
        try {
            const res = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    document_id: id,
                    client_id: doc?.client_id,
                    project_id: doc?.project_id,
                    ...payForm,
                    userId: user?.id
                })
            })
            if (res.ok) {
                setShowPayModal(false)
                setPayForm({ amount: '', payment_date: new Date().toISOString().split('T')[0], payment_method: 'TRANSFER', reference: '', notes: '' })
                fetchDoc()
            }
        } finally {
            setSubmittingPay(false)
        }
    }

    const handleDeletePayment = async (payId: string) => {
        if (!confirm('ลบรายการชำระเงินนี้?')) return
        await fetch(`/api/payments?id=${payId}`, { method: 'DELETE' })
        fetchDoc()
    }

    if (loading) return <div className="min-h-screen bg-midnight-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-violet-500 animate-spin" /></div>
    if (!doc) return <div className="min-h-screen bg-midnight-950 flex items-center justify-center text-midnight-500">ไม่พบเอกสาร</div>

    const netPayable = doc.total - (doc.wht_amount || 0)
    const remaining = netPayable - doc.paid_amount
    const nextStatuses = NEXT_STATUSES[doc.status]
    const inputCls = "w-full px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-violet-500/40"
    const labelCls = "block text-[10px] font-bold text-midnight-500 uppercase tracking-wider mb-1.5 ml-1"

    return (
        <div className="min-h-screen bg-midnight-950 flex">
            <Sidebar />
            <main className="flex-1 min-w-0 transition-all duration-300">
                {/* Header */}
                <div className="sticky top-0 z-20 bg-midnight-950/80 backdrop-blur-xl border-b border-white/[0.04] px-4 sm:px-8 py-4 print:hidden">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Link href="/admin/documents" className="p-2 text-midnight-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                <ArrowLeft className="w-4 h-4" />
                            </Link>
                            <div>
                                <h1 className="text-lg font-bold text-white font-mono">{doc.doc_number}</h1>
                                <p className="text-sm text-midnight-500">{TYPE_LABEL[doc.doc_type]}</p>
                            </div>
                            <span className={`ml-2 px-2 py-0.5 rounded-lg text-xs font-bold border ${STATUS_COLOR[doc.status]}`}>{STATUS_LABEL[doc.status]}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Status change */}
                            {nextStatuses.length > 0 && (
                                <div className="relative group">
                                    <button className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.04] border border-white/[0.06] text-midnight-300 text-sm font-medium rounded-lg hover:bg-white/[0.06] transition-all">
                                        เปลี่ยนสถานะ <ChevronDown className="w-3.5 h-3.5" />
                                    </button>
                                    <div className="absolute right-0 top-full mt-1 bg-[#0f0f23] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden hidden group-hover:block min-w-[140px] z-10">
                                        {nextStatuses.map(s => (
                                            <button key={s} onClick={() => handleStatusChange(s)} className="w-full text-left px-4 py-2.5 text-sm text-midnight-300 hover:bg-white/[0.04] hover:text-white transition-colors">
                                                {STATUS_LABEL[s]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* Record payment */}
                            {['SENT', 'APPROVED', 'PARTIAL'].includes(doc.status) && (
                                <button onClick={() => setShowPayModal(true)} className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-all">
                                    <Banknote className="w-4 h-4" /> บันทึกชำระเงิน
                                </button>
                            )}
                            <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] border border-white/[0.06] text-midnight-300 text-sm font-medium rounded-lg hover:bg-white/[0.06] transition-all">
                                <Printer className="w-4 h-4" /> พิมพ์
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4 sm:p-8 space-y-6">
                    {/* ─── Document Preview ─── */}
                    <div id="doc-print" className="bg-white text-gray-900 rounded-2xl shadow-2xl overflow-hidden print:rounded-none print:shadow-none max-w-4xl mx-auto">
                        {/* Doc header */}
                        <div className="p-8 border-b border-gray-200">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900">{COMPANY.nameТh}</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">{COMPANY.name}</p>
                                    <p className="text-sm text-gray-500">{COMPANY.address}</p>
                                    <p className="text-sm text-gray-500">เลขประจำตัวผู้เสียภาษี: {COMPANY.taxId}</p>
                                    <p className="text-sm text-gray-500">{COMPANY.phone} | {COMPANY.email}</p>
                                </div>
                                <div className="text-right">
                                    <div className="inline-block bg-violet-600 text-white px-6 py-2 rounded-xl mb-3">
                                        <p className="text-xs font-bold uppercase tracking-widest opacity-80">{TYPE_LABEL[doc.doc_type]}</p>
                                        <p className="text-xl font-black font-mono">{doc.doc_number}</p>
                                    </div>
                                    <div className="space-y-1 text-sm text-gray-600">
                                        <div className="flex justify-end gap-3">
                                            <span className="text-gray-400">วันที่ออก:</span>
                                            <span className="font-medium">{new Date(doc.issue_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                        </div>
                                        {doc.due_date && (
                                            <div className="flex justify-end gap-3">
                                                <span className="text-gray-400">ครบกำหนด:</span>
                                                <span className="font-medium">{new Date(doc.due_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Client info */}
                        <div className="p-8 border-b border-gray-200 bg-gray-50">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">เรียน / ลูกค้า</p>
                            {doc.clients ? (
                                <div>
                                    <p className="text-lg font-bold text-gray-900">{doc.clients.name}</p>
                                    {doc.clients.address && <p className="text-sm text-gray-600">{doc.clients.address}</p>}
                                    {doc.clients.company_tax_id && <p className="text-sm text-gray-600">เลขประจำตัวผู้เสียภาษี: {doc.clients.company_tax_id}</p>}
                                    {doc.clients.contact_person && <p className="text-sm text-gray-600">ผู้ติดต่อ: {doc.clients.contact_person}</p>}
                                    {doc.clients.phone && <p className="text-sm text-gray-600">โทร: {doc.clients.phone}</p>}
                                </div>
                            ) : <p className="text-gray-400 italic">ไม่ระบุลูกค้า</p>}
                            {doc.projects && <p className="text-sm text-gray-500 mt-1">โปรเจค: <span className="font-medium text-gray-700">{doc.projects.name}</span></p>}
                        </div>

                        {/* Line items */}
                        <div className="p-8">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b-2 border-gray-200">
                                        <th className="text-left py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-8">#</th>
                                        <th className="text-left py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">รายละเอียด</th>
                                        <th className="text-right py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">จำนวน</th>
                                        <th className="text-right py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">หน่วย</th>
                                        <th className="text-right py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">ราคา/หน่วย</th>
                                        <th className="text-right py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">จำนวนเงิน</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {doc.document_items.map((item, idx) => (
                                        <tr key={item.id} className="border-b border-gray-100">
                                            <td className="py-3 text-gray-400">{idx + 1}</td>
                                            <td className="py-3 font-medium text-gray-800">{item.description}</td>
                                            <td className="py-3 text-right text-gray-600">{item.quantity.toLocaleString()}</td>
                                            <td className="py-3 text-right text-gray-600">{item.unit}</td>
                                            <td className="py-3 text-right font-mono text-gray-700">{item.unit_price.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                                            <td className="py-3 text-right font-mono font-medium text-gray-900">{item.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Totals */}
                            <div className="flex justify-end mt-6">
                                <div className="w-72 space-y-2">
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>ยอดก่อน VAT</span>
                                        <span className="font-mono">{doc.subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    {doc.discount > 0 && (
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>ส่วนลด</span>
                                            <span className="font-mono text-red-600">-{doc.discount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>VAT {doc.vat_rate}%</span>
                                        <span className="font-mono">{doc.vat_amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between text-base font-black text-gray-900 border-t-2 border-gray-900 pt-2">
                                        <span>ยอดรวมทั้งสิ้น</span>
                                        <span className="font-mono">{doc.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span>
                                    </div>
                                    {(doc.wht_amount || 0) > 0 && (
                                        <>
                                            <div className="flex justify-between text-sm text-red-600">
                                                <span>หัก ณ ที่จ่าย {doc.wht_rate}%</span>
                                                <span className="font-mono">-{(doc.wht_amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between text-base font-black text-violet-700 border-t border-violet-200 pt-2">
                                                <span>ยอดที่ต้องชำระ</span>
                                                <span className="font-mono">{netPayable.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span>
                                            </div>
                                        </>
                                    )}
                                    {doc.paid_amount > 0 && (
                                        <>
                                            <div className="flex justify-between text-sm text-emerald-600">
                                                <span>ชำระแล้ว</span>
                                                <span className="font-mono">-{doc.paid_amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between text-sm font-bold text-orange-600">
                                                <span>คงเหลือ</span>
                                                <span className="font-mono">{remaining.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {doc.notes && (
                                <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">หมายเหตุ</p>
                                    <p className="text-sm text-gray-600">{doc.notes}</p>
                                </div>
                            )}

                            <div className="mt-8 pt-8 border-t border-gray-200 flex justify-between text-xs text-gray-400">
                                <span>สร้างเมื่อ: {new Date(doc.created_at).toLocaleString('th-TH')}</span>
                                <span>{COMPANY.name}</span>
                            </div>
                        </div>
                    </div>

                    {/* ─── Payment History ─── */}
                    <div className="max-w-4xl mx-auto print:hidden">
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2"><CreditCard className="w-4 h-4 text-emerald-400" /> ประวัติการชำระเงิน</h3>
                                <div className="text-sm font-mono">
                                    <span className="text-midnight-500">คงเหลือ: </span>
                                    <span className={remaining > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>{remaining.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span>
                                </div>
                            </div>
                            {payments.length === 0 ? (
                                <div className="px-6 py-8 text-center text-midnight-600 text-sm">ยังไม่มีการชำระเงิน</div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/[0.04]">
                                            {['วันที่', 'วิธีชำระ', 'อ้างอิง', 'จำนวนเงิน', ''].map(h => (
                                                <th key={h} className="px-6 py-3 text-left text-[10px] font-bold text-midnight-600 uppercase tracking-wider">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map(pay => (
                                            <tr key={pay.id} className="border-b border-white/[0.02]">
                                                <td className="px-6 py-3 text-midnight-400">{pay.payment_date}</td>
                                                <td className="px-6 py-3 text-midnight-400">{METHOD_LABEL[pay.payment_method] || pay.payment_method}</td>
                                                <td className="px-6 py-3 text-midnight-500 font-mono text-xs">{pay.reference || '—'}</td>
                                                <td className="px-6 py-3 font-mono font-bold text-emerald-400">{parseFloat(String(pay.amount)).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                                                <td className="px-6 py-3">
                                                    <button onClick={() => handleDeletePayment(pay.id)} className="p-1 text-midnight-700 hover:text-red-400 transition-colors">
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* ─── Payment Modal ─── */}
            {showPayModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0f0f23] border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
                            <h3 className="text-base font-bold text-white flex items-center gap-2"><Banknote className="w-4 h-4 text-emerald-400" /> บันทึกชำระเงิน</h3>
                            <button onClick={() => setShowPayModal(false)}><X className="w-5 h-5 text-midnight-500" /></button>
                        </div>
                        <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-midnight-500 uppercase tracking-wider mb-1.5 ml-1">จำนวนเงิน *</label>
                                <input type="number" min="0.01" step="any" required value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })}
                                    placeholder={`ยอดค้างชำระ: ${remaining.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`}
                                    className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/40" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-midnight-500 uppercase tracking-wider mb-1.5 ml-1">วันที่ชำระ</label>
                                    <input type="date" value={payForm.payment_date} onChange={e => setPayForm({ ...payForm, payment_date: e.target.value })}
                                        className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/40" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-midnight-500 uppercase tracking-wider mb-1.5 ml-1">วิธีชำระ</label>
                                    <select value={payForm.payment_method} onChange={e => setPayForm({ ...payForm, payment_method: e.target.value })}
                                        className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/40">
                                        {Object.entries(METHOD_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-midnight-500 uppercase tracking-wider mb-1.5 ml-1">เลขอ้างอิง / สลิป</label>
                                <input type="text" value={payForm.reference} onChange={e => setPayForm({ ...payForm, reference: e.target.value })} placeholder="เลขที่โอน, เช็ค..."
                                    className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/40" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-midnight-500 uppercase tracking-wider mb-1.5 ml-1">หมายเหตุ</label>
                                <input type="text" value={payForm.notes} onChange={e => setPayForm({ ...payForm, notes: e.target.value })}
                                    className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/40" />
                            </div>
                            <button type="submit" disabled={submittingPay} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 text-sm">
                                {submittingPay ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'บันทึกชำระเงิน'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

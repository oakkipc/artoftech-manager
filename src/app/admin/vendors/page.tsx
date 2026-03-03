'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { useSidebar } from '@/context/SidebarContext'
import {
    Plus,
    Search,
    Trash2,
    Edit2,
    X,
    Check,
    Loader2,
    Users,
    Mail,
    Phone,
    MapPin,
    Tag,
    ChevronRight,
    ExternalLink,
    Star,
    Calendar
} from 'lucide-react'

interface Vendor {
    id: string
    name: string
    contact_person: string
    email: string
    phone: string
    address: string
    category: string
    rating: number
    notes: string
    credit_term: number
    created_at: string
}

export default function VendorsPage() {
    const router = useRouter()
    const [vendors, setVendors] = useState<Vendor[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    const [formData, setFormData] = useState({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        category: 'Supplier',
        rating: 0,
        notes: '',
        credit_term: 0
    })

    useEffect(() => {
        const userStr = localStorage.getItem('user')
        if (!userStr) { router.push('/login'); return }
        fetchVendors()
    }, [])

    const fetchVendors = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/vendors')
            const data = await res.json()
            if (data.vendors) setVendors(data.vendors)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name || submitting) return
        setSubmitting(true)

        try {
            const res = await fetch('/api/vendors', {
                method: editingId ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingId ? { ...formData, id: editingId } : formData)
            })

            if (res.ok) {
                setShowModal(false)
                setEditingId(null)
                setFormData({
                    name: '',
                    contact_person: '',
                    email: '',
                    phone: '',
                    address: '',
                    category: 'Supplier',
                    rating: 0,
                    notes: '',
                    credit_term: 0
                })
                fetchVendors()
            } else {
                const error = await res.json()
                alert(`Error: ${error.error || 'Failed to save vendor'}`)
            }
        } catch (err: any) {
            console.error(err)
            alert('An unexpected error occurred')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('ยืนยันการลบ Vendor นี้?')) return
        try {
            await fetch(`/api/vendors?id=${id}`, { method: 'DELETE' })
            setVendors(prev => prev.filter(v => v.id !== id))
        } catch (err) {
            console.error(err)
        }
    }

    const startEdit = (vendor: Vendor) => {
        setEditingId(vendor.id)
        setFormData({
            name: vendor.name,
            contact_person: vendor.contact_person || '',
            email: vendor.email || '',
            phone: vendor.phone || '',
            address: vendor.address || '',
            category: vendor.category || 'Supplier',
            rating: vendor.rating || 0,
            notes: vendor.notes || '',
            credit_term: vendor.credit_term || 0
        })
        setShowModal(true)
    }

    const filteredVendors = vendors.filter(v =>
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.contact_person?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading && vendors.length === 0) {
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
                <div className="sticky top-0 z-20 bg-midnight-950/80 backdrop-blur-xl border-b border-white/[0.04] px-4 sm:px-8 py-4 text-white">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                <Users className="w-5 h-5 text-violet-400" />
                                Vendors & Suppliers
                            </h1>
                            <p className="text-sm text-midnight-500">Manage your business partners and suppliers</p>
                        </div>
                        <button onClick={() => { setEditingId(null); setShowModal(true) }}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-violet-600/20 active:scale-95">
                            <Plus className="w-4 h-4" /> Add Vendor
                        </button>
                    </div>
                </div>

                <div className="p-4 sm:p-8 space-y-6">
                    {/* Search & Filters */}
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-600" />
                        <input
                            type="text"
                            placeholder="Search vendors..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white text-sm focus:outline-none focus:border-violet-500/40"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredVendors.map((vendor) => (
                            <div key={vendor.id} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 hover:border-violet-500/30 transition-all group">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 font-bold text-lg">
                                        {vendor.name.charAt(0)}
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => startEdit(vendor)} className="p-2 text-midnight-600 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(vendor.id)} className="p-2 text-midnight-600 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-white font-bold text-lg">{vendor.name}</h3>
                                        <div className="flex items-center gap-1 mt-1">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <Star key={s} className={`w-3 h-3 ${s <= (vendor.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-midnight-700'}`} />
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-1.5">
                                            <Tag className="w-3 h-3 text-violet-400" />
                                            <span className="text-xs text-violet-400 font-medium">{vendor.category}</span>
                                        </div>
                                        {vendor.credit_term > 0 && (
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <Calendar className="w-3 h-3 text-midnight-500" />
                                                <span className="text-[10px] text-midnight-500 font-bold uppercase tracking-wider">Credit: {vendor.credit_term} Days</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2.5">
                                        {vendor.contact_person && (
                                            <div className="flex items-center gap-3 text-midnight-400 text-sm">
                                                <Users className="w-4 h-4 opacity-50 text-midnight-600" />
                                                {vendor.contact_person}
                                            </div>
                                        )}
                                        {vendor.email && (
                                            <div className="flex items-center gap-3 text-midnight-400 text-sm">
                                                <Mail className="w-4 h-4 opacity-50 text-midnight-600" />
                                                {vendor.email}
                                            </div>
                                        )}
                                        {vendor.phone && (
                                            <div className="flex items-center gap-3 text-midnight-400 text-sm">
                                                <Phone className="w-4 h-4 opacity-50 text-midnight-600" />
                                                {vendor.phone}
                                            </div>
                                        )}
                                        {vendor.address && (
                                            <div className="flex items-start gap-3 text-midnight-400 text-sm">
                                                <MapPin className="w-4 h-4 opacity-50 text-midnight-600 mt-0.5" />
                                                <span className="line-clamp-2">{vendor.address}</span>
                                            </div>
                                        )}
                                        {vendor.notes && (
                                            <div className="mt-4 p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                                                <p className="text-xs text-midnight-500 line-clamp-3 leading-relaxed">
                                                    {vendor.notes}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-white/[0.04]">
                                    <button onClick={() => router.push(`/budget?vendorId=${vendor.id}`)} className="w-full flex items-center justify-between text-xs font-bold text-midnight-500 hover:text-white transition-colors group/btn">
                                        VIEW TRANSACTIONS
                                        <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredVendors.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center py-20 bg-white/[0.01] border border-dashed border-white/10 rounded-3xl">
                            <Users className="w-12 h-12 text-midnight-800 mb-4" />
                            <p className="text-midnight-500 italic">No vendors found.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0f0f23] border border-white/[0.08] rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                {editingId ? 'Edit Vendor' : 'Add New Vendor'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-1 text-midnight-500 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-[10px] font-bold text-midnight-500 uppercase tracking-wider mb-1.5 ml-1">Vendor Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Company Name"
                                        className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-violet-500/40"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-midnight-500 uppercase tracking-wider mb-1.5 ml-1">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-violet-500/40"
                                    >
                                        <option value="Supplier" className="bg-[#0f0f23]">Supplier</option>
                                        <option value="Cloud Service" className="bg-[#0f0f23]">Cloud Service</option>
                                        <option value="Hardware" className="bg-[#0f0f23]">Hardware</option>
                                        <option value="Freelance" className="bg-[#0f0f23]">Freelance</option>
                                        <option value="Agency" className="bg-[#0f0f23]">Agency</option>
                                        <option value="Other" className="bg-[#0f0f23]">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-midnight-500 uppercase tracking-wider mb-1.5 ml-1">Credit Term (Days)</label>
                                    <input
                                        type="number"
                                        value={formData.credit_term}
                                        onChange={(e) => setFormData({ ...formData, credit_term: parseInt(e.target.value) || 0 })}
                                        placeholder="30"
                                        className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-violet-500/40"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-midnight-500 uppercase tracking-wider mb-1.5 ml-1">Contact Person</label>
                                    <input
                                        type="text"
                                        value={formData.contact_person}
                                        onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-violet-500/40"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-midnight-500 uppercase tracking-wider mb-1.5 ml-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-violet-500/40"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-midnight-500 uppercase tracking-wider mb-1.5 ml-1">Phone</label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-violet-500/40"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-[10px] font-bold text-midnight-500 uppercase tracking-wider mb-1.5 ml-1">Address</label>
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-violet-500/40 min-h-[80px]"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-[10px] font-bold text-midnight-500 uppercase tracking-wider mb-1.5 ml-1">Rating</label>
                                    <div className="flex items-center gap-2 mb-4">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, rating: s })}
                                                className="p-1 transition-transform active:scale-90"
                                            >
                                                <Star className={`w-6 h-6 ${s <= formData.rating ? 'text-yellow-400 fill-yellow-400' : 'text-midnight-700 hover:text-midnight-400'}`} />
                                            </button>
                                        ))}
                                    </div>
                                    <label className="block text-[10px] font-bold text-midnight-500 uppercase tracking-wider mb-1.5 ml-1">Internal Notes</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Add important information about this vendor..."
                                        className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-violet-500/40 min-h-[100px]"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-600/20 active:scale-[0.98] disabled:opacity-50 mt-4 text-sm"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : editingId ? 'Update Vendor' : 'Create Vendor'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

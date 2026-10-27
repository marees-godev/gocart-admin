'use client'

import { useEffect, useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import {
    ShieldCheck,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Search,
    AlertCircle,
    Store,
    Filter,
    X,
    FileText,
    HelpCircle,
    Building2,
    Calendar,
} from 'lucide-react'
import StoreInfo from '@/components/admin/StoreInfo'
import Loading from '@/components/Loading'

const REJECTION_TEMPLATES = [
    'Incomplete documentation or unverified business details',
    'Invalid or unverified business address and contact information',
    'KYC identity verification rejected or documents are illegible',
    'Store catalogue violates marketplace merchant terms of service',
    'Duplicate merchant registration detected',
]

export default function AdminApprove() {
    const [stores, setStores] = useState([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL_PENDING') // 'ALL_PENDING' | 'PENDING_APPROVAL' | 'DRAFT' | 'ALL'

    // Rejection Modal state
    const [rejectModalOpen, setRejectModalOpen] = useState(false)
    const [selectedStore, setSelectedStore] = useState(null)
    const [rejectReason, setRejectReason] = useState('')

    // Fetch pending stores from the API
    const fetchStores = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/stores/pending?status=ALL', {
                cache: 'no-store',
            })
            const data = await res.json()

            if (data.success && Array.isArray(data.stores)) {
                setStores(data.stores)
            } else {
                throw new Error(data.message || 'Failed to fetch stores')
            }
        } catch (err) {
            console.error('Failed to load stores from API:', err)
            toast.error(err.message || 'Failed to load store applications from backend')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStores()
    }, [])

    // Approve Store handler
    const handleApprove = async (store) => {
        if (!store?.id) return

        const confirmed = window.confirm(
            `Are you sure you want to approve "${store.name}"? This will allow the merchant to publish products on GoCart.`
        )
        if (!confirmed) return

        setActionLoading(store.id)
        try {
            const res = await fetch('/api/admin/stores/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storeId: store.id,
                    action: 'approve',
                }),
            })

            const data = await res.json()
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Approval failed')
            }

            toast.success(`Store "${store.name}" approved successfully!`)
            // Remove from pending list or update status
            setStores((prev) => prev.filter((s) => s.id !== store.id))
        } catch (err) {
            console.error('Approve Store Error:', err)
            toast.error(err.message || 'Failed to approve store')
        } finally {
            setActionLoading(null)
        }
    }

    // Open Reject Modal
    const openRejectModal = (store) => {
        setSelectedStore(store)
        setRejectReason(REJECTION_TEMPLATES[0])
        setRejectModalOpen(true)
    }

    // Submit Store Rejection
    const submitReject = async () => {
        if (!selectedStore?.id) return
        if (!rejectReason.trim()) {
            toast.error('Please specify a rejection reason')
            return
        }

        setActionLoading(selectedStore.id)
        try {
            const res = await fetch('/api/admin/stores/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storeId: selectedStore.id,
                    action: 'reject',
                    reason: rejectReason.trim(),
                }),
            })

            const data = await res.json()
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Rejection failed')
            }

            toast.success(`Store "${selectedStore.name}" application rejected.`)
            setStores((prev) => prev.filter((s) => s.id !== selectedStore.id))
            setRejectModalOpen(false)
            setSelectedStore(null)
            setRejectReason('')
        } catch (err) {
            console.error('Reject Store Error:', err)
            toast.error(err.message || 'Failed to reject store')
        } finally {
            setActionLoading(null)
        }
    }

    // Filtered store applications
    const filteredStores = useMemo(() => {
        return stores.filter((store) => {
            const st = (store.approvalStatus || '').toUpperCase()

            // Status filter logic
            let matchesStatus = true
            if (statusFilter === 'ALL_PENDING') {
                matchesStatus = st === 'PENDING' || st === 'PENDING_APPROVAL' || st === 'DRAFT'
            } else if (statusFilter === 'PENDING_APPROVAL') {
                matchesStatus = st === 'PENDING_APPROVAL' || st === 'PENDING'
            } else if (statusFilter === 'DRAFT') {
                matchesStatus = st === 'DRAFT'
            } else if (statusFilter === 'ALL') {
                matchesStatus = true
            }

            // Search query filter
            const query = searchQuery.toLowerCase().trim()
            const matchesSearch =
                !query ||
                (store.name && store.name.toLowerCase().includes(query)) ||
                (store.slug && store.slug.toLowerCase().includes(query)) ||
                (store.businessEmail && store.businessEmail.toLowerCase().includes(query)) ||
                (store.businessPhone && store.businessPhone.toLowerCase().includes(query)) ||
                (store.merchantId && store.merchantId.toLowerCase().includes(query)) ||
                (store.gstin && store.gstin.toLowerCase().includes(query))

            return matchesStatus && matchesSearch
        })
    }, [stores, statusFilter, searchQuery])

    // Counters
    const pendingApprovalCount = stores.filter((s) => {
        const st = (s.approvalStatus || '').toUpperCase()
        return st === 'PENDING_APPROVAL' || st === 'PENDING'
    }).length

    const draftCount = stores.filter((s) => (s.approvalStatus || '').toUpperCase() === 'DRAFT').length

    if (loading && stores.length === 0) return <Loading />

    return (
        <div className="text-slate-700 max-w-5xl pb-24 space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                                Merchant Store Approvals
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                Review submitted store applications, verify KYC, and grant selling privileges.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchStores}
                        disabled={loading}
                        className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition flex items-center gap-2 text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin text-indigo-600' : ''} />
                        <span>Refresh API</span>
                    </button>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Status Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                        <button
                            type="button"
                            onClick={() => setStatusFilter('ALL_PENDING')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                                statusFilter === 'ALL_PENDING'
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                            }`}
                        >
                            <span>Awaiting Review</span>
                            <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                    statusFilter === 'ALL_PENDING'
                                        ? 'bg-indigo-500 text-white'
                                        : 'bg-slate-200 text-slate-700'
                                }`}
                            >
                                {pendingApprovalCount + draftCount}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setStatusFilter('PENDING_APPROVAL')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                                statusFilter === 'PENDING_APPROVAL'
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                            }`}
                        >
                            <span>Submitted KYC</span>
                            <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                    statusFilter === 'PENDING_APPROVAL'
                                        ? 'bg-indigo-500 text-white'
                                        : 'bg-slate-200 text-slate-700'
                                }`}
                            >
                                {pendingApprovalCount}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setStatusFilter('DRAFT')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                                statusFilter === 'DRAFT'
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                            }`}
                        >
                            <span>Drafts</span>
                            <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                    statusFilter === 'DRAFT'
                                        ? 'bg-indigo-500 text-white'
                                        : 'bg-slate-200 text-slate-700'
                                }`}
                            >
                                {draftCount}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setStatusFilter('ALL')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                statusFilter === 'ALL'
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                            }`}
                        >
                            All Database Stores ({stores.length})
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full md:w-72">
                        <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search store, merchant or GSTIN..."
                            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition text-slate-800 placeholder:text-slate-400"
                        />
                    </div>
                </div>
            </div>

            {/* Applications List */}
            {filteredStores.length > 0 ? (
                <div className="space-y-4">
                    {filteredStores.map((store) => (
                        <div
                            key={store.id}
                            className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-end justify-between gap-6"
                        >
                            {/* Store Information */}
                            <div className="flex-1">
                                <StoreInfo store={store} />

                                {store.merchantId && (
                                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                                        <span className="font-mono bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-600">
                                            Store UUID: {store.id}
                                        </span>
                                        <span className="font-mono bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-600">
                                            Merchant UUID: {store.merchantId}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 pt-2 md:pt-0 shrink-0">
                                <button
                                    type="button"
                                    disabled={actionLoading === store.id}
                                    onClick={() => handleApprove(store)}
                                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                                >
                                    {actionLoading === store.id ? (
                                        <RefreshCw size={14} className="animate-spin" />
                                    ) : (
                                        <CheckCircle2 size={15} />
                                    )}
                                    <span>Approve Store</span>
                                </button>

                                <button
                                    type="button"
                                    disabled={actionLoading === store.id}
                                    onClick={() => openRejectModal(store)}
                                    className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 active:scale-[0.98] rounded-xl text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                >
                                    <XCircle size={15} />
                                    <span>Reject</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-sm">
                        <CheckCircle2 size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">All Applications Reviewed</h2>
                    <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                        There are currently no store applications waiting for approval under this filter. New merchant registrations will appear here automatically.
                    </p>
                    {statusFilter !== 'ALL' && (
                        <button
                            type="button"
                            onClick={() => setStatusFilter('ALL')}
                            className="mt-4 px-4 py-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition cursor-pointer"
                        >
                            View All Platform Stores
                        </button>
                    )}
                </div>
            )}

            {/* Rejection Modal Dialog */}
            {rejectModalOpen && selectedStore && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
                                    <XCircle size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        Reject Store Application
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Rejecting <span className="font-semibold text-slate-700">{selectedStore.name}</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setRejectModalOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Rejection Reason Form */}
                        <div className="space-y-3">
                            <label className="text-xs font-semibold text-slate-700 block">
                                Quick Rejection Templates
                            </label>
                            <div className="space-y-1.5">
                                {REJECTION_TEMPLATES.map((tmpl) => (
                                    <button
                                        key={tmpl}
                                        type="button"
                                        onClick={() => setRejectReason(tmpl)}
                                        className={`w-full text-left text-xs p-2.5 rounded-xl border transition cursor-pointer ${
                                            rejectReason === tmpl
                                                ? 'bg-rose-50 border-rose-300 text-rose-900 font-medium'
                                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        {tmpl}
                                    </button>
                                ))}
                            </div>

                            <label className="text-xs font-semibold text-slate-700 block pt-1">
                                Customized Reason sent to Merchant:
                            </label>
                            <textarea
                                rows={3}
                                required
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Enter specific feedback or reason for store application rejection..."
                                className="w-full p-3 text-xs bg-white border border-slate-200 rounded-xl focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none transition text-slate-800 placeholder:text-slate-400"
                            />
                        </div>

                        {/* Modal Actions */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setRejectModalOpen(false)}
                                className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={actionLoading === selectedStore.id || !rejectReason.trim()}
                                onClick={submitReject}
                                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white transition flex items-center gap-1.5 shadow-sm shadow-rose-600/20 disabled:opacity-50 cursor-pointer"
                            >
                                {actionLoading === selectedStore.id ? (
                                    <RefreshCw size={14} className="animate-spin" />
                                ) : (
                                    <XCircle size={14} />
                                )}
                                <span>Confirm Rejection</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
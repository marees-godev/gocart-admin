'use client'

import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
    Truck,
    CheckCircle2,
    XCircle,
    ShieldCheck,
    RefreshCw,
    Search,
    X
} from 'lucide-react'
import Loading from '@/components/Loading'

function authHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
}

export default function AdminDeliveryPartners() {
    const [partners, setPartners] = useState([])
    const [loading, setLoading] = useState(true)
    const [partnerLookup, setPartnerLookup] = useState('')
    const [actingId, setActingId] = useState(null)
    const [rejectTarget, setRejectTarget] = useState(null)
    const [rejectReason, setRejectReason] = useState('')

    const fetchPartners = async (partnerId = '') => {
        try {
            const url = partnerId
                ? `/api/admin/delivery-partners?partnerId=${encodeURIComponent(partnerId)}`
                : '/api/admin/delivery-partners'
            const res = await fetch(url, { headers: authHeaders(), cache: 'no-store' })
            const json = await res.json().catch(() => null)
            if (!res.ok || !json?.success) {
                throw new Error(json?.message || 'Failed to load delivery partners')
            }
            setPartners(json.partners || [])
        } catch (err) {
            toast.error(err.message || 'Failed to load delivery partners')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPartners()
    }, [])

    const handleAction = async (partnerId, action, reason = '') => {
        if (actingId) return
        setActingId(partnerId)
        try {
            const res = await fetch('/api/admin/delivery-partners', {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ partnerId, action, reason }),
            })
            const json = await res.json().catch(() => null)
            if (!res.ok || !json?.success) {
                throw new Error(json?.message || `Failed to ${action}`)
            }
            if (json.partner) {
                setPartners((prev) => prev.map((p) => (p.partnerId === partnerId ? { ...p, ...json.partner } : p)))
            }
            toast.success(`Partner ${action.replace('_', ' ')} succeeded`)
            if (action === 'reject') {
                setRejectTarget(null)
                setRejectReason('')
            }
        } catch (err) {
            toast.error(err.message || 'Action failed')
        } finally {
            setActingId(null)
        }
    }

    if (loading) return <Loading />

    return (
        <div className="text-slate-600 mb-28 max-w-6xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl text-slate-500 flex items-center gap-2">
                        <Truck className="text-indigo-600" size={24} />
                        Delivery <span className="text-slate-800 font-medium">Partners & Appeals</span>
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Review appealed delivery partner applications, verify GSTIN, and approve or reject partners.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => { setLoading(true); setPartnerLookup(''); fetchPartners() }}
                    className="self-start sm:self-auto p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition flex items-center gap-2 text-xs font-semibold"
                >
                    <RefreshCw size={14} /> Refresh Appeals
                </button>
            </div>

            {/* Lookup by Partner ID */}
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    setLoading(true)
                    fetchPartners(partnerLookup.trim())
                }}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3"
            >
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={partnerLookup}
                        onChange={(e) => setPartnerLookup(e.target.value)}
                        placeholder="Lookup specific partner by Partner ID (leave empty for appealed partners)..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 focus:border-slate-800 outline-none text-sm text-slate-800"
                    />
                    <Search size={16} className="absolute left-3.5 top-2.5 text-slate-400" />
                </div>
                <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition"
                >
                    Lookup Partner
                </button>
            </form>

            {partners.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-2">
                    <h2 className="text-lg font-bold text-slate-900">No Appealed Delivery Partners</h2>
                    <p className="text-sm text-slate-500 max-w-xl mx-auto">
                        The backend GraphQL API (<code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">appealDeliveryPartners</code>) only lists partners with <strong>APPEALED</strong> status. To approve, reject, or verify GSTIN for a newly registered (<strong>PENDING</strong>) delivery agent, enter their Partner ID above.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {partners.map((p) => (
                        <div key={p.id || p.partnerId} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1.5 text-sm">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="font-bold text-slate-900 text-base">{p.companyName || 'Unnamed Partner'}</h3>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                        {p.approvalStatus}
                                    </span>
                                    {p.isGstinVerified && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            <ShieldCheck size={12} /> GSTIN Verified
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500">
                                    Partner ID: <span className="font-mono text-slate-700">{p.partnerId}</span> • Email: {p.email} • Phone: {p.contactNumber || '-'}
                                </p>
                                {p.gstin && (
                                    <p className="text-xs text-slate-500">GSTIN: <span className="font-mono text-slate-800">{p.gstin}</span></p>
                                )}
                                {p.appealReason && (
                                    <p className="text-xs bg-amber-50 text-amber-800 px-3 py-1.5 rounded-lg border border-amber-200">
                                        <strong>Appeal Reason:</strong> {p.appealReason}
                                    </p>
                                )}
                                {p.rejectionReason && (
                                    <p className="text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-lg border border-red-200">
                                        <strong>Previous Rejection:</strong> {p.rejectionReason}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                                {!p.isGstinVerified && p.gstin && (
                                    <button
                                        type="button"
                                        disabled={actingId === p.partnerId}
                                        onClick={() => handleAction(p.partnerId, 'verify_gstin')}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition"
                                    >
                                        <ShieldCheck size={14} /> Verify GSTIN
                                    </button>
                                )}
                                <button
                                    type="button"
                                    disabled={actingId === p.partnerId}
                                    onClick={() => handleAction(p.partnerId, 'approve')}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
                                >
                                    <CheckCircle2 size={14} /> Approve
                                </button>
                                <button
                                    type="button"
                                    disabled={actingId === p.partnerId}
                                    onClick={() => setRejectTarget(p)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition"
                                >
                                    <XCircle size={14} /> Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {rejectTarget && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="font-bold text-slate-900">Reject Partner: {rejectTarget.companyName}</h3>
                            <button type="button" onClick={() => setRejectTarget(null)} className="text-slate-400 hover:text-slate-700">
                                <X size={18} />
                            </button>
                        </div>
                        <textarea
                            rows={3}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Enter rejection reason..."
                            className="w-full p-3 rounded-xl border border-slate-300 focus:border-slate-800 outline-none text-sm"
                        />
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setRejectTarget(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={!rejectReason.trim() || actingId === rejectTarget.partnerId}
                                onClick={() => handleAction(rejectTarget.partnerId, 'reject', rejectReason)}
                                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold"
                            >
                                Confirm Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

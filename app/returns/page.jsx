'use client'

import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
    RotateCcw,
    CheckCircle2,
    XCircle,
    RefreshCw,
    X
} from 'lucide-react'
import Loading from '@/components/Loading'
import { graphqlRequest } from '@/lib/apiClient'
import {
    GET_EXCHANGE_QUERY,
    VERIFY_EXCHANGE_PRODUCT_MUTATION,
    RESOLVE_EXCHANGE_MISMATCH_MUTATION
} from '@/lib/graphql/return'

function authHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
}

const STATUS_FILTERS = ['ALL', 'RETURN_REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PICKED_UP', 'RECEIVED', 'COMPLETED']

export default function AdminReturns() {
    const [returnsList, setReturnsList] = useState([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [actingId, setActingId] = useState(null)
    const [rejectTarget, setRejectTarget] = useState(null)
    const [rejectReason, setRejectReason] = useState('')
    const [exchangeLookupId, setExchangeLookupId] = useState('')
    const [exchangeData, setExchangeData] = useState(null)
    const [loadingExchange, setLoadingExchange] = useState(false)

    const handleLookupExchange = async (e) => {
        e?.preventDefault()
        if (!exchangeLookupId.trim()) return
        setLoadingExchange(true)
        try {
            const res = await graphqlRequest(GET_EXCHANGE_QUERY, { id: exchangeLookupId.trim() })
            if (res?.exchange) {
                setExchangeData(res.exchange)
                toast.success('Exchange loaded')
            } else {
                toast.error('Exchange not found')
            }
        } catch (err) {
            toast.error(err.message || 'Exchange lookup failed')
        } finally {
            setLoadingExchange(false)
        }
    }

    const handleResolveExchange = async (action) => {
        if (!exchangeData?.id) return
        try {
            const res = await graphqlRequest(RESOLVE_EXCHANGE_MISMATCH_MUTATION, {
                input: { exchangeId: exchangeData.id, action }
            })
            if (res?.resolveExchangeMismatch) {
                setExchangeData((prev) => ({ ...prev, ...res.resolveExchangeMismatch }))
                toast.success(`Exchange updated: ${action}`)
            }
        } catch (err) {
            toast.error(err.message || 'Failed to resolve exchange')
        }
    }

    const fetchReturns = async (status = statusFilter) => {
        try {
            const query = status && status !== 'ALL' ? `?status=${encodeURIComponent(status)}&limit=50` : '?limit=50'
            const res = await fetch(`/api/admin/returns${query}`, { headers: authHeaders(), cache: 'no-store' })
            const json = await res.json().catch(() => null)
            if (!res.ok || !json?.success) {
                throw new Error(json?.message || 'Failed to load returns')
            }
            setReturnsList(json.returns || [])
        } catch (err) {
            toast.error(err.message || 'Failed to load returns')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchReturns(statusFilter)
    }, [statusFilter])

    const handleAction = async (id, action, reason = '', nextStatus = '') => {
        if (actingId) return
        setActingId(id)
        try {
            const res = await fetch('/api/admin/returns', {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ id, action, reason, status: nextStatus }),
            })
            const json = await res.json().catch(() => null)
            if (!res.ok || !json?.success) {
                throw new Error(json?.message || `Failed to ${action} return`)
            }
            if (json.returnOrder) {
                setReturnsList((prev) => prev.map((r) => (r.id === id ? { ...r, ...json.returnOrder } : r)))
            }
            toast.success(`Return ${action.replace('_', ' ')} succeeded`)
            if (action === 'reject') {
                setRejectTarget(null)
                setRejectReason('')
            }
        } catch (err) {
            toast.error(err.message || 'Failed to update return')
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
                        <RotateCcw className="text-indigo-600" size={24} />
                        Returns & <span className="text-slate-800 font-medium">Refund Requests</span>
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Approve, reject, and track return and replacement requests across orders.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => { setLoading(true); fetchReturns(statusFilter) }}
                    className="self-start sm:self-auto p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition flex items-center gap-2 text-xs font-semibold"
                >
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {STATUS_FILTERS.map((st) => (
                    <button
                        key={st}
                        type="button"
                        onClick={() => { setLoading(true); setStatusFilter(st) }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                            statusFilter === st
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        {st === 'ALL' ? 'All Returns' : st.replace(/_/g, ' ')}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-wider border-b border-slate-200">
                            <tr>
                                <th className="py-3.5 px-6">Return / Order</th>
                                <th className="py-3.5 px-6">Type</th>
                                <th className="py-3.5 px-6">Reason</th>
                                <th className="py-3.5 px-6 text-center">Refund</th>
                                <th className="py-3.5 px-6">Status</th>
                                <th className="py-3.5 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {returnsList.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-10 text-center text-slate-400">
                                        No return requests found.
                                    </td>
                                </tr>
                            ) : (
                                returnsList.map((ret) => (
                                    <tr key={ret.id} className="hover:bg-slate-50/80 transition">
                                        <td className="py-4 px-6">
                                            <p className="font-mono text-xs font-bold text-slate-800">#{ret.id.slice(0, 8)}</p>
                                            <p className="text-xs text-slate-400 font-mono">Order: {ret.orderId?.slice(0, 8)}</p>
                                        </td>
                                        <td className="py-4 px-6 text-xs font-semibold text-slate-700">{ret.type}</td>
                                        <td className="py-4 px-6 text-xs text-slate-600 max-w-xs truncate">{ret.reason}</td>
                                        <td className="py-4 px-6 text-center font-bold text-slate-900">
                                            ${Number(ret.refundAmount || 0).toFixed(2)}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                                                {ret.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="inline-flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    disabled={actingId === ret.id}
                                                    onClick={() => handleAction(ret.id, 'approve')}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition"
                                                >
                                                    <CheckCircle2 size={13} /> Approve
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={actingId === ret.id}
                                                    onClick={() => setRejectTarget(ret)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition"
                                                >
                                                    <XCircle size={13} /> Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {rejectTarget && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="font-bold text-slate-900">Reject Return #{rejectTarget.id.slice(0, 8)}</h3>
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
                                disabled={!rejectReason.trim() || actingId === rejectTarget.id}
                                onClick={() => handleAction(rejectTarget.id, 'reject', rejectReason)}
                                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold"
                            >
                                Confirm Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Exchange Lookup & Resolution */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div>
                    <h2 className="text-base font-bold text-slate-800">Trade-In Exchange Lookup &amp; Resolution</h2>
                    <p className="text-xs text-slate-400">Inspect an exchange by ID and resolve valuation mismatches.</p>
                </div>
                <form onSubmit={handleLookupExchange} className="flex gap-2 max-w-lg text-xs">
                    <input
                        type="text"
                        value={exchangeLookupId}
                        onChange={(e) => setExchangeLookupId(e.target.value)}
                        placeholder="Enter Exchange UUID..."
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-300 outline-none focus:border-slate-800"
                    />
                    <button
                        type="submit"
                        disabled={loadingExchange}
                        className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-xl disabled:opacity-50"
                    >
                        {loadingExchange ? 'Loading...' : 'Lookup Exchange'}
                    </button>
                </form>
                {exchangeData && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div>
                            <p className="font-bold text-slate-800">{exchangeData.oldBrand} {exchangeData.oldModel}</p>
                            <p className="text-slate-500">Status: <strong>{exchangeData.status}</strong> • Discount: ${exchangeData.finalDiscount ?? exchangeData.estimatedDiscount}</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => handleResolveExchange('PAY_DIFFERENCE')}
                                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold"
                            >
                                Pay Difference
                            </button>
                            <button
                                type="button"
                                onClick={() => handleResolveExchange('CANCEL_EXCHANGE')}
                                className="px-3 py-1.5 bg-rose-600 text-white rounded-lg font-semibold"
                            >
                                Cancel Exchange
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

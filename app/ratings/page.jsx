'use client'

import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
    Flag,
    Star,
    Eye,
    EyeOff,
    RefreshCw
} from 'lucide-react'
import Loading from '@/components/Loading'

function authHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
}

export default function AdminRatingsModeration() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [actingId, setActingId] = useState(null)

    const fetchFlaggedRatings = async () => {
        try {
            const res = await fetch('/api/admin/ratings?limit=50', { headers: authHeaders(), cache: 'no-store' })
            const json = await res.json().catch(() => null)
            if (!res.ok || !json?.success) {
                throw new Error(json?.message || 'Failed to load flagged ratings')
            }
            setItems(json.items || [])
        } catch (err) {
            toast.error(err.message || 'Failed to load flagged ratings')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchFlaggedRatings()
    }, [])

    const handleModerate = async (ratingId, isHidden) => {
        if (actingId) return
        setActingId(ratingId)
        try {
            const res = await fetch('/api/admin/ratings', {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ ratingId, isHidden }),
            })
            const json = await res.json().catch(() => null)
            if (!res.ok || !json?.success) {
                throw new Error(json?.message || 'Failed to moderate rating')
            }
            setItems((prev) =>
                prev.map((item) =>
                    item.rating?.id === ratingId
                        ? { ...item, rating: { ...item.rating, isHidden } }
                        : item
                )
            )
            toast.success(isHidden ? 'Review hidden from public' : 'Review restored to public')
        } catch (err) {
            toast.error(err.message || 'Moderation failed')
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
                        <Flag className="text-rose-500" size={24} />
                        Flagged <span className="text-slate-800 font-medium">Ratings & Reviews</span>
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Moderate reported product reviews and hide or restore inappropriate content.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => { setLoading(true); fetchFlaggedRatings() }}
                    className="self-start sm:self-auto p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition flex items-center gap-2 text-xs font-semibold"
                >
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {items.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                    <h2 className="text-lg font-bold text-slate-900">No Flagged Reviews</h2>
                    <p className="text-sm text-slate-500 mt-1">All product reviews are currently clean.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {items.map((item) => {
                        const r = item.rating || {}
                        return (
                            <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-2 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                            <Star size={12} className="fill-amber-500 text-amber-500" /> {r.rating}/5
                                        </span>
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                            {item.flagCount} Flag(s)
                                        </span>
                                        {r.isHidden && (
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-white">
                                                Hidden
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-800 font-medium">{r.review || '(No written review)'}</p>
                                    <p className="text-xs text-slate-400 font-mono">
                                        Product: {r.productId} • User: {r.userId}
                                    </p>
                                    {Array.isArray(item.flags) && item.flags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {item.flags.map((f) => (
                                                <span key={f.id} className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                                                    <strong>{f.category}</strong>{f.reason ? `: ${f.reason}` : ''}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="shrink-0">
                                    <button
                                        type="button"
                                        disabled={actingId === r.id}
                                        onClick={() => handleModerate(r.id, !r.isHidden)}
                                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                                            r.isHidden
                                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                : 'bg-rose-600 hover:bg-rose-700 text-white'
                                        }`}
                                    >
                                        {r.isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                                        {r.isHidden ? 'Restore Review' : 'Hide Review'}
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

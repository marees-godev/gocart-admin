'use client'

import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
    ShoppingBag,
    Search,
    Trash2,
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

export default function AdminProducts() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [actingId, setActingId] = useState(null)

    const fetchProducts = async () => {
        try {
            const statusParam = statusFilter !== 'ALL' ? `&status=${encodeURIComponent(statusFilter)}` : ''
            const res = await fetch(`/api/admin/products?limit=50${statusParam}`, { headers: authHeaders(), cache: 'no-store' })
            const json = await res.json().catch(() => null)
            if (!res.ok || !json?.success) {
                throw new Error(json?.message || 'Failed to load products')
            }
            setProducts(json.products || [])
        } catch (err) {
            toast.error(err.message || 'Failed to load products')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProducts()
    }, [statusFilter])

    const handleStatusChange = async (id, nextStatus) => {
        if (actingId) return
        setActingId(id)
        try {
            const res = await fetch('/api/admin/products', {
                method: 'PATCH',
                headers: authHeaders(),
                body: JSON.stringify({ id, input: { status: nextStatus } }),
            })
            const json = await res.json().catch(() => null)
            if (!res.ok || !json?.success) {
                throw new Error(json?.message || 'Failed to update product status')
            }
            setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status: nextStatus } : p)))
            toast.success(`Product status updated to ${nextStatus}`)
        } catch (err) {
            toast.error(err.message || 'Failed to update product')
        } finally {
            setActingId(null)
        }
    }

    const handleDelete = async (id, name) => {
        if (actingId) return
        setActingId(id)
        try {
            const res = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, {
                method: 'DELETE',
                headers: authHeaders(),
            })
            const json = await res.json().catch(() => null)
            if (!res.ok || !json?.success) {
                throw new Error(json?.message || 'Failed to delete product')
            }
            setProducts((prev) => prev.filter((p) => p.id !== id))
            toast.success(`Product "${name}" deleted`)
        } catch (err) {
            toast.error(err.message || 'Failed to delete product')
        } finally {
            setActingId(null)
        }
    }

    const filtered = products.filter((p) =>
        (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) return <Loading />

    return (
        <div className="text-slate-600 mb-28 max-w-6xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl text-slate-500 flex items-center gap-2">
                        <ShoppingBag className="text-indigo-600" size={24} />
                        Platform <span className="text-slate-800 font-medium">Products Catalog</span>
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Browse, moderate status, or remove products across all marketplace stores.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => { setLoading(true); fetchProducts() }}
                    className="self-start sm:self-auto p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition flex items-center gap-2 text-xs font-semibold"
                >
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                    <input
                        type="text"
                        placeholder="Search by product name or SKU..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-slate-800 outline-none text-slate-800 text-sm bg-white shadow-xs"
                    />
                    <Search size={17} className="absolute left-3.5 top-3 text-slate-400" />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {['ALL', 'ACTIVE', 'DRAFT', 'INACTIVE', 'OUT_OF_STOCK'].map((st) => (
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
                            {st === 'ALL' ? 'All Status' : st.replace(/_/g, ' ')}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-wider border-b border-slate-200">
                            <tr>
                                <th className="py-3.5 px-6">Product</th>
                                <th className="py-3.5 px-6">SKU</th>
                                <th className="py-3.5 px-6 text-center">Price</th>
                                <th className="py-3.5 px-6">Status</th>
                                <th className="py-3.5 px-6 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-10 text-center text-slate-400">
                                        No products found.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                {p.imageUrl && (
                                                    <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                                                )}
                                                <div>
                                                    <p className="font-semibold text-slate-900">{p.name}</p>
                                                    <p className="text-xs text-slate-400 font-mono">Store: {p.storeId?.slice(0, 8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 font-mono text-xs text-slate-500">{p.sku}</td>
                                        <td className="py-4 px-6 text-center font-bold text-slate-900">${Number(p.price || 0).toFixed(2)}</td>
                                        <td className="py-4 px-6">
                                            <select
                                                value={p.status}
                                                disabled={actingId === p.id}
                                                onChange={(e) => handleStatusChange(p.id, e.target.value)}
                                                className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 outline-none"
                                            >
                                                {['ACTIVE', 'DRAFT', 'INACTIVE', 'OUT_OF_STOCK'].map((st) => (
                                                    <option key={st} value={st}>{st}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <button
                                                type="button"
                                                disabled={actingId === p.id}
                                                onClick={() => handleDelete(p.id, p.name)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                title="Delete Product"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

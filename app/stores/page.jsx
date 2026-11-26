'use client'

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { Store, RefreshCw } from "lucide-react"
import { storesDummyData } from "@/assets/assets"
import StoreInfo from "@/components/admin/StoreInfo"
import Loading from "@/components/Loading"
import { graphqlRequest } from "@/lib/apiClient"
import { GET_ALL_STORES_QUERY, CLOSE_STORE_MUTATION } from "@/lib/graphql/store"

export default function AdminStores() {
    const [stores, setStores] = useState([])
    const [loading, setLoading] = useState(true)
    const [updatingId, setUpdatingId] = useState(null)

    const fetchStores = async () => {
        try {
            let allStores = []
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const res = await fetch('/api/admin/stores/pending?status=ALL&limit=100', {
                cache: 'no-store',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            }).catch(() => null)

            if (res && res.ok) {
                const json = await res.json().catch(() => null)
                if (json?.success && Array.isArray(json.stores)) {
                    allStores = json.stores
                }
            }

            if (allStores.length === 0) {
                const data = await graphqlRequest(GET_ALL_STORES_QUERY, { limit: 50 })
                allStores = data?.stores?.stores || []
            }

            const activeOrSuspended = allStores.filter(s =>
                ['APPROVED', 'SUSPENDED', 'approved', 'suspended'].includes(s.approvalStatus || s.status || '')
            )
            setStores(activeOrSuspended)
        } catch (err) {
            console.error("Failed to load stores from API:", err)
            setStores(storesDummyData)
        } finally {
            setLoading(false)
        }
    }

    const toggleIsActive = async (store) => {
        if (updatingId) return
        const isCurrentlyActive = store.isActive !== false && store.approvalStatus !== 'SUSPENDED'
        const action = isCurrentlyActive ? 'suspend' : 'unsuspend'
        setUpdatingId(store.id)

        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const res = await fetch('/api/admin/stores/action', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    storeId: store.id,
                    action,
                    reason: isCurrentlyActive
                        ? 'Suspended from admin dashboard'
                        : 'Reactivated from admin dashboard',
                }),
            })
            const json = await res.json().catch(() => null)
            if (!res.ok || !json?.success) {
                throw new Error(json?.message || `Failed to ${action} store`)
            }

            setStores(prev => prev.map(s => {
                if (s.id === store.id) {
                    return {
                        ...s,
                        ...(json.store || {}),
                        isActive: !isCurrentlyActive,
                        approvalStatus: json.store?.approvalStatus || (isCurrentlyActive ? 'SUSPENDED' : 'APPROVED'),
                    }
                }
                return s
            }))
            toast.success(json.message || `Store ${isCurrentlyActive ? 'suspended' : 'reactivated'}`)
        } catch (err) {
            toast.error(err.message || 'Failed to update store status')
        } finally {
            setUpdatingId(null)
        }
    }

    useEffect(() => {
        fetchStores()
    }, [])

    if (loading) return <Loading />

    return (
        <div className="text-slate-700 max-w-5xl mb-28">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Store className="text-indigo-600" size={26} />
                        Active Platform Stores
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Manage active and verified stores across GoCart ({stores.length} stores)
                    </p>
                </div>

                <button
                    onClick={() => { setLoading(true); fetchStores(); }}
                    className="self-start sm:self-auto p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition flex items-center gap-2 text-xs font-semibold"
                >
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {stores.length ? (
                <div className="flex flex-col gap-4">
                    {stores.map((store) => (
                        <div key={store.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex max-md:flex-col gap-4 md:items-end justify-between hover:border-slate-300 transition">
                            {/* Store Info */}
                            <div className="flex-1">
                                <StoreInfo store={store} />
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 pt-2 shrink-0">
                                <span className="text-xs font-semibold text-slate-600">
                                    {store.approvalStatus === 'SUSPENDED' ? 'Suspended' : 'Active'}
                                </span>
                                <label className="relative inline-flex items-center cursor-pointer text-gray-900">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        disabled={updatingId === store.id}
                                        onChange={() => toggleIsActive(store)}
                                        checked={store.isActive !== false && store.approvalStatus !== 'SUSPENDED'}
                                    />
                                    <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-emerald-600 transition-colors duration-200"></div>
                                    <span className="dot absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                                </label>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        const reason = prompt(`Close store "${store.name}" permanently? Enter reason:`)
                                        if (!reason) return
                                        try {
                                            await graphqlRequest(CLOSE_STORE_MUTATION, { id: store.id, reason })
                                            setStores((prev) => prev.filter((s) => s.id !== store.id))
                                            toast.success('Store closed')
                                        } catch (err) {
                                            toast.error(err.message || 'Failed to close store')
                                        }
                                    }}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                    <h2 className="text-xl font-bold text-slate-900">No Stores Available</h2>
                    <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                        No active stores are currently registered on the platform.
                    </p>
                </div>
            )}
        </div>
    )
}

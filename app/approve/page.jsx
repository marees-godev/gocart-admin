'use client'

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { ShieldCheck, RefreshCw, CheckCircle2, XCircle } from "lucide-react"
import StoreInfo from "@/components/admin/StoreInfo"
import Loading from "@/components/Loading"
import { storesDummyData } from "@/assets/assets"
import { graphqlRequest } from "@/lib/apiClient"
import { APPROVE_STORE_MUTATION, REJECT_STORE_MUTATION, GET_ALL_STORES_QUERY } from "@/lib/graphql/store"

export default function AdminApprove() {
    const [stores, setStores] = useState([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(null)

    const fetchStores = async () => {
        try {
            const data = await graphqlRequest(GET_ALL_STORES_QUERY, { limit: 50 })
            const allStores = data?.stores?.stores || []
            // Filter pending stores
            const pendingStores = allStores.filter(s =>
                s.approvalStatus === 'PENDING' ||
                s.approvalStatus === 'PENDING_APPROVAL' ||
                s.status === 'pending'
            )
            setStores(pendingStores.length > 0 ? pendingStores : (allStores.length > 0 ? [] : storesDummyData))
        } catch (err) {
            console.error("Failed to load stores from API:", err)
            setStores(storesDummyData)
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (storeId) => {
        setActionLoading(storeId)
        try {
            await graphqlRequest(APPROVE_STORE_MUTATION, { id: storeId })
            toast.success("Store approved successfully! The merchant can now add products.")
            setStores(prev => prev.filter(s => s.id !== storeId))
        } catch (err) {
            console.error("Failed to approve store:", err)
            toast.error(err.message || "Failed to approve store")
        } finally {
            setActionLoading(null)
        }
    }

    const handleReject = async (storeId) => {
        const reason = window.prompt("Please enter rejection reason:", "Incomplete documentation or unverified business details")
        if (!reason) return

        setActionLoading(storeId)
        try {
            await graphqlRequest(REJECT_STORE_MUTATION, { id: storeId, reason })
            toast.success("Store application rejected.")
            setStores(prev => prev.filter(s => s.id !== storeId))
        } catch (err) {
            console.error("Failed to reject store:", err)
            toast.error(err.message || "Failed to reject store")
        } finally {
            setActionLoading(null)
        }
    }

    useEffect(() => {
        fetchStores()
    }, [])

    if (loading) return <Loading />

    return (
        <div className="text-slate-700 max-w-5xl pb-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <ShieldCheck className="text-indigo-600" size={26} />
                        Approve Stores
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Review submitted merchant storefront applications ({stores.length} pending approval)
                    </p>
                </div>

                <button
                    onClick={() => { setLoading(true); fetchStores(); }}
                    className="self-start sm:self-auto p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition flex items-center gap-2 text-xs font-semibold"
                >
                    <RefreshCw size={14} /> Refresh List
                </button>
            </div>

            {stores.length ? (
                <div className="flex flex-col gap-4">
                    {stores.map((store) => (
                        <div key={store.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex max-md:flex-col gap-4 md:items-end justify-between hover:border-slate-300 transition">
                            {/* Store Info */}
                            <div className="flex-1">
                                <StoreInfo store={store} />
                                {store.merchantId && (
                                    <p className="text-[11px] font-mono text-slate-400 mt-2">
                                        Merchant UUID: {store.merchantId}
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-2 shrink-0">
                                <button
                                    disabled={actionLoading === store.id}
                                    onClick={() => handleApprove(store.id)}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-xs font-semibold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                                >
                                    <CheckCircle2 size={14} /> Approve
                                </button>
                                <button
                                    disabled={actionLoading === store.id}
                                    onClick={() => handleReject(store.id)}
                                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    <XCircle size={14} /> Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                        <CheckCircle2 size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">No Pending Applications</h2>
                    <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                        All submitted merchant store applications have been reviewed. New applications will appear here automatically.
                    </p>
                </div>
            )}
        </div>
    )
}
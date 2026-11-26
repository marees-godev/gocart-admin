'use client'

import React, { useState } from 'react'
import toast from 'react-hot-toast'
import {
    Search,
    Eye,
    X,
    RefreshCw,
    Truck
} from 'lucide-react'
import { assets, orderDummyData } from '@/assets/assets'
import { graphqlRequest } from '@/lib/apiClient'
import { GET_DELIVERY_BY_ORDER_QUERY, CANCEL_DELIVERY_MUTATION } from '@/lib/graphql/delivery'

function normalizeOrder(o) {
    let parsedAddr = null
    if (typeof o.shippingAddress === 'string') {
        try {
            parsedAddr = JSON.parse(o.shippingAddress)
        } catch {
            parsedAddr = { street: o.shippingAddress }
        }
    }

    return {
        ...o,
        total: o.total ?? o.totalAmount ?? 0,
        status: o.orderStatus || o.status || 'ORDER_PLACED',
        isPaid: o.isPaid ?? (o.paymentStatus === 'PAID' || o.paymentStatus === 'COMPLETED'),
        paymentMethod: o.paymentMethod || o.paymentStatus || 'ONLINE',
        user: o.user || { id: o.userId, name: o.userId ? `User ${String(o.userId).slice(0, 8)}` : 'Customer', email: '' },
        address: o.address || parsedAddr || {},
        orderItems: o.orderItems || (o.items || []).map((item) => ({
            orderId: o.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.unitPrice ?? item.totalPrice ?? 0,
            product: { id: item.productId, name: item.productName || item.sku || 'Product', images: [] },
        })),
        isBackend: true,
    }
}

export default function AdminMasterOrders() {
    const [orders, setOrders] = useState(orderDummyData || [])
    const [searchQuery, setSearchQuery] = useState('')
    const [lookupType, setLookupType] = useState('userId') // 'userId' | 'orderId'
    const [lookupValue, setLookupValue] = useState('')
    const [loading, setLoading] = useState(false)
    const [selectedStatus, setSelectedStatus] = useState('ALL')
    const [activeModalOrder, setActiveModalOrder] = useState(null)
    const [updatingStatus, setUpdatingStatus] = useState(false)
    const [refundLoading, setRefundLoading] = useState(false)
    const [refundReason, setRefundReason] = useState('')
    const [modalDelivery, setModalDelivery] = useState(null)
    const [loadingDelivery, setLoadingDelivery] = useState(false)

    const openOrderModal = async (order) => {
        setActiveModalOrder(order)
        setModalDelivery(null)
        setLoadingDelivery(true)
        try {
            const res = await graphqlRequest(GET_DELIVERY_BY_ORDER_QUERY, { orderId: String(order.id) })
            if (res?.deliveryByOrder) {
                setModalDelivery(res.deliveryByOrder)
            }
        } catch {
            // no delivery yet
        } finally {
            setLoadingDelivery(false)
        }
    }

    const handleCancelDelivery = async (deliveryId) => {
        const reason = prompt('Enter reason for cancelling delivery:')
        if (!reason) return
        try {
            const res = await graphqlRequest(CANCEL_DELIVERY_MUTATION, { id: String(deliveryId), reason })
            if (res?.cancelDelivery) {
                setModalDelivery(prev => prev ? { ...prev, status: res.cancelDelivery.status || 'CANCELLED' } : prev)
                toast.success('Delivery cancelled')
            }
        } catch (err) {
            toast.error(err.message || 'Failed to cancel delivery')
        }
    }

    const handleBackendLookup = async (e) => {
        e.preventDefault()
        if (!lookupValue.trim()) {
            setOrders(orderDummyData || [])
            return
        }
        setLoading(true)
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const param = lookupType === 'orderId'
                ? `orderId=${encodeURIComponent(lookupValue.trim())}`
                : `userId=${encodeURIComponent(lookupValue.trim())}`
            const res = await fetch(`/api/admin/orders?${param}`, {
                cache: 'no-store',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            const json = await res.json().catch(() => null)
            if (!res.ok || !json?.success) {
                throw new Error(json?.message || 'Failed to fetch orders')
            }
            const mapped = (json.orders || []).map(normalizeOrder)
            setOrders(mapped)
            toast.success(`Loaded ${mapped.length} order(s)`)
        } catch (err) {
            toast.error(err.message || 'Failed to lookup orders')
        } finally {
            setLoading(false)
        }
    }

    const handleStatusUpdate = async (orderId, newStatus) => {
        if (updatingStatus) return
        setUpdatingStatus(true)
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const res = await fetch('/api/admin/orders', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ id: orderId, status: newStatus }),
            })
            const json = await res.json().catch(() => null)
            if (!res.ok || !json?.success) {
                throw new Error(json?.message || 'Failed to update order status')
            }

            setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)))
            setActiveModalOrder((prev) => (prev && prev.id === orderId ? { ...prev, status: newStatus } : prev))
            toast.success(`Order status updated to ${newStatus}`)
        } catch (err) {
            toast.error(err.message || 'Failed to update order status')
        } finally {
            setUpdatingStatus(false)
        }
    }

    const handleIssueRefund = async (order) => {
        if (refundLoading) return
        setRefundLoading(true)
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const headers = {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            }

            const payRes = await fetch(`/api/admin/refunds?orderId=${encodeURIComponent(order.id)}`, {
                headers,
                cache: 'no-store',
            })
            const payJson = await payRes.json().catch(() => null)
            if (!payRes.ok || !payJson?.success || !payJson?.payment?.id) {
                throw new Error(payJson?.message || 'No payment record found for this order')
            }

            const refundRes = await fetch('/api/admin/refunds', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    paymentId: payJson.payment.id,
                    amount: Number(order.total || payJson.payment.amount || 0),
                    reason: refundReason.trim() || 'Admin initiated refund',
                    idempotencyKey: `refund-${order.id}-${Date.now()}`,
                }),
            })
            const refundJson = await refundRes.json().catch(() => null)
            if (!refundRes.ok || !refundJson?.success) {
                throw new Error(refundJson?.message || 'Failed to create refund')
            }

            toast.success(`Refund initiated (${refundJson.refund?.status || 'SUCCESS'})`)
            setRefundReason('')
        } catch (err) {
            toast.error(err.message || 'Refund failed')
        } finally {
            setRefundLoading(false)
        }
    }

    const filteredOrders = orders.filter((order) => {
        const matchesSearch =
            (order.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (order.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (order.user?.email || '').toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = selectedStatus === 'ALL' || order.status === selectedStatus
        return matchesSearch && matchesStatus
    })

    return (
        <div className="text-slate-600 mb-28 max-w-6xl space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl text-slate-500">
                    Platform <span className="text-slate-800 font-medium">Master Orders</span>
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                    Monitor all transactions, vendor fulfillment status, and customer payments across the marketplace.
                </p>
            </div>

            {/* Backend Lookup Bar */}
            <form onSubmit={handleBackendLookup} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <select
                    value={lookupType}
                    onChange={(e) => setLookupType(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-slate-50 outline-none"
                >
                    <option value="userId">Lookup by User ID</option>
                    <option value="orderId">Lookup by Order ID</option>
                </select>
                <input
                    type="text"
                    value={lookupValue}
                    onChange={(e) => setLookupValue(e.target.value)}
                    placeholder={lookupType === 'orderId' ? 'Enter Order UUID...' : 'Enter User UUID...'}
                    className="flex-1 px-4 py-2 rounded-xl border border-slate-300 focus:border-slate-800 outline-none text-sm text-slate-800"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    {loading ? 'Fetching...' : 'Fetch from Backend'}
                </button>
            </form>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                    <input
                        type="text"
                        placeholder="Filter loaded orders by ID or customer..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-slate-800 outline-none text-slate-800 text-sm bg-white shadow-xs"
                    />
                    <Search size={17} className="absolute left-3.5 top-3 text-slate-400" />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {['ALL', 'ORDER_PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map((st) => (
                        <button
                            key={st}
                            type="button"
                            onClick={() => setSelectedStatus(st)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                                selectedStatus === st
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {st === 'ALL' ? 'All Orders' : st.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders Master Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-wider border-b border-slate-200">
                            <tr>
                                <th className="py-3.5 px-6">Order ID</th>
                                <th className="py-3.5 px-6">Customer</th>
                                <th className="py-3.5 px-6">Items</th>
                                <th className="py-3.5 px-6 text-center">Amount</th>
                                <th className="py-3.5 px-6">Payment</th>
                                <th className="py-3.5 px-6">Status</th>
                                <th className="py-3.5 px-6 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-10 text-center text-slate-400">
                                        No platform orders found matching the filter criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50/80 transition">
                                        <td className="py-4 px-6 font-mono text-xs font-bold text-slate-800">
                                            #{order.id.slice(0, 10)}
                                        </td>
                                        <td className="py-4 px-6">
                                            <p className="font-semibold text-slate-900">{order.user?.name}</p>
                                            <p className="text-xs text-slate-400">{order.user?.email}</p>
                                        </td>
                                        <td className="py-4 px-6 text-xs text-slate-500">
                                            {order.orderItems?.length || 1} item(s)
                                        </td>
                                        <td className="py-4 px-6 text-center font-bold text-slate-900">
                                            ${order.total}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700">
                                                {order.paymentMethod}
                                                {order.isPaid ? (
                                                    <span className="text-green-600 ml-1 font-bold">(Paid)</span>
                                                ) : (
                                                    <span className="text-amber-600 ml-1 font-bold">(Unpaid)</span>
                                                )}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                    order.status === 'DELIVERED'
                                                        ? 'bg-green-100 text-green-700'
                                                        : order.status === 'SHIPPED'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-amber-100 text-amber-700'
                                                }`}
                                            >
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <button
                                                type="button"
                                                onClick={() => openOrderModal(order)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
                                            >
                                                <Eye size={13} /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Order Details Modal */}
            {activeModalOrder && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    Order Details #{activeModalOrder.id}
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Placed on {new Date(activeModalOrder.createdAt).toLocaleString()}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActiveModalOrder(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Status Update */}
                        <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl text-xs">
                            <span className="font-bold text-slate-700">Order Status:</span>
                            <select
                                value={activeModalOrder.status}
                                disabled={updatingStatus}
                                onChange={(e) => handleStatusUpdate(activeModalOrder.id, e.target.value)}
                                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 outline-none"
                            >
                                {['CREATED', 'CONFIRMED', 'ORDER_PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
                                    <option key={st} value={st}>{st}</option>
                                ))}
                            </select>
                        </div>

                        {/* Delivery Partner & Tracking */}
                        <div className="bg-slate-50 p-4 rounded-2xl text-xs space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                    <Truck size={14} className="text-indigo-600" /> Delivery Assignment &amp; Tracking
                                </span>
                                {modalDelivery && modalDelivery.status !== 'DELIVERED' && modalDelivery.status !== 'CANCELLED' && (
                                    <button
                                        type="button"
                                        onClick={() => handleCancelDelivery(modalDelivery.id)}
                                        className="text-rose-600 hover:underline font-semibold"
                                    >
                                        Cancel Delivery
                                    </button>
                                )}
                            </div>
                            {loadingDelivery ? (
                                <p className="text-slate-400">Checking delivery record...</p>
                            ) : modalDelivery ? (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-slate-200">
                                    <div>
                                        <span className="text-[10px] text-slate-400 block">Partner</span>
                                        <span className="font-bold text-slate-800">{modalDelivery.deliveryPartner}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 block">Tracking #</span>
                                        <span className="font-mono font-bold text-slate-800">{modalDelivery.trackingNumber || 'Pending'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 block">Status</span>
                                        <span className="font-bold text-indigo-700">{modalDelivery.status}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 block">Contact</span>
                                        <span className="text-slate-700">{modalDelivery.contactNumber || '-'}</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-slate-400 italic">No delivery dispatch record created yet for this order.</p>
                            )}
                        </div>

                        {/* Customer & Shipping Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl text-xs text-slate-600">
                            <div>
                                <h4 className="font-bold text-slate-800 mb-1">Customer Details</h4>
                                <p><span className="font-semibold">Name:</span> {activeModalOrder.user?.name}</p>
                                <p><span className="font-semibold">Email:</span> {activeModalOrder.user?.email || '-'}</p>
                                <p><span className="font-semibold">Phone:</span> {activeModalOrder.address?.phone || '-'}</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 mb-1">Shipping Address</h4>
                                <p>{activeModalOrder.address?.street || '-'}</p>
                                <p>{activeModalOrder.address?.city || ''} {activeModalOrder.address?.state || ''} {activeModalOrder.address?.zip || activeModalOrder.address?.postal_code || ''}</p>
                                <p>{activeModalOrder.address?.country || ''}</p>
                            </div>
                        </div>

                        {/* Items Breakdown */}
                        <div className="space-y-3">
                            <h4 className="font-bold text-slate-800 text-sm">Ordered Products</h4>
                            {activeModalOrder.orderItems?.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between border border-slate-100 p-3 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={item.product?.images?.[0] || assets.product_img1}
                                            alt={item.product?.name}
                                            className="w-12 h-12 rounded-lg object-cover"
                                        />
                                        <div>
                                            <p className="font-semibold text-slate-800 text-xs">{item.product?.name}</p>
                                            <p className="text-[11px] text-slate-400">Qty: {item.quantity}</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-slate-900 text-sm">${item.price}</span>
                                </div>
                            ))}
                        </div>

                        {/* Summary Totals */}
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                            <span className="font-bold text-slate-700">Total Order Amount</span>
                            <span className="text-xl font-extrabold text-slate-900">${activeModalOrder.total}</span>
                        </div>

                        {/* Admin Refund Action */}
                        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                            <input
                                type="text"
                                value={refundReason}
                                onChange={(e) => setRefundReason(e.target.value)}
                                placeholder="Refund reason (optional)..."
                                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:border-slate-800"
                            />
                            <button
                                type="button"
                                disabled={refundLoading}
                                onClick={() => handleIssueRefund(activeModalOrder)}
                                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold transition"
                            >
                                {refundLoading ? 'Processing Refund...' : 'Issue Full Refund'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

'use client'

import React, { useState } from 'react'
import {
    Package,
    Search,
    Filter,
    Calendar,
    Eye,
    DollarSign,
    CheckCircle2,
    Clock,
    Truck,
    AlertCircle,
    X
} from 'lucide-react'
import { orderDummyData } from '@/assets/assets'

export default function AdminMasterOrders() {
    const [orders, setOrders] = useState(orderDummyData || [])
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedStatus, setSelectedStatus] = useState('ALL')
    const [activeModalOrder, setActiveModalOrder] = useState(null)

    const filteredOrders = orders.filter((order) => {
        const matchesSearch =
            order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.user?.email.toLowerCase().includes(searchQuery.toLowerCase())
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

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                    <input
                        type="text"
                        placeholder="Search by order ID or customer name..."
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
                                                onClick={() => setActiveModalOrder(order)}
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

                        {/* Customer & Shipping Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl text-xs text-slate-600">
                            <div>
                                <h4 className="font-bold text-slate-800 mb-1">Customer Details</h4>
                                <p><span className="font-semibold">Name:</span> {activeModalOrder.user?.name}</p>
                                <p><span className="font-semibold">Email:</span> {activeModalOrder.user?.email}</p>
                                <p><span className="font-semibold">Phone:</span> {activeModalOrder.address?.phone || '+1 555-0192'}</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 mb-1">Shipping Address</h4>
                                <p>{activeModalOrder.address?.street || '742 Evergreen Terrace'}</p>
                                <p>{activeModalOrder.address?.city || 'Springfield'}, {activeModalOrder.address?.state || 'OR'} {activeModalOrder.address?.zip || '97477'}</p>
                                <p>{activeModalOrder.address?.country || 'United States'}</p>
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
                    </div>
                </div>
            )}
        </div>
    )
}

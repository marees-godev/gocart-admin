'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import {
    Users,
    Search,
    Shield,
    Store,
    UserCheck,
    UserX,
    Filter,
    Mail,
    Calendar,
    MoreVertical,
    CheckCircle2,
    Ban
} from 'lucide-react'
import { assets } from '@/assets/assets'

export default function AdminUsers() {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedRole, setSelectedRole] = useState('ALL') // 'ALL' | 'USER' | 'SELLER' | 'ADMIN'

    // Mock Users Data
    const [usersList, setUsersList] = useState([
        {
            id: 'usr_1',
            name: 'Alex Morgan',
            email: 'alex.morgan@example.com',
            role: 'USER',
            ordersCount: 12,
            spent: '$1,240.50',
            status: 'ACTIVE',
            joinedAt: '2024-01-15'
        },
        {
            id: 'usr_2',
            name: 'Sarah Jenkins',
            email: 'sarah.j@happyshop.com',
            role: 'SELLER',
            storeName: 'Happy Shop',
            ordersCount: 142,
            spent: '$18,920.00',
            status: 'ACTIVE',
            joinedAt: '2023-11-20'
        },
        {
            id: 'usr_3',
            name: 'David Miller',
            email: 'david.m@example.com',
            role: 'USER',
            ordersCount: 3,
            spent: '$210.00',
            status: 'BANNED',
            joinedAt: '2024-05-10'
        },
        {
            id: 'usr_4',
            name: 'GoCart Administrator',
            email: 'admin@gocart.com',
            role: 'ADMIN',
            ordersCount: 0,
            spent: '$0.00',
            status: 'ACTIVE',
            joinedAt: '2023-01-01'
        },
        {
            id: 'usr_5',
            name: 'Elena Rostova',
            email: 'elena@novatech.io',
            role: 'SELLER',
            storeName: 'Nova Tech Store',
            ordersCount: 88,
            spent: '$12,450.00',
            status: 'ACTIVE',
            joinedAt: '2024-02-18'
        }
    ])

    const filteredUsers = usersList.filter((user) => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesRole = selectedRole === 'ALL' || user.role === selectedRole
        return matchesSearch && matchesRole
    })

    const toggleUserStatus = (userId) => {
        setUsersList((prev) =>
            prev.map((u) =>
                u.id === userId
                    ? { ...u, status: u.status === 'ACTIVE' ? 'BANNED' : 'ACTIVE' }
                    : u
            )
        )
    }

    return (
        <div className="text-slate-600 mb-28 max-w-6xl space-y-8">
            
            {/* Page Header */}
            <div>
                <h1 className="text-2xl text-slate-500">
                    Platform <span className="text-slate-800 font-medium">Users & Merchants</span>
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                    Manage buyer accounts, merchant permissions, and platform administrators.
                </p>
            </div>

            {/* Filters & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-slate-800 outline-none text-slate-800 text-sm bg-white shadow-xs"
                    />
                    <Search size={17} className="absolute left-3.5 top-3 text-slate-400" />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {['ALL', 'USER', 'SELLER', 'ADMIN'].map((role) => (
                        <button
                            key={role}
                            type="button"
                            onClick={() => setSelectedRole(role)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                                selectedRole === role
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {role === 'ALL' ? 'All Roles' : role === 'USER' ? 'Buyers' : role === 'SELLER' ? 'Merchants' : 'Admins'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-wider border-b border-slate-200">
                            <tr>
                                <th className="py-3.5 px-6">User / Account</th>
                                <th className="py-3.5 px-6">System Role</th>
                                <th className="py-3.5 px-6 text-center">Orders / Store</th>
                                <th className="py-3.5 px-6">Account Status</th>
                                <th className="py-3.5 px-6">Join Date</th>
                                <th className="py-3.5 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-10 text-center text-slate-400">
                                        No users found matching the filter criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/80 transition">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                                    {user.name.slice(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">{user.name}</p>
                                                    <p className="text-xs text-slate-400">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="py-4 px-6">
                                            {user.role === 'ADMIN' && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                                                    <Shield size={12} /> Admin
                                                </span>
                                            )}
                                            {user.role === 'SELLER' && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                    <Store size={12} /> Merchant
                                                </span>
                                            )}
                                            {user.role === 'USER' && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                                    <Users size={12} /> Customer
                                                </span>
                                            )}
                                        </td>

                                        <td className="py-4 px-6 text-center">
                                            {user.role === 'SELLER' ? (
                                                <span className="font-medium text-slate-800 text-xs">
                                                    {user.storeName}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-500">
                                                    {user.ordersCount} orders ({user.spent})
                                                </span>
                                            )}
                                        </td>

                                        <td className="py-4 px-6">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    user.status === 'ACTIVE'
                                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                                        : 'bg-red-50 text-red-700 border border-red-200'
                                                }`}
                                            >
                                                {user.status === 'ACTIVE' ? (
                                                    <CheckCircle2 size={12} />
                                                ) : (
                                                    <Ban size={12} />
                                                )}
                                                {user.status}
                                            </span>
                                        </td>

                                        <td className="py-4 px-6 text-xs text-slate-400">
                                            {user.joinedAt}
                                        </td>

                                        <td className="py-4 px-6 text-right">
                                            {user.role !== 'ADMIN' && (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleUserStatus(user.id)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                                                        user.status === 'ACTIVE'
                                                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                            : 'bg-green-50 text-green-700 hover:bg-green-100'
                                                    }`}
                                                >
                                                    {user.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                                                </button>
                                            )}
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

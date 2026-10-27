'use client'

import React, { useState } from 'react'
import {
    Settings,
    Percent,
    DollarSign,
    Shield,
    Globe,
    Save,
    AlertTriangle,
    CreditCard,
    Bell,
    CheckCircle2
} from 'lucide-react'

export default function AdminPlatformSettings() {
    const [settings, setSettings] = useState({
        platformName: 'GoCart Multi-Vendor Marketplace',
        supportEmail: 'support@gocart.com',
        commissionRate: '8.5', // 8.5% platform fee
        currencySymbol: '$',
        currencyCode: 'USD',
        stripeEnabled: true,
        paypalEnabled: true,
        codEnabled: true,
        maintenanceMode: false,
        sellerApprovalRequired: true,
        minWithdrawalAmount: '50'
    })

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setSettings((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        // TODO: Insert backend system settings update API logic
        console.log('Saved Admin Settings:', settings)
    }

    return (
        <div className="text-slate-600 mb-28 max-w-5xl space-y-8">
            
            {/* Page Header */}
            <div>
                <h1 className="text-2xl text-slate-500">
                    Platform <span className="text-slate-800 font-medium">Settings</span>
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                    Configure global marketplace economics, commission structures, and platform operations.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. Marketplace Economics & Fees */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
                    <div className="border-b border-slate-100 pb-3">
                        <h3 className="font-bold text-slate-800 text-base">Marketplace Commission & Currency</h3>
                        <p className="text-xs text-slate-400">Manage transaction fees deducted from merchant payouts.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                Platform Commission Fee (%)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.1"
                                    name="commissionRate"
                                    value={settings.commissionRate}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-slate-800 outline-none text-slate-800 text-sm"
                                />
                                <Percent size={16} className="absolute left-3.5 top-3 text-slate-400" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                Currency Symbol
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="currencySymbol"
                                    value={settings.currencySymbol}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-slate-800 outline-none text-slate-800 text-sm"
                                />
                                <DollarSign size={16} className="absolute left-3.5 top-3 text-slate-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Merchant Onboarding Policies */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
                    <div className="border-b border-slate-100 pb-3">
                        <h3 className="font-bold text-slate-800 text-base">Merchant & Store Approval Policies</h3>
                        <p className="text-xs text-slate-400">Control seller onboarding requirements.</p>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                        <div>
                            <h4 className="text-sm font-semibold text-slate-800">Manual Admin Store Approval</h4>
                            <p className="text-xs text-slate-500">Require an administrator to review and verify new stores before they go live.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSettings((prev) => ({ ...prev, sellerApprovalRequired: !prev.sellerApprovalRequired }))}
                            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                                settings.sellerApprovalRequired ? 'bg-green-600' : 'bg-slate-300'
                            }`}
                        >
                            <div
                                className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${
                                    settings.sellerApprovalRequired ? 'translate-x-6' : 'translate-x-0'
                                }`}
                            />
                        </button>
                    </div>
                </div>

                {/* 3. Global Maintenance Mode */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
                    <div className="border-b border-slate-100 pb-3">
                        <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                            <AlertTriangle size={18} className="text-amber-500" /> Maintenance & System Control
                        </h3>
                        <p className="text-xs text-slate-400">Emergency mode for platform-wide updates.</p>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-amber-200 bg-amber-50/30">
                        <div>
                            <h4 className="text-sm font-semibold text-slate-800">Platform Maintenance Mode</h4>
                            <p className="text-xs text-slate-500">Temporarily show maintenance screen to all non-admin visitors.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSettings((prev) => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))}
                            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                                settings.maintenanceMode ? 'bg-amber-600' : 'bg-slate-300'
                            }`}
                        >
                            <div
                                className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${
                                    settings.maintenanceMode ? 'translate-x-6' : 'translate-x-0'
                                }`}
                            />
                        </button>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="inline-flex items-center gap-2 px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium shadow-md transition"
                    >
                        <Save size={16} /> Save Platform Settings
                    </button>
                </div>
            </form>
        </div>
    )
}

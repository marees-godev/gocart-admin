'use client'

import { MapPin, Mail, Phone, Store, User, FileText, CheckCircle2, Clock, AlertTriangle, ShieldCheck } from "lucide-react"

const StoreInfo = ({ store }) => {
    if (!store) return null

    const logoSrc = store.logo || store.logoUrl || null
    const username = store.slug || store.username || (store.name ? store.name.toLowerCase().replace(/\s+/g, '-') : '')
    const status = (store.approvalStatus || store.status || 'PENDING').toUpperCase()
    const email = store.businessEmail || store.email || store.user?.email || null
    const contact = store.businessPhone || store.contact || null
    const address = store.address || null
    const user = store.user || null
    const createdAt = store.createdAt ? new Date(store.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }) : null
    const kyc = (store.kycStatus || '').toUpperCase()

    return (
        <div className="flex-1 space-y-3 text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {logoSrc ? (
                    <img
                        src={logoSrc}
                        alt={store.name || "Store"}
                        className="w-14 h-14 object-cover shadow-sm rounded-2xl border border-slate-200 shrink-0"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                ) : (
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <Store size={26} />
                    </div>
                )}

                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">{store.name}</h3>
                        {username && <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">@{username}</span>}

                        {/* Status Badge */}
                        <span
                            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                status === 'APPROVED'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : status === 'REJECTED'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : status === 'DRAFT'
                                    ? 'bg-slate-100 text-slate-600 border border-slate-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                        >
                            {status === 'PENDING_APPROVAL' ? 'Pending Approval' : status}
                        </span>

                        {/* KYC Badge */}
                        {kyc && (
                            <span
                                className={`text-[11px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                                    kyc === 'VERIFIED'
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                        : kyc === 'PENDING'
                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                        : 'bg-slate-50 text-slate-500 border border-slate-200'
                                }`}
                            >
                                <ShieldCheck size={11} />
                                KYC: {kyc}
                            </span>
                        )}
                    </div>

                    {createdAt && (
                        <p className="text-slate-400 text-xs mt-0.5">
                            Application submitted on <span className="font-medium text-slate-600">{createdAt}</span>
                        </p>
                    )}
                </div>
            </div>

            {store.description && (
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-2xl bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    {store.description}
                </p>
            )}

            {/* Rejection / Note Callout */}
            {store.rejectionReason && (
                <div className="bg-rose-50/80 border border-rose-200/80 rounded-xl p-3 text-xs text-rose-800 flex items-start gap-2 max-w-2xl">
                    <AlertTriangle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                    <div>
                        <span className="font-semibold">Rejection / Review Note:</span> {store.rejectionReason}
                    </div>
                </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                {email && (
                    <div className="flex items-center gap-2">
                        <Mail size={14} className="text-slate-400 shrink-0" />
                        <span className="truncate">{email}</span>
                    </div>
                )}
                {contact && (
                    <div className="flex items-center gap-2">
                        <Phone size={14} className="text-slate-400 shrink-0" />
                        <span>{contact}</span>
                    </div>
                )}
                {address && (
                    <div className="flex items-center gap-2 sm:col-span-2">
                        <MapPin size={14} className="text-slate-400 shrink-0" />
                        <span>{address}</span>
                    </div>
                )}
                {store.gstin && (
                    <div className="flex items-center gap-2 sm:col-span-2">
                        <FileText size={14} className="text-indigo-500 shrink-0" />
                        <span className="font-mono text-slate-700">GSTIN: {store.gstin}</span>
                    </div>
                )}
            </div>

            {/* Applicant User Info */}
            {user && (
                <div className="flex items-center gap-2 text-xs pt-2 border-t border-slate-100">
                    {user.image ? (
                        <img
                            src={user.image}
                            alt={user.name || "User"}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200"
                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                    ) : (
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <User size={13} />
                        </div>
                    )}
                    <div>
                        <p className="text-slate-700 font-medium">{user.name || 'Merchant Applicant'}</p>
                        {user.email && <p className="text-slate-400 text-[11px]">{user.email}</p>}
                    </div>
                </div>
            )}
        </div>
    )
}

export default StoreInfo
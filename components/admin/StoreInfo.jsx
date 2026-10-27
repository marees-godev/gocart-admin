'use client'

import { MapPin, Mail, Phone, Store, User } from "lucide-react"

const StoreInfo = ({ store }) => {
    if (!store) return null

    const logoSrc = store.logo || store.logoUrl || null
    const username = store.slug || store.username || (store.name ? store.name.toLowerCase().replace(/\s+/g, '-') : '')
    const status = (store.approvalStatus || store.status || 'PENDING').toLowerCase()
    const email = store.businessEmail || store.email || store.user?.email || null
    const contact = store.businessPhone || store.contact || null
    const address = store.address || null
    const user = store.user || null
    const createdAt = store.createdAt ? new Date(store.createdAt).toLocaleDateString() : null

    return (
        <div className="flex-1 space-y-2 text-sm">
            {logoSrc ? (
                <img
                    src={logoSrc}
                    alt={store.name || "Store"}
                    className="w-16 h-16 object-cover shadow rounded-full max-sm:mx-auto border border-slate-200"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
            ) : (
                <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center max-sm:mx-auto">
                    <Store size={28} />
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 items-center pt-1">
                <h3 className="text-xl font-semibold text-slate-800">{store.name}</h3>
                {username && <span className="text-sm text-slate-500">@{username}</span>}

                {/* Status Badge */}
                <span
                    className={`text-xs font-semibold px-3 py-0.5 rounded-full uppercase tracking-wider ${
                        status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : status === 'rejected'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                >
                    {store.approvalStatus || store.status || 'PENDING'}
                </span>
            </div>

            {store.description && (
                <p className="text-slate-600 my-3 max-w-2xl text-xs sm:text-sm">{store.description}</p>
            )}

            <div className="space-y-1 text-slate-600 text-xs sm:text-sm">
                {address && (
                    <p className="flex items-center gap-2"><MapPin size={15} className="text-slate-400 shrink-0" /> {address}</p>
                )}
                {contact && (
                    <p className="flex items-center gap-2"><Phone size={15} className="text-slate-400 shrink-0" /> {contact}</p>
                )}
                {email && (
                    <p className="flex items-center gap-2"><Mail size={15} className="text-slate-400 shrink-0" /> {email}</p>
                )}
            </div>

            {createdAt && (
                <p className="text-slate-500 text-xs mt-3">
                    Applied on <span className="font-medium text-slate-700">{createdAt}</span>
                </p>
            )}

            {/* Applicant User Info (rendered only if user object exists) */}
            {user && (
                <div className="flex items-center gap-2 text-xs pt-1">
                    {user.image ? (
                        <img
                            src={user.image}
                            alt={user.name || "User"}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <User size={14} />
                        </div>
                    )}
                    <div>
                        <p className="text-slate-700 font-medium">{user.name || 'Merchant Applicant'}</p>
                        {user.email && <p className="text-slate-400">{user.email}</p>}
                    </div>
                </div>
            )}
        </div>
    )
}

export default StoreInfo
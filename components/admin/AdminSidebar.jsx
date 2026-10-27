'use client'

import { usePathname } from 'next/navigation'
import {
    HomeIcon,
    ShieldCheckIcon,
    StoreIcon,
    TicketPercentIcon,
    LayoutListIcon,
    UsersIcon,
    LayersIcon,
    SettingsIcon
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { assets } from '@/assets/assets'

const AdminSidebar = () => {
    const pathname = usePathname()

    const sidebarLinks = [
        { name: 'Dashboard', href: '/', icon: HomeIcon },
        { name: 'Live Stores', href: '/stores', icon: StoreIcon },
        { name: 'Approve Stores', href: '/approve', icon: ShieldCheckIcon },
        { name: 'Master Orders', href: '/orders', icon: LayoutListIcon },
        { name: 'Users & Merchants', href: '/users', icon: UsersIcon },
        { name: 'Categories', href: '/categories', icon: LayersIcon },
        { name: 'Coupons', href: '/coupons', icon: TicketPercentIcon },
        { name: 'Platform Settings', href: '/settings', icon: SettingsIcon },
    ]

    const isActive = (href) => {
        if (href === '/') return pathname === '/'
        return pathname.startsWith(href)
    }

    return (
        <div className="inline-flex h-full flex-col gap-5 border-r border-slate-200 bg-white sm:min-w-64">
            <div className="flex flex-col gap-2 justify-center items-center pt-8 max-sm:hidden">
                <Image className="w-14 h-14 rounded-full border border-slate-200 shadow-sm" src={assets.gs_logo} alt="" width={80} height={80} />
                <p className="text-slate-800 font-semibold text-sm">Admin Console</p>
                <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Master Key Active</span>
            </div>

            <div className="max-sm:mt-6 px-3 space-y-1">
                {sidebarLinks.map((link, index) => {
                    const active = isActive(link.href)
                    return (
                        <Link
                            key={index}
                            href={link.href}
                            className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${active ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            <link.icon size={18} className={active ? 'text-indigo-600' : 'text-slate-400'} />
                            <p className="max-sm:hidden">{link.name}</p>
                            {active && <span className="absolute right-2 w-1.5 h-5 bg-indigo-600 rounded-full"></span>}
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}

export default AdminSidebar

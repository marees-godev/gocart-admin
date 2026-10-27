'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShieldCheck, LogOut, ExternalLink } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { logout } from '@/lib/features/auth/authSlice'

const AdminNavbar = () => {
    const router = useRouter()
    const dispatch = useDispatch()

    const handleLogout = () => {
        dispatch(logout())
        if (typeof window !== 'undefined') {
            localStorage.removeItem('adminKey')
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            document.cookie = 'token=; Max-Age=0; path=/;'
            document.cookie = 'adminKey=; Max-Age=0; path=/;'
        }
        router.push('/login')
    }

    return (
        <header className="flex items-center justify-between px-6 lg:px-10 py-3.5 bg-white border-b border-slate-200 sticky top-0 z-30">
            <div className="flex items-center gap-3">
                <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-slate-800">
                    <span className="text-indigo-600">go</span>cart<span className="text-indigo-600 text-3xl leading-none">.</span>
                    <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 ml-1">
                        Admin
                    </span>
                </Link>
            </div>

            <div className="flex items-center gap-4">
                <a
                    href="http://localhost:3000"
                    target="_blank"
                    rel="noreferrer"
                    className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 transition"
                >
                    View Storefront <ExternalLink size={13} />
                </a>

                <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>

                <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full">
                        <ShieldCheck size={14} className="text-indigo-600" />
                        <span>Administrator</span>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title="Log out of admin session"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </header>
    )
}

export default AdminNavbar

'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Loading from '../Loading'
import Link from 'next/link'
import { ArrowRightIcon, ShieldCheck } from 'lucide-react'
import AdminNavbar from './AdminNavbar'
import AdminSidebar from './AdminSidebar'

const AdminLayout = ({ children }) => {
    const pathname = usePathname()
    const router = useRouter()

    const [isAdmin, setIsAdmin] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const checkAdminAuth = () => {
            if (typeof window === 'undefined') return

            const adminKey = localStorage.getItem('adminKey')
            const token = localStorage.getItem('token')

            if (adminKey || token) {
                setIsAdmin(true)
            } else {
                setIsAdmin(false)
            }
            setLoading(false)
        }

        checkAdminAuth()
    }, [pathname])

    // Bypass layout chrome for login page
    if (pathname === '/login') {
        return <>{children}</>
    }

    if (loading) return <Loading />

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-slate-50">
                <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mb-4">
                    <ShieldCheck size={32} />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Admin Authorization Required</h1>
                <p className="text-slate-500 text-sm mt-2 max-w-md">
                    Please authenticate with your master security key to access the GoCart Admin Console.
                </p>
                <Link
                    href="/login"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 mt-6 py-2.5 px-6 rounded-xl font-medium text-sm transition shadow-sm"
                >
                    Authenticate with Admin Key <ArrowRightIcon size={16} />
                </Link>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-slate-50/50">
            <AdminNavbar />
            <div className="flex flex-1 items-start h-full overflow-hidden">
                <AdminSidebar />
                <div className="flex-1 h-full p-6 lg:p-10 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    )
}

export default AdminLayout

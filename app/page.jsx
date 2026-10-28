'use client'

import { dummyAdminDashboardData } from "@/assets/assets"
import Loading from "@/components/Loading"
import OrdersAreaChart from "@/components/OrdersAreaChart"
import { CircleDollarSignIcon, ShoppingBasketIcon, StoreIcon, TagsIcon, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"
import { graphqlRequest } from "@/lib/apiClient"
import { GET_ADMIN_DASHBOARD_QUERY } from "@/lib/graphql/dashboard"

export default function AdminDashboard() {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [dashboardData, setDashboardData] = useState({
        products: dummyAdminDashboardData.products,
        revenue: dummyAdminDashboardData.revenue,
        orders: dummyAdminDashboardData.orders,
        stores: dummyAdminDashboardData.stores,
        allOrders: dummyAdminDashboardData.allOrders,
    })

    const dashboardCardsData = [
        { title: 'Total Products', value: dashboardData.products, icon: ShoppingBasketIcon },
        { title: 'Total Revenue', value: currency + dashboardData.revenue, icon: CircleDollarSignIcon },
        { title: 'Total Orders', value: dashboardData.orders, icon: TagsIcon },
        { title: 'Total Stores', value: dashboardData.stores, icon: StoreIcon },
    ]

    const fetchDashboardData = async (isManualRefresh = false) => {
        if (isManualRefresh) {
            setRefreshing(true)
        } else {
            setLoading(true)
        }

        try {
            let beData = null

            // 1. Attempt to fetch from internal Next.js API route (which uses server-side ADMIN_KEY)
            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
                const res = await fetch('/api/admin/dashboard', {
                    cache: 'no-store',
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                })
                if (res.ok) {
                    const json = await res.json().catch(() => null)
                    if (json?.success && json?.data) {
                        beData = json.data
                    }
                }
            } catch (apiErr) {
                console.warn('API route /api/admin/dashboard error, trying direct GraphQL query:', apiErr)
            }

            // 2. Direct client-side GraphQL fallback if API route returned no data
            if (!beData) {
                try {
                    const gqlData = await graphqlRequest(GET_ADMIN_DASHBOARD_QUERY, { limit: 100 })
                    if (gqlData) {
                        beData = {
                            products: gqlData.products?.total ?? gqlData.products?.products?.length ?? null,
                            stores: gqlData.stores?.total ?? gqlData.stores?.stores?.length ?? null,
                            orders: null,
                            revenue: null,
                            allOrders: null,
                        }
                    }
                } catch (gqlErr) {
                    console.warn('Direct GraphQL request failed:', gqlErr)
                }
            }

            // 3. Fallback logic: "if BE returns nothing use default value"
            const finalProducts = (beData?.products !== null && beData?.products !== undefined && typeof beData?.products === 'number')
                ? beData.products
                : dummyAdminDashboardData.products

            const finalStores = (beData?.stores !== null && beData?.stores !== undefined && typeof beData?.stores === 'number')
                ? beData.stores
                : dummyAdminDashboardData.stores

            const finalOrders = (beData?.orders !== null && beData?.orders !== undefined && beData?.orders > 0)
                ? beData.orders
                : dummyAdminDashboardData.orders

            const finalRevenue = (beData?.revenue !== null && beData?.revenue !== undefined && Number(beData?.revenue) > 0)
                ? (typeof beData.revenue === 'number' ? beData.revenue.toFixed(2) : String(beData.revenue))
                : dummyAdminDashboardData.revenue

            const finalAllOrders = (Array.isArray(beData?.allOrders) && beData.allOrders.length > 0)
                ? beData.allOrders
                : dummyAdminDashboardData.allOrders

            setDashboardData({
                products: finalProducts,
                stores: finalStores,
                orders: finalOrders,
                revenue: finalRevenue,
                allOrders: finalAllOrders,
            })
        } catch (error) {
            console.error('Error fetching admin dashboard data:', error)
            // If BE fails or returns nothing, use default values
            setDashboardData(dummyAdminDashboardData)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()
    }, [])

    if (loading) return <Loading />

    return (
        <div className="text-slate-500 mb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl">Admin <span className="text-slate-800 font-medium">Dashboard</span></h1>
                    <p className="text-xs text-slate-400 mt-1">Overview of marketplace activity, catalog, and vendor metrics</p>
                </div>
                <button
                    onClick={() => fetchDashboardData(true)}
                    disabled={refreshing}
                    className="flex items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition shadow-xs disabled:opacity-60"
                    title="Refresh dashboard metrics"
                >
                    <RefreshCw size={14} className={refreshing ? "animate-spin text-indigo-600" : ""} />
                    <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
                </button>
            </div>

            {/* Cards */}
            <div className="flex flex-wrap gap-5 my-10 mt-6">
                {
                    dashboardCardsData.map((card, index) => (
                        <div key={index} className="flex items-center gap-10 border border-slate-200 p-3 px-6 rounded-lg bg-white shadow-xs hover:border-slate-300 transition">
                            <div className="flex flex-col gap-3 text-xs">
                                <p>{card.title}</p>
                                <b className="text-2xl font-medium text-slate-700">{card.value}</b>
                            </div>
                            <card.icon size={50} className="w-11 h-11 p-2.5 text-slate-400 bg-slate-100 rounded-full" />
                        </div>
                    ))
                }
            </div>

            {/* Area Chart */}
            <OrdersAreaChart allOrders={dashboardData.allOrders} />
        </div>
    )
}
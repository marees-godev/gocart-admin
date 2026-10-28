import { NextResponse } from 'next/server'
import { GRAPHQL_ENDPOINT } from '@/lib/apiClient'
import { GET_ADMIN_DASHBOARD_QUERY } from '@/lib/graphql/dashboard'

const ADMIN_KEY = process.env.ADMIN_KEY

export async function GET(request) {
    try {
        const authHeader = request.headers.get('authorization')

        const headers = {
            'Content-Type': 'application/json',
            ...(ADMIN_KEY ? { 'X-Admin-Key': ADMIN_KEY } : {}),
            ...(authHeader ? { Authorization: authHeader } : {}),
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 12000)

        const response = await fetch(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                query: GET_ADMIN_DASHBOARD_QUERY,
                variables: { limit: 100 }
            }),
            cache: 'no-store',
            signal: controller.signal
        }).catch((err) => {
            clearTimeout(timeoutId)
            throw err
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
            return NextResponse.json({
                success: false,
                message: `Backend returned HTTP ${response.status}`,
                data: null
            }, { status: 200 })
        }

        const result = await response.json().catch(() => null)

        if (result?.errors && result.errors.length > 0 && !result.data) {
            return NextResponse.json({
                success: false,
                message: result.errors.map(e => e.message).join(', '),
                data: null
            }, { status: 200 })
        }

        const productsData = result?.data?.products
        const storesData = result?.data?.stores

        // Extract counts if returned by BE
        const productsCount = (productsData?.total !== undefined && productsData?.total !== null)
            ? productsData.total
            : (Array.isArray(productsData?.products) ? productsData.products.length : null)

        const storesCount = (storesData?.total !== undefined && storesData?.total !== null)
            ? storesData.total
            : (Array.isArray(storesData?.stores) ? storesData.stores.length : null)

        return NextResponse.json({
            success: true,
            data: {
                products: productsCount,
                stores: storesCount,
                orders: null, // Fall back to default if BE has no orders
                revenue: null, // Fall back to default if BE has no revenue
                allOrders: null, // Fall back to default if BE has no chart data
                rawProducts: productsData?.products || [],
                rawStores: storesData?.stores || []
            }
        })
    } catch (err) {
        console.error('API Error in GET /api/admin/dashboard:', err)
        // Return 200 with null data so client falls back gracefully to default static values
        return NextResponse.json({
            success: false,
            message: err.message || 'Failed to fetch dashboard data from backend',
            data: null
        }, { status: 200 })
    }
}

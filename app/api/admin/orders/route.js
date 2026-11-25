import { NextResponse } from 'next/server'
import { GRAPHQL_ENDPOINT } from '@/lib/apiClient'
import {
    GET_ORDER_BY_ID_QUERY,
    GET_ORDERS_BY_USER_QUERY,
    UPDATE_ORDER_STATUS_MUTATION,
} from '@/lib/graphql/order'

const ADMIN_KEY = process.env.ADMIN_KEY

function buildHeaders(request) {
    const authHeader = request.headers.get('authorization')
    return {
        'Content-Type': 'application/json',
        ...(ADMIN_KEY ? { 'X-Admin-Key': ADMIN_KEY } : {}),
        ...(authHeader ? { Authorization: authHeader } : {}),
    }
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const orderId = searchParams.get('orderId')
        const userId = searchParams.get('userId')
        const limit = parseInt(searchParams.get('limit') || '50', 10)
        const offset = parseInt(searchParams.get('offset') || '0', 10)

        if (!orderId && !userId) {
            return NextResponse.json(
                { success: false, message: 'Either userId or orderId query parameter is required' },
                { status: 400 }
            )
        }

        const query = orderId ? GET_ORDER_BY_ID_QUERY : GET_ORDERS_BY_USER_QUERY
        const variables = orderId ? { id: orderId } : { userId, limit, offset }

        const response = await fetch(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: buildHeaders(request),
            body: JSON.stringify({ query, variables }),
            cache: 'no-store',
        })

        const result = await response.json().catch(() => null)
        if (!response.ok || result?.errors?.length) {
            const msg = result?.errors?.map((e) => e.message).join(', ') || `Backend returned HTTP ${response.status}`
            return NextResponse.json({ success: false, message: msg }, { status: response.ok ? 400 : response.status })
        }

        if (orderId) {
            const ord = result?.data?.order
            return NextResponse.json({
                success: true,
                orders: ord ? [ord] : [],
                total: ord ? 1 : 0,
            })
        }

        const orders = result?.data?.orders?.orders || []
        const total = result?.data?.orders?.total ?? orders.length
        return NextResponse.json({ success: true, orders, total })
    } catch (err) {
        console.error('API Error in GET /api/admin/orders:', err)
        return NextResponse.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function PATCH(request) {
    try {
        const body = await request.json().catch(() => null)
        if (!body?.id || !body?.status) {
            return NextResponse.json({ success: false, message: 'Order id and status are required' }, { status: 400 })
        }

        const response = await fetch(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: buildHeaders(request),
            body: JSON.stringify({
                query: UPDATE_ORDER_STATUS_MUTATION,
                variables: { id: body.id, status: body.status },
            }),
            cache: 'no-store',
        })

        const result = await response.json().catch(() => null)
        if (!response.ok || result?.errors?.length) {
            const msg = result?.errors?.map((e) => e.message).join(', ') || `Backend returned HTTP ${response.status}`
            return NextResponse.json({ success: false, message: msg }, { status: response.ok ? 400 : response.status })
        }

        return NextResponse.json({
            success: true,
            order: result?.data?.updateOrderStatus,
        })
    } catch (err) {
        console.error('API Error in PATCH /api/admin/orders:', err)
        return NextResponse.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 })
    }
}

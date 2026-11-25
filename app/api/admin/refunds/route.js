import { NextResponse } from 'next/server'
import { GRAPHQL_ENDPOINT } from '@/lib/apiClient'
import { GET_PAYMENT_BY_ORDER_QUERY, CREATE_REFUND_MUTATION } from '@/lib/graphql/order'

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
        if (!orderId) {
            return NextResponse.json({ success: false, message: 'orderId is required' }, { status: 400 })
        }

        const response = await fetch(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: buildHeaders(request),
            body: JSON.stringify({
                query: GET_PAYMENT_BY_ORDER_QUERY,
                variables: { orderId },
            }),
            cache: 'no-store',
        })

        const result = await response.json().catch(() => null)
        if (!response.ok || result?.errors?.length) {
            const msg = result?.errors?.map((e) => e.message).join(', ') || `Backend returned HTTP ${response.status}`
            return NextResponse.json({ success: false, message: msg }, { status: response.ok ? 400 : response.status })
        }

        return NextResponse.json({ success: true, payment: result?.data?.paymentByOrderId || null })
    } catch (err) {
        console.error('API Error in GET /api/admin/refunds:', err)
        return NextResponse.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const body = await request.json().catch(() => null)
        const { paymentId, amount, reason, idempotencyKey } = body || {}

        if (!paymentId || amount === undefined || Number(amount) <= 0) {
            return NextResponse.json({ success: false, message: 'paymentId and positive amount are required' }, { status: 400 })
        }

        const response = await fetch(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: buildHeaders(request),
            body: JSON.stringify({
                query: CREATE_REFUND_MUTATION,
                variables: {
                    paymentId,
                    amount: Number(amount),
                    ...(reason ? { reason } : {}),
                    ...(idempotencyKey ? { idempotencyKey } : {}),
                },
            }),
            cache: 'no-store',
        })

        const result = await response.json().catch(() => null)
        if (!response.ok || result?.errors?.length) {
            const msg = result?.errors?.map((e) => e.message).join(', ') || `Backend returned HTTP ${response.status}`
            return NextResponse.json({ success: false, message: msg }, { status: response.ok ? 400 : response.status })
        }

        return NextResponse.json({ success: true, refund: result?.data?.createRefund })
    } catch (err) {
        console.error('API Error in POST /api/admin/refunds:', err)
        return NextResponse.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 })
    }
}

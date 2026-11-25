import { NextResponse } from 'next/server'
import { GRAPHQL_ENDPOINT } from '@/lib/apiClient'
import {
    GET_MERCHANTS_QUERY,
    GET_USER_BY_ID_QUERY,
    UPDATE_MERCHANT_STATUS_MUTATION,
} from '@/lib/graphql/merchant'

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
        const limit = parseInt(searchParams.get('limit') || '50', 10)
        const offset = parseInt(searchParams.get('offset') || '0', 10)
        const statusFilter = searchParams.get('status') || undefined
        const userId = searchParams.get('userId')

        if (userId) {
            const response = await fetch(GRAPHQL_ENDPOINT, {
                method: 'POST',
                headers: buildHeaders(request),
                body: JSON.stringify({
                    query: GET_USER_BY_ID_QUERY,
                    variables: { id: userId },
                }),
                cache: 'no-store',
            })

            const result = await response.json().catch(() => null)
            if (!response.ok || result?.errors?.length) {
                const msg = result?.errors?.map((e) => e.message).join(', ') || `Backend returned HTTP ${response.status}`
                return NextResponse.json({ success: false, message: msg }, { status: response.ok ? 400 : response.status })
            }

            return NextResponse.json({ success: true, user: result?.data?.user || null })
        }

        const response = await fetch(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: buildHeaders(request),
            body: JSON.stringify({
                query: GET_MERCHANTS_QUERY,
                variables: {
                    limit,
                    offset,
                    ...(statusFilter ? { status: statusFilter } : {}),
                },
            }),
            cache: 'no-store',
        })

        const result = await response.json().catch(() => null)
        if (!response.ok || result?.errors?.length) {
            const msg = result?.errors?.map((e) => e.message).join(', ') || `Backend returned HTTP ${response.status}`
            return NextResponse.json({ success: false, message: msg }, { status: response.ok ? 400 : response.status })
        }

        const merchants = result?.data?.merchants?.merchants || []
        const total = result?.data?.merchants?.total ?? merchants.length

        return NextResponse.json({ success: true, merchants, total })
    } catch (err) {
        console.error('API Error in GET /api/admin/users:', err)
        return NextResponse.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function PATCH(request) {
    try {
        const body = await request.json().catch(() => null)
        if (!body?.id || !body?.status) {
            return NextResponse.json({ success: false, message: 'Merchant id and status are required' }, { status: 400 })
        }

        const response = await fetch(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: buildHeaders(request),
            body: JSON.stringify({
                query: UPDATE_MERCHANT_STATUS_MUTATION,
                variables: {
                    id: body.id,
                    status: body.status,
                    ...(body.rejectionReason ? { rejectionReason: body.rejectionReason } : {}),
                },
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
            merchant: result?.data?.updateMerchantStatus,
        })
    } catch (err) {
        console.error('API Error in PATCH /api/admin/users:', err)
        return NextResponse.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 })
    }
}

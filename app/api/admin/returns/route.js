import { NextResponse } from 'next/server'
import { GRAPHQL_ENDPOINT } from '@/lib/apiClient'
import {
    LIST_RETURNS_QUERY,
    APPROVE_RETURN_MUTATION,
    REJECT_RETURN_MUTATION,
    UPDATE_RETURN_STATUS_MUTATION,
} from '@/lib/graphql/return'

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

        const response = await fetch(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: buildHeaders(request),
            body: JSON.stringify({
                query: LIST_RETURNS_QUERY,
                variables: { limit, offset, ...(statusFilter ? { status: statusFilter } : {}) },
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
            returns: result?.data?.listReturns || [],
        })
    } catch (err) {
        console.error('API Error in GET /api/admin/returns:', err)
        return NextResponse.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const body = await request.json().catch(() => null)
        const { id, action, reason, status: nextStatus } = body || {}

        if (!id || !action) {
            return NextResponse.json({ success: false, message: 'id and action are required' }, { status: 400 })
        }

        const normalized = action.toLowerCase()
        let query = APPROVE_RETURN_MUTATION
        let variables = { id }
        let resultKey = 'approveReturn'

        if (normalized === 'reject') {
            if (!reason || !reason.trim()) {
                return NextResponse.json({ success: false, message: 'Rejection reason is required' }, { status: 400 })
            }
            query = REJECT_RETURN_MUTATION
            variables = { id, reason: reason.trim() }
            resultKey = 'rejectReturn'
        } else if (normalized === 'update_status') {
            if (!nextStatus) {
                return NextResponse.json({ success: false, message: 'status is required' }, { status: 400 })
            }
            query = UPDATE_RETURN_STATUS_MUTATION
            variables = { id, status: nextStatus, ...(reason ? { rejectionReason: reason } : {}) }
            resultKey = 'updateReturnStatus'
        } else if (normalized !== 'approve') {
            return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 })
        }

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

        return NextResponse.json({
            success: true,
            returnOrder: result?.data?.[resultKey],
        })
    } catch (err) {
        console.error('API Error in POST /api/admin/returns:', err)
        return NextResponse.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 })
    }
}

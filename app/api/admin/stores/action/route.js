import { NextResponse } from 'next/server'
import { GRAPHQL_ENDPOINT } from '@/lib/apiClient'
import {
    APPROVE_STORE_MUTATION,
    REJECT_STORE_MUTATION,
    SUSPEND_STORE_MUTATION,
    UNSUSPEND_STORE_MUTATION,
} from '@/lib/graphql/store'

const ADMIN_KEY = process.env.ADMIN_KEY

export async function POST(request) {
    try {
        const body = await request.json().catch(() => null)
        if (!body) {
            return NextResponse.json(
                { success: false, message: 'Missing JSON request body' },
                { status: 400 }
            )
        }

        const { storeId, action, reason } = body

        if (!storeId) {
            return NextResponse.json(
                { success: false, message: 'Store ID is required' },
                { status: 400 }
            )
        }

        const normalizedAction = (action || '').toLowerCase()
        const validActions = ['approve', 'reject', 'suspend', 'unsuspend']
        if (!validActions.includes(normalizedAction)) {
            return NextResponse.json(
                { success: false, message: 'Action must be one of: approve, reject, suspend, unsuspend' },
                { status: 400 }
            )
        }

        if (normalizedAction === 'reject' && (!reason || !reason.trim())) {
            return NextResponse.json(
                { success: false, message: 'A rejection reason is required to reject a store application.' },
                { status: 400 }
            )
        }

        let query = APPROVE_STORE_MUTATION
        let variables = { id: storeId }
        if (normalizedAction === 'reject') {
            query = REJECT_STORE_MUTATION
            variables = { id: storeId, reason: reason.trim() }
        } else if (normalizedAction === 'suspend') {
            query = SUSPEND_STORE_MUTATION
            variables = { id: storeId, reason: (reason && reason.trim()) || 'Suspended by administrator' }
        } else if (normalizedAction === 'unsuspend') {
            query = UNSUSPEND_STORE_MUTATION
            variables = { id: storeId, ...(reason && reason.trim() ? { reason: reason.trim() } : {}) }
        }

        const authHeader = request.headers.get('authorization')
        const response = await fetch(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(ADMIN_KEY ? { 'X-Admin-Key': ADMIN_KEY } : {}),
                ...(authHeader ? { Authorization: authHeader } : {}),
            },
            body: JSON.stringify({ query, variables }),
            cache: 'no-store',
        })

        if (!response.ok) {
            return NextResponse.json(
                { success: false, message: `Backend service responded with HTTP ${response.status}` },
                { status: response.status }
            )
        }

        const result = await response.json()

        if (result.errors && result.errors.length > 0) {
            const errorMsg = result.errors.map((e) => e.message).join(', ')
            return NextResponse.json(
                { success: false, message: errorMsg || `Failed to ${normalizedAction} store.` },
                { status: 400 }
            )
        }

        const resultKeyMap = {
            approve: 'approveStore',
            reject: 'rejectStore',
            suspend: 'suspendStore',
            unsuspend: 'unsuspendStore',
        }
        const updatedStore = result.data?.[resultKeyMap[normalizedAction]]

        const messageMap = {
            approve: `Store "${updatedStore?.name || storeId}" has been approved successfully.`,
            reject: `Store "${updatedStore?.name || storeId}" application was rejected.`,
            suspend: `Store "${updatedStore?.name || storeId}" has been suspended.`,
            unsuspend: `Store "${updatedStore?.name || storeId}" has been reactivated.`,
        }

        return NextResponse.json({
            success: true,
            action: normalizedAction,
            message: messageMap[normalizedAction],
            store: updatedStore,
        })
    } catch (err) {
        console.error('API Error in POST /api/admin/stores/action:', err)
        return NextResponse.json(
            { success: false, message: err.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}

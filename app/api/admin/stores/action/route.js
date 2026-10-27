import { NextResponse } from 'next/server'
import { GRAPHQL_ENDPOINT } from '@/lib/apiClient'

const ADMIN_KEY = process.env.ADMIN_KEY

const APPROVE_STORE_MUTATION = `
  mutation ApproveStore($id: ID!) {
    approveStore(id: $id) {
      id
      name
      approvalStatus
      updatedAt
    }
  }
`

const REJECT_STORE_MUTATION = `
  mutation RejectStore($id: ID!, $reason: String!) {
    rejectStore(id: $id, reason: $reason) {
      id
      name
      approvalStatus
      rejectionReason
      updatedAt
    }
  }
`

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
        if (normalizedAction !== 'approve' && normalizedAction !== 'reject') {
            return NextResponse.json(
                { success: false, message: 'Action must be either "approve" or "reject"' },
                { status: 400 }
            )
        }

        if (normalizedAction === 'reject' && (!reason || !reason.trim())) {
            return NextResponse.json(
                { success: false, message: 'A rejection reason is required to reject a store application.' },
                { status: 400 }
            )
        }

        const query = normalizedAction === 'approve' ? APPROVE_STORE_MUTATION : REJECT_STORE_MUTATION
        const variables = normalizedAction === 'approve' ? { id: storeId } : { id: storeId, reason: reason.trim() }

        const response = await fetch(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Key': ADMIN_KEY,
            },
            body: JSON.stringify({
                query,
                variables,
            }),
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

        const updatedStore = normalizedAction === 'approve' ? result.data?.approveStore : result.data?.rejectStore

        return NextResponse.json({
            success: true,
            action: normalizedAction,
            message:
                normalizedAction === 'approve'
                    ? `Store "${updatedStore?.name || storeId}" has been approved successfully.`
                    : `Store "${updatedStore?.name || storeId}" application was rejected.`,
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

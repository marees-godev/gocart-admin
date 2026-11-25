import { NextResponse } from 'next/server'
import { GRAPHQL_ENDPOINT } from '@/lib/apiClient'
import {
    GET_APPEAL_DELIVERY_PARTNERS_QUERY,
    GET_DELIVERY_PARTNER_PROFILE_QUERY,
    APPROVE_DELIVERY_PARTNER_MUTATION,
    REJECT_DELIVERY_PARTNER_MUTATION,
    VERIFY_DELIVERY_PARTNER_GSTIN_MUTATION,
} from '@/lib/graphql/delivery'

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
        const partnerId = searchParams.get('partnerId')

        const query = partnerId ? GET_DELIVERY_PARTNER_PROFILE_QUERY : GET_APPEAL_DELIVERY_PARTNERS_QUERY
        const variables = partnerId ? { partnerId } : {}

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

        if (partnerId) {
            const profile = result?.data?.deliveryPartnerProfile
            return NextResponse.json({
                success: true,
                partners: profile ? [profile] : [],
            })
        }

        return NextResponse.json({
            success: true,
            partners: result?.data?.appealDeliveryPartners || [],
        })
    } catch (err) {
        console.error('API Error in GET /api/admin/delivery-partners:', err)
        return NextResponse.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const body = await request.json().catch(() => null)
        const { partnerId, action, reason } = body || {}

        if (!partnerId || !action) {
            return NextResponse.json({ success: false, message: 'partnerId and action are required' }, { status: 400 })
        }

        const normalized = action.toLowerCase()
        let query = APPROVE_DELIVERY_PARTNER_MUTATION
        let variables = { partnerId }
        let resultKey = 'approveDeliveryPartner'

        if (normalized === 'reject') {
            if (!reason || !reason.trim()) {
                return NextResponse.json({ success: false, message: 'Rejection reason is required' }, { status: 400 })
            }
            query = REJECT_DELIVERY_PARTNER_MUTATION
            variables = { partnerId, reason: reason.trim() }
            resultKey = 'rejectDeliveryPartner'
        } else if (normalized === 'verify_gstin') {
            query = VERIFY_DELIVERY_PARTNER_GSTIN_MUTATION
            resultKey = 'verifyDeliveryPartnerGSTIN'
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
            partner: result?.data?.[resultKey],
        })
    } catch (err) {
        console.error('API Error in POST /api/admin/delivery-partners:', err)
        return NextResponse.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 })
    }
}

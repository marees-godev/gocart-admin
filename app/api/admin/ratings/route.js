import { NextResponse } from 'next/server'
import { GRAPHQL_ENDPOINT } from '@/lib/apiClient'
import { GET_FLAGGED_RATINGS_QUERY, MODERATE_RATING_MUTATION } from '@/lib/graphql/rating'

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

        const response = await fetch(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: buildHeaders(request),
            body: JSON.stringify({
                query: GET_FLAGGED_RATINGS_QUERY,
                variables: { limit, offset },
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
            items: result?.data?.getFlaggedRating?.items || [],
            total: result?.data?.getFlaggedRating?.total ?? 0,
        })
    } catch (err) {
        console.error('API Error in GET /api/admin/ratings:', err)
        return NextResponse.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const body = await request.json().catch(() => null)
        if (!body?.ratingId || body?.isHidden === undefined) {
            return NextResponse.json({ success: false, message: 'ratingId and isHidden are required' }, { status: 400 })
        }

        const response = await fetch(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: buildHeaders(request),
            body: JSON.stringify({
                query: MODERATE_RATING_MUTATION,
                variables: {
                    input: {
                        ratingId: body.ratingId,
                        isHidden: Boolean(body.isHidden),
                    },
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
            success: result?.data?.moderateRating?.success ?? true,
            message: result?.data?.moderateRating?.message || 'Rating moderated',
        })
    } catch (err) {
        console.error('API Error in POST /api/admin/ratings:', err)
        return NextResponse.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 })
    }
}

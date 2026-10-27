import { NextResponse } from 'next/server'
import { GRAPHQL_ENDPOINT } from '@/lib/apiClient'

const ADMIN_KEY =
    process.env.ADMIN_KEY ||
    process.env.NEXT_PUBLIC_ADMIN_KEY ||
    '7f3a9c2e8d1b6f405a7e3c9d2b8f1a604e6d9c3b7a2f5e801d4c6b9a3f7e2d51'

const GET_ALL_STORES_QUERY = `
  query GetStoresForApproval($limit: Int, $offset: Int) {
    stores(limit: $limit, offset: $offset) {
      stores {
        id
        merchantId
        name
        slug
        businessEmail
        businessPhone
        description
        logoUrl
        address
        isVacationMode
        approvalStatus
        rejectionReason
        isPublished
        kycStatus
        gstin
        createdAt
        updatedAt
      }
      total
    }
  }
`

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const statusFilter = searchParams.get('status') || 'PENDING'
        const limit = parseInt(searchParams.get('limit') || '100', 10)
        const offset = parseInt(searchParams.get('offset') || '0', 10)

        // Request stores from backend GraphQL service using master admin key
        const response = await fetch(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Key': ADMIN_KEY,
            },
            body: JSON.stringify({
                query: GET_ALL_STORES_QUERY,
                variables: { limit, offset },
            }),
            cache: 'no-store',
        })

        if (!response.ok) {
            return NextResponse.json(
                { success: false, message: `Backend returned HTTP ${response.status}` },
                { status: response.status }
            )
        }

        const result = await response.json()

        if (result.errors && result.errors.length > 0) {
            const errMsg = result.errors.map((e) => e.message).join(', ')
            return NextResponse.json(
                { success: false, message: errMsg },
                { status: 400 }
            )
        }

        const allStores = result.data?.stores?.stores || []
        const totalInDb = result.data?.stores?.total || allStores.length

        // Filter stores based on approval status
        let filteredStores = allStores
        if (statusFilter.toUpperCase() === 'PENDING') {
            filteredStores = allStores.filter((s) => {
                const st = (s.approvalStatus || '').toUpperCase()
                return st === 'PENDING' || st === 'PENDING_APPROVAL' || st === 'DRAFT'
            })
        } else if (statusFilter.toUpperCase() !== 'ALL') {
            filteredStores = allStores.filter(
                (s) => (s.approvalStatus || '').toUpperCase() === statusFilter.toUpperCase()
            )
        }

        return NextResponse.json({
            success: true,
            totalPending: filteredStores.length,
            totalAll: totalInDb,
            filter: statusFilter,
            stores: filteredStores,
        })
    } catch (err) {
        console.error('API Error in GET /api/admin/stores/pending:', err)
        return NextResponse.json(
            { success: false, message: err.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}

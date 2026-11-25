import { NextResponse } from 'next/server'
import { GRAPHQL_ENDPOINT } from '@/lib/apiClient'
import {
    GET_PRODUCTS_QUERY,
    UPDATE_PRODUCT_MUTATION,
    DELETE_PRODUCT_MUTATION,
} from '@/lib/graphql/product'

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
        const categoryId = searchParams.get('categoryId') || undefined
        const storeId = searchParams.get('storeId') || undefined
        const statusFilter = searchParams.get('status') || undefined

        const response = await fetch(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: buildHeaders(request),
            body: JSON.stringify({
                query: GET_PRODUCTS_QUERY,
                variables: { limit, offset, categoryId, storeId, status: statusFilter },
            }),
            cache: 'no-store',
        })

        const result = await response.json().catch(() => null)
        if (!response.ok || result?.errors?.length) {
            const msg = result?.errors?.map((e) => e.message).join(', ') || `Backend returned HTTP ${response.status}`
            return NextResponse.json({ success: false, message: msg }, { status: response.ok ? 400 : response.status })
        }

        const products = result?.data?.products?.products || []
        const total = result?.data?.products?.total ?? products.length

        return NextResponse.json({ success: true, products, total })
    } catch (err) {
        console.error('API Error in GET /api/admin/products:', err)
        return NextResponse.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function PATCH(request) {
    try {
        const body = await request.json().catch(() => null)
        if (!body?.id || !body?.input) {
            return NextResponse.json({ success: false, message: 'id and input are required' }, { status: 400 })
        }

        const response = await fetch(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: buildHeaders(request),
            body: JSON.stringify({
                query: UPDATE_PRODUCT_MUTATION,
                variables: { id: body.id, input: body.input },
            }),
            cache: 'no-store',
        })

        const result = await response.json().catch(() => null)
        if (!response.ok || result?.errors?.length) {
            const msg = result?.errors?.map((e) => e.message).join(', ') || `Backend returned HTTP ${response.status}`
            return NextResponse.json({ success: false, message: msg }, { status: response.ok ? 400 : response.status })
        }

        return NextResponse.json({ success: true, product: result?.data?.updateProduct })
    } catch (err) {
        console.error('API Error in PATCH /api/admin/products:', err)
        return NextResponse.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        if (!id) {
            return NextResponse.json({ success: false, message: 'Product id is required' }, { status: 400 })
        }

        const response = await fetch(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: buildHeaders(request),
            body: JSON.stringify({
                query: DELETE_PRODUCT_MUTATION,
                variables: { id },
            }),
            cache: 'no-store',
        })

        const result = await response.json().catch(() => null)
        if (!response.ok || result?.errors?.length) {
            const msg = result?.errors?.map((e) => e.message).join(', ') || `Backend returned HTTP ${response.status}`
            return NextResponse.json({ success: false, message: msg }, { status: response.ok ? 400 : response.status })
        }

        return NextResponse.json({
            success: result?.data?.deleteProduct?.success ?? true,
            message: result?.data?.deleteProduct?.message || 'Product deleted',
        })
    } catch (err) {
        console.error('API Error in DELETE /api/admin/products:', err)
        return NextResponse.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 })
    }
}

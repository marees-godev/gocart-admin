import { NextResponse } from 'next/server'
import { GRAPHQL_ENDPOINT } from '@/lib/apiClient'
import {
    GET_CATEGORIES_QUERY,
    CREATE_CATEGORY_MUTATION,
    UPDATE_CATEGORY_MUTATION,
    DELETE_CATEGORY_MUTATION,
} from '@/lib/graphql/category'

const ADMIN_KEY = process.env.ADMIN_KEY

function buildHeaders(request) {
    const authHeader = request.headers.get('authorization')
    return {
        'Content-Type': 'application/json',
        ...(ADMIN_KEY ? { 'X-Admin-Key': ADMIN_KEY } : {}),
        ...(authHeader ? { Authorization: authHeader } : {}),
    }
}

async function callGraphQL(request, query, variables) {
    const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: buildHeaders(request),
        body: JSON.stringify({ query, variables }),
        cache: 'no-store',
    })

    if (!response.ok) {
        return { error: `Backend returned HTTP ${response.status}`, status: response.status }
    }

    const result = await response.json().catch(() => null)
    if (result?.errors?.length > 0) {
        return { error: result.errors.map((e) => e.message).join(', '), status: 400 }
    }

    return { data: result?.data, status: 200 }
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '100', 10)
        const offset = parseInt(searchParams.get('offset') || '0', 10)

        const { data, error, status } = await callGraphQL(request, GET_CATEGORIES_QUERY, { limit, offset })
        if (error) {
            return NextResponse.json({ success: false, message: error }, { status })
        }

        const categories = data?.categories?.categories || []
        const total = data?.categories?.total ?? categories.length

        return NextResponse.json({ success: true, categories, total })
    } catch (err) {
        console.error('API Error in GET /api/admin/categories:', err)
        return NextResponse.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const body = await request.json().catch(() => null)
        if (!body?.name?.trim()) {
            return NextResponse.json({ success: false, message: 'Category name is required' }, { status: 400 })
        }

        const input = {
            name: body.name.trim(),
            ...(body.description ? { description: body.description.trim() } : {}),
            ...(body.parentCategoryId ? { parentCategoryId: body.parentCategoryId } : {}),
            isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
        }

        const { data, error, status } = await callGraphQL(request, CREATE_CATEGORY_MUTATION, { input })
        if (error) {
            return NextResponse.json({ success: false, message: error }, { status })
        }

        return NextResponse.json({ success: true, category: data?.createCategory })
    } catch (err) {
        console.error('API Error in POST /api/admin/categories:', err)
        return NextResponse.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function PATCH(request) {
    try {
        const body = await request.json().catch(() => null)
        if (!body?.id) {
            return NextResponse.json({ success: false, message: 'Category ID is required' }, { status: 400 })
        }

        const input = {}
        if (body.name !== undefined) input.name = body.name.trim()
        if (body.description !== undefined) input.description = body.description
        if (body.parentCategoryId !== undefined) input.parentCategoryId = body.parentCategoryId
        if (body.isActive !== undefined) input.isActive = Boolean(body.isActive)

        const { data, error, status } = await callGraphQL(request, UPDATE_CATEGORY_MUTATION, { id: body.id, input })
        if (error) {
            return NextResponse.json({ success: false, message: error }, { status })
        }

        return NextResponse.json({ success: true, category: data?.updateCategory })
    } catch (err) {
        console.error('API Error in PATCH /api/admin/categories:', err)
        return NextResponse.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url)
        let id = searchParams.get('id')
        if (!id) {
            const body = await request.json().catch(() => null)
            id = body?.id
        }
        if (!id) {
            return NextResponse.json({ success: false, message: 'Category ID is required' }, { status: 400 })
        }

        const { data, error, status } = await callGraphQL(request, DELETE_CATEGORY_MUTATION, { id })
        if (error) {
            return NextResponse.json({ success: false, message: error }, { status })
        }

        return NextResponse.json({
            success: data?.deleteCategory?.success ?? true,
            message: data?.deleteCategory?.message || 'Category deleted',
        })
    } catch (err) {
        console.error('API Error in DELETE /api/admin/categories:', err)
        return NextResponse.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 })
    }
}

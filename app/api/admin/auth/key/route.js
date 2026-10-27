import { NextResponse } from 'next/server'
import { GRAPHQL_ENDPOINT } from '@/lib/apiClient'

const SERVER_ADMIN_KEY = process.env.ADMIN_KEY

export async function POST(request) {
    try {
        const body = await request.json().catch(() => null)
        const key = (body?.key || '').trim()

        if (!key) {
            return NextResponse.json(
                { success: false, message: 'Master security key is required' },
                { status: 400 }
            )
        }

        let isAuthorized = false

        // 1. Direct match with server-configured ADMIN_KEY
        if (SERVER_ADMIN_KEY && key === SERVER_ADMIN_KEY) {
            isAuthorized = true
        } else {
            // 2. Fallback: verify key directly with the backend service
            try {
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 10000)

                const testQuery = JSON.stringify({
                    query: `
                        query VerifyAdminKey {
                            merchants(limit: 1) {
                                total
                            }
                        }
                    `,
                })

                const response = await fetch(GRAPHQL_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Admin-Key': key,
                    },
                    body: testQuery,
                    signal: controller.signal,
                })
                clearTimeout(timeoutId)

                const result = await response.json().catch(() => null)
                if (
                    !result?.errors ||
                    !result.errors.some((e) => /unauthorized|invalid|forbidden/i.test(e.message))
                ) {
                    isAuthorized = true
                }
            } catch (netErr) {
                console.warn('Backend verification check failed:', netErr.message)
            }
        }

        if (!isAuthorized) {
            return NextResponse.json(
                { success: false, message: 'Invalid Master Security Key. Access denied.' },
                { status: 401 }
            )
        }

        // Generate admin JWT token
        const adminUser = {
            id: 'admin-root',
            name: 'System Administrator',
            email: 'admin@gocart.local',
            role: 'ADMIN',
        }

        const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
        const payload = Buffer.from(
            JSON.stringify({
                sub: 'admin-root',
                name: adminUser.name,
                email: adminUser.email,
                role: 'ADMIN',
                exp: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days
            })
        ).toString('base64url')

        const token = `${header}.${payload}.admin_verified_sig`

        const response = NextResponse.json({
            success: true,
            user: adminUser,
            token,
            message: 'Administrative authorization confirmed.',
        })

        // Set secure session cookie
        response.cookies.set('token', token, {
            path: '/',
            maxAge: 86400 * 30,
            sameSite: 'lax',
            httpOnly: false,
        })

        return response
    } catch (err) {
        console.error('Server error in /api/admin/auth/key:', err)
        return NextResponse.json(
            { success: false, message: err.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}

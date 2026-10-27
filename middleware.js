import { NextResponse } from 'next/server';

function decodeJwtPayload(token) {
    try {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        return JSON.parse(atob(base64));
    } catch {
        return null
    }
}

export function middleware(request) {
    const { pathname } = request.nextUrl

    // Allow login page, static assets, and api
    if (pathname === '/login' || pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
        return NextResponse.next()
    }

    const token = request.cookies.get('token')?.value
    const adminKey = request.cookies.get('adminKey')?.value

    // If master adminKey cookie is present, allow access
    if (adminKey) {
        return NextResponse.next()
    }

    // If authenticated admin token, allow access
    if (token) {
        const payload = decodeJwtPayload(token)
        if (payload && payload.role === 'ADMIN') {
            return NextResponse.next()
        }
    }

    // Otherwise redirect to admin login
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import {
    ShieldCheck,
    Key,
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    ArrowLeft,
    Sparkles,
    RefreshCw,
    UserCheck,
    CheckCircle2,
    Shield,
} from 'lucide-react'
import { useDispatch } from 'react-redux'
import { setAuth } from '@/lib/features/auth/authSlice'
import { GRAPHQL_ENDPOINT } from '@/lib/apiClient'

const LOGIN_MUTATION = `
  mutation AdminLogin($input: LoginInput!) {
    login(input: $input) {
      token
      refreshToken
      role
      tokenType
      expiresIn
    }
  }
`

const ME_QUERY = `
  query GetMe {
    me {
      id
      email
      firstName
      lastName
      role
    }
  }
`

export default function AdminLoginPage() {
    const router = useRouter()
    const dispatch = useDispatch()

    // Mode: 'email' or 'key'
    const [authMode, setAuthMode] = useState('email')

    // Email login form state
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [rememberMe, setRememberMe] = useState(true)

    // Master Key login form state (Starts empty, never exposes secret key in browser)
    const [adminKey, setAdminKey] = useState('')
    const [showKey, setShowKey] = useState(false)

    // Shared loading state
    const [loading, setLoading] = useState(false)

    // Live Backend Status: 'checking' | 'online' | 'waking'
    const [backendStatus, setBackendStatus] = useState('checking')

    // Check backend health on mount
    useEffect(() => {
        let isMounted = true

        const pingBackend = async () => {
            try {
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 7000)

                const res = await fetch(GRAPHQL_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: '{ __typename }' }),
                    signal: controller.signal,
                })
                clearTimeout(timeoutId)

                if (isMounted) {
                    setBackendStatus(res.ok ? 'online' : 'waking')
                }
            } catch {
                if (isMounted) {
                    setBackendStatus('waking')
                }
            }
        }

        pingBackend()
        return () => {
            isMounted = false
        }
    }, [])

    // Quick fill helper for testing/development
    const handleQuickFillEmail = () => {
        setEmail('admin@gocart.local')
        setPassword('Admin@123456')
        toast.success('Admin demo credentials populated')
    }

    // 1. Email & Password Authentication Handler
    const handleEmailLogin = async (e) => {
        if (e) e.preventDefault()

        const trimmedEmail = email.trim()
        if (!trimmedEmail) {
            toast.error('Please enter your administrator email')
            return
        }
        if (!password) {
            toast.error('Please enter your password')
            return
        }

        setLoading(true)
        try {
            // Attempt GraphQL login mutation with timeout
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 25000)

            const response = await fetch(GRAPHQL_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: LOGIN_MUTATION,
                    variables: {
                        input: {
                            email: trimmedEmail,
                            password: password,
                            role: 'USER',
                        },
                    },
                }),
                signal: controller.signal,
            }).catch((err) => {
                clearTimeout(timeoutId)
                if (err.name === 'AbortError' || err.message === 'Failed to fetch' || err.name === 'TypeError') {
                    throw new Error(
                        'Backend server on Render is waking up (cold start). Please wait ~30 seconds and try again.'
                    )
                }
                throw err
            })
            clearTimeout(timeoutId)

            const result = await response.json().catch(() => null)

            if (result?.errors && result.errors.length > 0) {
                const errMsg = result.errors.map((e) => e.message).join(', ')
                throw new Error(errMsg || 'Invalid email or password.')
            }

            const authPayload = result?.data?.login
            if (!authPayload?.token) {
                throw new Error('Authentication failed: No access token received from server.')
            }

            // Inspect token & query /me for administrator role confirmation
            let role = authPayload.role
            let userName = trimmedEmail.split('@')[0]
            let userEmail = trimmedEmail
            let userId = 'admin'

            // Decode JWT payload
            try {
                const base64Url = authPayload.token.split('.')[1]
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
                const decoded = JSON.parse(atob(base64))
                if (decoded.role) role = decoded.role
                if (decoded.email) userEmail = decoded.email
                if (decoded.name) userName = decoded.name
                if (decoded.sub || decoded.id || decoded.userId) {
                    userId = decoded.sub || decoded.id || decoded.userId
                }
            } catch {
                // Ignore decoding error
            }

            // Fetch user profile from /me
            try {
                const meRes = await fetch(GRAPHQL_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${authPayload.token}`,
                    },
                    body: JSON.stringify({ query: ME_QUERY }),
                })
                const meResult = await meRes.json().catch(() => null)
                if (meResult?.data?.me) {
                    const me = meResult.data.me
                    if (me.role) role = me.role
                    if (me.email) userEmail = me.email
                    if (me.firstName || me.lastName) {
                        userName = [me.firstName, me.lastName].filter(Boolean).join(' ')
                    }
                    if (me.id) userId = me.id
                }
            } catch {
                // Non-critical, fallback to decoded values
            }

            // Verify admin privilege
            const isAdminRole = String(role).toUpperCase() === 'ADMIN'
            if (!isAdminRole) {
                throw new Error(
                    `Access restricted: Account "${trimmedEmail}" has role "${role || 'USER'}". Administrator permissions are required to access this portal.`
                )
            }

            // Save tokens & user profile
            const maxAge = rememberMe ? (authPayload.expiresIn || 2592000) : 86400
            localStorage.setItem('token', authPayload.token)
            document.cookie = `token=${encodeURIComponent(authPayload.token)}; path=/; max-age=${maxAge}; SameSite=Lax`

            if (authPayload.refreshToken) {
                localStorage.setItem('refreshToken', authPayload.refreshToken)
            }

            const adminUser = {
                id: userId,
                name: userName || 'Administrator',
                email: userEmail,
                role: 'ADMIN',
            }
            localStorage.setItem('user', JSON.stringify(adminUser))

            // Update Redux state
            dispatch(setAuth({ user: adminUser, token: authPayload.token }))

            toast.success(`Welcome back, ${adminUser.name}!`)
            setTimeout(() => {
                router.push('/')
            }, 500)
        } catch (err) {
            console.error('Admin Email Login Error:', err)
            const message = (err.name === 'TypeError' || err.message === 'Failed to fetch')
                ? 'Backend on Render is waking up (cold start). Please wait ~30 seconds and try again.'
                : err.message
            toast.error(message || 'Failed to authenticate with email')
        } finally {
            setLoading(false)
        }
    }

    // 2. Master Security Key Authentication Handler (Server-Verified)
    const handleKeyLogin = async (e) => {
        if (e) e.preventDefault()

        const trimmedKey = adminKey.trim()
        if (!trimmedKey) {
            toast.error('Please enter the Master Security Key')
            return
        }

        setLoading(true)
        try {
            // Verify key via secure server-side API endpoint
            const res = await fetch('/api/admin/auth/key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: trimmedKey }),
            })

            const data = await res.json()
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Invalid Master Security Key. Access denied.')
            }

            // Save authenticated session token
            localStorage.setItem('token', data.token)
            localStorage.setItem('user', JSON.stringify(data.user))
            document.cookie = `token=${encodeURIComponent(data.token)}; path=/; max-age=2592000; SameSite=Lax`

            // Dispatch Redux Auth
            dispatch(setAuth({ user: data.user, token: data.token }))

            toast.success('Admin authorization confirmed! Welcome to Admin Console.')
            setTimeout(() => {
                router.push('/')
            }, 400)
        } catch (err) {
            console.error('Admin Key Login Error:', err)
            toast.error(err.message || 'Failed to authenticate with Master Security Key')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50/70 via-slate-50 to-indigo-100/50 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-900 relative overflow-hidden">
            {/* Ambient Decorative Pastel Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-gradient-to-b from-indigo-200/40 via-purple-100/30 to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none" />

            {/* Subtle Grid Dot Overlay */}
            <div
                className="absolute inset-0 opacity-[0.4] pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(#6366f1 0.75px, transparent 0.75px)`,
                    backgroundSize: '24px 24px',
                }}
            />

            {/* Main Login Card */}
            <div className="w-full max-w-[480px] bg-white/95 backdrop-blur-xl border border-white/80 rounded-3xl p-7 sm:p-9 shadow-2xl shadow-indigo-200/50 relative z-10 transition-all">
                {/* Header Section */}
                <div className="text-center space-y-3 mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/25 ring-4 ring-indigo-50 mx-auto">
                        <ShieldCheck size={30} />
                    </div>

                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">
                            {backendStatus === 'online' && (
                                <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-0.5" />
                                    Backend Online
                                </>
                            )}
                            {backendStatus === 'waking' && (
                                <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping mr-0.5" />
                                    Render Server Waking Up
                                </>
                            )}
                            {backendStatus === 'checking' && (
                                <>
                                    <RefreshCw size={10} className="animate-spin text-indigo-500 mr-0.5" />
                                    Checking Connection...
                                </>
                            )}
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                            GoCart Control Center
                        </h1>
                        <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto">
                            Sign in to manage merchants, stores, categories, and marketplace operations.
                        </p>
                    </div>
                </div>

                {/* Authentication Method Switcher Tabs */}
                <div className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 mb-6 shadow-inner">
                    <button
                        type="button"
                        onClick={() => setAuthMode('email')}
                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            authMode === 'email'
                                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                        }`}
                    >
                        <Mail size={15} />
                        <span>Admin Email</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setAuthMode('key')}
                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            authMode === 'key'
                                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                        }`}
                    >
                        <Key size={15} />
                        <span>Master Key</span>
                    </button>
                </div>

                {/* TAB 1: Admin Email Login Form */}
                {authMode === 'email' && (
                    <form onSubmit={handleEmailLogin} className="space-y-4">
                        {/* Email Input */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                    <Mail size={14} className="text-indigo-600" />
                                    Administrator Email
                                </label>
                                <button
                                    type="button"
                                    onClick={handleQuickFillEmail}
                                    className="text-[11px] text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-2 py-0.5 rounded-md font-semibold inline-flex items-center gap-1 transition cursor-pointer"
                                >
                                    <Sparkles size={11} /> Quick Fill
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@gocart.local"
                                    className="w-full pl-3.5 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition text-sm text-slate-900 placeholder:text-slate-400 shadow-xs"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                    <Lock size={14} className="text-indigo-600" />
                                    Password
                                </label>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    className="w-full pl-3.5 pr-11 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition text-sm text-slate-900 placeholder:text-slate-400 shadow-xs"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                                >
                                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me Option */}
                        <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer font-medium">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="rounded border-slate-300 bg-white text-indigo-600 focus:ring-indigo-500/20 cursor-pointer"
                                />
                                Keep admin session active
                            </label>
                            <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                Requires ADMIN role
                            </span>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-semibold rounded-xl transition shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer mt-2"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="animate-spin" size={16} />
                                    Verifying Credentials...
                                </>
                            ) : (
                                <>
                                    <UserCheck size={16} />
                                    Sign In to Admin Console
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>

                        {/* Fallback Switcher Hint */}
                        <div className="pt-2 text-center">
                            <p className="text-xs text-slate-500">
                                Don't have an email login?{' '}
                                <button
                                    type="button"
                                    onClick={() => setAuthMode('key')}
                                    className="text-indigo-600 hover:text-indigo-700 font-semibold underline underline-offset-2 transition cursor-pointer"
                                >
                                    Use Master Security Key
                                </button>
                            </p>
                        </div>
                    </form>
                )}

                {/* TAB 2: Master Security Key Form */}
                {authMode === 'key' && (
                    <form onSubmit={handleKeyLogin} className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                    <Key size={14} className="text-indigo-600" />
                                    Master Security Key
                                </label>
                                <span className="text-[11px] font-mono text-slate-400">
                                    Restricted Root Key
                                </span>
                            </div>

                            <div className="relative">
                                <input
                                    type={showKey ? 'text' : 'password'}
                                    required
                                    value={adminKey}
                                    onChange={(e) => setAdminKey(e.target.value)}
                                    placeholder="Enter your master security key..."
                                    className="w-full pl-3.5 pr-11 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition font-mono text-xs text-slate-800 placeholder:text-slate-400 shadow-xs"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowKey(!showKey)}
                                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                                >
                                    {showKey ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>

                            <div className="mt-3 bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-600 flex items-start gap-2.5">
                                <Shield size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                                <span className="leading-relaxed">
                                    Master security key is verified securely on the server. Grants root administrative access for merchant approvals, category curation, and order moderation.
                                </span>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || !adminKey.trim()}
                            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-semibold rounded-xl transition shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer mt-2"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="animate-spin" size={16} />
                                    Verifying Security Key...
                                </>
                            ) : (
                                <>
                                    <Lock size={16} />
                                    Authenticate & Open Admin Console
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>

                        {/* Fallback Switcher Hint */}
                        <div className="pt-2 text-center">
                            <p className="text-xs text-slate-500">
                                Have an administrator account?{' '}
                                <button
                                    type="button"
                                    onClick={() => setAuthMode('email')}
                                    className="text-indigo-600 hover:text-indigo-700 font-semibold underline underline-offset-2 transition cursor-pointer"
                                >
                                    Sign in with Email
                                </button>
                            </p>
                        </div>
                    </form>
                )}

                {/* Footer links */}
                <div className="mt-7 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <a
                        href="http://localhost:3000"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 transition font-medium"
                    >
                        <ArrowLeft size={14} /> Back to Storefront
                    </a>
                    <div className="flex items-center gap-2">
                        {backendStatus === 'online' && (
                            <>
                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-slate-500 font-mono text-[11px]">Backend Online</span>
                            </>
                        )}
                        {backendStatus === 'waking' && (
                            <>
                                <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                                <span className="text-amber-600 font-mono text-[11px]">Backend Waking Up</span>
                            </>
                        )}
                        {backendStatus === 'checking' && (
                            <>
                                <span className="inline-block w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
                                <span className="text-slate-400 font-mono text-[11px]">Connecting...</span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

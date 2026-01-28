/**
 * Authenticated fetch utility
 * Automatically adds Authorization header with JWT token
 * Handles 401 errors by redirecting to login
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

interface AuthData {
    auth: {
        token: string
        user: {
            id: string
            email: string
        }
        expiresIn: string
    }
}

/**
 * Get auth token from localStorage
 */
function getAuthToken(): string | null {
    const authDataStr = localStorage.getItem('_auth')
    if (!authDataStr) return null

    try {
        const authData: AuthData = JSON.parse(authDataStr)
        return authData.auth?.token || null
    } catch {
        return null
    }
}

/**
 * Handle 401 Unauthorized - logout and redirect to login
 */
function handleUnauthorized() {
    localStorage.removeItem('_auth')
    window.location.href = '/login'
}

/**
 * Authenticated fetch wrapper
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = getAuthToken()

    if (!token) {
        handleUnauthorized()
        throw new Error('No auth token')
    }

    // Add Authorization header
    const headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    }

    // Make request
    const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
    })

    // Handle 401 Unauthorized
    if (response.status === 401) {
        handleUnauthorized()
        throw new Error('Unauthorized')
    }

    return response
}

/**
 * Convenience methods
 */
export const authAPI = {
    get: (url: string) => authFetch(url, {method: 'GET'}),

    post: (url: string, data?: any) =>
        authFetch(url, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        }),

    patch: (url: string, data?: any) =>
        authFetch(url, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        }),

    put: (url: string, data?: any) =>
        authFetch(url, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        }),

    delete: (url: string) => authFetch(url, {method: 'DELETE'}),
}

/**
 * Logout function
 */
export function logout() {
    localStorage.removeItem('_auth')
    window.location.href = '/login'
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
    return getAuthToken() !== null
}

/**
 * Save auth data and redirect (Login)
 */
export function login(token: string, user: any, expiresIn: string) {
    localStorage.setItem(
        '_auth',
        JSON.stringify({
            auth: {
                token,
                user,
                expiresIn,
            },
        })
    )
    window.location.href = '/'
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser() {
    const authDataStr = localStorage.getItem('_auth')
    if (!authDataStr) return null

    try {
        const authData: AuthData = JSON.parse(authDataStr)
        return authData.auth?.user || null
    } catch {
        return null
    }
}

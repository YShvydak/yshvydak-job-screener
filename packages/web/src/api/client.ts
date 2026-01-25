const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

/**
 * Generic API response handler
 */
async function handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json()

    if (!response.ok || !data.success) {
        throw new Error(data.error || 'Request failed')
    }

    return data.data
}

/**
 * Generic GET request
 */
export async function get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`)
    return handleResponse<T>(response)
}

/**
 * Generic POST request
 */
export async function post<T, B = unknown>(endpoint: string, body: B): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
    })
    return handleResponse<T>(response)
}

/**
 * Generic PUT request
 */
export async function put<T, B = unknown>(endpoint: string, body: B): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
    })
    return handleResponse<T>(response)
}

/**
 * Generic PATCH request
 */
export async function patch<T, B = unknown>(endpoint: string, body?: B): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        ...(body && {body: JSON.stringify(body)}),
    })
    return handleResponse<T>(response)
}

/**
 * Generic DELETE request
 */
export async function del<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'DELETE',
    })
    return handleResponse<T>(response)
}

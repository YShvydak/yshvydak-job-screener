import {authFetch} from '../utils/authFetch'

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
    const response = await authFetch(endpoint, {method: 'GET'})
    return handleResponse<T>(response)
}

/**
 * Generic POST request
 */
export async function post<T, B = unknown>(endpoint: string, body: B): Promise<T> {
    const response = await authFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
    })
    return handleResponse<T>(response)
}

/**
 * Generic PUT request
 */
export async function put<T, B = unknown>(endpoint: string, body: B): Promise<T> {
    const response = await authFetch(endpoint, {
        method: 'PUT',
        body: JSON.stringify(body),
    })
    return handleResponse<T>(response)
}

/**
 * Generic PATCH request
 */
export async function patch<T, B = unknown>(endpoint: string, body?: B): Promise<T> {
    const response = await authFetch(endpoint, {
        method: 'PATCH',
        ...(body && {body: JSON.stringify(body)}),
    })
    return handleResponse<T>(response)
}

/**
 * Generic DELETE request
 */
export async function del<T>(endpoint: string): Promise<T> {
    const response = await authFetch(endpoint, {
        method: 'DELETE',
    })
    return handleResponse<T>(response)
}

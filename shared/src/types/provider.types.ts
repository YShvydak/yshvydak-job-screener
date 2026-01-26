/**
 * Job Search Provider Types
 */

/**
 * Supported job search providers
 */
export type JobProvider = 'serpapi' | 'glassdoor'

/**
 * Provider availability status (for API response)
 */
export interface ProviderStatus {
    name: JobProvider
    displayName: string
    available: boolean
    configured: boolean
}

/**
 * Common search parameters for all providers
 */
export interface ProviderSearchParams {
    keywords: string
    location?: string
    date_posted?: string
    radius?: number // in km
}

/**
 * Test connection result
 */
export interface ProviderTestResult {
    ok: boolean
    error?: string
    responseTime?: number
}

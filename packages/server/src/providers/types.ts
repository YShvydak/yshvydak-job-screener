import {JobProvider, ProviderSearchParams, ProviderTestResult} from '@yshvydak-job-screener/shared'

/**
 * Common job result from any provider
 * This is the normalized format that all providers map their responses to
 */
export interface ProviderJobResult {
    provider_job_id: string
    title: string
    company?: string
    location?: string
    description?: string
    apply_link?: string
    posted_date?: string
    source?: string
}

/**
 * Provider search result
 */
export interface ProviderSearchResult {
    jobs: ProviderJobResult[]
    provider: JobProvider
    totalCount?: number
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
    apiKey: string
    baseUrl?: string
    timeout?: number
}

/**
 * Job Search Provider Interface
 * All providers must implement this interface
 */
export interface IJobSearchProvider {
    /**
     * Provider identifier
     */
    readonly name: JobProvider

    /**
     * Human-readable display name
     */
    readonly displayName: string

    /**
     * Check if provider is configured (has API key)
     */
    isAvailable(): boolean

    /**
     * Test provider connection with minimal API call
     */
    testConnection(): Promise<ProviderTestResult>

    /**
     * Execute job search
     */
    search(params: ProviderSearchParams): Promise<ProviderSearchResult>

    /**
     * Get list of supported search fields
     */
    getSupportedFields(): string[]
}

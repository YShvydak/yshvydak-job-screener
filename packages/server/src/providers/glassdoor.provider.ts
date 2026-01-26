import {ProviderSearchParams, ProviderTestResult} from '@yshvydak-job-screener/shared'
import {IJobSearchProvider, ProviderConfig, ProviderJobResult, ProviderSearchResult} from './types'
import {Logger} from '../utils/Logger'

/**
 * Glassdoor API response types (OpenWeb Ninja)
 */
interface GlassdoorJobResult {
    job_id: number
    job_title: string
    company_id?: number
    company_name?: string
    company_logo?: string
    location_name?: string
    location_id?: number
    location_type?: string
    job_link?: string
    easy_apply?: boolean
    age_in_days?: number
    is_sponsored?: boolean
    is_sponsored_employer?: boolean
    rating?: number
    salary_currency?: string
    salary_period?: string
    salary_source?: string
}

interface GlassdoorResponse {
    status: string
    request_id?: string
    parameters?: Record<string, unknown>
    data?: {
        total_count?: number
        jobs?: GlassdoorJobResult[]
        cursor?: string
    }
    message?: string
}

/**
 * Glassdoor Job Search Provider
 * Uses OpenWeb Ninja Real-Time Glassdoor Data API
 */
export class GlassdoorProvider implements IJobSearchProvider {
    readonly name = 'glassdoor' as const
    readonly displayName = 'Glassdoor'

    private readonly baseUrl = 'https://api.openwebninja.com/realtime-glassdoor-data'
    private static readonly DEFAULT_RESULTS_LIMIT = 50

    constructor(private providerConfig: ProviderConfig) {}

    isAvailable(): boolean {
        return !!this.providerConfig.apiKey
    }

    async testConnection(): Promise<ProviderTestResult> {
        if (!this.isAvailable()) {
            return {ok: false, error: 'GLASSDOOR_KEY not configured'}
        }

        const startTime = Date.now()
        try {
            // Minimal search to verify API key works (Glassdoor requires location)
            const response = await this.fetchJobs({query: 'test', location: 'New York', limit: '1'})
            const responseTime = Date.now() - startTime

            if (response.status !== 'OK') {
                return {ok: false, error: response.message || 'API error', responseTime}
            }

            return {ok: true, responseTime}
        } catch (error) {
            const responseTime = Date.now() - startTime
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            return {ok: false, error: errorMessage, responseTime}
        }
    }

    async search(params: ProviderSearchParams): Promise<ProviderSearchResult> {
        if (!this.isAvailable()) {
            throw new Error('GLASSDOOR_KEY is not configured')
        }

        Logger.info('Glassdoor search', {keywords: params.keywords, location: params.location})

        const queryParams = this.buildSearchParams(params)
        const response = await this.fetchJobs(queryParams)

        if (response.status !== 'OK') {
            throw new Error(`Glassdoor API error: ${response.message || 'Unknown error'}`)
        }

        const jobs = response.data?.jobs || []
        const normalizedJobs = jobs.map((job) => this.normalizeJob(job))

        Logger.info(
            `Glassdoor: Found ${normalizedJobs.length} jobs (total: ${response.data?.total_count})`
        )

        return {
            jobs: normalizedJobs,
            provider: 'glassdoor',
            totalCount: response.data?.total_count,
        }
    }

    getSupportedFields(): string[] {
        // Glassdoor supports keywords and location, but not radius or specific date filters
        return ['keywords', 'location']
    }

    /**
     * Build Glassdoor API search parameters
     */
    private buildSearchParams(params: ProviderSearchParams): Record<string, string> {
        const queryParams: Record<string, string> = {
            query: params.keywords,
            limit: String(GlassdoorProvider.DEFAULT_RESULTS_LIMIT),
        }

        if (params.location && params.location.trim()) {
            queryParams.location = params.location
        }

        // Note: Glassdoor API doesn't support date_posted or radius filters directly
        // We could potentially filter results client-side using age_in_days

        return queryParams
    }

    /**
     * Fetch jobs from Glassdoor API
     */
    private async fetchJobs(params: Record<string, string>): Promise<GlassdoorResponse> {
        const url = new URL(`${this.baseUrl}/job-search`)
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value)
        })

        try {
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'x-api-key': this.providerConfig.apiKey,
                    Accept: 'application/json',
                },
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`Glassdoor API returned ${response.status}: ${errorText}`)
            }

            return (await response.json()) as GlassdoorResponse
        } catch (error) {
            Logger.error('Glassdoor fetch failed', error)
            throw error
        }
    }

    /**
     * Normalize Glassdoor job to common format
     */
    private normalizeJob(job: GlassdoorJobResult): ProviderJobResult {
        // Convert age_in_days to posted_date string
        const postedDate =
            job.age_in_days !== undefined ? this.formatPostedDate(job.age_in_days) : undefined

        return {
            provider_job_id: String(job.job_id),
            title: job.job_title,
            company: job.company_name,
            location: job.location_name,
            description: undefined, // Glassdoor list API doesn't include description
            apply_link: job.job_link,
            posted_date: postedDate,
            source: 'Glassdoor',
        }
    }

    /**
     * Format age_in_days to human-readable posted date
     */
    private formatPostedDate(ageInDays: number): string {
        if (ageInDays === 0) return 'Today'
        if (ageInDays === 1) return '1 day ago'
        if (ageInDays < 7) return `${ageInDays} days ago`
        if (ageInDays < 14) return '1 week ago'
        if (ageInDays < 30) return `${Math.floor(ageInDays / 7)} weeks ago`
        if (ageInDays < 60) return '1 month ago'
        return `${Math.floor(ageInDays / 30)} months ago`
    }
}

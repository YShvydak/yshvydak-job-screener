import {getJson, config} from 'serpapi'
import {ProviderSearchParams, ProviderTestResult} from '@yshvydak-job-screener/shared'
import {IJobSearchProvider, ProviderConfig, ProviderJobResult, ProviderSearchResult} from './types'
import {Logger} from '../utils/Logger'

/**
 * SerpAPI Google Jobs response types
 */
interface SerpAPIJobResult {
    job_id: string
    title: string
    company_name?: string
    location?: string
    description?: string
    snippet?: string
    share_link?: string
    detected_extensions?: {
        posted_at?: string
        schedule_type?: string
    }
    apply_options?: Array<{
        title: string
        link: string
    }>
    via?: string
    extensions?: string[]
}

interface SerpAPIResponse {
    jobs_results?: SerpAPIJobResult[]
    error?: string
}

/**
 * SerpAPI Job Search Provider
 * Uses Google Jobs engine via SerpAPI
 */
export class SerpAPIProvider implements IJobSearchProvider {
    readonly name = 'serpapi' as const
    readonly displayName = 'Google Jobs (SerpAPI)'

    private static readonly TEST_QUERY_LIMIT = 1

    constructor(private providerConfig: ProviderConfig) {
        if (providerConfig.apiKey) {
            config.api_key = providerConfig.apiKey
        }
    }

    isAvailable(): boolean {
        return !!this.providerConfig.apiKey
    }

    async testConnection(): Promise<ProviderTestResult> {
        if (!this.isAvailable()) {
            return {ok: false, error: 'SERPAPI_KEY not configured'}
        }

        const startTime = Date.now()
        try {
            // Minimal search to verify API key works
            const response = await getJson({
                engine: 'google_jobs',
                q: 'test',
                hl: 'en',
                num: SerpAPIProvider.TEST_QUERY_LIMIT,
            })

            const responseTime = Date.now() - startTime

            // Check for error in response
            if (response.error) {
                return {ok: false, error: response.error, responseTime}
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
            throw new Error('SERPAPI_KEY is not configured')
        }

        Logger.info('SerpAPI search', {keywords: params.keywords, location: params.location})

        const serpApiParams = this.buildSearchParams(params)
        const response = await this.fetchJobs(serpApiParams)

        // Handle "no results" as valid response
        if (response.error) {
            const isNoResults = response.error.toLowerCase().includes("hasn't returned any results")
            if (isNoResults) {
                Logger.info('SerpAPI: No jobs found for this query')
                return {jobs: [], provider: 'serpapi', totalCount: 0}
            }
            throw new Error(`SerpAPI error: ${response.error}`)
        }

        const jobs = response.jobs_results || []
        const normalizedJobs = jobs.map((job) => this.normalizeJob(job))

        Logger.info(`SerpAPI: Found ${normalizedJobs.length} jobs`)

        return {
            jobs: normalizedJobs,
            provider: 'serpapi',
            totalCount: normalizedJobs.length,
        }
    }

    getSupportedFields(): string[] {
        return ['keywords', 'location', 'date_posted', 'radius']
    }

    /**
     * Build SerpAPI search parameters
     */
    private buildSearchParams(params: ProviderSearchParams): Record<string, string> {
        const serpParams: Record<string, string> = {
            engine: 'google_jobs',
            q: params.keywords,
            hl: 'en',
        }

        // Add location only if provided (optional for global search)
        if (params.location && params.location.trim()) {
            serpParams.location = params.location

            // Add radius filter only when location is specified (SerpAPI uses miles)
            if (params.radius) {
                const radiusMiles = Math.round(params.radius * 0.621371)
                serpParams.lrad = String(radiusMiles)
            }
        }

        // Add date filter using chips parameter
        if (params.date_posted) {
            serpParams.chips = `date_posted:${params.date_posted}`
        }

        return serpParams
    }

    /**
     * Fetch jobs from SerpAPI
     */
    private async fetchJobs(params: Record<string, string>): Promise<SerpAPIResponse> {
        try {
            const response = await getJson(params)
            return response as SerpAPIResponse
        } catch (error) {
            Logger.error('SerpAPI fetch failed', error)
            throw error
        }
    }

    /**
     * Normalize SerpAPI job to common format
     */
    private normalizeJob(job: SerpAPIJobResult): ProviderJobResult {
        // Resolve job ID with fallback chain
        const providerId =
            job.job_id?.trim() ||
            job.share_link?.trim() ||
            job.apply_options?.[0]?.link?.trim() ||
            `fallback:${[
                job.title,
                job.company_name,
                job.location,
                job.detected_extensions?.posted_at,
            ]
                .filter(Boolean)
                .join('|')}`

        return {
            provider_job_id: providerId,
            title: job.title,
            company: job.company_name,
            location: job.location,
            description: job.description || job.snippet,
            apply_link: job.apply_options?.[0]?.link || job.share_link,
            posted_date: job.detected_extensions?.posted_at,
            source: job.via,
        }
    }
}

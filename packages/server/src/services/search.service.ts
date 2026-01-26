import {
    SearchProfile,
    JobInput,
    SearchResult,
    JobProvider,
    ProviderStatus,
    ProviderTestResult,
} from '@yshvydak-job-screener/shared'
import {JobRepository} from '../repositories/job.repository'
import {ProfileRepository} from '../repositories/profile.repository'
import {ProviderRegistry, ProviderJobResult, IJobSearchProvider} from '../providers'
import {Logger} from '../utils/Logger'

/**
 * Extended search result with provider info
 */
export interface ExtendedSearchResult extends SearchResult {
    provider: JobProvider
}

/**
 * Service for job search across multiple providers
 */
export class SearchService {
    constructor(
        private jobRepository: JobRepository,
        private profileRepository: ProfileRepository,
        private providerRegistry: ProviderRegistry
    ) {}

    /**
     * Execute a job search using a profile
     * @param profileId - Profile to use for search parameters
     * @param providerOverride - Optional provider to use instead of profile preference
     */
    async executeSearch(
        profileId: string,
        providerOverride?: JobProvider
    ): Promise<ExtendedSearchResult> {
        // Get the search profile
        const profile = this.profileRepository.findById(profileId)
        if (!profile) {
            throw new Error(`Profile not found: ${profileId}`)
        }

        // Select provider
        const provider = this.selectProvider(profile, providerOverride)

        Logger.info('Starting job search', {
            profileId,
            provider: provider.name,
            keywords: profile.keywords,
            location: profile.location,
        })

        // Build common search params from profile
        const params = {
            keywords: profile.keywords,
            location: profile.location || undefined,
            date_posted: profile.date_posted || undefined,
            radius: profile.radius || undefined,
        }

        // Execute search via provider
        const result = await provider.search(params)

        Logger.info(`Fetched ${result.jobs.length} jobs from ${provider.name}`)

        // Save jobs (preventing duplicates)
        const {saved, duplicates} = await this.saveJobs(result.jobs, profileId, provider.name)

        Logger.success('Search completed', {
            profileId,
            provider: provider.name,
            total: result.jobs.length,
            saved,
            duplicates,
        })

        return {
            jobsFound: result.jobs.length,
            newJobs: saved,
            analyzed: false,
            provider: provider.name,
        }
    }

    /**
     * Get available providers
     */
    getAvailableProviders(): ProviderStatus[] {
        return this.providerRegistry.getStatus()
    }

    /**
     * Test a specific provider connection
     */
    async testProvider(providerName: JobProvider): Promise<ProviderTestResult> {
        const provider = this.providerRegistry.get(providerName)
        if (!provider) {
            return {ok: false, error: `Provider '${providerName}' not found`}
        }
        if (!provider.isAvailable()) {
            return {ok: false, error: `Provider '${providerName}' is not configured`}
        }
        return provider.testConnection()
    }

    /**
     * Select provider based on profile preference and override
     */
    private selectProvider(profile: SearchProfile, override?: JobProvider): IJobSearchProvider {
        // Priority: 1. Override param, 2. Profile preference, 3. First available
        const providerName = override || profile.preferred_provider

        if (providerName) {
            const provider = this.providerRegistry.get(providerName)
            if (provider?.isAvailable()) {
                return provider
            }
            Logger.warn(`Requested provider '${providerName}' not available, using fallback`)
        }

        // Fall back to first available
        const available = this.providerRegistry.getFirstAvailable()
        if (!available) {
            throw new Error(
                'No job search providers available. Configure at least one provider API key.'
            )
        }

        return available
    }

    /**
     * Save jobs to database (preventing duplicates)
     * Uses provider + provider_job_id for deduplication
     */
    private async saveJobs(
        jobs: ProviderJobResult[],
        profileId: string,
        provider: JobProvider
    ): Promise<{saved: number; duplicates: number}> {
        let saved = 0
        let duplicates = 0

        for (const job of jobs) {
            // Check for existing job by provider and job ID
            const existing = this.jobRepository.findByProviderJobId(provider, job.provider_job_id)

            if (existing) {
                duplicates++
                Logger.debug('Skipping duplicate job', {
                    provider,
                    provider_job_id: job.provider_job_id,
                })
                continue
            }

            const jobInput: JobInput = {
                profile_id: profileId,
                provider: provider,
                provider_job_id: job.provider_job_id,
                // Keep serpapi_job_id for backward compatibility during migration
                serpapi_job_id: provider === 'serpapi' ? job.provider_job_id : undefined,
                title: job.title,
                company: job.company,
                location: job.location,
                description: job.description,
                apply_link: job.apply_link,
                posted_date: job.posted_date,
                source: job.source,
            }

            this.jobRepository.create(jobInput)
            saved++
        }

        return {saved, duplicates}
    }
}

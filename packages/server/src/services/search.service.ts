import { getJson, config } from 'serpapi';
import { SearchProfile, JobInput, SearchResult } from '@yshvydak-job-screener/shared';
import { JobRepository } from '../repositories/job.repository';
import { ProfileRepository } from '../repositories/profile.repository';
import { Logger } from '../utils/Logger';
import { env } from '../config/environment.config';

/**
 * SerpAPI Google Jobs response types
 */
interface SerpAPIJobResult {
    job_id: string;
    title: string;
    company_name?: string;
    location?: string;
    description?: string;
    detected_extensions?: {
        posted_at?: string;
        schedule_type?: string;
    };
    apply_options?: Array<{
        title: string;
        link: string;
    }>;
    via?: string;
}

interface SerpAPIResponse {
    jobs_results?: SerpAPIJobResult[];
    error?: string;
}

/**
 * Service for SerpAPI job search integration
 */
export class SearchService {
    constructor(
        private jobRepository: JobRepository,
        private profileRepository: ProfileRepository
    ) {
        // Configure SerpAPI with API key
        if (env.SERPAPI_KEY) {
            config.api_key = env.SERPAPI_KEY;
        }
    }

    /**
     * Execute a job search using a profile
     */
    async executeSearch(profileId: string): Promise<SearchResult> {
        // Get the search profile
        const profile = this.profileRepository.findById(profileId);
        if (!profile) {
            throw new Error(`Profile not found: ${profileId}`);
        }

        if (!env.SERPAPI_KEY) {
            throw new Error('SERPAPI_KEY is not configured');
        }

        Logger.info('Starting job search', {
            profileId,
            keywords: profile.keywords,
            location: profile.location
        });

        // Build SerpAPI parameters
        const params = this.buildSearchParams(profile);

        Logger.info('SerpAPI request params', params);

        // Fetch jobs from SerpAPI
        const response = await this.fetchJobs(params);

        // Handle "no results" as valid response, not error
        if (response.error) {
            const isNoResults = response.error.toLowerCase().includes("hasn't returned any results");
            if (isNoResults) {
                Logger.info('No jobs found for this query');
                return {
                    jobsFound: 0,
                    newJobs: 0,
                    analyzed: false
                };
            }
            throw new Error(`SerpAPI error: ${response.error}`);
        }

        const jobs = response.jobs_results || [];
        Logger.info(`Fetched ${jobs.length} jobs from SerpAPI`);

        // Save jobs (preventing duplicates)
        const { saved, duplicates } = await this.saveJobs(jobs, profileId);

        Logger.success('Search completed', {
            profileId,
            total: jobs.length,
            saved,
            duplicates
        });

        return {
            jobsFound: jobs.length,
            newJobs: saved,
            analyzed: false // AI analysis is separate
        };
    }

    /**
     * Build SerpAPI search parameters from profile
     */
    private buildSearchParams(profile: SearchProfile): Record<string, string> {
        const params: Record<string, string> = {
            engine: 'google_jobs',
            q: profile.keywords,
            hl: 'en' // English results
        };

        // Add location only if provided (optional for global search)
        if (profile.location && profile.location.trim()) {
            params.location = profile.location;

            // Add radius filter only when location is specified (SerpAPI uses miles)
            if (profile.radius) {
                // Convert km to miles (approximate)
                const radiusMiles = Math.round(profile.radius * 0.621371);
                params.lrad = String(radiusMiles);
            }
        }

        // Add date filter using chips parameter
        if (profile.date_posted) {
            params.chips = `date_posted:${profile.date_posted}`;
        }

        return params;
    }

    /**
     * Fetch jobs from SerpAPI
     */
    private async fetchJobs(params: Record<string, string>): Promise<SerpAPIResponse> {
        try {
            const response = await getJson(params);
            return response as SerpAPIResponse;
        } catch (error) {
            Logger.error('SerpAPI fetch failed', error);
            throw error;
        }
    }

    /**
     * Save jobs to database (preventing duplicates)
     * ⚠️ CRITICAL: Uses findBySerpAPIId() before create() to prevent duplicates
     */
    private async saveJobs(
        jobs: SerpAPIJobResult[],
        profileId: string
    ): Promise<{ saved: number; duplicates: number }> {
        let saved = 0;
        let duplicates = 0;

        for (const job of jobs) {
            // ⚠️ CRITICAL: Check for existing job by SerpAPI ID
            const existing = this.jobRepository.findBySerpAPIId(job.job_id);

            if (existing) {
                duplicates++;
                Logger.debug('Skipping duplicate job', { serpapi_job_id: job.job_id });
                continue;
            }

            // Get the first apply link if available
            const applyLink = job.apply_options?.[0]?.link;

            const jobInput: JobInput = {
                profile_id: profileId,
                serpapi_job_id: job.job_id,
                title: job.title,
                company: job.company_name,
                location: job.location,
                description: job.description,
                apply_link: applyLink,
                posted_date: job.detected_extensions?.posted_at,
                source: job.via
            };

            this.jobRepository.create(jobInput);
            saved++;
        }

        return { saved, duplicates };
    }
}

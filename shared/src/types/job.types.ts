import {JobProvider} from './provider.types'

/**
 * Job Status Enum
 */
export type JobStatus = 'new' | 'applied' | 'saved' | 'rejected'

/**
 * AI Analysis Method
 * - 'api': Use Google Gemini API (cloud)
 * - 'local': Use local Gemini CLI
 */
export type AIAnalysisMethod = 'api' | 'local'

/**
 * Job entity from database
 */
export interface Job {
    id: string
    user_id: string
    profile_id: string
    provider: JobProvider
    provider_job_id: string
    /** @deprecated Use provider_job_id instead */
    serpapi_job_id?: string
    title: string
    company: string | null
    location: string | null
    description: string | null
    apply_link: string | null
    posted_date: string | null
    source: string | null
    status: JobStatus
    fetched_at: string
    created_at: string
    updated_at: string
}

/**
 * Job with AI analysis (joined data)
 */
export interface JobWithAnalysis extends Job {
    analysis?: AIAnalysis
}

/**
 * Input for creating a job
 */
export interface JobInput {
    profile_id: string
    provider: JobProvider
    provider_job_id: string
    /** @deprecated Use provider_job_id instead */
    serpapi_job_id?: string
    title: string
    company?: string
    location?: string
    description?: string
    apply_link?: string
    posted_date?: string
    source?: string
}

/**
 * Filters for job queries
 */
export interface JobFilters {
    status?: JobStatus
    minScore?: number
    profileId?: string
    hasAnalysis?: boolean // Filter by AI analysis presence
}

/**
 * AI Analysis entity from database
 */
export interface AIAnalysis {
    id: string
    job_id: string
    match_score: number // 0-100
    recommendation: 'APPLY' | 'MAYBE' | 'SKIP'
    strengths: string // JSON array as string
    gaps: string // JSON array as string
    reasoning: string
    analyzed_at: string
}

/**
 * Parsed AI Analysis (with arrays)
 */
export interface AIAnalysisParsed extends Omit<AIAnalysis, 'strengths' | 'gaps'> {
    strengths: string[]
    gaps: string[]
}

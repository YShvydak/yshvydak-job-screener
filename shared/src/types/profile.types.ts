import {JobProvider} from './provider.types'

/**
 * Date Posted Filter Values (SerpAPI supported)
 */
export type DatePosted = 'today' | '3days' | 'week' | 'month'

/**
 * Search Profile entity from database
 */
export interface SearchProfile {
    id: string
    name: string
    keywords: string
    location: string
    date_posted: DatePosted | null
    radius: number | null // in kilometers
    preferred_provider: JobProvider | null // optional preferred provider
    active: number // 0 or 1 (SQLite boolean)
    created_at: string
    updated_at: string
}

/**
 * Input for creating/updating a search profile
 */
export interface SearchProfileInput {
    name: string
    keywords: string
    location: string
    date_posted: DatePosted
    radius?: number
    preferred_provider?: JobProvider
}

/**
 * Search execution request
 */
export interface SearchRequest {
    profileId: string
    provider?: JobProvider // optional provider override
    analyzeWithAI?: boolean
}

/**
 * Search execution result
 */
export interface SearchResult {
    jobsFound: number // Total from provider
    newJobs: number // Actually saved (not duplicates)
    analyzed: boolean // Whether AI analysis was run
    provider?: JobProvider // Provider used for search
}

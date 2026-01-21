/**
 * Date Posted Filter Values (SerpAPI supported)
 */
export type DatePosted = 'today' | '3days' | 'week' | 'month';

/**
 * Search Profile entity from database
 */
export interface SearchProfile {
    id: string;
    name: string;
    keywords: string;
    location: string;
    date_posted: DatePosted | null;
    radius: number | null; // in kilometers
    active: number; // 0 or 1 (SQLite boolean)
    created_at: string;
    updated_at: string;
}

/**
 * Input for creating/updating a search profile
 */
export interface SearchProfileInput {
    name: string;
    keywords: string;
    location: string;
    date_posted?: DatePosted;
    radius?: number;
}

/**
 * Search execution request
 */
export interface SearchRequest {
    profileId: string;
    analyzeWithAI?: boolean;
}

/**
 * Search execution result
 */
export interface SearchResult {
    jobsFound: number; // Total from SerpAPI
    newJobs: number; // Actually saved (not duplicates)
    analyzed: boolean; // Whether AI analysis was run
}

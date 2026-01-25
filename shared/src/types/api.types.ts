/**
 * Standard API Success Response
 */
export interface APISuccessResponse<T = any> {
    success: true
    data: T
}

/**
 * Standard API Error Response
 */
export interface APIErrorResponse {
    success: false
    error: string
    code?: string
}

/**
 * API Response Union
 */
export type APIResponse<T = any> = APISuccessResponse<T> | APIErrorResponse

/**
 * Dashboard Statistics
 */
export interface DashboardStats {
    total_jobs: number
    new_jobs: number
    applied_jobs: number
    saved_jobs: number
    rejected_jobs: number
    high_match_jobs: number // Match score > 80
    avg_match_score: number
}

/**
 * Settings Response
 */
export interface SettingsResponse {
    cv_uploaded: boolean
    cv_size?: number
    last_updated?: string
}

/**
 * CV Upload Response
 */
export interface CVUploadResponse {
    uploaded: boolean
    size: number
    format: string
}

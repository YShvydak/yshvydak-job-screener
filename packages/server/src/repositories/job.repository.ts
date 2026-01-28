import {Database} from 'better-sqlite3'
import {v4 as uuidv4} from 'uuid'
import {
    Job,
    JobInput,
    JobFilters,
    JobStatus,
    JobWithAnalysis,
    JobProvider,
} from '@yshvydak-job-screener/shared'

/**
 * Repository for jobs table operations
 * ⚠️ CRITICAL: Always use findByProviderJobId() before create() to prevent duplicates
 */
export class JobRepository {
    constructor(private db: Database) {}

    /**
     * Find all jobs with optional filters
     * @param userId - Filter jobs by user ID (required for multi-user support)
     */
    findAll(userId: string, filters?: JobFilters): Job[] {
        let sql = 'SELECT * FROM jobs'
        const conditions: string[] = ['user_id = ?']
        const params: (string | number)[] = [userId]

        if (filters?.status) {
            conditions.push('status = ?')
            params.push(filters.status)
        }

        if (filters?.profileId) {
            conditions.push('profile_id = ?')
            params.push(filters.profileId)
        }

        sql += ' WHERE ' + conditions.join(' AND ')
        sql += ' ORDER BY fetched_at DESC'

        const stmt = this.db.prepare(sql)
        return stmt.all(...params) as Job[]
    }

    /**
     * Find jobs with AI analysis joined
     * @param userId - Filter jobs by user ID (required for multi-user support)
     */
    findAllWithAnalysis(userId: string, filters?: JobFilters): JobWithAnalysis[] {
        let sql = `
            SELECT
                j.*,
                a.id as analysis_id,
                a.match_score,
                a.recommendation,
                a.strengths,
                a.gaps,
                a.reasoning,
                a.analyzed_at
            FROM jobs j
            LEFT JOIN ai_analyses a ON j.id = a.job_id
        `
        const conditions: string[] = ['j.user_id = ?']
        const params: (string | number)[] = [userId]

        if (filters?.status) {
            conditions.push('j.status = ?')
            params.push(filters.status)
        }

        if (filters?.profileId) {
            conditions.push('j.profile_id = ?')
            params.push(filters.profileId)
        }

        if (filters?.minScore !== undefined) {
            conditions.push('a.match_score >= ?')
            params.push(filters.minScore)
        }

        if (filters?.hasAnalysis !== undefined) {
            if (filters.hasAnalysis) {
                conditions.push('a.id IS NOT NULL')
            } else {
                conditions.push('a.id IS NULL')
            }
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ')
        }

        sql += ' ORDER BY j.fetched_at DESC'

        const stmt = this.db.prepare(sql)
        const rows = stmt.all(...params) as any[]

        return rows.map((row) => this.mapRowToJobWithAnalysis(row))
    }

    /**
     * Find job by ID
     * @param id - Job ID
     * @param userId - User ID (optional, for security check)
     */
    findById(id: string, userId?: string): Job | null {
        let sql = 'SELECT * FROM jobs WHERE id = ?'
        const params: string[] = [id]

        if (userId) {
            sql += ' AND user_id = ?'
            params.push(userId)
        }

        const stmt = this.db.prepare(sql)
        return (stmt.get(...params) as Job) || null
    }

    /**
     * Find job by provider and provider job ID for a specific user
     * ⚠️ CRITICAL: Use this to check for duplicates before creating a job
     * @param provider - Job provider (serpapi, glassdoor, etc.)
     * @param providerJobId - External job ID from provider
     * @param userId - User ID to check duplicates for
     */
    findByProviderJobId(provider: JobProvider, providerJobId: string, userId: string): Job | null {
        const stmt = this.db.prepare(
            'SELECT * FROM jobs WHERE provider = ? AND provider_job_id = ? AND user_id = ?'
        )
        return (stmt.get(provider, providerJobId, userId) as Job) || null
    }

    /**
     * Find job by SerpAPI job ID
     * @deprecated Use findByProviderJobId() instead
     */
    findBySerpAPIId(serpApiJobId: string, userId: string): Job | null {
        return this.findByProviderJobId('serpapi', serpApiJobId, userId)
    }

    /**
     * Create a new job
     * ⚠️ IMPORTANT: Check findByProviderJobId() first to prevent duplicates!
     * @param input - Job input data
     * @param userId - User ID who owns this job
     */
    create(input: JobInput, userId: string): Job {
        const id = uuidv4()
        const now = new Date().toISOString()

        const stmt = this.db.prepare(`
            INSERT INTO jobs (
                id, user_id, profile_id, provider, provider_job_id, serpapi_job_id,
                title, company, location, description, apply_link,
                posted_date, source, status, fetched_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?)
        `)

        stmt.run(
            id,
            userId,
            input.profile_id,
            input.provider,
            input.provider_job_id,
            input.serpapi_job_id || null, // deprecated, keep for backward compatibility
            input.title,
            input.company || null,
            input.location || null,
            input.description || null,
            input.apply_link || null,
            input.posted_date || null,
            input.source || null,
            now,
            now,
            now
        )

        return this.findById(id)!
    }

    /**
     * Update job status
     */
    updateStatus(id: string, status: JobStatus): Job | null {
        const existing = this.findById(id)
        if (!existing) return null

        const now = new Date().toISOString()

        const stmt = this.db.prepare(`
            UPDATE jobs
            SET status = ?, updated_at = ?
            WHERE id = ?
        `)

        stmt.run(status, now, id)
        return this.findById(id)
    }

    /**
     * Update job description
     */
    updateDescription(id: string, description: string): Job | null {
        const existing = this.findById(id)
        if (!existing) return null

        const now = new Date().toISOString()

        const stmt = this.db.prepare(`
            UPDATE jobs
            SET description = ?, updated_at = ?
            WHERE id = ?
        `)

        stmt.run(description, now, id)
        return this.findById(id)
    }

    /**
     * Delete a job
     */
    delete(id: string): boolean {
        const stmt = this.db.prepare('DELETE FROM jobs WHERE id = ?')
        const result = stmt.run(id)
        return result.changes > 0
    }

    /**
     * Delete all jobs for a user
     * @param userId - User ID
     */
    deleteAll(userId: string): number {
        const stmt = this.db.prepare('DELETE FROM jobs WHERE user_id = ?')
        const result = stmt.run(userId)
        return result.changes
    }

    /**
     * Count jobs by status for a user
     * @param userId - User ID
     */
    countByStatus(userId: string): Record<JobStatus | 'total', number> {
        const stmt = this.db.prepare(`
            SELECT status, COUNT(*) as count FROM jobs WHERE user_id = ? GROUP BY status
        `)
        const rows = stmt.all(userId) as {status: JobStatus; count: number}[]

        const result: Record<JobStatus | 'total', number> = {
            new: 0,
            applied: 0,
            saved: 0,
            rejected: 0,
            total: 0,
        }

        rows.forEach((row) => {
            result[row.status] = row.count
            result.total += row.count
        })

        return result
    }

    /**
     * Map database row to JobWithAnalysis
     */
    private mapRowToJobWithAnalysis(row: any): JobWithAnalysis {
        const job: JobWithAnalysis = {
            id: row.id,
            user_id: row.user_id,
            profile_id: row.profile_id,
            provider: row.provider || 'serpapi', // default for old data
            provider_job_id: row.provider_job_id || row.serpapi_job_id,
            serpapi_job_id: row.serpapi_job_id,
            title: row.title,
            company: row.company,
            location: row.location,
            description: row.description,
            apply_link: row.apply_link,
            posted_date: row.posted_date,
            source: row.source,
            status: row.status,
            fetched_at: row.fetched_at,
            created_at: row.created_at,
            updated_at: row.updated_at,
        }

        if (row.analysis_id) {
            job.analysis = {
                id: row.analysis_id,
                job_id: row.id,
                match_score: row.match_score,
                recommendation: row.recommendation,
                strengths: row.strengths,
                gaps: row.gaps,
                reasoning: row.reasoning,
                analyzed_at: row.analyzed_at,
            }
        }

        return job
    }
}

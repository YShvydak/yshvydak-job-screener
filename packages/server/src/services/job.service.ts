import {Job, JobFilters, JobStatus, JobWithAnalysis} from '@yshvydak-job-screener/shared'
import {JobRepository} from '../repositories/job.repository'
import {Logger} from '../utils/Logger'

/**
 * Service layer for job business logic
 */
export class JobService {
    constructor(private jobRepository: JobRepository) {}

    /**
     * Get all jobs with optional filters
     * @param userId - User ID
     */
    getAll(userId: string, filters?: JobFilters): Job[] {
        return this.jobRepository.findAll(userId, filters)
    }

    /**
     * Get all jobs with AI analysis joined
     * @param userId - User ID
     */
    getAllWithAnalysis(userId: string, filters?: JobFilters): JobWithAnalysis[] {
        return this.jobRepository.findAllWithAnalysis(userId, filters)
    }

    /**
     * Get job by ID
     * @param id - Job ID
     * @param userId - User ID (for security check)
     */
    getById(id: string, userId: string): Job | null {
        return this.jobRepository.findById(id, userId)
    }

    /**
     * Update job status
     * @param id - Job ID
     * @param status - New status
     * @param userId - User ID (for security check)
     */
    updateStatus(id: string, status: JobStatus, userId: string): Job {
        this.validateStatus(status)

        // First check if job belongs to user
        const existing = this.jobRepository.findById(id, userId)
        if (!existing) {
            throw new Error(`Job not found: ${id}`)
        }

        const job = this.jobRepository.updateStatus(id, status)
        if (!job) {
            throw new Error(`Job not found: ${id}`)
        }

        Logger.info('Job status updated', {id, status, userId})
        return job
    }

    /**
     * Update job description
     * @param id - Job ID
     * @param description - New description
     * @param userId - User ID (for security check)
     */
    updateDescription(id: string, description: string, userId: string): Job {
        // First check if job belongs to user
        const existing = this.jobRepository.findById(id, userId)
        if (!existing) {
            throw new Error(`Job not found: ${id}`)
        }

        const job = this.jobRepository.updateDescription(id, description)
        if (!job) {
            throw new Error(`Job not found: ${id}`)
        }

        Logger.info('Job description updated manually', {id, userId})
        return job
    }

    /**
     * Delete a job
     * @param id - Job ID
     * @param userId - User ID (for security check)
     */
    delete(id: string, userId: string): void {
        // First check if job belongs to user
        const existing = this.jobRepository.findById(id, userId)
        if (!existing) {
            throw new Error(`Job not found: ${id}`)
        }

        const deleted = this.jobRepository.delete(id)
        if (!deleted) {
            throw new Error(`Job not found: ${id}`)
        }

        Logger.info('Job deleted', {id, userId})
    }

    /**
     * Delete all jobs for a user
     * @param userId - User ID
     */
    clearAll(userId: string): number {
        const deletedCount = this.jobRepository.deleteAll(userId)
        Logger.info('All jobs deleted', {deletedCount, userId})
        return deletedCount
    }

    /**
     * Get job statistics by status for a user
     * @param userId - User ID
     */
    getStats(userId: string): Record<JobStatus | 'total', number> {
        return this.jobRepository.countByStatus(userId)
    }

    /**
     * Validate job status
     */
    private validateStatus(status: JobStatus): void {
        const validStatuses: JobStatus[] = ['new', 'applied', 'saved', 'rejected']
        if (!validStatuses.includes(status)) {
            throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`)
        }
    }
}

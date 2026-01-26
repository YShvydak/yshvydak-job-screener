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
     */
    getAll(filters?: JobFilters): Job[] {
        return this.jobRepository.findAll(filters)
    }

    /**
     * Get all jobs with AI analysis joined
     */
    getAllWithAnalysis(filters?: JobFilters): JobWithAnalysis[] {
        return this.jobRepository.findAllWithAnalysis(filters)
    }

    /**
     * Get job by ID
     */
    getById(id: string): Job | null {
        return this.jobRepository.findById(id)
    }

    /**
     * Update job status
     */
    updateStatus(id: string, status: JobStatus): Job {
        this.validateStatus(status)

        const job = this.jobRepository.updateStatus(id, status)
        if (!job) {
            throw new Error(`Job not found: ${id}`)
        }

        Logger.info('Job status updated', {id, status})
        return job
    }

    /**
     * Update job description
     */
    updateDescription(id: string, description: string): Job {
        const job = this.jobRepository.updateDescription(id, description)
        if (!job) {
            throw new Error(`Job not found: ${id}`)
        }

        Logger.info('Job description updated manually', {id})
        return job
    }

    /**
     * Delete a job
     */
    delete(id: string): void {
        const deleted = this.jobRepository.delete(id)
        if (!deleted) {
            throw new Error(`Job not found: ${id}`)
        }

        Logger.info('Job deleted', {id})
    }

    /**
     * Delete all jobs
     */
    clearAll(): number {
        const deletedCount = this.jobRepository.deleteAll()
        Logger.info('All jobs deleted', {deletedCount})
        return deletedCount
    }

    /**
     * Get job statistics by status
     */
    getStats(): Record<JobStatus | 'total', number> {
        return this.jobRepository.countByStatus()
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

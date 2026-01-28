import {Request, Response} from 'express'
import {JobService} from '../services/job.service'
import {ResponseHelper} from '../utils/ResponseHelper'
import {JobFilters, JobStatus} from '@yshvydak-job-screener/shared'

/**
 * Controller for /api/jobs endpoints
 */
export class JobController {
    constructor(private jobService: JobService) {}

    /**
     * GET /api/jobs
     * Get all jobs with optional filters
     */
    getAll = (req: Request, res: Response): void => {
        try {
            const userId = req.user!.id
            const filters: JobFilters = {}

            if (req.query.status) {
                filters.status = req.query.status as JobStatus
            }
            if (req.query.profileId) {
                filters.profileId = req.query.profileId as string
            }
            if (req.query.minScore) {
                filters.minScore = parseInt(req.query.minScore as string, 10)
            }
            if (req.query.hasAnalysis !== undefined) {
                filters.hasAnalysis = req.query.hasAnalysis === 'true'
            }

            // Include AI analysis if requested
            const includeAnalysis = req.query.includeAnalysis === 'true'

            const jobs = includeAnalysis
                ? this.jobService.getAllWithAnalysis(userId, filters)
                : this.jobService.getAll(userId, filters)

            ResponseHelper.success(res, {jobs})
        } catch (error) {
            ResponseHelper.error(res, error)
        }
    }

    /**
     * GET /api/jobs/stats
     * Get job statistics by status
     */
    getStats = (req: Request, res: Response): void => {
        try {
            const userId = req.user!.id
            const stats = this.jobService.getStats(userId)
            ResponseHelper.success(res, {stats})
        } catch (error) {
            ResponseHelper.error(res, error)
        }
    }

    /**
     * GET /api/jobs/:id
     * Get job by ID
     */
    getById = (req: Request, res: Response): void => {
        try {
            const userId = req.user!.id
            const {id} = req.params
            const job = this.jobService.getById(id, userId)

            if (!job) {
                ResponseHelper.notFound(res, 'Job not found')
                return
            }

            ResponseHelper.success(res, {job})
        } catch (error) {
            ResponseHelper.error(res, error)
        }
    }

    /**
     * PATCH /api/jobs/:id/status
     * Update job status
     */
    updateStatus = (req: Request, res: Response): void => {
        try {
            const userId = req.user!.id
            const {id} = req.params
            const {status} = req.body

            if (!status) {
                ResponseHelper.badRequest(res, 'Status is required')
                return
            }

            const job = this.jobService.updateStatus(id, status, userId)
            ResponseHelper.success(res, {job})
        } catch (error) {
            ResponseHelper.error(res, error)
        }
    }

    /**
     * PATCH /api/jobs/:id/description
     * Update job description
     */
    updateDescription = (req: Request, res: Response): void => {
        try {
            const userId = req.user!.id
            const {id} = req.params
            const {description} = req.body

            if (!description) {
                ResponseHelper.badRequest(res, 'Description is required')
                return
            }

            const job = this.jobService.updateDescription(id, description, userId)
            ResponseHelper.success(res, {job})
        } catch (error) {
            ResponseHelper.error(res, error)
        }
    }

    /**
     * DELETE /api/jobs/:id
     * Delete a job
     */
    delete = (req: Request, res: Response): void => {
        try {
            const userId = req.user!.id
            const {id} = req.params
            this.jobService.delete(id, userId)
            ResponseHelper.success(res, {message: 'Job deleted successfully'})
        } catch (error) {
            ResponseHelper.error(res, error)
        }
    }

    /**
     * DELETE /api/jobs
     * Delete all jobs
     */
    clearAll = (req: Request, res: Response): void => {
        try {
            const userId = req.user!.id
            const deletedCount = this.jobService.clearAll(userId)
            ResponseHelper.success(res, {deletedCount})
        } catch (error) {
            ResponseHelper.error(res, error)
        }
    }
}

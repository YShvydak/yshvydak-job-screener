import { Request, Response } from 'express';
import { JobService } from '../services/job.service';
import { ResponseHelper } from '../utils/ResponseHelper';
import { JobFilters, JobStatus } from '@yshvydak-job-screener/shared';

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
            const filters: JobFilters = {};

            if (req.query.status) {
                filters.status = req.query.status as JobStatus;
            }
            if (req.query.profileId) {
                filters.profileId = req.query.profileId as string;
            }
            if (req.query.minScore) {
                filters.minScore = parseInt(req.query.minScore as string, 10);
            }

            // Include AI analysis if requested
            const includeAnalysis = req.query.includeAnalysis === 'true';

            const jobs = includeAnalysis
                ? this.jobService.getAllWithAnalysis(filters)
                : this.jobService.getAll(filters);

            ResponseHelper.success(res, { jobs });
        } catch (error) {
            ResponseHelper.error(res, error);
        }
    };

    /**
     * GET /api/jobs/stats
     * Get job statistics by status
     */
    getStats = (_req: Request, res: Response): void => {
        try {
            const stats = this.jobService.getStats();
            ResponseHelper.success(res, { stats });
        } catch (error) {
            ResponseHelper.error(res, error);
        }
    };

    /**
     * GET /api/jobs/:id
     * Get job by ID
     */
    getById = (req: Request, res: Response): void => {
        try {
            const { id } = req.params;
            const job = this.jobService.getById(id);

            if (!job) {
                ResponseHelper.notFound(res, 'Job not found');
                return;
            }

            ResponseHelper.success(res, { job });
        } catch (error) {
            ResponseHelper.error(res, error);
        }
    };

    /**
     * PATCH /api/jobs/:id/status
     * Update job status
     */
    updateStatus = (req: Request, res: Response): void => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!status) {
                ResponseHelper.badRequest(res, 'Status is required');
                return;
            }

            const job = this.jobService.updateStatus(id, status);
            ResponseHelper.success(res, { job });
        } catch (error) {
            ResponseHelper.error(res, error);
        }
    };

    /**
     * DELETE /api/jobs/:id
     * Delete a job
     */
    delete = (req: Request, res: Response): void => {
        try {
            const { id } = req.params;
            this.jobService.delete(id);
            ResponseHelper.success(res, { message: 'Job deleted successfully' });
        } catch (error) {
            ResponseHelper.error(res, error);
        }
    };

    /**
     * DELETE /api/jobs
     * Delete all jobs
     */
    clearAll = (_req: Request, res: Response): void => {
        try {
            const deletedCount = this.jobService.clearAll();
            ResponseHelper.success(res, { deletedCount });
        } catch (error) {
            ResponseHelper.error(res, error);
        }
    };
}

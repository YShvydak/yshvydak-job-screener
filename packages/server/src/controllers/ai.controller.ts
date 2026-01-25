import { Request, Response } from 'express';
import { AIAnalysisMethod } from '@yshvydak-job-screener/shared';
import { AIService } from '../services/ai.service';
import { ResponseHelper } from '../utils/ResponseHelper';

/**
 * Controller for /api/ai endpoints
 */
export class AIController {
    constructor(
        private aiService: AIService,
        private getCV: () => string // Function to get CV content from settings
    ) {}

    /**
     * POST /api/ai/analyze/:jobId
     * Analyze a single job
     * Query param: ?method=api|local (optional, uses default if not provided)
     */
    analyzeJob = async (req: Request, res: Response): Promise<void> => {
        try {
            const { jobId } = req.params;
            const methodParam = req.query.method as string | undefined;

            // Validate method parameter if provided
            let method: AIAnalysisMethod | undefined;
            if (methodParam) {
                if (methodParam !== 'api' && methodParam !== 'local') {
                    ResponseHelper.badRequest(res, "Invalid method. Must be 'api' or 'local'.");
                    return;
                }
                method = methodParam;
            }

            const cvContent = this.getCV();

            if (!cvContent) {
                ResponseHelper.badRequest(res, 'CV content is not configured. Please upload your CV in settings.');
                return;
            }

            const analysis = await this.aiService.analyzeJob(jobId, cvContent, method);
            ResponseHelper.success(res, { analysis });
        } catch (error) {
            ResponseHelper.error(res, error);
        }
    };

    /**
     * POST /api/ai/analyze-batch
     * Analyze multiple jobs
     * Query param: ?method=api|local (optional, uses default if not provided)
     */
    analyzeBatch = async (req: Request, res: Response): Promise<void> => {
        try {
            const { jobIds } = req.body;
            const methodParam = req.query.method as string | undefined;

            // Validate method parameter if provided
            let method: AIAnalysisMethod | undefined;
            if (methodParam) {
                if (methodParam !== 'api' && methodParam !== 'local') {
                    ResponseHelper.badRequest(res, "Invalid method. Must be 'api' or 'local'.");
                    return;
                }
                method = methodParam;
            }

            if (!Array.isArray(jobIds) || jobIds.length === 0) {
                ResponseHelper.badRequest(res, 'jobIds array is required');
                return;
            }

            const cvContent = this.getCV();

            if (!cvContent) {
                ResponseHelper.badRequest(res, 'CV content is not configured. Please upload your CV in settings.');
                return;
            }

            const analyses = await this.aiService.analyzeJobs(jobIds, cvContent, method);
            ResponseHelper.success(res, {
                total: jobIds.length,
                analyzed: analyses.length,
                analyses
            });
        } catch (error) {
            ResponseHelper.error(res, error);
        }
    };

    /**
     * GET /api/ai/analysis/:jobId
     * Get existing analysis for a job
     */
    getAnalysis = (req: Request, res: Response): void => {
        try {
            const { jobId } = req.params;
            const analysis = this.aiService.getAnalysis(jobId);

            if (!analysis) {
                ResponseHelper.notFound(res, 'Analysis not found');
                return;
            }

            ResponseHelper.success(res, { analysis });
        } catch (error) {
            ResponseHelper.error(res, error);
        }
    };

    /**
     * GET /api/ai/stats
     * Get AI analysis statistics
     */
    getStats = (_req: Request, res: Response): void => {
        try {
            const stats = this.aiService.getStats();
            ResponseHelper.success(res, { stats });
        } catch (error) {
            ResponseHelper.error(res, error);
        }
    };
}

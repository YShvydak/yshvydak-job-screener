import { Request, Response } from 'express';
import { SettingsRepository } from '../repositories/settings.repository';
import { ResponseHelper } from '../utils/ResponseHelper';
import { Logger } from '../utils/Logger';

/**
 * Controller for /api/settings endpoints
 */
export class SettingsController {
    constructor(private settingsRepository: SettingsRepository) {}

    /**
     * GET /api/settings
     * Get all settings
     */
    getAll = (_req: Request, res: Response): void => {
        try {
            const settings = this.settingsRepository.getAll();
            ResponseHelper.success(res, { settings });
        } catch (error) {
            ResponseHelper.error(res, error);
        }
    };

    /**
     * GET /api/settings/cv
     * Get CV content
     */
    getCV = (_req: Request, res: Response): void => {
        try {
            const cv = this.settingsRepository.getCV();
            ResponseHelper.success(res, {
                cv_content: cv,
                has_cv: cv.length > 0
            });
        } catch (error) {
            ResponseHelper.error(res, error);
        }
    };

    /**
     * POST /api/settings/cv
     * Set CV content
     */
    setCV = (req: Request, res: Response): void => {
        try {
            const { content } = req.body;

            if (!content || typeof content !== 'string') {
                ResponseHelper.badRequest(res, 'CV content is required');
                return;
            }

            this.settingsRepository.setCV(content);
            Logger.success('CV updated', { length: content.length });

            ResponseHelper.success(res, {
                message: 'CV updated successfully',
                length: content.length
            });
        } catch (error) {
            ResponseHelper.error(res, error);
        }
    };

    /**
     * DELETE /api/settings/cv
     * Delete CV content
     */
    deleteCV = (_req: Request, res: Response): void => {
        try {
            this.settingsRepository.setCV('');
            Logger.info('CV deleted');
            ResponseHelper.success(res, { message: 'CV deleted successfully' });
        } catch (error) {
            ResponseHelper.error(res, error);
        }
    };

    /**
     * GET /api/settings/ai-method
     * Get AI analysis method
     */
    getAIMethod = (_req: Request, res: Response): void => {
        try {
            const method = this.settingsRepository.getAIAnalysisMethod();
            ResponseHelper.success(res, { method });
        } catch (error) {
            ResponseHelper.error(res, error);
        }
    };

    /**
     * PUT /api/settings/ai-method
     * Set AI analysis method
     */
    setAIMethod = (req: Request, res: Response): void => {
        try {
            const { method } = req.body;

            if (method !== 'api' && method !== 'local') {
                ResponseHelper.badRequest(res, "Invalid method. Must be 'api' or 'local'.");
                return;
            }

            this.settingsRepository.setAIAnalysisMethod(method);
            Logger.success('AI analysis method updated', { method });

            ResponseHelper.success(res, {
                message: 'AI analysis method updated successfully',
                method
            });
        } catch (error) {
            ResponseHelper.error(res, error);
        }
    };
}

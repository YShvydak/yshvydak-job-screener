import {Request, Response} from 'express'
import {SettingsRepository} from '../repositories/settings.repository'
import {ResponseHelper} from '../utils/ResponseHelper'
import {Logger} from '../utils/Logger'
import {env} from '../config/environment.config'

/**
 * Controller for /api/settings endpoints
 */
export class SettingsController {
    constructor(private settingsRepository: SettingsRepository) {}

    /**
     * GET /api/settings
     * Get all settings
     */
    getAll = (req: Request, res: Response): void => {
        try {
            const userId = req.user!.id
            const settings = this.settingsRepository.getAll(userId)
            ResponseHelper.success(res, {settings})
        } catch (error) {
            ResponseHelper.error(res, error)
        }
    }

    /**
     * GET /api/settings/cv
     * Get CV content
     */
    getCV = (req: Request, res: Response): void => {
        try {
            const userId = req.user!.id
            const cv = this.settingsRepository.getCV(userId)
            ResponseHelper.success(res, {
                cv_content: cv,
                has_cv: cv.length > 0,
            })
        } catch (error) {
            ResponseHelper.error(res, error)
        }
    }

    /**
     * POST /api/settings/cv
     * Set CV content
     */
    setCV = (req: Request, res: Response): void => {
        try {
            const userId = req.user!.id
            const {content} = req.body

            if (!content || typeof content !== 'string') {
                ResponseHelper.badRequest(res, 'CV content is required')
                return
            }

            this.settingsRepository.setCV(userId, content)
            Logger.success('CV updated', {userId, length: content.length})

            ResponseHelper.success(res, {
                message: 'CV updated successfully',
                length: content.length,
            })
        } catch (error) {
            ResponseHelper.error(res, error)
        }
    }

    /**
     * DELETE /api/settings/cv
     * Delete CV content
     */
    deleteCV = (req: Request, res: Response): void => {
        try {
            const userId = req.user!.id
            this.settingsRepository.setCV(userId, '')
            Logger.info('CV deleted', {userId})
            ResponseHelper.success(res, {message: 'CV deleted successfully'})
        } catch (error) {
            ResponseHelper.error(res, error)
        }
    }

    /**
     * GET /api/settings/ai-method
     * Get AI analysis method
     */
    getAIMethod = (req: Request, res: Response): void => {
        try {
            const userId = req.user!.id
            const method = this.settingsRepository.getAIAnalysisMethod(userId)
            ResponseHelper.success(res, {method})
        } catch (error) {
            ResponseHelper.error(res, error)
        }
    }

    /**
     * PUT /api/settings/ai-method
     * Set AI analysis method
     */
    setAIMethod = (req: Request, res: Response): void => {
        try {
            const userId = req.user!.id
            const {method} = req.body

            if (method !== 'api' && method !== 'local') {
                ResponseHelper.badRequest(res, "Invalid method. Must be 'api' or 'local'.")
                return
            }

            this.settingsRepository.setAIAnalysisMethod(userId, method)
            Logger.success('AI analysis method updated', {userId, method})

            ResponseHelper.success(res, {
                message: 'AI analysis method updated successfully',
                method,
            })
        } catch (error) {
            ResponseHelper.error(res, error)
        }
    }

    /**
     * GET /api/settings/api-status
     * Get API keys configuration status
     */
    getAPIStatus = (_req: Request, res: Response): void => {
        try {
            const status = {
                serpapi: {
                    configured: !!env.SERPAPI_KEY && env.SERPAPI_KEY.length > 0,
                    name: 'SerpAPI',
                    description: 'Job search API',
                },
                gemini: {
                    configured: !!env.GEMINI_API_KEY && env.GEMINI_API_KEY.length > 0,
                    name: 'Google Gemini',
                    description: 'AI job analysis',
                },
            }

            ResponseHelper.success(res, {status})
        } catch (error) {
            ResponseHelper.error(res, error)
        }
    }
}

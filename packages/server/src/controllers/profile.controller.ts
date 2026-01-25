import {Request, Response} from 'express'
import {ProfileService} from '../services/profile.service'
import {ResponseHelper} from '../utils/ResponseHelper'
import {SearchProfileInput} from '@yshvydak-job-screener/shared'

/**
 * Controller for /api/profiles endpoints
 */
export class ProfileController {
    constructor(private profileService: ProfileService) {}

    /**
     * GET /api/profiles
     * Get all profiles
     */
    getAll = (_req: Request, res: Response): void => {
        try {
            const profiles = this.profileService.getAll()
            ResponseHelper.success(res, {profiles})
        } catch (error) {
            ResponseHelper.error(res, error)
        }
    }

    /**
     * GET /api/profiles/active
     * Get active profiles only
     */
    getActive = (_req: Request, res: Response): void => {
        try {
            const profiles = this.profileService.getActive()
            ResponseHelper.success(res, {profiles})
        } catch (error) {
            ResponseHelper.error(res, error)
        }
    }

    /**
     * GET /api/profiles/:id
     * Get profile by ID
     */
    getById = (req: Request, res: Response): void => {
        try {
            const {id} = req.params
            const profile = this.profileService.getById(id)

            if (!profile) {
                ResponseHelper.notFound(res, 'Profile not found')
                return
            }

            ResponseHelper.success(res, {profile})
        } catch (error) {
            ResponseHelper.error(res, error)
        }
    }

    /**
     * POST /api/profiles
     * Create a new profile
     */
    create = (req: Request, res: Response): void => {
        try {
            const input: SearchProfileInput = req.body
            const profile = this.profileService.create(input)
            ResponseHelper.created(res, {profile})
        } catch (error) {
            // Validation errors should return 400
            if (
                error instanceof Error &&
                (error.message.includes('required') ||
                    error.message.includes('Invalid') ||
                    error.message.includes('must be'))
            ) {
                ResponseHelper.badRequest(res, error.message)
            } else {
                ResponseHelper.error(res, error)
            }
        }
    }

    /**
     * PUT /api/profiles/:id
     * Update an existing profile
     */
    update = (req: Request, res: Response): void => {
        try {
            const {id} = req.params
            const input: Partial<SearchProfileInput> = req.body
            const profile = this.profileService.update(id, input)
            ResponseHelper.success(res, {profile})
        } catch (error) {
            // Validation errors should return 400
            if (
                error instanceof Error &&
                (error.message.includes('required') ||
                    error.message.includes('Invalid') ||
                    error.message.includes('must be'))
            ) {
                ResponseHelper.badRequest(res, error.message)
            } else {
                ResponseHelper.error(res, error)
            }
        }
    }

    /**
     * PATCH /api/profiles/:id/toggle
     * Toggle profile active status
     */
    toggleActive = (req: Request, res: Response): void => {
        try {
            const {id} = req.params
            const profile = this.profileService.toggleActive(id)
            ResponseHelper.success(res, {profile})
        } catch (error) {
            ResponseHelper.error(res, error)
        }
    }

    /**
     * DELETE /api/profiles/:id
     * Delete a profile
     */
    delete = (req: Request, res: Response): void => {
        try {
            const {id} = req.params
            this.profileService.delete(id)
            ResponseHelper.success(res, {message: 'Profile deleted successfully'})
        } catch (error) {
            ResponseHelper.error(res, error)
        }
    }
}

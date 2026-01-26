import {Request, Response} from 'express'
import {JobProvider} from '@yshvydak-job-screener/shared'
import {SearchService} from '../services/search.service'
import {ResponseHelper} from '../utils/ResponseHelper'

/**
 * Controller for /api/search endpoints
 */
export class SearchController {
    constructor(private searchService: SearchService) {}

    /**
     * POST /api/search/run
     * Execute a job search using a profile
     * Body: { profileId: string, provider?: JobProvider }
     */
    run = async (req: Request, res: Response): Promise<void> => {
        try {
            const {profileId, provider} = req.body

            if (!profileId) {
                ResponseHelper.badRequest(res, 'profileId is required')
                return
            }

            const result = await this.searchService.executeSearch(
                profileId,
                provider as JobProvider | undefined
            )
            ResponseHelper.success(res, {result})
        } catch (error) {
            ResponseHelper.error(res, error)
        }
    }

    /**
     * GET /api/search/providers
     * Get list of available job search providers
     */
    getProviders = async (_req: Request, res: Response): Promise<void> => {
        try {
            const providers = this.searchService.getAvailableProviders()
            ResponseHelper.success(res, {providers})
        } catch (error) {
            ResponseHelper.error(res, error)
        }
    }

    /**
     * POST /api/search/providers/:provider/test
     * Test a specific provider connection
     */
    testProvider = async (req: Request, res: Response): Promise<void> => {
        try {
            const {provider} = req.params

            if (!provider) {
                ResponseHelper.badRequest(res, 'provider parameter is required')
                return
            }

            const result = await this.searchService.testProvider(provider as JobProvider)
            ResponseHelper.success(res, result)
        } catch (error) {
            ResponseHelper.error(res, error)
        }
    }
}

import {Request, Response} from 'express'
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
     */
    run = async (req: Request, res: Response): Promise<void> => {
        try {
            const {profileId} = req.body

            if (!profileId) {
                ResponseHelper.badRequest(res, 'profileId is required')
                return
            }

            const result = await this.searchService.executeSearch(profileId)
            ResponseHelper.success(res, {result})
        } catch (error) {
            ResponseHelper.error(res, error)
        }
    }
}

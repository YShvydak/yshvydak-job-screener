import {Router} from 'express'
import {SearchController} from '../controllers/search.controller'

/**
 * Create search routes
 */
export function createSearchRoutes(controller: SearchController): Router {
    const router = Router()

    // POST /api/search/run - Execute job search
    router.post('/run', controller.run)

    // GET /api/search/providers - Get available providers
    router.get('/providers', controller.getProviders)

    // POST /api/search/providers/:provider/test - Test provider connection
    router.post('/providers/:provider/test', controller.testProvider)

    return router
}

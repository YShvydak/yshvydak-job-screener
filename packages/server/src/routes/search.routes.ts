import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';

/**
 * Create search routes
 */
export function createSearchRoutes(controller: SearchController): Router {
    const router = Router();

    // POST /api/search/run - Execute job search
    router.post('/run', controller.run);

    return router;
}

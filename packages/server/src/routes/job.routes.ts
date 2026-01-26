import {Router} from 'express'
import {JobController} from '../controllers/job.controller'

/**
 * Create job routes
 */
export function createJobRoutes(controller: JobController): Router {
    const router = Router()

    // GET /api/jobs - Get all jobs
    router.get('/', controller.getAll)

    // GET /api/jobs/stats - Get job statistics
    router.get('/stats', controller.getStats)

    // GET /api/jobs/:id - Get job by ID
    router.get('/:id', controller.getById)

    // PATCH /api/jobs/:id/status - Update job status
    router.patch('/:id/status', controller.updateStatus)

    // PATCH /api/jobs/:id/description - Update job description
    router.patch('/:id/description', controller.updateDescription)

    // DELETE /api/jobs - Delete all jobs
    router.delete('/', controller.clearAll)

    // DELETE /api/jobs/:id - Delete a job
    router.delete('/:id', controller.delete)

    return router
}

import {Router} from 'express'
import {ProfileController} from '../controllers/profile.controller'

/**
 * Create profile routes
 */
export function createProfileRoutes(controller: ProfileController): Router {
    const router = Router()

    // GET /api/profiles - Get all profiles
    router.get('/', controller.getAll)

    // GET /api/profiles/active - Get active profiles only
    router.get('/active', controller.getActive)

    // GET /api/profiles/:id - Get profile by ID
    router.get('/:id', controller.getById)

    // POST /api/profiles - Create a new profile
    router.post('/', controller.create)

    // PUT /api/profiles/:id - Update a profile
    router.put('/:id', controller.update)

    // PATCH /api/profiles/:id/toggle - Toggle active status
    router.patch('/:id/toggle', controller.toggleActive)

    // DELETE /api/profiles/:id - Delete a profile
    router.delete('/:id', controller.delete)

    return router
}

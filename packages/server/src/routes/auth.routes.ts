import {Router} from 'express'
import {AuthController} from '../controllers/auth.controller'

/**
 * Create auth routes
 */
export function createAuthRoutes(controller: AuthController): Router {
    const router = Router()

    // POST /api/auth/register - Register new user
    router.post('/register', controller.register)

    // POST /api/auth/login - Login user
    router.post('/login', controller.login)

    // GET /api/auth/verify - Verify JWT token
    router.get('/verify', controller.verify)

    // POST /api/auth/logout - Logout user
    router.post('/logout', controller.logout)

    return router
}

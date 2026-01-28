import {Request, Response} from 'express'
import {AuthService} from '../services/auth.service'
import {ResponseHelper} from '../utils/ResponseHelper'

/**
 * Controller for /api/auth endpoints
 */
export class AuthController {
    constructor(private authService: AuthService) {}

    /**
     * POST /api/auth/register
     * Register a new user
     */
    register = async (req: Request, res: Response): Promise<void> => {
        try {
            const {email, password} = req.body

            if (!email || !password) {
                ResponseHelper.badRequest(res, 'Email and password are required')
                return
            }

            const result = await this.authService.register({email, password})

            if (!result.success) {
                ResponseHelper.badRequest(res, result.message || 'Registration failed')
                return
            }

            ResponseHelper.success(res, {
                token: result.token,
                user: result.user,
                expiresIn: result.expiresIn,
            })
        } catch (error) {
            ResponseHelper.error(res, error)
        }
    }

    /**
     * POST /api/auth/login
     * Login user
     */
    login = async (req: Request, res: Response): Promise<void> => {
        try {
            const {email, password} = req.body

            if (!email || !password) {
                ResponseHelper.badRequest(res, 'Email and password are required')
                return
            }

            const result = await this.authService.login({email, password})

            if (!result.success) {
                ResponseHelper.unauthorized(res, result.message || 'Invalid credentials')
                return
            }

            ResponseHelper.success(res, {
                token: result.token,
                user: result.user,
                expiresIn: result.expiresIn,
            })
        } catch (error) {
            ResponseHelper.error(res, error)
        }
    }

    /**
     * GET /api/auth/verify
     * Verify JWT token
     */
    verify = async (req: Request, res: Response): Promise<void> => {
        try {
            const token = req.headers.authorization

            if (!token) {
                ResponseHelper.unauthorized(res, 'No token provided')
                return
            }

            const result = await this.authService.verifyJWT(token)

            if (!result.valid) {
                ResponseHelper.unauthorized(res, result.message || 'Invalid token')
                return
            }

            ResponseHelper.success(res, {
                valid: true,
                user: result.user,
            })
        } catch (error) {
            ResponseHelper.error(res, error)
        }
    }

    /**
     * POST /api/auth/logout
     * Logout user
     */
    logout = async (req: Request, res: Response): Promise<void> => {
        try {
            const token = req.headers.authorization
            const result = await this.authService.logout(token)

            ResponseHelper.success(res, {
                message: result.message,
            })
        } catch (error) {
            ResponseHelper.error(res, error)
        }
    }
}

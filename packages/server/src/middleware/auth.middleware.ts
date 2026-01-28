import {Request, Response, NextFunction} from 'express'
import {AuthService} from '../services/auth.service'
import {ResponseHelper} from '../utils/ResponseHelper'
import {UserResponse} from '../types/user.types'

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: UserResponse
        }
    }
}

// Public endpoints that don't require authentication
const PUBLIC_ENDPOINTS = ['/api/auth/login', '/api/auth/register', '/api/health']

/**
 * Check if endpoint should be public
 */
function isPublicEndpoint(path: string): boolean {
    return PUBLIC_ENDPOINTS.some((endpoint) => path.startsWith(endpoint))
}

/**
 * Create authentication middleware
 * Protects routes by verifying JWT tokens
 */
export function createAuthMiddleware(authService: AuthService, enableAuth: boolean = true) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // Skip authentication if disabled
            if (!enableAuth) {
                next()
                return
            }

            // Skip authentication for public endpoints
            if (isPublicEndpoint(req.path)) {
                next()
                return
            }

            // Get token from Authorization header or query parameter
            const authHeader = req.headers.authorization as string
            const queryToken = req.query?.token as string

            // Support both Authorization header and ?token= query parameter
            // Query parameter is needed for certain scenarios (e.g., file downloads)
            const tokenToVerify = authHeader || (queryToken ? `Bearer ${queryToken}` : null)

            if (!tokenToVerify) {
                console.warn(`⚠️ No authentication provided for: ${req.method} ${req.path}`)
                ResponseHelper.unauthorized(res, 'Authentication required')
                return
            }

            // Verify JWT token
            const tokenResult = await authService.verifyJWT(tokenToVerify)

            if (tokenResult.valid && tokenResult.user) {
                // Attach user to request
                req.user = tokenResult.user
                console.log(`✅ Authenticated user: ${tokenResult.user.email}`)
                next()
                return
            } else {
                console.warn(`⚠️ Invalid JWT token for: ${req.method} ${req.path}`)
                ResponseHelper.unauthorized(res, tokenResult.message || 'Invalid or expired token')
                return
            }
        } catch (error) {
            console.error('❌ Authentication middleware error:', error)
            ResponseHelper.serverError(res, 'Authentication service error')
        }
    }
}

/**
 * Middleware to require authenticated user
 * Use this after createAuthMiddleware to ensure user is present
 */
export function requireAuth() {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            ResponseHelper.unauthorized(res, 'Authentication required')
            return
        }
        next()
    }
}

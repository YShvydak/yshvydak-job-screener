import {createSigner, createVerifier} from 'fast-jwt'
import bcrypt from 'bcrypt'
import {UserRepository} from '../repositories/user.repository'
import {toUserResponse, UserResponse} from '../types/user.types'

const SALT_ROUNDS = 10

export interface LoginCredentials {
    email: string
    password: string
}

export interface RegisterCredentials {
    email: string
    password: string
}

export interface LoginResult {
    success: boolean
    token?: string
    user?: UserResponse
    expiresIn?: string
    message?: string
}

export interface VerifyResult {
    valid: boolean
    user?: UserResponse
    message?: string
}

export interface AuthTokenData {
    user: UserResponse
    iat?: number
    exp?: number
}

/**
 * Authentication Service
 * Handles user authentication, registration, and JWT token management
 */
export class AuthService {
    private jwtSigner: any
    private jwtVerifier: any

    constructor(
        private userRepository: UserRepository,
        private jwtSecret: string,
        private jwtExpiresIn: string = '30d'
    ) {
        this.initializeJWT()
    }

    private initializeJWT() {
        if (!this.jwtSecret) {
            throw new Error('JWT_SECRET is required for authentication')
        }

        try {
            this.jwtSigner = createSigner({
                key: this.jwtSecret,
                expiresIn: this.jwtExpiresIn,
            })

            this.jwtVerifier = createVerifier({
                key: this.jwtSecret,
            })

            console.log('✅ JWT authentication initialized')
        } catch (error) {
            console.error('❌ Failed to initialize JWT authentication:', error)
            throw error
        }
    }

    /**
     * Register a new user
     */
    async register(credentials: RegisterCredentials): Promise<LoginResult> {
        try {
            const {email, password} = credentials

            // Validate email format
            if (!this.isValidEmail(email)) {
                return {
                    success: false,
                    message: 'Invalid email format',
                }
            }

            // Validate password strength
            if (password.length < 6) {
                return {
                    success: false,
                    message: 'Password must be at least 6 characters long',
                }
            }

            // Check if user already exists
            const existingUser = this.userRepository.findByEmail(email)
            if (existingUser) {
                return {
                    success: false,
                    message: 'User with this email already exists',
                }
            }

            // Hash password
            const password_hash = await bcrypt.hash(password, SALT_ROUNDS)

            // Create user
            const user = this.userRepository.create({
                email,
                password,
                password_hash,
            })

            // Generate JWT token
            const userResponse = toUserResponse(user)
            const tokenPayload: AuthTokenData = {user: userResponse}
            const token = await this.jwtSigner(tokenPayload)

            console.log(`✅ New user registered: ${email}`)

            return {
                success: true,
                token,
                user: userResponse,
                expiresIn: this.jwtExpiresIn,
            }
        } catch (error) {
            console.error('❌ Registration failed:', error)
            return {
                success: false,
                message: 'Registration failed',
            }
        }
    }

    /**
     * Login user
     */
    async login(credentials: LoginCredentials): Promise<LoginResult> {
        try {
            const {email, password} = credentials

            // Find user by email
            const user = this.userRepository.findByEmail(email)
            if (!user) {
                return {
                    success: false,
                    message: 'Invalid email or password',
                }
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password_hash)
            if (!isPasswordValid) {
                console.warn(`⚠️ Failed login attempt for: ${email}`)
                return {
                    success: false,
                    message: 'Invalid email or password',
                }
            }

            // Generate JWT token
            const userResponse = toUserResponse(user)
            const tokenPayload: AuthTokenData = {user: userResponse}
            const token = await this.jwtSigner(tokenPayload)

            console.log(`✅ User logged in: ${email}`)

            return {
                success: true,
                token,
                user: userResponse,
                expiresIn: this.jwtExpiresIn,
            }
        } catch (error) {
            console.error('❌ Login failed:', error)
            return {
                success: false,
                message: 'Authentication failed',
            }
        }
    }

    /**
     * Verify JWT token
     */
    async verifyJWT(token: string): Promise<VerifyResult> {
        try {
            if (!token) {
                return {
                    valid: false,
                    message: 'No token provided',
                }
            }

            // Remove 'Bearer ' prefix if present
            const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token

            // Verify JWT token
            const decoded = (await this.jwtVerifier(cleanToken)) as AuthTokenData

            if (!decoded || !decoded.user) {
                return {
                    valid: false,
                    message: 'Invalid token structure',
                }
            }

            // Validate that user still exists
            const user = this.userRepository.findById(decoded.user.id)
            if (!user) {
                console.warn(`⚠️ Token valid but user no longer exists: ${decoded.user.email}`)
                return {
                    valid: false,
                    message: 'User no longer exists',
                }
            }

            return {
                valid: true,
                user: decoded.user,
            }
        } catch (error) {
            console.warn('⚠️ JWT verification failed:', error)
            return {
                valid: false,
                message: 'Invalid or expired token',
            }
        }
    }

    /**
     * Logout user (JWT tokens are stateless, so this is mostly a placeholder)
     */
    async logout(_token?: string): Promise<{success: boolean; message: string}> {
        // For JWT tokens, we don't need to do anything server-side
        // The client should remove the token from storage
        // In a future implementation, we could add token blacklisting

        console.log('✅ User logged out')
        return {
            success: true,
            message: 'Successfully logged out',
        }
    }

    /**
     * Validate email format
     */
    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }
}

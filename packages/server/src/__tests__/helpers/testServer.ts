/**
 * Test Server Helper - Setup isolated Express app for integration tests
 *
 * Usage:
 *   import { setupTestServer, teardownTestServer, cleanDatabase } from '../helpers/testServer'
 *
 *   let server: TestServerInstance
 *
 *   beforeAll(async () => {
 *     server = await setupTestServer()
 *   })
 *
 *   afterAll(async () => {
 *     await teardownTestServer(server)
 *   })
 *
 *   beforeEach(async () => {
 *     cleanTestDatabase(server)
 *   })
 */

import express, {Application} from 'express'
import Database from 'better-sqlite3'
import {v4 as uuid} from 'uuid'
import path from 'path'
import fs from 'fs'
import {seedUser} from './database'

// Repositories
import {ProfileRepository} from '../../repositories/profile.repository'
import {JobRepository} from '../../repositories/job.repository'
import {AnalysisRepository} from '../../repositories/analysis.repository'
import {SettingsRepository} from '../../repositories/settings.repository'

// Services
import {ProfileService} from '../../services/profile.service'
import {JobService} from '../../services/job.service'
import {SearchService} from '../../services/search.service'
import {AIService} from '../../services/ai.service'

// Providers
import {ProviderRegistry, SerpAPIProvider, GlassdoorProvider} from '../../providers'

// Controllers
import {ProfileController} from '../../controllers/profile.controller'
import {JobController} from '../../controllers/job.controller'
import {SearchController} from '../../controllers/search.controller'
import {AIController} from '../../controllers/ai.controller'
import {SettingsController} from '../../controllers/settings.controller'

// Routes
import {createProfileRoutes} from '../../routes/profile.routes'
import {createJobRoutes} from '../../routes/job.routes'
import {createSearchRoutes} from '../../routes/search.routes'
import {createAIRoutes} from '../../routes/ai.routes'
import {createSettingsRoutes} from '../../routes/settings.routes'

// ... imports
import {UserRepository} from '../../repositories/user.repository'
import {AuthService} from '../../services/auth.service'
import {AuthController} from '../../controllers/auth.controller'
import {createAuthRoutes} from '../../routes/auth.routes'
import {createAuthMiddleware} from '../../middleware/auth.middleware'

export interface TestServerInstance {
    app: Application
    db: Database.Database
    dbPath: string
    tempDir: string
    // Repositories for direct access in tests
    repositories: {
        user: UserRepository
        profile: ProfileRepository
        job: JobRepository
        analysis: AnalysisRepository
        settings: SettingsRepository
    }
    // Services for mocking
    services: {
        auth: AuthService
        profile: ProfileService
        job: JobService
        search: SearchService
        ai: AIService
    }
}

export interface TestServerOptions {
    useRealAuth?: boolean
}

/**
 * Setup isolated test server with temporary database
 */
export async function setupTestServer(
    options: TestServerOptions = {}
): Promise<TestServerInstance> {
    // Create unique temp directory for isolated database
    const testId = uuid().slice(0, 8)
    const tempDir = path.join(process.cwd(), `.test-${testId}`)
    fs.mkdirSync(tempDir, {recursive: true})

    const dbPath = path.join(tempDir, 'test.db')

    // Initialize database with schema
    const db = new Database(dbPath)

    // Read and execute schema
    const schemaPath = path.join(__dirname, '../../database/schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf-8')
    db.exec(schema)

    // Initialize Repositories
    const userRepository = new UserRepository(db)
    const profileRepository = new ProfileRepository(db)
    const jobRepository = new JobRepository(db)
    const analysisRepository = new AnalysisRepository(db)
    const settingsRepository = new SettingsRepository(db)

    // Seed test user (only if not using real auth, or we can seed it anyway for convenience)
    seedUser(db)

    // Initialize Provider Registry (with empty keys for testing)
    const providerRegistry = new ProviderRegistry()
    providerRegistry.register(new SerpAPIProvider({apiKey: ''}))
    providerRegistry.register(new GlassdoorProvider({apiKey: ''}))

    // Initialize Services
    const authService = new AuthService(userRepository, 'test-jwt-secret', '1h')
    const profileService = new ProfileService(profileRepository)
    const jobService = new JobService(jobRepository)
    const searchService = new SearchService(jobRepository, profileRepository, providerRegistry)
    const aiService = new AIService(analysisRepository, jobRepository, settingsRepository)

    // Initialize Controllers
    const authController = new AuthController(authService)
    const profileController = new ProfileController(profileService)
    const jobController = new JobController(jobService)
    const searchController = new SearchController(searchService)
    const aiController = new AIController(aiService, (userId) => settingsRepository.getCV(userId))
    const settingsController = new SettingsController(settingsRepository)

    // Create Express app
    const app = express()
    app.use(express.json())
    app.use(express.urlencoded({extended: true}))

    // Auth Middleware
    if (options.useRealAuth) {
        app.use(createAuthMiddleware(authService))
    } else {
        // Mock Auth Middleware for Integration Tests (Default)
        app.use((req, _res, next) => {
            // Check if it's an auth route, if so, skip mock user injection to allow testing real auth endpoints if needed
            // But usually, real auth endpoints are public. The mock middleware sets user for PROTECTED routes.
            // If the router is mounted AFTER this middleware, this middleware runs first.
            // Let's keep it simple: if useRealAuth is false, we inject user.
            // We can exclude /api/auth paths to be safe, but they ignore req.user anyway.
            ;(req as any).user = {
                id: 'test-user-id',
                email: 'test@example.com',
            }
            next()
        })
    }

    // Health check
    app.get('/health', (_req, res) => {
        res.json({status: 'ok', environment: 'test'})
    })

    // Mount routes
    app.use('/api/auth', createAuthRoutes(authController))
    app.use('/api/profiles', createProfileRoutes(profileController))
    app.use('/api/jobs', createJobRoutes(jobController))
    app.use('/api/search', createSearchRoutes(searchController))
    app.use('/api/ai', createAIRoutes(aiController))
    app.use('/api/settings', createSettingsRoutes(settingsController))

    return {
        app,
        db,
        dbPath,
        tempDir,
        repositories: {
            user: userRepository,
            profile: profileRepository,
            job: jobRepository,
            analysis: analysisRepository,
            settings: settingsRepository,
        },
        services: {
            auth: authService,
            profile: profileService,
            job: jobService,
            search: searchService,
            ai: aiService,
        },
    }
}

/**
 * Teardown test server and cleanup temp files
 */
export async function teardownTestServer(server: TestServerInstance): Promise<void> {
    try {
        // Close database connection
        server.db.close()

        // Remove temp directory
        fs.rmSync(server.tempDir, {recursive: true, force: true})
    } catch (error) {
        // Log but don't fail tests on cleanup errors
        console.warn('Warning: Failed to cleanup test server:', error)
    }
}

/**
 * Clean all data from test database
 */
export function cleanTestDatabase(server: TestServerInstance): void {
    // Order matters for foreign key constraints
    server.db.exec('DELETE FROM ai_analyses')
    server.db.exec('DELETE FROM job_notes')
    server.db.exec('DELETE FROM jobs')
    server.db.exec('DELETE FROM search_profiles')
    server.db.exec('DELETE FROM user_settings')
    server.db.exec('DELETE FROM users')
    seedUser(server.db)
}

/**
 * Re-export database helpers for convenience
 */
export {cleanDatabase, cleanJobsAndAnalyses} from './database'

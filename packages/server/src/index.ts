import {env} from './config/environment.config'
import {DatabaseManager} from './database/database.manager'
import {Logger} from './utils/Logger'
import express, {Application} from 'express'
import cors from 'cors'

// Repositories
import {ProfileRepository} from './repositories/profile.repository'
import {JobRepository} from './repositories/job.repository'
import {AnalysisRepository} from './repositories/analysis.repository'
import {SettingsRepository} from './repositories/settings.repository'

// Services
import {ProfileService} from './services/profile.service'
import {JobService} from './services/job.service'
import {SearchService} from './services/search.service'
import {AIService} from './services/ai.service'

// Controllers
import {ProfileController} from './controllers/profile.controller'
import {JobController} from './controllers/job.controller'
import {SearchController} from './controllers/search.controller'
import {AIController} from './controllers/ai.controller'
import {SettingsController} from './controllers/settings.controller'

// Routes
import {createProfileRoutes} from './routes/profile.routes'
import {createJobRoutes} from './routes/job.routes'
import {createSearchRoutes} from './routes/search.routes'
import {createAIRoutes} from './routes/ai.routes'
import {createSettingsRoutes} from './routes/settings.routes'

/**
 * Initialize Express application with dependencies
 * Exported for testing purposes
 */
export function createApp(db: DatabaseManager): Application {
    const app = express()

    // Middleware
    app.use(cors())
    app.use(express.json())
    app.use(express.urlencoded({extended: true}))

    // Health check endpoint
    app.get('/health', (_req, res) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            environment: env.NODE_ENV,
        })
    })

    // API info endpoint
    app.get('/api', (_req, res) => {
        res.json({
            message: 'YShvydak Job Screener API',
            version: '1.0.0',
            endpoints: {
                health: '/health',
                profiles: '/api/profiles',
                jobs: '/api/jobs',
                search: '/api/search',
                ai: '/api/ai',
                settings: '/api/settings',
            },
        })
    })

    // Initialize Repositories
    const profileRepository = new ProfileRepository(db.getDB())
    const jobRepository = new JobRepository(db.getDB())
    const analysisRepository = new AnalysisRepository(db.getDB())
    const settingsRepository = new SettingsRepository(db.getDB())

    // Initialize Services
    const profileService = new ProfileService(profileRepository)
    const jobService = new JobService(jobRepository)
    const searchService = new SearchService(jobRepository, profileRepository)
    const aiService = new AIService(analysisRepository, jobRepository, settingsRepository)

    // Initialize Controllers
    const profileController = new ProfileController(profileService)
    const jobController = new JobController(jobService)
    const searchController = new SearchController(searchService)
    const aiController = new AIController(aiService, () => settingsRepository.getCV())
    const settingsController = new SettingsController(settingsRepository)

    // Mount routes
    app.use('/api/profiles', createProfileRoutes(profileController))
    app.use('/api/jobs', createJobRoutes(jobController))
    app.use('/api/search', createSearchRoutes(searchController))
    app.use('/api/ai', createAIRoutes(aiController))
    app.use('/api/settings', createSettingsRoutes(settingsController))

    return app
}

/**
 * Start the server
 */
function startServer(): void {
    try {
        // Initialize database
        const dbPath = env.DATABASE_PATH
        const db = new DatabaseManager(dbPath)
        Logger.success('Database initialized', {path: dbPath})

        // Create Express app with database connection
        const app = createApp(db)

        // Start listening
        app.listen(env.PORT, () => {
            Logger.success(`Server started on port ${env.PORT}`, {
                environment: env.NODE_ENV,
                database: dbPath,
            })
        })

        // Graceful shutdown
        process.on('SIGTERM', () => {
            Logger.info('SIGTERM received, shutting down gracefully')
            db.close()
            process.exit(0)
        })

        process.on('SIGINT', () => {
            Logger.info('SIGINT received, shutting down gracefully')
            db.close()
            process.exit(0)
        })
    } catch (error) {
        Logger.error('Failed to start server', error)
        process.exit(1)
    }
}

// Start the server
startServer()

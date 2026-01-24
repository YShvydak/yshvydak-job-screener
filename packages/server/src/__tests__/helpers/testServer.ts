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
 *     cleanDatabase(server.db)
 *   })
 */

import express, { Application } from 'express'
import Database from 'better-sqlite3'
import { v4 as uuid } from 'uuid'
import path from 'path'
import fs from 'fs'

// Repositories
import { ProfileRepository } from '../../repositories/profile.repository'
import { JobRepository } from '../../repositories/job.repository'
import { AnalysisRepository } from '../../repositories/analysis.repository'
import { SettingsRepository } from '../../repositories/settings.repository'

// Services
import { ProfileService } from '../../services/profile.service'
import { JobService } from '../../services/job.service'
import { SearchService } from '../../services/search.service'
import { AIService } from '../../services/ai.service'

// Controllers
import { ProfileController } from '../../controllers/profile.controller'
import { JobController } from '../../controllers/job.controller'
import { SearchController } from '../../controllers/search.controller'
import { AIController } from '../../controllers/ai.controller'
import { SettingsController } from '../../controllers/settings.controller'

// Routes
import { createProfileRoutes } from '../../routes/profile.routes'
import { createJobRoutes } from '../../routes/job.routes'
import { createSearchRoutes } from '../../routes/search.routes'
import { createAIRoutes } from '../../routes/ai.routes'
import { createSettingsRoutes } from '../../routes/settings.routes'

export interface TestServerInstance {
  app: Application
  db: Database.Database
  dbPath: string
  tempDir: string
  // Repositories for direct access in tests
  repositories: {
    profile: ProfileRepository
    job: JobRepository
    analysis: AnalysisRepository
    settings: SettingsRepository
  }
  // Services for mocking
  services: {
    profile: ProfileService
    job: JobService
    search: SearchService
    ai: AIService
  }
}

/**
 * Setup isolated test server with temporary database
 */
export async function setupTestServer(): Promise<TestServerInstance> {
  // Create unique temp directory for isolated database
  const testId = uuid().slice(0, 8)
  const tempDir = path.join(process.cwd(), `.test-${testId}`)
  fs.mkdirSync(tempDir, { recursive: true })

  const dbPath = path.join(tempDir, 'test.db')

  // Initialize database with schema
  const db = new Database(dbPath)

  // Read and execute schema
  const schemaPath = path.join(__dirname, '../../database/schema.sql')
  const schema = fs.readFileSync(schemaPath, 'utf-8')
  db.exec(schema)

  // Initialize Repositories
  const profileRepository = new ProfileRepository(db)
  const jobRepository = new JobRepository(db)
  const analysisRepository = new AnalysisRepository(db)
  const settingsRepository = new SettingsRepository(db)

  // Initialize Services
  const profileService = new ProfileService(profileRepository)
  const jobService = new JobService(jobRepository)
  const searchService = new SearchService(jobRepository, profileRepository)
  const aiService = new AIService(analysisRepository, jobRepository)

  // Initialize Controllers
  const profileController = new ProfileController(profileService)
  const jobController = new JobController(jobService)
  const searchController = new SearchController(searchService)
  const aiController = new AIController(aiService, () => settingsRepository.getCV())
  const settingsController = new SettingsController(settingsRepository)

  // Create Express app
  const app = express()
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', environment: 'test' })
  })

  // Mount routes
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
      profile: profileRepository,
      job: jobRepository,
      analysis: analysisRepository,
      settings: settingsRepository,
    },
    services: {
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
    fs.rmSync(server.tempDir, { recursive: true, force: true })
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
  server.db.exec("UPDATE settings SET value = '' WHERE key = 'cv_content'")
}

/**
 * Re-export database helpers for convenience
 */
export { cleanDatabase, cleanJobsAndAnalyses } from './database'

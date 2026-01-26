/**
 * SearchService Unit Tests
 *
 * Tests SerpAPI integration, parameter building, and job deduplication
 */

import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest'
import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import {SearchService} from '../../../services/search.service'
import {JobRepository} from '../../../repositories/job.repository'
import {ProfileRepository} from '../../../repositories/profile.repository'
import {fixtures} from '../../helpers/fixtures'

// Mock SerpAPI
vi.mock('serpapi', () => ({
    getJson: vi.fn(),
    config: {api_key: ''},
}))

// Mock environment config
vi.mock('../../../config/environment.config', () => ({
    env: {
        SERPAPI_KEY: 'test_serpapi_key',
        NODE_ENV: 'test',
    },
}))

describe('SearchService', () => {
    let db: Database.Database
    let jobRepository: JobRepository
    let profileRepository: ProfileRepository
    let searchService: SearchService
    let mockProviderRegistry: any

    beforeEach(() => {
        // Use in-memory database
        db = new Database(':memory:')

        // Load schema
        const schemaPath = path.join(__dirname, '../../../database/schema.sql')
        const schema = fs.readFileSync(schemaPath, 'utf-8')
        db.exec(schema)

        // Initialize repositories
        jobRepository = new JobRepository(db)
        profileRepository = new ProfileRepository(db)

        // Mock ProviderRegistry with SerpAPI provider
        const mockSerpAPIProvider = {
            name: 'serpapi',
            search: vi.fn(),
        }

        mockProviderRegistry = {
            getFirstAvailable: vi.fn().mockReturnValue(mockSerpAPIProvider),
            get: vi.fn().mockReturnValue(mockSerpAPIProvider),
        }

        searchService = new SearchService(jobRepository, profileRepository, mockProviderRegistry)

        // Reset mocks
        vi.clearAllMocks()
    })

    afterEach(() => {
        db.close()
    })

    // Helper to seed a profile
    function seedProfile(data: Partial<typeof fixtures.profile> = {}) {
        const profile = {...fixtures.profile, ...data}
        db.prepare(
            `
      INSERT INTO search_profiles (id, name, keywords, location, date_posted, radius, active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
        ).run(
            profile.id,
            profile.name,
            profile.keywords,
            profile.location,
            profile.date_posted,
            profile.radius,
            profile.active
        )
        return profile
    }

    // ============================================
    // Provider Integration
    // ============================================
    describe('Provider Integration', () => {
        it('should call provider search with profile parameters', async () => {
            // Arrange
            seedProfile({
                id: 'profile-params',
                keywords: 'software engineer',
                location: 'New York, NY',
                radius: 50,
                date_posted: 'week',
            })

            const mockProvider = mockProviderRegistry.getFirstAvailable()
            vi.mocked(mockProvider.search).mockResolvedValue({
                provider: 'serpapi',
                jobs: [],
            })

            // Act
            await searchService.executeSearch('profile-params')

            // Assert - check params passed to provider.search
            expect(mockProvider.search).toHaveBeenCalledWith({
                keywords: 'software engineer',
                location: 'New York, NY',
                radius: 50,
                date_posted: 'week',
            })
        })
    })

    // ============================================
    // executeSearch
    // ============================================
    describe('executeSearch', () => {
        it('should throw error when profile not found', async () => {
            // Act & Assert
            await expect(searchService.executeSearch('non-existent-profile')).rejects.toThrow(
                'Profile not found'
            )
        })

        it('should return results with job count', async () => {
            // Arrange
            seedProfile({id: 'profile-results'})

            const mockProvider = mockProviderRegistry.getFirstAvailable()
            vi.mocked(mockProvider.search).mockResolvedValue({
                provider: 'serpapi',
                jobs: [
                    {provider_job_id: 'job1', title: 'Job 1', company: 'Company 1'},
                    {provider_job_id: 'job2', title: 'Job 2', company: 'Company 2'},
                ],
            })

            // Act
            const result = await searchService.executeSearch('profile-results')

            // Assert
            expect(result.jobsFound).toBe(2)
            expect(result.newJobs).toBe(2)
            expect(result.analyzed).toBe(false)
        })

        it('should handle empty results gracefully', async () => {
            // Arrange
            seedProfile({id: 'profile-empty'})

            const mockProvider = mockProviderRegistry.getFirstAvailable()
            vi.mocked(mockProvider.search).mockResolvedValue({
                provider: 'serpapi',
                jobs: [],
            })

            // Act
            const result = await searchService.executeSearch('profile-empty')

            // Assert - should NOT throw, return 0 jobs
            expect(result.jobsFound).toBe(0)
            expect(result.newJobs).toBe(0)
        })

        it('should throw error on provider error', async () => {
            // Arrange
            seedProfile({id: 'profile-error'})

            const mockProvider = mockProviderRegistry.getFirstAvailable()
            vi.mocked(mockProvider.search).mockRejectedValue(new Error('Provider failure'))

            // Act & Assert
            await expect(searchService.executeSearch('profile-error')).rejects.toThrow(
                'Provider failure'
            )
        })
    })

    // ============================================
    // saveJobs (via executeSearch - deduplication)
    // ============================================
    describe('saveJobs (Deduplication)', () => {
        it('should skip duplicate jobs based on provider_job_id', async () => {
            // Arrange - create profile and existing job
            seedProfile({id: 'profile-dup'})

            // Pre-insert a job
            const now = new Date().toISOString()
            db.prepare(
                `
        INSERT INTO jobs (id, profile_id, provider, provider_job_id, title, status, fetched_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'new', ?, ?, ?)
      `
            ).run(
                'existing-job',
                'profile-dup',
                'serpapi',
                'job_123',
                'Existing Job',
                now,
                now,
                now
            )

            const mockProvider = mockProviderRegistry.getFirstAvailable()
            vi.mocked(mockProvider.search).mockResolvedValue({
                provider: 'serpapi',
                jobs: [
                    {provider_job_id: 'job_123', title: 'Duplicate Job', company: 'Company A'},
                    {provider_job_id: 'job_456', title: 'New Job', company: 'Company B'},
                ],
            })

            // Act
            const result = await searchService.executeSearch('profile-dup')

            // Assert - only 1 new job saved (the other was duplicate)
            expect(result.jobsFound).toBe(2)
            expect(result.newJobs).toBe(1) // Only job_456 should be saved

            // Verify in database
            const jobs = db.prepare('SELECT * FROM jobs').all()
            expect(jobs).toHaveLength(2) // 1 existing + 1 new
        })

        it('should save all jobs when none are duplicates', async () => {
            // Arrange
            seedProfile({id: 'profile-new'})

            const mockProvider = mockProviderRegistry.getFirstAvailable()
            vi.mocked(mockProvider.search).mockResolvedValue({
                provider: 'serpapi',
                jobs: [
                    {provider_job_id: 'job_1', title: 'Job 1', company: 'Company 1'},
                    {provider_job_id: 'job_2', title: 'Job 2', company: 'Company 2'},
                ],
            })

            // Act
            const result = await searchService.executeSearch('profile-new')

            // Assert
            expect(result.jobsFound).toBe(2)
            expect(result.newJobs).toBe(2)

            // Verify in database
            const jobs = db.prepare('SELECT * FROM jobs').all()
            expect(jobs).toHaveLength(2)
        })

        it('should allow same provider_job_id from DIFFERENT providers', async () => {
            // Arrange
            seedProfile({id: 'profile-multi'})

            // Pre-insert a job from serpapi
            const now = new Date().toISOString()
            db.prepare(
                `
        INSERT INTO jobs (id, profile_id, provider, provider_job_id, title, status, fetched_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'new', ?, ?, ?)
      `
            ).run(
                'job-serpapi',
                'profile-multi',
                'serpapi',
                'job_shared',
                'Job Serp',
                now,
                now,
                now
            )

            // Mock glassdoor provider
            const mockGlassdoorProvider = {
                name: 'glassdoor',
                isAvailable: vi.fn().mockReturnValue(true),
                search: vi.fn().mockResolvedValue({
                    provider: 'glassdoor',
                    jobs: [
                        {provider_job_id: 'job_shared', title: 'Job Glassdoor', company: 'Company'},
                    ],
                }),
            }
            vi.mocked(mockProviderRegistry.get).mockReturnValue(mockGlassdoorProvider)

            // Act
            const result = await searchService.executeSearch('profile-multi', 'glassdoor')

            // Assert - should be saved as a new job because provider is different
            expect(result.newJobs).toBe(1)

            const jobs = db.prepare('SELECT * FROM jobs').all()
            expect(jobs).toHaveLength(2)
        })

        it('should correctly map provider fields to job entity', async () => {
            // Arrange
            seedProfile({id: 'profile-map'})

            const mockProvider = mockProviderRegistry.getFirstAvailable()
            vi.mocked(mockProvider.search).mockResolvedValue({
                provider: 'serpapi',
                jobs: [
                    {
                        provider_job_id: 'custom_123',
                        title: 'Custom Title',
                        company: 'Custom Company',
                        location: 'Custom Location',
                        description: 'Custom Description',
                        source: 'Custom Source',
                        apply_link: 'https://apply.com',
                        posted_date: '1 day ago',
                    },
                ],
            })

            // Act
            await searchService.executeSearch('profile-map')

            // Assert - verify field mapping
            const job = db
                .prepare('SELECT * FROM jobs WHERE provider_job_id = ?')
                .get('custom_123') as any

            expect(job).toBeDefined()
            expect(job.title).toBe('Custom Title')
            expect(job.company).toBe('Custom Company')
            expect(job.location).toBe('Custom Location')
            expect(job.description).toBe('Custom Description')
            expect(job.source).toBe('Custom Source')
            expect(job.apply_link).toBe('https://apply.com')
            expect(job.posted_date).toBe('1 day ago')
            expect(job.profile_id).toBe('profile-map')
            expect(job.status).toBe('new')
            expect(job.provider).toBe('serpapi')
        })
    })
})

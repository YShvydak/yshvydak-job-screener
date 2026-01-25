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

    beforeEach(() => {
        // Use in-memory database
        db = new Database(':memory:')

        // Load schema
        const schemaPath = path.join(__dirname, '../../../database/schema.sql')
        const schema = fs.readFileSync(schemaPath, 'utf-8')
        db.exec(schema)

        // Initialize repositories and service
        jobRepository = new JobRepository(db)
        profileRepository = new ProfileRepository(db)
        searchService = new SearchService(jobRepository, profileRepository)

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
    // buildSearchParams (via executeSearch reflection)
    // ============================================
    describe('buildSearchParams', () => {
        it('should build params with location when provided', async () => {
            // Arrange
            seedProfile({
                id: 'profile-loc',
                keywords: 'software engineer',
                location: 'New York, NY',
                radius: 50,
                date_posted: 'week',
            })

            const {getJson} = await import('serpapi')
            vi.mocked(getJson).mockResolvedValue({jobs_results: []})

            // Act
            await searchService.executeSearch('profile-loc')

            // Assert - check params passed to getJson
            expect(getJson).toHaveBeenCalledWith(
                expect.objectContaining({
                    engine: 'google_jobs',
                    q: 'software engineer',
                    hl: 'en',
                    location: 'New York, NY',
                    lrad: '31', // 50km ≈ 31 miles
                    chips: 'date_posted:week',
                })
            )
        })

        it('should build params WITHOUT location when empty (global search)', async () => {
            // Arrange
            seedProfile({
                id: 'profile-global',
                keywords: 'react developer',
                location: '', // Empty = global search
                radius: 0,
                date_posted: 'month',
            })

            const {getJson} = await import('serpapi')
            vi.mocked(getJson).mockResolvedValue({jobs_results: []})

            // Act
            await searchService.executeSearch('profile-global')

            // Assert - location and lrad should NOT be present
            expect(getJson).toHaveBeenCalledWith(
                expect.objectContaining({
                    engine: 'google_jobs',
                    q: 'react developer',
                    hl: 'en',
                    chips: 'date_posted:month',
                })
            )

            // Verify location is NOT in the call
            const callArgs = vi.mocked(getJson).mock.calls[0][0]
            expect(callArgs).not.toHaveProperty('location')
            expect(callArgs).not.toHaveProperty('lrad')
        })

        it('should build params without date filter when not specified', async () => {
            // Arrange
            seedProfile({
                id: 'profile-no-date',
                keywords: 'typescript',
                location: 'Remote',
                date_posted: null as any,
            })

            const {getJson} = await import('serpapi')
            vi.mocked(getJson).mockResolvedValue({jobs_results: []})

            // Act
            await searchService.executeSearch('profile-no-date')

            // Assert - chips should NOT be present
            const callArgs = vi.mocked(getJson).mock.calls[0][0]
            expect(callArgs).not.toHaveProperty('chips')
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

            const {getJson} = await import('serpapi')
            vi.mocked(getJson).mockResolvedValue(fixtures.serpApiResponse)

            // Act
            const result = await searchService.executeSearch('profile-results')

            // Assert
            expect(result.jobsFound).toBe(2) // From fixtures.serpApiResponse
            expect(result.newJobs).toBe(2)
            expect(result.analyzed).toBe(false)
        })

        it('should handle "no results" response gracefully', async () => {
            // Arrange
            seedProfile({id: 'profile-empty'})

            const {getJson} = await import('serpapi')
            vi.mocked(getJson).mockResolvedValue({
                error: "Google hasn't returned any results for this query.",
            })

            // Act
            const result = await searchService.executeSearch('profile-empty')

            // Assert - should NOT throw, return 0 jobs
            expect(result.jobsFound).toBe(0)
            expect(result.newJobs).toBe(0)
        })

        it('should throw error on SerpAPI error (non-empty results)', async () => {
            // Arrange
            seedProfile({id: 'profile-error'})

            const {getJson} = await import('serpapi')
            vi.mocked(getJson).mockResolvedValue({
                error: 'Invalid API key',
            })

            // Act & Assert
            await expect(searchService.executeSearch('profile-error')).rejects.toThrow(
                'SerpAPI error: Invalid API key'
            )
        })

        it('should return empty response when jobs_results is empty array', async () => {
            // Arrange
            seedProfile({id: 'profile-empty-arr'})

            const {getJson} = await import('serpapi')
            vi.mocked(getJson).mockResolvedValue(fixtures.serpApiEmptyResponse)

            // Act
            const result = await searchService.executeSearch('profile-empty-arr')

            // Assert
            expect(result.jobsFound).toBe(0)
            expect(result.newJobs).toBe(0)
        })
    })

    // ============================================
    // saveJobs (via executeSearch - deduplication)
    // ============================================
    describe('saveJobs (Deduplication)', () => {
        it('should skip duplicate jobs based on serpapi_job_id', async () => {
            // Arrange - create profile and existing job
            seedProfile({id: 'profile-dup'})

            // Pre-insert a job with same serpapi_job_id as in fixtures
            const now = new Date().toISOString()
            db.prepare(
                `
        INSERT INTO jobs (id, profile_id, serpapi_job_id, title, status, fetched_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'new', ?, ?, ?)
      `
            ).run('existing-job', 'profile-dup', 'serpapi_new_123', 'Existing Job', now, now, now)

            const {getJson} = await import('serpapi')
            vi.mocked(getJson).mockResolvedValue(fixtures.serpApiResponse)

            // Act
            const result = await searchService.executeSearch('profile-dup')

            // Assert - only 1 new job saved (the other was duplicate)
            expect(result.jobsFound).toBe(2)
            expect(result.newJobs).toBe(1) // Only serpapi_new_456 should be saved

            // Verify in database
            const jobs = db.prepare('SELECT * FROM jobs').all()
            expect(jobs).toHaveLength(2) // 1 existing + 1 new
        })

        it('should save all jobs when none are duplicates', async () => {
            // Arrange
            seedProfile({id: 'profile-new'})

            const {getJson} = await import('serpapi')
            vi.mocked(getJson).mockResolvedValue(fixtures.serpApiResponse)

            // Act
            const result = await searchService.executeSearch('profile-new')

            // Assert
            expect(result.jobsFound).toBe(2)
            expect(result.newJobs).toBe(2)

            // Verify in database
            const jobs = db.prepare('SELECT * FROM jobs').all()
            expect(jobs).toHaveLength(2)
        })

        it('should dedupe using share_link when job_id is missing', async () => {
            // Arrange
            seedProfile({id: 'profile-share-link'})
            const response = {
                jobs_results: [
                    {
                        job_id: null,
                        title: 'QA Automation Engineer',
                        company_name: 'QA Co',
                        location: 'Remote',
                        share_link: 'https://example.com/jobs/qa-automation',
                        detected_extensions: {posted_at: '1 day ago'},
                    } as any,
                ],
            }

            const {getJson} = await import('serpapi')
            vi.mocked(getJson).mockResolvedValueOnce(response).mockResolvedValueOnce(response)

            // Act
            const first = await searchService.executeSearch('profile-share-link')
            const second = await searchService.executeSearch('profile-share-link')

            // Assert
            expect(first.newJobs).toBe(1)
            expect(second.newJobs).toBe(0)

            const jobs = db.prepare('SELECT * FROM jobs').all() as any[]
            expect(jobs).toHaveLength(1)
            expect(jobs[0].serpapi_job_id).toBe('https://example.com/jobs/qa-automation')
        })

        it('should dedupe using apply link when share_link and job_id are missing', async () => {
            // Arrange
            seedProfile({id: 'profile-apply-link'})
            const response = {
                jobs_results: [
                    {
                        job_id: null,
                        title: 'SDET',
                        company_name: 'Test Co',
                        location: 'Remote',
                        apply_options: [{title: 'Apply', link: 'https://apply.example.com/sdet'}],
                        detected_extensions: {posted_at: '2 days ago'},
                    } as any,
                ],
            }

            const {getJson} = await import('serpapi')
            vi.mocked(getJson).mockResolvedValueOnce(response).mockResolvedValueOnce(response)

            // Act
            const first = await searchService.executeSearch('profile-apply-link')
            const second = await searchService.executeSearch('profile-apply-link')

            // Assert
            expect(first.newJobs).toBe(1)
            expect(second.newJobs).toBe(0)

            const jobs = db.prepare('SELECT * FROM jobs').all() as any[]
            expect(jobs).toHaveLength(1)
            expect(jobs[0].serpapi_job_id).toBe('https://apply.example.com/sdet')
        })

        it('should dedupe using fallback identifier when no links are present', async () => {
            // Arrange
            seedProfile({id: 'profile-fallback'})
            const response = {
                jobs_results: [
                    {
                        job_id: null,
                        title: 'Manual QA',
                        company_name: 'Quality Inc',
                        location: 'Berlin',
                        detected_extensions: {posted_at: '3 days ago'},
                    } as any,
                ],
            }

            const {getJson} = await import('serpapi')
            vi.mocked(getJson).mockResolvedValueOnce(response).mockResolvedValueOnce(response)

            // Act
            const first = await searchService.executeSearch('profile-fallback')
            const second = await searchService.executeSearch('profile-fallback')

            // Assert
            expect(first.newJobs).toBe(1)
            expect(second.newJobs).toBe(0)

            const jobs = db.prepare('SELECT * FROM jobs').all() as any[]
            expect(jobs).toHaveLength(1)
            expect(jobs[0].serpapi_job_id).toBe('fallback:Manual QA|Quality Inc|Berlin|3 days ago')
        })

        it('should correctly map SerpAPI fields to job entity', async () => {
            // Arrange
            seedProfile({id: 'profile-map'})

            const customResponse = {
                jobs_results: [
                    {
                        job_id: 'custom_123',
                        title: 'Custom Title',
                        company_name: 'Custom Company',
                        location: 'Custom Location',
                        description: 'Custom Description',
                        via: 'Custom Source',
                        apply_options: [{title: 'Apply', link: 'https://apply.com'}],
                        detected_extensions: {posted_at: '1 day ago'},
                    },
                ],
            }

            const {getJson} = await import('serpapi')
            vi.mocked(getJson).mockResolvedValue(customResponse)

            // Act
            await searchService.executeSearch('profile-map')

            // Assert - verify field mapping
            const job = db
                .prepare('SELECT * FROM jobs WHERE serpapi_job_id = ?')
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
        })
    })
})

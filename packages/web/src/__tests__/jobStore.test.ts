/**
 * Job store tests
 */

import {describe, it, expect, beforeEach, vi} from 'vitest'
import {useJobStore} from '../stores/jobStore'
import * as api from '../api/client'

vi.mock('../api/client', () => ({
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    del: vi.fn(),
    put: vi.fn(),
}))

const initialState = {
    jobs: [],
    stats: {new: 0, applied: 0, saved: 0, rejected: 0, total: 0},
    loading: false,
    error: null,
    filters: {},
}

describe('useJobStore', () => {
    beforeEach(() => {
        useJobStore.setState(initialState)
        vi.clearAllMocks()
    })

    it('fetchJobs should load jobs with filters', async () => {
        useJobStore.setState({filters: {status: 'new', profileId: 'profile-1', minScore: 70}})

        vi.mocked(api.get).mockResolvedValue({
            jobs: [{id: 'job-1', serpapi_job_id: 'serp_1', title: 'Job 1', status: 'new'}],
        })

        await useJobStore.getState().fetchJobs()

        expect(vi.mocked(api.get)).toHaveBeenCalled()
        const call = vi.mocked(api.get).mock.calls[0][0]
        expect(call).toContain('/jobs?')
        expect(call).toContain('includeAnalysis=true')
        expect(call).toContain('status=new')
        expect(call).toContain('profileId=profile-1')
        expect(call).toContain('minScore=70')
        expect(useJobStore.getState().jobs).toHaveLength(1)
        expect(useJobStore.getState().loading).toBe(false)
    })

    it('fetchJobs should set error on failure', async () => {
        vi.mocked(api.get).mockRejectedValue(new Error('Fetch failed'))

        await useJobStore.getState().fetchJobs()

        expect(useJobStore.getState().error).toBe('Fetch failed')
        expect(useJobStore.getState().loading).toBe(false)
    })

    it('updateStatus should update job and refresh stats', async () => {
        useJobStore.setState({
            jobs: [{id: 'job-1', serpapi_job_id: 'serp_1', title: 'Job 1', status: 'new'} as any],
        })

        vi.mocked(api.patch).mockResolvedValue({
            job: {id: 'job-1', status: 'applied'},
        })
        vi.mocked(api.get).mockResolvedValue({
            stats: {new: 0, applied: 1, saved: 0, rejected: 0, total: 1},
        })

        await useJobStore.getState().updateStatus('job-1', 'applied')

        expect(useJobStore.getState().jobs[0].status).toBe('applied')
        expect(vi.mocked(api.patch)).toHaveBeenCalled()
    })

    it('deleteJob should remove job and refresh stats', async () => {
        useJobStore.setState({
            jobs: [
                {id: 'job-1', serpapi_job_id: 'serp_1', title: 'Job 1', status: 'new'} as any,
                {id: 'job-2', serpapi_job_id: 'serp_2', title: 'Job 2', status: 'new'} as any,
            ],
        })

        vi.mocked(api.del).mockResolvedValue({})
        vi.mocked(api.get).mockResolvedValue({
            stats: {new: 1, applied: 0, saved: 0, rejected: 0, total: 1},
        })

        await useJobStore.getState().deleteJob('job-1')

        expect(useJobStore.getState().jobs).toHaveLength(1)
        expect(useJobStore.getState().jobs[0].id).toBe('job-2')
    })

    it('analyzeJob should attach analysis to job', async () => {
        useJobStore.setState({
            jobs: [{id: 'job-1', serpapi_job_id: 'serp_1', title: 'Job 1', status: 'new'} as any],
        })

        vi.mocked(api.post).mockResolvedValue({
            analysis: {match_score: 80, recommendation: 'APPLY', strengths: '[]', gaps: '[]'},
        })

        await useJobStore.getState().analyzeJob('job-1')

        expect(useJobStore.getState().jobs[0].analysis).toBeDefined()
        expect(useJobStore.getState().loading).toBe(false)
    })

    it('setFilters should merge filters', () => {
        useJobStore.getState().setFilters({status: 'new'})

        expect(useJobStore.getState().filters.status).toBe('new')
    })
})

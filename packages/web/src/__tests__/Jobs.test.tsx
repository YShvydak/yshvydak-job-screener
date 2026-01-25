/**
 * Jobs page tests
 */

import {describe, it, expect, vi} from 'vitest'
import {render, screen} from '@testing-library/react'
import {Jobs} from '../pages/Jobs'

const mockJobState = {
    jobs: [],
    loading: false,
    error: null,
    filters: {},
    analyzingJobs: new Set<string>(),
    fetchJobs: vi.fn(),
    updateStatus: vi.fn(),
    deleteJob: vi.fn(),
    analyzeJob: vi.fn(),
    setFilters: vi.fn(),
}

const mockSettingsState = {
    aiMethod: 'api' as const,
    fetchAIMethod: vi.fn(),
}

vi.mock('../stores/jobStore', () => ({
    useJobStore: () => mockJobState,
}))

vi.mock('../stores/settingsStore', () => ({
    useSettingsStore: () => mockSettingsState,
}))

describe('Jobs', () => {
    it('renders empty state when no jobs', () => {
        mockJobState.jobs = []
        mockJobState.loading = false

        render(<Jobs />)

        expect(screen.getByText('Jobs')).toBeInTheDocument()
        expect(screen.getByText('No jobs found')).toBeInTheDocument()
    })

    it('renders job list', () => {
        mockJobState.jobs = [
            {
                id: 'job-1',
                title: 'Senior Engineer',
                company: 'Test Co',
                location: 'Remote',
                status: 'new',
                serpapi_job_id: 'serp_1',
                analysis: null,
            },
        ] as any

        render(<Jobs />)

        expect(screen.getByText('Senior Engineer')).toBeInTheDocument()
        expect(screen.getByText('1 jobs found')).toBeInTheDocument()
    })
})

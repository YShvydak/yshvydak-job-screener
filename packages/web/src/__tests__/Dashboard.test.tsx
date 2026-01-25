/**
 * Dashboard page tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Dashboard } from '../pages/Dashboard'

const fetchStats = vi.fn()
const fetchProfiles = vi.fn()
const fetchCV = vi.fn()

vi.mock('../stores/jobStore', () => ({
  useJobStore: () => ({
    stats: { new: 1, applied: 2, saved: 0, rejected: 0, total: 3 },
    fetchStats,
  }),
}))

vi.mock('../stores/profileStore', () => ({
  useProfileStore: () => ({
    profiles: [],
    fetchProfiles,
  }),
}))

vi.mock('../stores/settingsStore', () => ({
  useSettingsStore: () => ({
    hasCV: false,
    fetchCV,
  }),
}))

describe('Dashboard', () => {
  it('renders summary and calls fetchers', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Setup Required')).toBeInTheDocument()

    await waitFor(() => {
      expect(fetchStats).toHaveBeenCalled()
      expect(fetchProfiles).toHaveBeenCalled()
      expect(fetchCV).toHaveBeenCalled()
    })
  })
})

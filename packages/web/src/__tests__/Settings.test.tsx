/**
 * Settings page tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Settings } from '../pages/Settings'
import * as api from '../api/client'

const fetchCV = vi.fn()

const mockState = {
  cvContent: '',
  hasCV: false,
  loading: false,
  error: null,
  fetchCV,
  saveCV: vi.fn(),
  deleteCV: vi.fn(),
}

vi.mock('../stores/settingsStore', () => ({
  useSettingsStore: () => mockState,
}))

vi.mock('../api/client', () => ({
  del: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
}))

describe('Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.confirm = vi.fn(() => true)
  })

  it('shows empty state when no CV uploaded', () => {
    mockState.hasCV = false
    mockState.cvContent = ''

    render(<Settings />)

    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('No CV uploaded yet. Upload your CV to enable AI job matching.')).toBeInTheDocument()
    expect(screen.getByText('Delete All Jobs')).toBeInTheDocument()
  })

  it('shows CV content when uploaded', () => {
    mockState.hasCV = true
    mockState.cvContent = 'My CV'

    render(<Settings />)

    expect(screen.getByText('CV Uploaded')).toBeInTheDocument()
    expect(screen.getByText('My CV')).toBeInTheDocument()
  })

  it('should clear all jobs when confirmed', async () => {
    vi.mocked(api.del).mockResolvedValue({ deletedCount: 5 })
    window.confirm = vi.fn(() => true)

    render(<Settings />)

    const button = screen.getByText('Delete All Jobs')
    await userEvent.click(button)

    expect(window.confirm).toHaveBeenCalledWith('Delete all jobs? This cannot be undone.')
    expect(api.del).toHaveBeenCalledWith('/jobs')

    await waitFor(() => {
      expect(screen.getByText('All jobs have been deleted.')).toBeInTheDocument()
    })
  })

  it('should not clear jobs when confirmation is cancelled', async () => {
    window.confirm = vi.fn(() => false)

    render(<Settings />)

    const button = screen.getByText('Delete All Jobs')
    await userEvent.click(button)

    expect(window.confirm).toHaveBeenCalled()
    expect(api.del).not.toHaveBeenCalled()
  })

  it('should show error message when clearing jobs fails', async () => {
    vi.mocked(api.del).mockRejectedValue(new Error('Failed to delete'))
    window.confirm = vi.fn(() => true)

    render(<Settings />)

    const button = screen.getByText('Delete All Jobs')
    await userEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Failed to delete')).toBeInTheDocument()
    })
  })
})

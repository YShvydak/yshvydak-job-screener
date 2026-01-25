/**
 * Profiles page tests
 */

import {describe, it, expect, vi} from 'vitest'
import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {Profiles} from '../pages/Profiles'

const fetchProfiles = vi.fn()

const mockState = {
    profiles: [],
    loading: false,
    error: null,
    fetchProfiles,
    createProfile: vi.fn(),
    updateProfile: vi.fn(),
    toggleProfile: vi.fn(),
    deleteProfile: vi.fn(),
    runSearch: vi.fn(),
}

vi.mock('../stores/profileStore', () => ({
    useProfileStore: () => mockState,
}))

describe('Profiles', () => {
    it('renders empty state and calls fetch', async () => {
        mockState.profiles = []

        render(<Profiles />)

        expect(screen.getByText('Search Profiles')).toBeInTheDocument()
        expect(screen.getByText('No search profiles yet')).toBeInTheDocument()

        await waitFor(() => {
            expect(fetchProfiles).toHaveBeenCalled()
        })
    })

    it('should show date_posted field as required in form', async () => {
        mockState.profiles = []
        const user = userEvent.setup()

        const {container} = render(<Profiles />)

        // Click "Create Profile" button
        const createButton = screen.getByText('Create Profile')
        await user.click(createButton)

        // Wait for form to appear
        await waitFor(() => {
            expect(screen.getByText(/Profile Name/i)).toBeInTheDocument()
        })

        // Check that label shows required indicator (red asterisk)
        const label = screen.getByText(/Date Posted/i)
        expect(label).toBeInTheDocument()

        // Find the select element by its position (after the label)
        const datePostedSelect = container.querySelector('select[required]')
        expect(datePostedSelect).toBeInTheDocument()
        expect(datePostedSelect).toHaveAttribute('required')
    })
})

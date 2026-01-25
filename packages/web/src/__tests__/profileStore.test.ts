/**
 * Profile store tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useProfileStore } from '../stores/profileStore'
import * as api from '../api/client'

vi.mock('../api/client', () => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
  put: vi.fn(),
}))

const initialState = {
  profiles: [],
  loading: false,
  error: null,
}

describe('useProfileStore', () => {
  beforeEach(() => {
    useProfileStore.setState(initialState)
    vi.clearAllMocks()
  })

  it('fetchProfiles should load profiles', async () => {
    vi.mocked(api.get).mockResolvedValue({
      profiles: [{ id: 'profile-1', name: 'Profile', keywords: 'react', location: '' }],
    })

    await useProfileStore.getState().fetchProfiles()

    expect(useProfileStore.getState().profiles).toHaveLength(1)
  })

  it('createProfile should prepend new profile', async () => {
    vi.mocked(api.post).mockResolvedValue({
      profile: { id: 'profile-1', name: 'Profile', keywords: 'react', location: '', date_posted: 'today' },
    })

    const result = await useProfileStore.getState().createProfile({
      name: 'Profile',
      keywords: 'react',
      location: '',
      date_posted: 'today',
    })

    expect(result.id).toBe('profile-1')
    expect(useProfileStore.getState().profiles[0].id).toBe('profile-1')
  })

  it('updateProfile should update profile in state', async () => {
    useProfileStore.setState({
      profiles: [{ id: 'profile-1', name: 'Old', keywords: 'react', location: '' }] as any,
    })
    vi.mocked(api.put).mockResolvedValue({
      profile: { id: 'profile-1', name: 'New', keywords: 'react', location: '' },
    })

    await useProfileStore.getState().updateProfile('profile-1', { name: 'New' })

    expect(useProfileStore.getState().profiles[0].name).toBe('New')
  })

  it('toggleProfile should update active status', async () => {
    useProfileStore.setState({
      profiles: [{ id: 'profile-1', name: 'Profile', keywords: 'react', location: '', active: 1 }] as any,
    })
    vi.mocked(api.patch).mockResolvedValue({
      profile: { id: 'profile-1', name: 'Profile', keywords: 'react', location: '', active: 0 },
    })

    await useProfileStore.getState().toggleProfile('profile-1')

    expect(useProfileStore.getState().profiles[0].active).toBe(0)
  })

  it('deleteProfile should remove profile', async () => {
    useProfileStore.setState({
      profiles: [
        { id: 'profile-1', name: 'Profile', keywords: 'react', location: '' } as any,
        { id: 'profile-2', name: 'Profile 2', keywords: 'ts', location: '' } as any,
      ],
    })
    vi.mocked(api.del).mockResolvedValue({})

    await useProfileStore.getState().deleteProfile('profile-1')

    expect(useProfileStore.getState().profiles).toHaveLength(1)
    expect(useProfileStore.getState().profiles[0].id).toBe('profile-2')
  })

  it('runSearch should return result and clear loading', async () => {
    vi.mocked(api.post).mockResolvedValue({
      result: { jobsFound: 2, newJobs: 1 },
    })

    const result = await useProfileStore.getState().runSearch('profile-1')

    expect(result.jobsFound).toBe(2)
    expect(useProfileStore.getState().loading).toBe(false)
  })
})

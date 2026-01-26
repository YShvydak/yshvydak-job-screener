import {create} from 'zustand'
import {
    SearchProfile,
    SearchProfileInput,
    JobProvider,
    ProviderStatus,
} from '@yshvydak-job-screener/shared'
import * as api from '../api/client'

interface SearchResult {
    jobsFound: number
    newJobs: number
    provider?: JobProvider
}

interface ProfileState {
    profiles: SearchProfile[]
    providers: ProviderStatus[]
    loading: boolean
    error: string | null
    // Actions
    fetchProfiles: () => Promise<void>
    fetchProviders: () => Promise<void>
    createProfile: (input: SearchProfileInput) => Promise<SearchProfile>
    updateProfile: (id: string, input: Partial<SearchProfileInput>) => Promise<void>
    toggleProfile: (id: string) => Promise<void>
    deleteProfile: (id: string) => Promise<void>
    runSearch: (profileId: string, provider?: JobProvider) => Promise<SearchResult>
}

export const useProfileStore = create<ProfileState>()((set) => ({
    profiles: [],
    providers: [],
    loading: false,
    error: null,

    fetchProfiles: async () => {
        set({loading: true, error: null})
        try {
            const data = await api.get<{profiles: SearchProfile[]}>('/profiles')
            set({profiles: data.profiles, loading: false})
        } catch (error) {
            set({error: (error as Error).message, loading: false})
        }
    },

    fetchProviders: async () => {
        try {
            const data = await api.get<{providers: ProviderStatus[]}>('/search/providers')
            set({providers: data.providers})
        } catch (error) {
            console.error('Failed to fetch providers:', error)
        }
    },

    createProfile: async (input) => {
        set({loading: true, error: null})
        try {
            const data = await api.post<{profile: SearchProfile}>('/profiles', input)
            set((state) => ({
                profiles: [data.profile, ...state.profiles],
                loading: false,
            }))
            return data.profile
        } catch (error) {
            set({error: (error as Error).message, loading: false})
            throw error
        }
    },

    updateProfile: async (id, input) => {
        set({loading: true, error: null})
        try {
            const data = await api.put<{profile: SearchProfile}>(`/profiles/${id}`, input)
            set((state) => ({
                profiles: state.profiles.map((p) => (p.id === id ? data.profile : p)),
                loading: false,
            }))
        } catch (error) {
            set({error: (error as Error).message, loading: false})
            throw error
        }
    },

    toggleProfile: async (id) => {
        try {
            const data = await api.patch<{profile: SearchProfile}>(`/profiles/${id}/toggle`)
            set((state) => ({
                profiles: state.profiles.map((p) => (p.id === id ? data.profile : p)),
            }))
        } catch (error) {
            set({error: (error as Error).message})
            throw error
        }
    },

    deleteProfile: async (id) => {
        try {
            await api.del(`/profiles/${id}`)
            set((state) => ({
                profiles: state.profiles.filter((p) => p.id !== id),
            }))
        } catch (error) {
            set({error: (error as Error).message})
            throw error
        }
    },

    runSearch: async (profileId, provider) => {
        set({loading: true, error: null})
        try {
            const data = await api.post<{result: SearchResult}>('/search/run', {
                profileId,
                provider,
            })
            set({loading: false})
            return data.result
        } catch (error) {
            set({error: (error as Error).message, loading: false})
            throw error
        }
    },
}))

import { create } from 'zustand';
import { SearchProfile, SearchProfileInput } from '@yshvydak-job-screener/shared';
import * as api from '../api/client';

interface ProfileState {
    profiles: SearchProfile[];
    loading: boolean;
    error: string | null;
    // Actions
    fetchProfiles: () => Promise<void>;
    createProfile: (input: SearchProfileInput) => Promise<SearchProfile>;
    updateProfile: (id: string, input: Partial<SearchProfileInput>) => Promise<void>;
    toggleProfile: (id: string) => Promise<void>;
    deleteProfile: (id: string) => Promise<void>;
    runSearch: (profileId: string) => Promise<{ jobsFound: number; newJobs: number }>;
}

export const useProfileStore = create<ProfileState>()((set) => ({
    profiles: [],
    loading: false,
    error: null,

    fetchProfiles: async () => {
        set({ loading: true, error: null });
        try {
            const data = await api.get<{ profiles: SearchProfile[] }>('/profiles');
            set({ profiles: data.profiles, loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },

    createProfile: async (input) => {
        set({ loading: true, error: null });
        try {
            const data = await api.post<{ profile: SearchProfile }>('/profiles', input);
            set((state) => ({
                profiles: [data.profile, ...state.profiles],
                loading: false
            }));
            return data.profile;
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },

    updateProfile: async (id, input) => {
        set({ loading: true, error: null });
        try {
            const data = await api.put<{ profile: SearchProfile }>(`/profiles/${id}`, input);
            set((state) => ({
                profiles: state.profiles.map((p) => (p.id === id ? data.profile : p)),
                loading: false
            }));
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },

    toggleProfile: async (id) => {
        try {
            const data = await api.patch<{ profile: SearchProfile }>(`/profiles/${id}/toggle`);
            set((state) => ({
                profiles: state.profiles.map((p) => (p.id === id ? data.profile : p))
            }));
        } catch (error) {
            set({ error: (error as Error).message });
            throw error;
        }
    },

    deleteProfile: async (id) => {
        try {
            await api.del(`/profiles/${id}`);
            set((state) => ({
                profiles: state.profiles.filter((p) => p.id !== id)
            }));
        } catch (error) {
            set({ error: (error as Error).message });
            throw error;
        }
    },

    runSearch: async (profileId) => {
        set({ loading: true, error: null });
        try {
            const data = await api.post<{ result: { jobsFound: number; newJobs: number } }>(
                '/search/run',
                { profileId }
            );
            set({ loading: false });
            return data.result;
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    }
}));

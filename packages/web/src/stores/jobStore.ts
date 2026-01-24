import { create } from 'zustand';
import { Job, JobWithAnalysis, JobStatus, JobFilters, AIAnalysisMethod } from '@yshvydak-job-screener/shared';
import * as api from '../api/client';

interface JobStats {
    new: number;
    applied: number;
    saved: number;
    rejected: number;
    total: number;
}

interface JobState {
    jobs: JobWithAnalysis[];
    stats: JobStats;
    loading: boolean;
    error: string | null;
    filters: JobFilters;
    analyzingJobs: Set<string>; // Track which jobs are being analyzed
    // Actions
    fetchJobs: () => Promise<void>;
    fetchStats: () => Promise<void>;
    updateStatus: (id: string, status: JobStatus) => Promise<void>;
    deleteJob: (id: string) => Promise<void>;
    analyzeJob: (id: string, method?: AIAnalysisMethod) => Promise<void>;
    setFilters: (filters: Partial<JobFilters>) => void;
}

export const useJobStore = create<JobState>()((set, get) => ({
    jobs: [],
    stats: { new: 0, applied: 0, saved: 0, rejected: 0, total: 0 },
    loading: false,
    error: null,
    filters: {},
    analyzingJobs: new Set<string>(),

    fetchJobs: async () => {
        set({ loading: true, error: null });
        try {
            const { filters } = get();
            const params = new URLSearchParams();
            params.append('includeAnalysis', 'true');
            if (filters.status) params.append('status', filters.status);
            if (filters.profileId) params.append('profileId', filters.profileId);
            if (filters.minScore !== undefined) params.append('minScore', String(filters.minScore));

            const data = await api.get<{ jobs: JobWithAnalysis[] }>(`/jobs?${params}`);
            set({ jobs: data.jobs, loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },

    fetchStats: async () => {
        try {
            const data = await api.get<{ stats: JobStats }>('/jobs/stats');
            set({ stats: data.stats });
        } catch (error) {
            set({ error: (error as Error).message });
        }
    },

    updateStatus: async (id, status) => {
        try {
            const data = await api.patch<{ job: Job }>(`/jobs/${id}/status`, { status });
            set((state) => ({
                jobs: state.jobs.map((j) => (j.id === id ? { ...j, status: data.job.status } : j))
            }));
            // Refresh stats after status change
            get().fetchStats();
        } catch (error) {
            set({ error: (error as Error).message });
            throw error;
        }
    },

    deleteJob: async (id) => {
        try {
            await api.del(`/jobs/${id}`);
            set((state) => ({
                jobs: state.jobs.filter((j) => j.id !== id)
            }));
            get().fetchStats();
        } catch (error) {
            set({ error: (error as Error).message });
            throw error;
        }
    },

    analyzeJob: async (id, method) => {
        // Add job to analyzing set
        set((state) => ({
            analyzingJobs: new Set(state.analyzingJobs).add(id),
            error: null
        }));
        try {
            const endpoint = method ? `/ai/analyze/${id}?method=${method}` : `/ai/analyze/${id}`;
            const data = await api.post<{ analysis: any }>(endpoint, {});
            set((state) => ({
                jobs: state.jobs.map((j) =>
                    j.id === id ? { ...j, analysis: data.analysis } : j
                ),
                analyzingJobs: (() => {
                    const newSet = new Set(state.analyzingJobs);
                    newSet.delete(id);
                    return newSet;
                })()
            }));
        } catch (error) {
            set((state) => ({
                error: (error as Error).message,
                analyzingJobs: (() => {
                    const newSet = new Set(state.analyzingJobs);
                    newSet.delete(id);
                    return newSet;
                })()
            }));
            throw error;
        }
    },

    setFilters: (newFilters) => {
        set((state) => ({
            filters: { ...state.filters, ...newFilters }
        }));
    }
}));

import { create } from 'zustand';
import * as api from '../api/client';

interface SettingsState {
    cvContent: string;
    hasCV: boolean;
    loading: boolean;
    error: string | null;
    // Actions
    fetchCV: () => Promise<void>;
    saveCV: (content: string) => Promise<void>;
    deleteCV: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()((set) => ({
    cvContent: '',
    hasCV: false,
    loading: false,
    error: null,

    fetchCV: async () => {
        set({ loading: true, error: null });
        try {
            const data = await api.get<{ cv_content: string; has_cv: boolean }>('/settings/cv');
            set({
                cvContent: data.cv_content,
                hasCV: data.has_cv,
                loading: false
            });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },

    saveCV: async (content) => {
        set({ loading: true, error: null });
        try {
            await api.post('/settings/cv', { content });
            set({
                cvContent: content,
                hasCV: content.length > 0,
                loading: false
            });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },

    deleteCV: async () => {
        set({ loading: true, error: null });
        try {
            await api.del('/settings/cv');
            set({
                cvContent: '',
                hasCV: false,
                loading: false
            });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    }
}));

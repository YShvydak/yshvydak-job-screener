/**
 * Settings store tests
 */

import {describe, it, expect, beforeEach, vi} from 'vitest'
import {useSettingsStore} from '../stores/settingsStore'
import * as api from '../api/client'

vi.mock('../api/client', () => ({
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    del: vi.fn(),
    put: vi.fn(),
}))

const initialState = {
    cvContent: '',
    hasCV: false,
    loading: false,
    error: null,
}

describe('useSettingsStore', () => {
    beforeEach(() => {
        useSettingsStore.setState(initialState)
        vi.clearAllMocks()
    })

    it('fetchCV should set content and hasCV', async () => {
        vi.mocked(api.get).mockResolvedValue({
            cv_content: 'My CV',
            has_cv: true,
        })

        await useSettingsStore.getState().fetchCV()

        expect(useSettingsStore.getState().cvContent).toBe('My CV')
        expect(useSettingsStore.getState().hasCV).toBe(true)
    })

    it('saveCV should update local state', async () => {
        vi.mocked(api.post).mockResolvedValue({})

        await useSettingsStore.getState().saveCV('New CV')

        expect(useSettingsStore.getState().cvContent).toBe('New CV')
        expect(useSettingsStore.getState().hasCV).toBe(true)
    })

    it('deleteCV should clear local state', async () => {
        useSettingsStore.setState({cvContent: 'Old CV', hasCV: true})
        vi.mocked(api.del).mockResolvedValue({})

        await useSettingsStore.getState().deleteCV()

        expect(useSettingsStore.getState().cvContent).toBe('')
        expect(useSettingsStore.getState().hasCV).toBe(false)
    })
})

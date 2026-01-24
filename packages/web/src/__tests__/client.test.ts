/**
 * API client tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { get, post } from '../api/client'

describe('api client', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should return data on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { value: 1 } }),
    })
    global.fetch = fetchMock as any

    const result = await get<{ value: number }>('/test')

    expect(result).toEqual({ value: 1 })
    expect(fetchMock).toHaveBeenCalled()
  })

  it('should throw when response is not ok', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ success: false, error: 'Bad Request' }),
    })
    global.fetch = fetchMock as any

    await expect(get('/test')).rejects.toThrow('Bad Request')
  })

  it('should send JSON body on post', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { ok: true } }),
    })
    global.fetch = fetchMock as any

    await post('/test', { name: 'Alice' })

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Alice' }),
      })
    )
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiError } from '@/lib/api-error'

const requireUserMock = vi.fn()
vi.mock('@/lib/auth', () => ({ requireUser: () => requireUserMock() }))

import { GET } from '@/app/api/users/me/route'

describe('GET /api/users/me', () => {
  beforeEach(() => vi.clearAllMocks())

  it('requires authentication', async () => {
    requireUserMock.mockRejectedValue(new ApiError(401, 'Not authenticated'))
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns the current user', async () => {
    requireUserMock.mockResolvedValue({ id: 1, username: 'john', email: 'john@example.com', phoneNumber: null, role: 'CLIENT', createdAt: new Date() })
    const res = await GET()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.username).toBe('john')
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: { offer: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() } },
}))

const requireAdminMock = vi.fn()
vi.mock('@/lib/auth', () => ({ requireAdmin: () => requireAdminMock() }))

import { prisma } from '@/lib/prisma'
import { ApiError } from '@/lib/api-error'
import { GET, POST } from '@/app/api/offers/route'

describe('GET /api/offers', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists offers ordered by id desc', async () => {
    ;(prisma.offer.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 2 }, { id: 1 }])
    const res = await GET()
    expect(res.status).toBe(200)
    expect(prisma.offer.findMany).toHaveBeenCalledWith({ orderBy: { id: 'desc' } })
  })
})

describe('POST /api/offers', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects non-admin callers', async () => {
    requireAdminMock.mockRejectedValue(new ApiError(403, 'Admin access required'))
    const req = new Request('http://localhost/api/offers', { method: 'POST', body: JSON.stringify({ title: 'Sale' }) })
    const res = await POST(req as never)
    expect(res.status).toBe(403)
  })

  it('creates an offer for an admin caller', async () => {
    requireAdminMock.mockResolvedValue({ id: 1, role: 'ADMIN' })
    ;(prisma.offer.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 3, title: 'Sale' })
    const req = new Request('http://localhost/api/offers', { method: 'POST', body: JSON.stringify({ title: 'Sale' }) })
    const res = await POST(req as never)
    expect(res.status).toBe(201)
  })
})

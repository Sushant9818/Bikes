import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: { part: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() } },
}))

const requireAdminMock = vi.fn()
vi.mock('@/lib/auth', () => ({ requireAdmin: () => requireAdminMock() }))

import { prisma } from '@/lib/prisma'
import { ApiError } from '@/lib/api-error'
import { GET, POST } from '@/app/api/parts/route'
import { DELETE } from '@/app/api/parts/[id]/route'

describe('GET /api/parts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists Suzuki parts filtered by type', async () => {
    ;(prisma.part.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 1, type: 'BIKE_PART' }])
    const req = new Request('http://localhost/api/parts?type=BIKE_PART')
    const res = await GET(req as never)
    expect(res.status).toBe(200)
    expect(prisma.part.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ brand: 'Suzuki', type: 'BIKE_PART' }) })
    )
  })
})

describe('POST /api/parts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects non-admin callers', async () => {
    requireAdminMock.mockRejectedValue(new ApiError(403, 'Admin access required'))
    const req = new Request('http://localhost/api/parts', {
      method: 'POST',
      body: JSON.stringify({ type: 'BIKE_PART', partName: 'Air Filter', price: 100, quantity: 5 }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(403)
  })
})

describe('DELETE /api/parts/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 204 on successful admin delete', async () => {
    requireAdminMock.mockResolvedValue({ id: 1, role: 'ADMIN' })
    ;(prisma.part.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 5 })
    ;(prisma.part.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 5 })
    const req = new Request('http://localhost/api/parts/5', { method: 'DELETE' })
    const res = await DELETE(req as never, { params: Promise.resolve({ id: '5' }) })
    expect(res.status).toBe(204)
  })
})

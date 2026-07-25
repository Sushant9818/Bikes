import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  },
}))

const requireUserMock = vi.fn()
const requireAdminMock = vi.fn()
vi.mock('@/lib/auth', () => ({
  requireUser: () => requireUserMock(),
  requireAdmin: () => requireAdminMock(),
}))

import { prisma } from '@/lib/prisma'
import { ApiError } from '@/lib/api-error'
import { GET as GET_MY } from '@/app/api/orders/my/route'
import { GET as GET_ALL } from '@/app/api/orders/route'
import { PUT as PUT_STATUS } from '@/app/api/orders/[id]/status/route'

describe('GET /api/orders/my', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns only the current user\'s orders', async () => {
    requireUserMock.mockResolvedValue({ id: 1 })
    ;(prisma.order.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 1, userId: 1 }])
    const res = await GET_MY()
    expect(res.status).toBe(200)
    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 1 } })
    )
  })
})

describe('GET /api/orders', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects non-admin callers', async () => {
    requireAdminMock.mockRejectedValue(new ApiError(403, 'Admin access required'))
    const res = await GET_ALL()
    expect(res.status).toBe(403)
  })
})

describe('PUT /api/orders/[id]/status', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates order status for an admin caller', async () => {
    requireAdminMock.mockResolvedValue({ id: 1, role: 'ADMIN' })
    ;(prisma.order.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 5 })
    ;(prisma.order.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 5, status: 'SHIPPED' })
    const req = new Request('http://localhost/api/orders/5/status', { method: 'PUT', body: JSON.stringify({ status: 'SHIPPED' }) })
    const res = await PUT_STATUS(req as never, { params: Promise.resolve({ id: '5' }) })
    expect(res.status).toBe(200)
  })
})

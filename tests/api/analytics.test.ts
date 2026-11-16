import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: { order: { findMany: vi.fn() }, part: { findMany: vi.fn() } },
}))

const requireAdminMock = vi.fn()
vi.mock('@/lib/auth', () => ({ requireAdmin: () => requireAdminMock() }))

import { prisma } from '@/lib/prisma'
import { ApiError } from '@/lib/api-error'
import { GET } from '@/app/api/analytics/summary/route'

describe('GET /api/analytics/summary', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects non-admin callers', async () => {
    requireAdminMock.mockRejectedValue(new ApiError(403, 'Admin access required'))
    const req = new Request('http://localhost/api/analytics/summary')
    const res = await GET(req as never)
    expect(res.status).toBe(403)
  })

  it('computes totals and top parts from PAID orders in range', async () => {
    requireAdminMock.mockResolvedValue({ id: 1, role: 'ADMIN' })
    ;(prisma.order.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 1, totalAmount: 1000, createdAt: new Date('2026-07-10'), items: [{ partName: 'Air Filter', price: 500, quantity: 2 }] },
      { id: 2, totalAmount: 500, createdAt: new Date('2026-07-11'), items: [{ partName: 'Air Filter', price: 500, quantity: 1 }] },
    ])
    ;(prisma.part.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([{ partName: 'Brake Pad', quantity: 3 }])

    const req = new Request('http://localhost/api/analytics/summary?from=2026-07-01&to=2026-07-15')
    const res = await GET(req as never)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.totalRevenue).toBe(1500)
    expect(body.totalOrders).toBe(2)
    expect(body.avgOrderValue).toBe(750)
    expect(body.topParts[0]).toEqual({ partName: 'Air Filter', qtySold: 3, revenue: 1500 })
    expect(body.lowStockParts).toEqual([{ partName: 'Brake Pad', quantity: 3 }])
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    vehicle: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}))

const requireAdminMock = vi.fn()
vi.mock('@/lib/auth', () => ({ requireAdmin: () => requireAdminMock() }))

import { prisma } from '@/lib/prisma'
import { ApiError } from '@/lib/api-error'
import { GET, POST } from '@/app/api/vehicles/route'
import { GET as GET_ONE, PUT, DELETE } from '@/app/api/vehicles/[id]/route'

describe('GET /api/vehicles', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists Suzuki vehicles filtered by type', async () => {
    ;(prisma.vehicle.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 1, type: 'BIKE' }])
    const req = new Request('http://localhost/api/vehicles?type=BIKE')
    const res = await GET(req as never)
    expect(res.status).toBe(200)
    expect(prisma.vehicle.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ brand: 'Suzuki', type: 'BIKE' }) })
    )
  })
})

describe('POST /api/vehicles', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects non-admin callers', async () => {
    requireAdminMock.mockRejectedValue(new ApiError(403, 'Admin access required'))
    const req = new Request('http://localhost/api/vehicles', {
      method: 'POST',
      body: JSON.stringify({ type: 'BIKE', modelName: 'Gixxer', year: 2024, price: 100, quantity: 1 }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(403)
  })

  it('creates a vehicle for an admin caller', async () => {
    requireAdminMock.mockResolvedValue({ id: 1, role: 'ADMIN' })
    ;(prisma.vehicle.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 5, modelName: 'Gixxer' })
    const req = new Request('http://localhost/api/vehicles', {
      method: 'POST',
      body: JSON.stringify({ type: 'BIKE', modelName: 'Gixxer', year: 2024, price: 100, quantity: 1 }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(201)
  })
})

describe('GET /api/vehicles/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 404 for a missing vehicle', async () => {
    ;(prisma.vehicle.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    const req = new Request('http://localhost/api/vehicles/999')
    const res = await GET_ONE(req as never, { params: Promise.resolve({ id: '999' }) })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/vehicles/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 204 on successful admin delete', async () => {
    requireAdminMock.mockResolvedValue({ id: 1, role: 'ADMIN' })
    ;(prisma.vehicle.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 5 })
    ;(prisma.vehicle.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 5 })
    const req = new Request('http://localhost/api/vehicles/5', { method: 'DELETE' })
    const res = await DELETE(req as never, { params: Promise.resolve({ id: '5' }) })
    expect(res.status).toBe(204)
  })
})

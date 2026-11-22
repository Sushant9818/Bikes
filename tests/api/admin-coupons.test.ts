import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    coupon: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

const requireAdminMock = vi.fn()
vi.mock('@/lib/auth', () => ({ requireAdmin: () => requireAdminMock() }))

import { prisma } from '@/lib/prisma'
import { ApiError } from '@/lib/api-error'
import { GET, POST } from '@/app/api/admin/coupons/route'
import { PUT, DELETE } from '@/app/api/admin/coupons/[id]/route'

const validCoupon = {
  code: 'SAVE10',
  description: '10% off',
  discountPercent: 10,
  minAmount: 100,
  maxUses: 50,
  isActive: true,
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe('GET /api/admin/coupons', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects non-admin callers', async () => {
    requireAdminMock.mockRejectedValue(new ApiError(403, 'Admin access required'))
    const req = new Request('http://localhost/api/admin/coupons')
    const res = await GET(req as never)
    expect(res.status).toBe(403)
  })

  it('returns paginated coupons with total and page', async () => {
    requireAdminMock.mockResolvedValue({ id: 1, role: 'ADMIN' })
    ;(prisma.coupon.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 1 }, { id: 2 }])
    ;(prisma.coupon.count as ReturnType<typeof vi.fn>).mockResolvedValue(25)

    const req = new Request('http://localhost/api/admin/coupons?page=2')
    const res = await GET(req as never)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.total).toBe(25)
    expect(json.page).toBe(2)
    expect(json.coupons).toHaveLength(2)
    expect(prisma.coupon.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 })
    )
  })
})

describe('POST /api/admin/coupons', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects non-admin callers', async () => {
    requireAdminMock.mockRejectedValue(new ApiError(403, 'Admin access required'))
    const req = new Request('http://localhost/api/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(validCoupon),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(403)
  })

  it('rejects when both discountPercent and discountFixed are set', async () => {
    requireAdminMock.mockResolvedValue({ id: 1, role: 'ADMIN' })
    const req = new Request('http://localhost/api/admin/coupons', {
      method: 'POST',
      body: JSON.stringify({ ...validCoupon, discountFixed: 50 }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
    expect(prisma.coupon.create).not.toHaveBeenCalled()
  })

  it('rejects when neither discountPercent nor discountFixed is set', async () => {
    requireAdminMock.mockResolvedValue({ id: 1, role: 'ADMIN' })
    const { discountPercent, ...rest } = validCoupon
    const req = new Request('http://localhost/api/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(rest),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
    expect(prisma.coupon.create).not.toHaveBeenCalled()
  })

  it('rejects a negative minAmount', async () => {
    requireAdminMock.mockResolvedValue({ id: 1, role: 'ADMIN' })
    const req = new Request('http://localhost/api/admin/coupons', {
      method: 'POST',
      body: JSON.stringify({ ...validCoupon, minAmount: -5 }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })

  it('creates a coupon with a percent discount for an admin caller', async () => {
    requireAdminMock.mockResolvedValue({ id: 1, role: 'ADMIN' })
    ;(prisma.coupon.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    ;(prisma.coupon.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1, ...validCoupon })

    const req = new Request('http://localhost/api/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(validCoupon),
    })
    const res = await POST(req as never)
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.code).toBe('SAVE10')
    expect(prisma.coupon.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ code: 'SAVE10', discountPercent: 10, discountFixed: null }),
      })
    )
  })

  it('creates a coupon with a fixed discount for an admin caller', async () => {
    requireAdminMock.mockResolvedValue({ id: 1, role: 'ADMIN' })
    ;(prisma.coupon.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    ;(prisma.coupon.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 2, code: 'FLAT50' })

    const { discountPercent, ...rest } = validCoupon
    const req = new Request('http://localhost/api/admin/coupons', {
      method: 'POST',
      body: JSON.stringify({ ...rest, code: 'FLAT50', discountFixed: 50 }),
    })
    const res = await POST(req as never)

    expect(res.status).toBe(201)
    expect(prisma.coupon.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ discountPercent: 0, discountFixed: 50 }),
      })
    )
  })

  it('persists and returns maxUsesPerUser when provided', async () => {
    requireAdminMock.mockResolvedValue({ id: 1, role: 'ADMIN' })
    ;(prisma.coupon.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    ;(prisma.coupon.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 3,
      ...validCoupon,
      maxUsesPerUser: 2,
    })

    const req = new Request('http://localhost/api/admin/coupons', {
      method: 'POST',
      body: JSON.stringify({ ...validCoupon, maxUsesPerUser: 2 }),
    })
    const res = await POST(req as never)
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.maxUsesPerUser).toBe(2)
    expect(prisma.coupon.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ maxUsesPerUser: 2 }) })
    )
  })

  it('omits maxUsesPerUser from create data when not provided, letting the column default apply', async () => {
    requireAdminMock.mockResolvedValue({ id: 1, role: 'ADMIN' })
    ;(prisma.coupon.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    ;(prisma.coupon.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 4, ...validCoupon, maxUsesPerUser: 1 })

    const req = new Request('http://localhost/api/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(validCoupon),
    })
    await POST(req as never)

    const callData = (prisma.coupon.create as ReturnType<typeof vi.fn>).mock.calls[0][0].data
    expect('maxUsesPerUser' in callData).toBe(true)
    expect(callData.maxUsesPerUser).toBeUndefined()
  })

  it('rejects a duplicate coupon code', async () => {
    requireAdminMock.mockResolvedValue({ id: 1, role: 'ADMIN' })
    ;(prisma.coupon.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 99, code: 'SAVE10' })

    const req = new Request('http://localhost/api/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(validCoupon),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
    expect(prisma.coupon.create).not.toHaveBeenCalled()
  })
})

describe('PUT /api/admin/coupons/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects non-admin callers', async () => {
    requireAdminMock.mockRejectedValue(new ApiError(403, 'Admin access required'))
    const req = new Request('http://localhost/api/admin/coupons/1', {
      method: 'PUT',
      body: JSON.stringify(validCoupon),
    })
    const res = await PUT(req as never, makeParams('1'))
    expect(res.status).toBe(403)
  })

  it('returns 404 when the coupon does not exist', async () => {
    requireAdminMock.mockResolvedValue({ id: 1, role: 'ADMIN' })
    ;(prisma.coupon.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    const req = new Request('http://localhost/api/admin/coupons/999', {
      method: 'PUT',
      body: JSON.stringify(validCoupon),
    })
    const res = await PUT(req as never, makeParams('999'))
    expect(res.status).toBe(404)
  })

  it('rejects invalid discount combinations on update', async () => {
    requireAdminMock.mockResolvedValue({ id: 1, role: 'ADMIN' })
    const req = new Request('http://localhost/api/admin/coupons/1', {
      method: 'PUT',
      body: JSON.stringify({ ...validCoupon, discountFixed: 20 }),
    })
    const res = await PUT(req as never, makeParams('1'))
    expect(res.status).toBe(400)
    expect(prisma.coupon.update).not.toHaveBeenCalled()
  })

  it('updates an existing coupon for an admin caller', async () => {
    requireAdminMock.mockResolvedValue({ id: 1, role: 'ADMIN' })
    ;(prisma.coupon.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1, code: 'SAVE10' })
    ;(prisma.coupon.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1, ...validCoupon, discountPercent: 20 })

    const req = new Request('http://localhost/api/admin/coupons/1', {
      method: 'PUT',
      body: JSON.stringify({ ...validCoupon, discountPercent: 20 }),
    })
    const res = await PUT(req as never, makeParams('1'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.discountPercent).toBe(20)
    expect(prisma.coupon.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } })
    )
  })

  it('persists and returns maxUsesPerUser on update', async () => {
    requireAdminMock.mockResolvedValue({ id: 1, role: 'ADMIN' })
    ;(prisma.coupon.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1, code: 'SAVE10' })
    ;(prisma.coupon.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1, ...validCoupon, maxUsesPerUser: 3 })

    const req = new Request('http://localhost/api/admin/coupons/1', {
      method: 'PUT',
      body: JSON.stringify({ ...validCoupon, maxUsesPerUser: 3 }),
    })
    const res = await PUT(req as never, makeParams('1'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.maxUsesPerUser).toBe(3)
    expect(prisma.coupon.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ maxUsesPerUser: 3 }) })
    )
  })

  it('allows explicitly setting maxUsesPerUser to null for unlimited per-user uses', async () => {
    requireAdminMock.mockResolvedValue({ id: 1, role: 'ADMIN' })
    ;(prisma.coupon.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1, code: 'SAVE10' })
    ;(prisma.coupon.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1, ...validCoupon, maxUsesPerUser: null })

    const req = new Request('http://localhost/api/admin/coupons/1', {
      method: 'PUT',
      body: JSON.stringify({ ...validCoupon, maxUsesPerUser: null }),
    })
    const res = await PUT(req as never, makeParams('1'))

    expect(res.status).toBe(200)
    expect(prisma.coupon.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ maxUsesPerUser: null }) })
    )
  })
})

describe('DELETE /api/admin/coupons/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects non-admin callers', async () => {
    requireAdminMock.mockRejectedValue(new ApiError(403, 'Admin access required'))
    const req = new Request('http://localhost/api/admin/coupons/1', { method: 'DELETE' })
    const res = await DELETE(req as never, makeParams('1'))
    expect(res.status).toBe(403)
  })

  it('returns 404 when the coupon does not exist', async () => {
    requireAdminMock.mockResolvedValue({ id: 1, role: 'ADMIN' })
    ;(prisma.coupon.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    const req = new Request('http://localhost/api/admin/coupons/999', { method: 'DELETE' })
    const res = await DELETE(req as never, makeParams('999'))
    expect(res.status).toBe(404)
  })

  it('deletes an existing coupon for an admin caller', async () => {
    requireAdminMock.mockResolvedValue({ id: 1, role: 'ADMIN' })
    ;(prisma.coupon.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1, code: 'SAVE10' })
    ;(prisma.coupon.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1 })

    const req = new Request('http://localhost/api/admin/coupons/1', { method: 'DELETE' })
    const res = await DELETE(req as never, makeParams('1'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
  })
})

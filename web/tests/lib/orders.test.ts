import { describe, it, expect, vi, beforeEach } from 'vitest'

const txMock = {
  part: { updateMany: vi.fn(), findUnique: vi.fn() },
  order: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
}

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: { findUnique: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(async (cb: (tx: typeof txMock) => unknown) => cb(txMock)),
  },
}))

vi.mock('@/lib/email', () => ({
  sendOrderConfirmationEmail: vi.fn(),
  sendOrderAlertAdminEmail: vi.fn(),
  sendLowStockAlertEmail: vi.fn(),
}))

import { prisma } from '@/lib/prisma'
import { createOrderDraft, finalizeOrder } from '@/lib/orders'
import { ApiError } from '@/lib/api-error'
import type { User } from '@prisma/client'

const user = { id: 1, role: 'CLIENT' } as User

describe('createOrderDraft', () => {
  beforeEach(() => vi.clearAllMocks())

  it('computes the total server-side from current Part prices, ignoring any client-sent price', async () => {
    txMock.part.findUnique.mockResolvedValue({ id: 10, partName: 'Air Filter', price: 850, quantity: 50 })
    txMock.order.create.mockResolvedValue({ id: 1, totalAmount: 1700, items: [] })

    const order = await createOrderDraft(user, 'John', '9800000000', null, 'Kathmandu', [{ partId: 10, quantity: 2 }])

    expect(txMock.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totalAmount: 1700,
          items: { create: [{ partId: 10, partName: 'Air Filter', price: 850, quantity: 2 }] },
        }),
      })
    )
    expect(order.id).toBe(1)
  })

  it('throws 400 when requested quantity exceeds stock', async () => {
    txMock.part.findUnique.mockResolvedValue({ id: 10, partName: 'Air Filter', price: 850, quantity: 1 })

    await expect(
      createOrderDraft(user, 'John', '9800000000', null, 'Kathmandu', [{ partId: 10, quantity: 2 }])
    ).rejects.toMatchObject({ status: 400 })
  })

  it('throws 404 when the part does not exist', async () => {
    txMock.part.findUnique.mockResolvedValue(null)

    await expect(
      createOrderDraft(user, 'John', '9800000000', null, 'Kathmandu', [{ partId: 999, quantity: 1 }])
    ).rejects.toMatchObject({ status: 404 })
  })
})

describe('finalizeOrder', () => {
  beforeEach(() => vi.clearAllMocks())

  it('is a no-op when the order is already PAID', async () => {
    ;(prisma.order.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1, status: 'PAID', items: [] })
    await finalizeOrder(1)
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('reduces stock and sets status PAID', async () => {
    ;(prisma.order.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1, status: 'PENDING', items: [{ partId: 10, quantity: 2 }],
    })
    txMock.order.findUnique.mockResolvedValue({ status: 'PENDING' })
    txMock.part.updateMany.mockResolvedValue({ count: 1 })

    await finalizeOrder(1)

    expect(txMock.part.updateMany).toHaveBeenCalledWith({
      where: { id: 10, quantity: { gte: 2 } },
      data: { quantity: { decrement: 2 } },
    })
    expect(txMock.order.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { status: 'PAID' } })
  })

  it('routes to PAYMENT_REVIEW and throws when stock is insufficient after payment', async () => {
    ;(prisma.order.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1, status: 'PENDING', items: [{ partId: 10, quantity: 5 }],
    })
    txMock.order.findUnique.mockResolvedValue({ status: 'PENDING' })
    txMock.part.updateMany.mockResolvedValue({ count: 0 })
    txMock.part.findUnique.mockResolvedValue({ id: 10, partName: 'Air Filter', quantity: 2 })

    await expect(finalizeOrder(1)).rejects.toMatchObject({ status: 409 })
    expect((prisma.order.update as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: 'PAYMENT_REVIEW' },
    })
  })
})

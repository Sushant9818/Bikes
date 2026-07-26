import { describe, it, expect, vi, beforeEach } from 'vitest'

const { sendMock } = vi.hoisted(() => {
  return { sendMock: vi.fn() }
})

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(function() {
    return { emails: { send: sendMock } }
  })
}))

import { sendOrderConfirmationEmail, sendOrderAlertAdminEmail, sendLowStockAlertEmail } from '@/lib/email'
import type { Order, OrderItem, Part } from '@prisma/client'

const order = {
  id: 1, customerName: 'John', phone: '9800000000', email: 'john@example.com', address: 'Kathmandu',
  totalAmount: 1700, items: [{ id: 1, partId: 10, partName: 'Air Filter', price: 850, quantity: 2, orderId: 1 }],
} as Order & { items: OrderItem[] }

const part = { id: 10, partName: 'Air Filter', compatibleModel: null, quantity: 3 } as Part

describe('email', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.MAIL_ENABLED = 'true'
    process.env.MAIL_FROM = 'noreply@example.com'
    process.env.ADMIN_EMAIL = 'admin@example.com'
  })

  it('sends the customer confirmation email when MAIL_ENABLED and the order has an email', async () => {
    await sendOrderConfirmationEmail(order)
    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({ to: 'john@example.com', subject: 'Order Confirmation #1' }))
  })

  it('does not send the customer email when the order has no email', async () => {
    await sendOrderConfirmationEmail({ ...order, email: null })
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('does not send anything when MAIL_ENABLED is false', async () => {
    process.env.MAIL_ENABLED = 'false'
    await sendOrderConfirmationEmail(order)
    await sendOrderAlertAdminEmail(order)
    await sendLowStockAlertEmail(part)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('sends the admin order alert to ADMIN_EMAIL', async () => {
    await sendOrderAlertAdminEmail(order)
    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({ to: 'admin@example.com', subject: 'New Paid Order #1' }))
  })

  it('sends the low stock alert to ADMIN_EMAIL', async () => {
    await sendLowStockAlertEmail(part)
    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({ to: 'admin@example.com', subject: 'Low Stock Alert: Air Filter' }))
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiError } from '@/lib/api-error'

const requireUserMock = vi.fn()
vi.mock('@/lib/auth', () => ({ requireUser: () => requireUserMock() }))

const createOrderDraftMock = vi.fn()
const setStripePaymentIntentIdMock = vi.fn()
const findOrderByStripePaymentIntentIdMock = vi.fn()
const finalizeOrderMock = vi.fn()
vi.mock('@/lib/orders', () => ({
  createOrderDraft: (...args: unknown[]) => createOrderDraftMock(...args),
  setStripePaymentIntentId: (...args: unknown[]) => setStripePaymentIntentIdMock(...args),
  findOrderByStripePaymentIntentId: (...args: unknown[]) => findOrderByStripePaymentIntentIdMock(...args),
  finalizeOrder: (...args: unknown[]) => finalizeOrderMock(...args),
}))

const paymentIntentsCreateMock = vi.fn()
const constructEventMock = vi.fn()
vi.mock('@/lib/stripe', () => ({
  stripe: {
    paymentIntents: { create: (...args: unknown[]) => paymentIntentsCreateMock(...args) },
    webhooks: { constructEvent: (...args: unknown[]) => constructEventMock(...args) },
  },
}))

import { POST as createIntent } from '@/app/api/payments/create-intent/route'
import { POST as webhook } from '@/app/api/payments/webhook/route'

describe('POST /api/payments/create-intent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_CURRENCY = 'usd'
  })

  it('requires authentication', async () => {
    requireUserMock.mockRejectedValue(new ApiError(401, 'Not authenticated'))
    const req = new Request('http://localhost/api/payments/create-intent', { method: 'POST', body: JSON.stringify({}) })
    const res = await createIntent(req as never)
    expect(res.status).toBe(401)
  })

  it('creates a draft order and a Stripe PaymentIntent, returns clientSecret', async () => {
    requireUserMock.mockResolvedValue({ id: 1 })
    createOrderDraftMock.mockResolvedValue({ id: 5, totalAmount: 1700 })
    paymentIntentsCreateMock.mockResolvedValue({ id: 'pi_123', client_secret: 'secret_abc' })

    const req = new Request('http://localhost/api/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({
        customerName: 'John', phone: '9800000000', address: 'Kathmandu',
        items: [{ partId: 10, quantity: 2 }],
      }),
    })
    const res = await createIntent(req as never)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ clientSecret: 'secret_abc', orderDraftId: 5 })
    expect(paymentIntentsCreateMock).toHaveBeenCalledWith(expect.objectContaining({ amount: 170000, currency: 'usd' }))
    expect(setStripePaymentIntentIdMock).toHaveBeenCalledWith(5, 'pi_123')
  })
})

describe('POST /api/payments/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
  })

  it('rejects a request with an invalid signature', async () => {
    constructEventMock.mockImplementation(() => { throw new Error('bad sig') })
    const req = new Request('http://localhost/api/payments/webhook', {
      method: 'POST', body: '{}', headers: { 'stripe-signature': 'bad' },
    })
    const res = await webhook(req as never)
    expect(res.status).toBe(400)
  })

  it('finalizes the matching order on payment_intent.succeeded', async () => {
    constructEventMock.mockReturnValue({
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_123' } },
    })
    findOrderByStripePaymentIntentIdMock.mockResolvedValue({ id: 5 })

    const req = new Request('http://localhost/api/payments/webhook', {
      method: 'POST', body: '{}', headers: { 'stripe-signature': 'sig_valid' },
    })
    const res = await webhook(req as never)

    expect(res.status).toBe(200)
    expect(finalizeOrderMock).toHaveBeenCalledWith(5)
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: { user: { upsert: vi.fn() } },
}))

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Map([
    ['svix-id', 'id1'],
    ['svix-timestamp', '123'],
    ['svix-signature', 'sig1'],
  ])),
}))

const verifyMock = vi.fn()
vi.mock('svix', () => {
  return {
    Webhook: class {
      verify = verifyMock
    },
  }
})

import { prisma } from '@/lib/prisma'
import { POST } from '@/app/api/webhooks/clerk/route'

describe('POST /api/webhooks/clerk', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CLERK_WEBHOOK_SECRET = 'whsec_test'
  })

  it('upserts a local User row on user.created', async () => {
    verifyMock.mockReturnValue({
      type: 'user.created',
      data: {
        id: 'user_123',
        username: 'johndoe',
        email_addresses: [{ id: 'email_1', email_address: 'john@example.com' }],
        primary_email_address_id: 'email_1',
        phone_numbers: [],
        primary_phone_number_id: null,
        public_metadata: {},
      },
    })

    const req = new Request('http://localhost/api/webhooks/clerk', { method: 'POST', body: '{}' })
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clerkUserId: 'user_123' },
        create: expect.objectContaining({ email: 'john@example.com', role: 'CLIENT' }),
      })
    )
  })

  it('maps publicMetadata.role ADMIN through to the mirrored row', async () => {
    verifyMock.mockReturnValue({
      type: 'user.updated',
      data: {
        id: 'user_123',
        username: 'johndoe',
        email_addresses: [{ id: 'email_1', email_address: 'john@example.com' }],
        primary_email_address_id: 'email_1',
        phone_numbers: [],
        primary_phone_number_id: null,
        public_metadata: { role: 'ADMIN' },
      },
    })

    const req = new Request('http://localhost/api/webhooks/clerk', { method: 'POST', body: '{}' })
    await POST(req)

    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: expect.objectContaining({ role: 'ADMIN' }) })
    )
  })

  it('rejects an invalid signature', async () => {
    verifyMock.mockImplementation(() => {
      throw new Error('bad signature')
    })

    const req = new Request('http://localhost/api/webhooks/clerk', { method: 'POST', body: '{}' })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })
})

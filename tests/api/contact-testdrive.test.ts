import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    contactRequest: { create: vi.fn() },
    testDriveRequest: { create: vi.fn() },
  },
}))

import { prisma } from '@/lib/prisma'
import { POST as CONTACT } from '@/app/api/contact/route'
import { POST as TEST_DRIVE } from '@/app/api/test-drive/route'

describe('POST /api/contact', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a contact request and returns 201', async () => {
    ;(prisma.contactRequest.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1 })
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify({ name: 'John', email: 'john@example.com', message: 'Hello, I have a question.' }),
    })
    const res = await CONTACT(req as never)
    expect(res.status).toBe(201)
  })

  it('rejects an invalid email with 400', async () => {
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify({ name: 'John', email: 'not-an-email', message: 'Hello' }),
    })
    const res = await CONTACT(req as never)
    expect(res.status).toBe(400)
  })
})

describe('POST /api/test-drive', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a test drive request and returns 201', async () => {
    ;(prisma.testDriveRequest.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1 })
    const req = new Request('http://localhost/api/test-drive', {
      method: 'POST',
      body: JSON.stringify({ name: 'John', phone: '9800000000' }),
    })
    const res = await TEST_DRIVE(req as never)
    expect(res.status).toBe(201)
  })
})

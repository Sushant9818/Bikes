import { describe, it, expect, vi, beforeEach } from 'vitest'

const authMock = vi.fn()
const currentUserMock = vi.fn()
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => authMock(),
  currentUser: () => currentUserMock(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: { user: { findUnique: vi.fn(), upsert: vi.fn() } },
}))

import { prisma } from '@/lib/prisma'
import { requireUser, requireAdmin } from '@/lib/auth'
import { ApiError } from '@/lib/api-error'

describe('requireUser', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 401 when there is no Clerk session', async () => {
    authMock.mockResolvedValue({ userId: null })
    await expect(requireUser()).rejects.toMatchObject({ status: 401 })
  })

  it('returns the mirrored local User row when it exists', async () => {
    authMock.mockResolvedValue({ userId: 'user_1' })
    ;(prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1, clerkUserId: 'user_1', role: 'CLIENT', email: 'a@b.com', username: 'a',
    })

    const user = await requireUser()
    expect(user.id).toBe(1)
  })

  it('lazily creates the local User row if the webhook has not landed yet', async () => {
    authMock.mockResolvedValue({ userId: 'user_2' })
    ;(prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    currentUserMock.mockResolvedValue({
      username: 'newbie',
      primaryEmailAddress: { emailAddress: 'newbie@example.com' },
      primaryPhoneNumber: null,
      publicMetadata: {},
    })
    ;(prisma.user.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 2, clerkUserId: 'user_2', role: 'CLIENT', email: 'newbie@example.com', username: 'newbie',
    })

    const user = await requireUser()
    expect(user.email).toBe('newbie@example.com')
    expect(prisma.user.upsert).toHaveBeenCalled()
  })
})

describe('requireAdmin', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 403 for a non-admin user', async () => {
    authMock.mockResolvedValue({ userId: 'user_1' })
    ;(prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1, clerkUserId: 'user_1', role: 'CLIENT', email: 'a@b.com', username: 'a',
    })

    await expect(requireAdmin()).rejects.toMatchObject({ status: 403 })
  })

  it('returns the user when role is ADMIN', async () => {
    authMock.mockResolvedValue({ userId: 'user_1' })
    ;(prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1, clerkUserId: 'user_1', role: 'ADMIN', email: 'a@b.com', username: 'a',
    })

    const user = await requireAdmin()
    expect(user.role).toBe('ADMIN')
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiError } from '@/lib/api-error'

const requireAdminMock = vi.fn()
vi.mock('@/lib/auth', () => ({ requireAdmin: () => requireAdminMock() }))

const getUserListMock = vi.fn()
const updateUserMetadataMock = vi.fn()
const banUserMock = vi.fn()
const unbanUserMock = vi.fn()
vi.mock('@clerk/nextjs/server', () => ({
  clerkClient: async () => ({
    users: {
      getUserList: (...args: unknown[]) => getUserListMock(...args),
      updateUserMetadata: (...args: unknown[]) => updateUserMetadataMock(...args),
      banUser: (...args: unknown[]) => banUserMock(...args),
      unbanUser: (...args: unknown[]) => unbanUserMock(...args),
    },
  }),
}))

const sampleClerkUser = {
  id: 'user_1', username: 'johndoe',
  emailAddresses: [{ id: 'e1', emailAddress: 'john@example.com' }], primaryEmailAddressId: 'e1',
  phoneNumbers: [], primaryPhoneNumberId: null,
  publicMetadata: { role: 'CLIENT' }, banned: false, createdAt: 1700000000000,
}

import { GET as LIST } from '@/app/api/admin/users/route'
import { PUT as UPDATE_ROLE } from '@/app/api/admin/users/[id]/role/route'
import { PUT as UPDATE_ENABLED } from '@/app/api/admin/users/[id]/enable/route'

describe('GET /api/admin/users', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects non-admin callers', async () => {
    requireAdminMock.mockRejectedValue(new ApiError(403, 'Admin access required'))
    const res = await LIST()
    expect(res.status).toBe(403)
  })

  it('maps the Clerk user list to AdminUserDto', async () => {
    requireAdminMock.mockResolvedValue({ id: 1, role: 'ADMIN' })
    getUserListMock.mockResolvedValue({ data: [sampleClerkUser] })
    const res = await LIST()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body[0]).toMatchObject({ id: 'user_1', email: 'john@example.com', role: 'CLIENT', enabled: true })
  })
})

describe('PUT /api/admin/users/[id]/role', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates Clerk publicMetadata.role', async () => {
    requireAdminMock.mockResolvedValue({ id: 1, role: 'ADMIN' })
    updateUserMetadataMock.mockResolvedValue({ ...sampleClerkUser, publicMetadata: { role: 'ADMIN' } })
    const req = new Request('http://localhost/api/admin/users/user_1/role', { method: 'PUT', body: JSON.stringify({ role: 'ADMIN' }) })
    const res = await UPDATE_ROLE(req as never, { params: Promise.resolve({ id: 'user_1' }) })
    expect(res.status).toBe(200)
    expect(updateUserMetadataMock).toHaveBeenCalledWith('user_1', { publicMetadata: { role: 'ADMIN' } })
  })
})

describe('PUT /api/admin/users/[id]/enable', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls banUser when enabled=false', async () => {
    requireAdminMock.mockResolvedValue({ id: 1, role: 'ADMIN' })
    banUserMock.mockResolvedValue({ ...sampleClerkUser, banned: true })
    const req = new Request('http://localhost/api/admin/users/user_1/enable', { method: 'PUT', body: JSON.stringify({ enabled: false }) })
    const res = await UPDATE_ENABLED(req as never, { params: Promise.resolve({ id: 'user_1' }) })
    expect(res.status).toBe(200)
    expect(banUserMock).toHaveBeenCalledWith('user_1')
  })

  it('calls unbanUser when enabled=true', async () => {
    requireAdminMock.mockResolvedValue({ id: 1, role: 'ADMIN' })
    unbanUserMock.mockResolvedValue(sampleClerkUser)
    const req = new Request('http://localhost/api/admin/users/user_1/enable', { method: 'PUT', body: JSON.stringify({ enabled: true }) })
    const res = await UPDATE_ENABLED(req as never, { params: Promise.resolve({ id: 'user_1' }) })
    expect(res.status).toBe(200)
    expect(unbanUserMock).toHaveBeenCalledWith('user_1')
  })
})

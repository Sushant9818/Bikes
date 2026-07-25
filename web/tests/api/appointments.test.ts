import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    appointment: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn(), aggregate: vi.fn() },
  },
}))

const requireUserMock = vi.fn()
const requireAdminMock = vi.fn()
vi.mock('@/lib/auth', () => ({
  requireUser: () => requireUserMock(),
  requireAdmin: () => requireAdminMock(),
}))

import { prisma } from '@/lib/prisma'
import { POST } from '@/app/api/appointments/route'
import { GET as GET_MY } from '@/app/api/appointments/my/route'
import { GET as GET_BY_ID } from '@/app/api/appointments/[id]/route'
import { PUT as RESCHEDULE } from '@/app/api/appointments/[id]/reschedule/route'
import { PUT as CANCEL } from '@/app/api/appointments/[id]/cancel/route'

const clientUser = { id: 1, username: 'client1', role: 'CLIENT' }
const otherUser = { id: 2, username: 'other', role: 'CLIENT' }

describe('POST /api/appointments', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates an appointment owned by the authenticated user', async () => {
    requireUserMock.mockResolvedValue(clientUser)
    ;(prisma.appointment.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1, clientUsername: 'client1', status: 'PENDING', services: [{ service: 'OIL_CHANGE' }],
    })

    const req = new Request('http://localhost/api/appointments', {
      method: 'POST',
      body: JSON.stringify({ bikeModel: 'Gixxer', services: ['OIL_CHANGE'], preferredDate: '2026-08-01', preferredTime: '10:00 AM' }),
    })
    const res = await POST(req as never)

    expect(res.status).toBe(201)
    expect(prisma.appointment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ clientUsername: 'client1', status: 'PENDING' }) })
    )
  })
})

describe('GET /api/appointments/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('denies access to a non-owner, non-admin caller', async () => {
    requireUserMock.mockResolvedValue(otherUser)
    ;(prisma.appointment.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1, clientUsername: 'client1', services: [] })
    const req = new Request('http://localhost/api/appointments/1')
    const res = await GET_BY_ID(req as never, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(403)
  })

  it('allows the owner', async () => {
    requireUserMock.mockResolvedValue(clientUser)
    ;(prisma.appointment.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1, clientUsername: 'client1', services: [] })
    const req = new Request('http://localhost/api/appointments/1')
    const res = await GET_BY_ID(req as never, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(200)
  })
})

describe('PUT /api/appointments/[id]/reschedule', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects rescheduling a non-PENDING appointment', async () => {
    requireUserMock.mockResolvedValue(clientUser)
    ;(prisma.appointment.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1, clientUsername: 'client1', status: 'APPROVED' })
    const req = new Request('http://localhost/api/appointments/1/reschedule', { method: 'PUT', body: JSON.stringify({ preferredDate: '2026-09-01', preferredTime: '11:00 AM' }) })
    const res = await RESCHEDULE(req as never, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(400)
  })
})

describe('PUT /api/appointments/[id]/cancel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects a caller who does not own the appointment', async () => {
    requireUserMock.mockResolvedValue(otherUser)
    ;(prisma.appointment.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1, clientUsername: 'client1', status: 'PENDING' })
    const req = new Request('http://localhost/api/appointments/1/cancel', { method: 'PUT' })
    const res = await CANCEL(req as never, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(403)
  })

  it('cancels a PENDING appointment owned by the caller', async () => {
    requireUserMock.mockResolvedValue(clientUser)
    ;(prisma.appointment.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1, clientUsername: 'client1', status: 'PENDING' })
    ;(prisma.appointment.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1, status: 'CANCELLED', services: [] })
    const req = new Request('http://localhost/api/appointments/1/cancel', { method: 'PUT' })
    const res = await CANCEL(req as never, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(200)
    expect(prisma.appointment.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'CANCELLED' } }))
  })
})

describe('GET /api/appointments/my', () => {
  beforeEach(() => vi.clearAllMocks())

  it('scopes results to the caller\'s clientUsername', async () => {
    requireUserMock.mockResolvedValue(clientUser)
    ;(prisma.appointment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([])
    await GET_MY()
    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { clientUsername: 'client1' } })
    )
  })
})

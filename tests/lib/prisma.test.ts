import { describe, it, expect } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('prisma client', () => {
  it('exposes the models this app depends on', () => {
    expect(prisma.user).toBeDefined()
    expect(prisma.vehicle).toBeDefined()
    expect(prisma.part).toBeDefined()
    expect(prisma.offer).toBeDefined()
    expect(prisma.order).toBeDefined()
    expect(prisma.orderItem).toBeDefined()
    expect(prisma.appointment).toBeDefined()
    expect(prisma.appointmentService).toBeDefined()
    expect(prisma.testDriveRequest).toBeDefined()
    expect(prisma.contactRequest).toBeDefined()
  })
})

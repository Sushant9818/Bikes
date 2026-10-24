import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'

export async function GET(req: NextRequest) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      await requireAdmin()
    }

    // Get distinct mechanic names from appointments
    const mechanics = await prisma.appointment.findMany({
      distinct: ['mechanicName'],
      select: {
        mechanicName: true,
      },
      where: {
        mechanicName: {
          not: null,
        },
      },
    })

    const mechanicNames = mechanics
      .map(m => m.mechanicName)
      .filter((name): name is string => name !== null)
      .sort()

    return NextResponse.json({ mechanics: mechanicNames })
  } catch (err) {
    return handleApiError(err)
  }
}

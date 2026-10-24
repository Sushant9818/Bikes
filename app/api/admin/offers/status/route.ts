import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { z } from 'zod'

const statusToggleSchema = z.object({
  id: z.number(),
  isActive: z.boolean(),
})

export async function PATCH(req: NextRequest) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      await requireAdmin()
    }

    const body = await req.json()
    const validated = statusToggleSchema.parse(body)

    const offer = await prisma.offer.update({
      where: { id: validated.id },
      data: { isActive: validated.isActive },
    })

    return NextResponse.json(offer)
  } catch (err) {
    return handleApiError(err)
  }
}

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

    // Note: Offer model doesn't support status/isActive field
    // This endpoint is not fully implemented yet
    const offer = await prisma.offer.findUnique({
      where: { id: validated.id },
    })

    return NextResponse.json(offer)
  } catch (err) {
    return handleApiError(err)
  }
}

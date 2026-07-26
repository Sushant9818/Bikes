import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'
import { testDriveInputSchema } from '@/lib/validations/testDrive'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = testDriveInputSchema.parse(body)
    const request = await prisma.testDriveRequest.create({
      data: { ...data, preferredDate: data.preferredDate ? new Date(data.preferredDate) : null },
    })
    return NextResponse.json({ id: request.id, message: 'Test drive request submitted successfully' }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { ApiError, handleApiError } from '@/lib/api-error'
import { partInputSchema } from '@/lib/validations/part'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const part = await prisma.part.findUnique({ where: { id: Number(id) } })
    if (!part) throw new ApiError(404, 'Part not found')
    return NextResponse.json(part)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const data = partInputSchema.parse(body)
    const existing = await prisma.part.findUnique({ where: { id: Number(id) } })
    if (!existing) throw new ApiError(404, 'Part not found')
    const part = await prisma.part.update({ where: { id: Number(id) }, data: { ...data, brand: 'Suzuki' } })
    return NextResponse.json(part)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params
    const existing = await prisma.part.findUnique({ where: { id: Number(id) } })
    if (!existing) throw new ApiError(404, 'Part not found')
    await prisma.part.delete({ where: { id: Number(id) } })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return handleApiError(err)
  }
}

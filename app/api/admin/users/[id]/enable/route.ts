import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { enabledUpdateSchema } from '@/lib/validations/adminUser'
import { toAdminUserDto } from '@/lib/adminUsers'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const { enabled } = enabledUpdateSchema.parse(body)
    const client = await clerkClient()
    const user = enabled ? await client.users.unbanUser(id) : await client.users.banUser(id)
    return NextResponse.json(toAdminUserDto(user as never))
  } catch (err) {
    return handleApiError(err)
  }
}

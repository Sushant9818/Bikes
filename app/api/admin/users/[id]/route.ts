import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { toAdminUserDto } from '@/lib/adminUsers'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params
    const client = await clerkClient()
    const user = await client.users.getUser(id)
    return NextResponse.json(toAdminUserDto(user as never))
  } catch (err) {
    return handleApiError(err)
  }
}

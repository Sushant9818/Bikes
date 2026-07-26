import { NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { toAdminUserDto } from '@/lib/adminUsers'

export async function GET() {
  try {
    await requireAdmin()
    const client = await clerkClient()
    const { data } = await client.users.getUserList({ limit: 200 })
    return NextResponse.json(data.map((u) => toAdminUserDto(u as never)))
  } catch (err) {
    return handleApiError(err)
  }
}

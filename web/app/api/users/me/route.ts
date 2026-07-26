import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'

export async function GET() {
  try {
    const user = await requireUser()
    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      createdAt: user.createdAt,
    })
  } catch (err) {
    return handleApiError(err)
  }
}

import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { ApiError } from '@/lib/api-error'
import type { User, Role } from '@prisma/client'

export async function requireUser(): Promise<User> {
  const { userId } = await auth()
  if (!userId) throw new ApiError(401, 'Not authenticated')

  let user = await prisma.user.findUnique({ where: { clerkUserId: userId } })

  if (!user) {
    // Fallback sync in case the Clerk webhook hasn't landed yet.
    const clerkUser = await currentUser()
    if (!clerkUser) throw new ApiError(401, 'Not authenticated')

    const email = clerkUser.primaryEmailAddress?.emailAddress
    if (!email) throw new ApiError(400, 'User has no email address')

    const role: Role = clerkUser.publicMetadata?.role === 'ADMIN' ? 'ADMIN' : 'CLIENT'
    const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null
    // Real verified phone (added later as an MFA factor) takes priority over the
    // unverified value collected at sign-up, since phone_number sign-up itself is
    // gated behind Clerk's Pro plan — see app/sign-up/[[...sign-up]]/page.tsx.
    const phoneNumber =
      clerkUser.primaryPhoneNumber?.phoneNumber ??
      (typeof clerkUser.unsafeMetadata?.phoneNumber === 'string' ? clerkUser.unsafeMetadata.phoneNumber : null)

    user = await prisma.user.upsert({
      where: { clerkUserId: userId },
      create: {
        clerkUserId: userId,
        username: clerkUser.username ?? email,
        fullName,
        email,
        phoneNumber,
        role,
      },
      update: {},
    })
  }

  return user
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser()
  if (user.role !== 'ADMIN') throw new ApiError(403, 'Admin access required')
  return user
}

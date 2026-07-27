import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { prisma } from '@/lib/prisma'
import type { Role } from '@prisma/client'

interface ClerkUserEvent {
  type: 'user.created' | 'user.updated' | 'user.deleted'
  data: {
    id: string
    username: string | null
    first_name: string | null
    last_name: string | null
    email_addresses: { id: string; email_address: string }[]
    primary_email_address_id: string | null
    phone_numbers: { id: string; phone_number: string }[]
    primary_phone_number_id: string | null
    public_metadata: { role?: string }
    unsafe_metadata: { phoneNumber?: string }
  }
}

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ message: 'Webhook not configured' }, { status: 500 })
  }

  const headerPayload = await headers()
  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ message: 'Missing svix headers' }, { status: 400 })
  }

  const body = await req.text()
  const wh = new Webhook(secret)

  let event: ClerkUserEvent
  try {
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkUserEvent
  } catch {
    return NextResponse.json({ message: 'Invalid signature' }, { status: 400 })
  }

  const { data, type } = event

  if (type === 'user.deleted') {
    // Row is kept (Order/Appointment hold references) — nothing to do.
    return NextResponse.json({ ok: true })
  }

  const primaryEmail = data.email_addresses.find((e) => e.id === data.primary_email_address_id)?.email_address
    ?? data.email_addresses[0]?.email_address
  // Real verified phone (added later as an MFA factor) takes priority over the
  // unverified value collected at sign-up, since phone_number sign-up itself is
  // gated behind Clerk's Pro plan — see app/sign-up/[[...sign-up]]/page.tsx.
  const primaryPhone = data.phone_numbers.find((p) => p.id === data.primary_phone_number_id)?.phone_number
    ?? data.phone_numbers[0]?.phone_number
    ?? data.unsafe_metadata?.phoneNumber
    ?? null
  const role: Role = data.public_metadata?.role === 'ADMIN' ? 'ADMIN' : 'CLIENT'
  const username = data.username ?? primaryEmail ?? data.id
  const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ') || null

  if (!primaryEmail) {
    return NextResponse.json({ message: 'User has no email address' }, { status: 400 })
  }

  await prisma.user.upsert({
    where: { clerkUserId: data.id },
    create: {
      clerkUserId: data.id,
      username,
      fullName,
      email: primaryEmail,
      phoneNumber: primaryPhone,
      role,
    },
    update: {
      username,
      fullName,
      email: primaryEmail,
      phoneNumber: primaryPhone,
      role,
    },
  })

  return NextResponse.json({ ok: true })
}

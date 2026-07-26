import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'
import { contactInputSchema } from '@/lib/validations/contact'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = contactInputSchema.parse(body)
    const contact = await prisma.contactRequest.create({ data })
    return NextResponse.json({ id: contact.id, message: 'Contact form submitted successfully' }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}

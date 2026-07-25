import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { ApiError, handleApiError } from '@/lib/api-error'
import { stripe } from '@/lib/stripe'
import { createOrderDraft, setStripePaymentIntentId } from '@/lib/orders'
import { createIntentSchema } from '@/lib/validations/order'

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser()
    const body = await req.json()
    const data = createIntentSchema.parse(body)

    const order = await createOrderDraft(user, data.customerName, data.phone, data.email ?? null, data.address, data.items)

    const amountCents = Math.round(order.totalAmount * 100)
    if (amountCents < 50) throw new ApiError(400, 'Minimum amount is 0.50')

    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: process.env.STRIPE_CURRENCY ?? 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: { orderId: String(order.id) },
    })

    await setStripePaymentIntentId(order.id, intent.id)

    return NextResponse.json({ clientSecret: intent.client_secret, orderDraftId: order.id })
  } catch (err) {
    return handleApiError(err)
  }
}

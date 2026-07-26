import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { findOrderByStripePaymentIntentId, finalizeOrder } from '@/lib/orders'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ message: 'Webhook not configured' }, { status: 500 })
  }

  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ message: 'Missing signature' }, { status: 400 })

  const payload = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret)
  } catch {
    return NextResponse.json({ message: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    const order = await findOrderByStripePaymentIntentId(paymentIntent.id)
    if (order) {
      try {
        await finalizeOrder(order.id)
      } catch (err) {
        console.error('Order finalization failed:', err)
        return NextResponse.json({ ok: true, message: 'Order finalization failed' })
      }
    }
  }

  return NextResponse.json({ ok: true })
}

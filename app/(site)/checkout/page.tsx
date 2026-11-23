'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useCart } from '@/components/cart/CartContext'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatNPR } from '@/lib/currency'
import StoreSelector from '@/components/checkout/StoreSelector'
import TimeSlotSelector from '@/components/checkout/TimeSlotSelector'
import CouponInput from '@/components/checkout/CouponInput'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? 'pk_test_placeholder')

interface CheckoutFormData {
  customerName: string
  phone: string
  email: string
  address: string
}

function PaymentForm({ totalPrice, onSuccess }: { totalPrice: number; onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError(null)

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/checkout/success` },
    })

    if (confirmError) {
      setError(confirmError.message ?? 'Payment failed')
      setLoading(false)
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <Button type="submit" disabled={!stripe || loading} size="lg" className="w-full bg-[#E60012] hover:bg-[#C5000F]">
        {loading ? 'Processing...' : `Pay ${formatNPR(totalPrice)}`}
      </Button>
    </form>
  )
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalPrice, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'payment'>('form')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [formData, setFormData] = useState<CheckoutFormData>({ customerName: '', phone: '', email: '', address: '' })
  const [pickupLocation, setPickupLocation] = useState('')
  const [pickupTimeSlot, setPickupTimeSlot] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<number | null>(null)
  const [couponCode, setCouponCode] = useState<string | null>(null)
  const [discountAmount, setDiscountAmount] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    fetch('/api/users/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.id) setUserId(data.id)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const finalTotal = Math.max(0, totalPrice - (discountAmount ?? 0))

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return

    // If a coupon code was applied client-side but we somehow don't have a
    // discount amount for it, don't let the customer pay the un-discounted
    // price — make them re-apply (or remove) the coupon first.
    if (couponCode && discountAmount === null) {
      setError('Please re-apply your coupon code before continuing')
      return
    }

    if (!formData.customerName.trim()) {
      setError('Customer name is required')
      return
    }

    if (!formData.phone.trim()) {
      setError('Phone number is required')
      return
    }

    if (!formData.address.trim()) {
      setError('Address is required')
      return
    }

    if (!pickupLocation) {
      setError('Please select a pick-up location')
      return
    }

    if (!pickupTimeSlot) {
      setError('Please select a pick-up time slot')
      return
    }

    setLoading(true)
    setError(null)

    const res = await fetch('/api/payments/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: formData.customerName,
        phone: formData.phone,
        email: formData.email || undefined,
        address: formData.address,
        pickupLocation: `Store ${pickupLocation}`,
        pickupTimeSlot: pickupTimeSlot,
        items: items.map((item) => ({ partId: item.partId, quantity: item.quantity })),
        couponCode: couponCode ?? undefined,
        discountAmount: discountAmount ?? undefined,
      }),
    })

    setLoading(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.message ?? 'Failed to create payment')
      return
    }

    const body = await res.json()
    setClientSecret(body.clientSecret)
    setStep('payment')
  }

  const onPaymentSuccess = () => {
    clearCart()
    router.push('/checkout/success?redirect_status=succeeded')
  }

  if (items.length === 0 && step === 'form') {
    return (
      <>
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
              <p className="text-zinc-600 text-lg mb-4 dark:text-zinc-400">Your cart is empty.</p>
              <Button asChild className="bg-[#E60012] hover:bg-[#C5000F]"><Link href="/parts">Browse Parts</Link></Button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-zinc-900 mb-8 dark:text-zinc-100">Checkout</h1>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {step === 'form' ? (
                <form onSubmit={onFormSubmit} className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-6 dark:bg-zinc-900 dark:border-zinc-800">
                  <h2 className="text-xl font-bold text-zinc-900 mb-4 dark:text-zinc-100">Shipping Information</h2>
                  {error && <p className="text-red-600 text-sm">{error}</p>}
                  <div><Label htmlFor="customerName">Full Name *</Label><Input id="customerName" value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} required className="mt-1" /></div>
                  <div><Label htmlFor="phone">Phone *</Label><Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required className="mt-1" /></div>
                  <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="mt-1" /></div>
                  <div><Label htmlFor="address">Address *</Label><Textarea id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows={4} required className="mt-1" /></div>

                  <div className="mb-6 p-4 border border-zinc-200 rounded-lg dark:border-zinc-700">
                    <h3 className="font-semibold mb-4 text-zinc-900 dark:text-gray-100">Pick-up Details</h3>
                    <StoreSelector value={pickupLocation} onChange={setPickupLocation} />
                    <div className="mt-4">
                      <TimeSlotSelector value={pickupTimeSlot} onChange={setPickupTimeSlot} />
                    </div>
                  </div>

                  {userId !== null && (
                    <div className="mb-6 p-4 border border-zinc-200 rounded-lg dark:border-zinc-700">
                      <CouponInput
                        orderTotal={totalPrice}
                        userId={userId}
                        onDiscountChange={setDiscountAmount}
                        onCodeChange={setCouponCode}
                      />
                    </div>
                  )}

                  <Button type="submit" disabled={loading} size="lg" className="w-full bg-[#E60012] hover:bg-[#C5000F]">
                    {loading ? 'Creating payment...' : 'Continue to Payment'}
                  </Button>
                </form>
              ) : (
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
                  <h2 className="text-xl font-bold text-zinc-900 mb-4 dark:text-zinc-100">Pay with Card</h2>
                  {clientSecret && (
                    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#E60012' } } }}>
                      <PaymentForm totalPrice={finalTotal} onSuccess={onPaymentSuccess} />
                    </Elements>
                  )}
                </div>
              )}
            </div>
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm sticky top-24 dark:bg-zinc-900 dark:border-zinc-800">
                <h3 className="font-semibold text-zinc-900 mb-4 dark:text-zinc-100">Order Summary</h3>
                <div className="space-y-3 mb-4">
                  {items.map((item) => (
                    <div key={item.partId} className="flex justify-between text-sm">
                      <span className="text-zinc-600 dark:text-zinc-400">{item.partName} × {item.quantity}</span>
                      <span className="font-semibold">{formatNPR(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                {discountAmount !== null && discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400 mb-2">
                    <span>Discount {couponCode ? `(${couponCode})` : ''}</span>
                    <span>-{formatNPR(discountAmount)}</span>
                  </div>
                )}
                <div className="border-t border-zinc-200 pt-4 flex justify-between font-bold text-lg dark:border-zinc-800">
                  <span>Total</span><span className="text-[#E60012]">{formatNPR(finalTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

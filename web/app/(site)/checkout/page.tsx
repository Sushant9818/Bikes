'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useCart } from '@/cart/CartContext'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatNPR } from '@/lib/currency'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? 'pk_test_placeholder')

interface CheckoutFormData {
  customerName: string
  phone: string
  email: string
  address: string
}

function PaymentForm({ totalAmount, onSuccess }: { totalAmount: number; onSuccess: () => void }) {
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
        {loading ? 'Processing...' : `Pay ${formatNPR(totalAmount)}`}
      </Button>
    </form>
  )
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalAmount, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'payment'>('form')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [formData, setFormData] = useState<CheckoutFormData>({ customerName: '', phone: '', email: '', address: '' })
  const [error, setError] = useState<string | null>(null)

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return
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
        items: items.map((item) => ({ partId: item.partId, quantity: item.quantity })),
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
            <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center shadow-sm">
              <p className="text-zinc-600 text-lg mb-4">Your cart is empty.</p>
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
          <h1 className="text-3xl font-bold text-zinc-900 mb-8">Checkout</h1>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {step === 'form' ? (
                <form onSubmit={onFormSubmit} className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-6">
                  <h2 className="text-xl font-bold text-zinc-900 mb-4">Shipping Information</h2>
                  {error && <p className="text-red-600 text-sm">{error}</p>}
                  <div><Label htmlFor="customerName">Full Name *</Label><Input id="customerName" value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} required className="mt-1" /></div>
                  <div><Label htmlFor="phone">Phone *</Label><Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required className="mt-1" /></div>
                  <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="mt-1" /></div>
                  <div><Label htmlFor="address">Address *</Label><Textarea id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows={4} required className="mt-1" /></div>
                  <Button type="submit" disabled={loading} size="lg" className="w-full bg-[#E60012] hover:bg-[#C5000F]">
                    {loading ? 'Creating payment...' : 'Continue to Payment'}
                  </Button>
                </form>
              ) : (
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-zinc-900 mb-4">Pay with Card</h2>
                  {clientSecret && (
                    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#E60012' } } }}>
                      <PaymentForm totalAmount={totalAmount} onSuccess={onPaymentSuccess} />
                    </Elements>
                  )}
                </div>
              )}
            </div>
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm sticky top-24">
                <h3 className="font-semibold text-zinc-900 mb-4">Order Summary</h3>
                <div className="space-y-3 mb-4">
                  {items.map((item) => (
                    <div key={item.partId} className="flex justify-between text-sm">
                      <span className="text-zinc-600">{item.partName} × {item.quantity}</span>
                      <span className="font-semibold">{formatNPR(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-zinc-200 pt-4 flex justify-between font-bold text-lg">
                  <span>Total</span><span className="text-[#E60012]">{formatNPR(totalAmount)}</span>
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

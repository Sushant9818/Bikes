import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useCart } from '@/cart/CartContext'
import { createPaymentIntent } from '@/api/payments'
import Footer from '@/components/Footer'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatNPR } from '@/utils/currency'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder')

const schema = z.object({
  customerName: z.string().min(1, 'Full name is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Valid email required').optional().or(z.literal('')),
  address: z.string().min(1, 'Address is required'),
})

function PaymentForm({ formData, items, totalAmount, onSuccess }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/checkout/success',
          receipt_email: formData.email || undefined,
          payment_method_data: {
            billing_details: {
              name: formData.customerName,
              phone: formData.phone,
              address: {
                line1: formData.address,
              },
            },
          },
        },
      })

      if (error) {
        toast.error(error.message || 'Payment failed')
      } else {
        onSuccess()
      }
    } catch (err) {
      toast.error(err.message || 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || loading}
        size="lg"
        className="w-full bg-[#E60012] hover:bg-[#C5000F]"
      >
        {loading ? 'Processing...' : `Pay ${formatNPR(totalAmount)}`}
      </Button>
    </form>
  )
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, totalAmount, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('form')
  const [clientSecret, setClientSecret] = useState(null)
  const [orderDraftId, setOrderDraftId] = useState(null)
  const [formData, setFormData] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      customerName: '',
      phone: '',
      email: '',
      address: '',
    },
  })

  const onFormSubmit = async (data) => {
    if (items.length === 0) {
      toast.error('Cart is empty')
      return
    }

    setLoading(true)
    try {
      const res = await createPaymentIntent({
        customerName: data.customerName,
        phone: data.phone,
        email: data.email || null,
        address: data.address,
        items: items.map((item) => ({
          partId: item.partId,
          partName: item.partName,
          price: item.price,
          quantity: item.quantity,
        })),
      })

      setClientSecret(res.clientSecret)
      setOrderDraftId(res.orderDraftId)
      setFormData(data)
      setStep('payment')
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data || 'Failed to create payment')
    } finally {
      setLoading(false)
    }
  }

  const onPaymentSuccess = () => {
    clearCart()
    toast.success('Order placed successfully! Payment confirmed.')
    navigate('/')
  }

  if (items.length === 0 && step === 'form') {
    return (
      <>
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center shadow-sm">
              <p className="text-zinc-600 text-lg mb-4">Your cart is empty.</p>
              <Button asChild className="bg-[#E60012] hover:bg-[#C5000F]">
                <a href="/parts">Browse Parts</a>
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  const options = clientSecret
    ? {
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: { colorPrimary: '#E60012' },
        },
      }
    : {}

  return (
    <>
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-zinc-900 mb-8">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {step === 'form' ? (
                <form onSubmit={handleSubmit(onFormSubmit)} className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-6">
                  <h2 className="text-xl font-bold text-zinc-900 mb-4">Shipping Information</h2>

                  <div>
                    <Label htmlFor="customerName">Full Name *</Label>
                    <Input id="customerName" {...register('customerName')} className="mt-1" />
                    {errors.customerName && (
                      <p className="text-red-600 text-sm mt-1">{errors.customerName.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input id="phone" type="tel" {...register('phone')} className="mt-1" />
                    {errors.phone && (
                      <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" {...register('email')} className="mt-1" />
                    {errors.email && (
                      <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="address">Address *</Label>
                    <Textarea id="address" {...register('address')} rows={4} className="mt-1" />
                    {errors.address && (
                      <p className="text-red-600 text-sm mt-1">{errors.address.message}</p>
                    )}
                  </div>

                  <Button type="submit" disabled={loading} size="lg" className="w-full bg-[#E60012] hover:bg-[#C5000F]">
                    {loading ? 'Creating payment...' : 'Continue to Payment'}
                  </Button>
                </form>
              ) : (
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-zinc-900 mb-4">Pay with Card</h2>
                  {options.clientSecret && (
                    <Elements stripe={stripePromise} options={options}>
                      <PaymentForm
                        formData={formData}
                        items={items}
                        totalAmount={totalAmount}
                        onSuccess={onPaymentSuccess}
                      />
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
                      <span className="text-zinc-600">
                        {item.partName} × {item.quantity}
                      </span>
                      <span className="font-semibold">
                        {formatNPR(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-zinc-200 pt-4 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-[#E60012]">{formatNPR(totalAmount)}</span>
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

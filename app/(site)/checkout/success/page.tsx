'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const status = searchParams.get('redirect_status')

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto text-center">
        {status === 'succeeded' ? (
          <>
            <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-zinc-900 mb-4">Payment Successful!</h1>
            <p className="text-zinc-600 mb-8">Your order has been placed successfully. You will receive an email confirmation shortly.</p>
            <Button asChild className="bg-[#E60012] hover:bg-[#C5000F]"><Link href="/">Return to Home</Link></Button>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-zinc-900 mb-4">Checkout</h1>
            <p className="text-zinc-600 mb-8">
              {status === 'processing' ? 'Your payment is being processed...' : 'Something went wrong. Please try again.'}
            </p>
            <Button asChild className="bg-[#E60012] hover:bg-[#C5000F]"><Link href="/checkout">Back to Checkout</Link></Button>
          </>
        )}
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <>
      <Suspense fallback={<div className="py-16 px-4 sm:px-6 lg:px-8"><div className="max-w-2xl mx-auto">Loading...</div></div>}>
        <CheckoutSuccessContent />
      </Suspense>
      <Footer />
    </>
  )
}

import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom'
import { useCart } from '@/cart/CartContext'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams()
  const { clearCart } = useCart()
  const status = searchParams.get('redirect_status')

  useEffect(() => {
    if (status === 'succeeded') {
      clearCart()
    }
  }, [status, clearCart])

  return (
    <>
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          {status === 'succeeded' ? (
            <>
              <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-zinc-900 mb-4">Payment Successful!</h1>
              <p className="text-zinc-600 mb-8">
                Your order has been placed successfully. You will receive an email confirmation shortly.
              </p>
              <Button asChild className="bg-[#E60012] hover:bg-[#C5000F]">
                <Link to="/">Return to Home</Link>
              </Button>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-zinc-900 mb-4">Checkout</h1>
              <p className="text-zinc-600 mb-8">
                {status === 'processing'
                  ? 'Your payment is being processed...'
                  : 'Something went wrong. Please try again.'}
              </p>
              <Button asChild className="bg-[#E60012] hover:bg-[#C5000F]">
                <Link to="/checkout">Back to Checkout</Link>
              </Button>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}

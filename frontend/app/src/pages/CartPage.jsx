import { Link } from 'react-router-dom'
import { useCart } from '@/cart/CartContext'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { formatNPR } from '@/utils/currency'

export default function CartPage() {
  const { items, totalAmount, updateQuantity, removeFromCart } = useCart()

  if (items.length === 0) {
    return (
      <>
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
              <ShoppingBag className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Your cart is empty</h3>
              <p className="text-zinc-600 mb-6">Add some parts to get started!</p>
              <Button asChild className="bg-[#E60012] hover:bg-[#C5000F]">
                <Link to="/parts">Browse Parts</Link>
              </Button>
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
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-zinc-900">Shopping Cart</h1>
            <Badge variant="secondary">{items.length} item{items.length !== 1 ? 's' : ''}</Badge>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden mb-6 shadow-sm">
            <div className="divide-y divide-zinc-200">
              {items.map((item) => (
                <div key={item.partId} className="p-6 flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-zinc-900">{item.partName}</h3>
                    <p className="text-sm text-zinc-600 mt-1">
                      {formatNPR(item.price)} each
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 border border-zinc-200 rounded-xl">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => updateQuantity(item.partId, item.quantity - 1)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-12 text-center font-semibold">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => updateQuantity(item.partId, item.quantity + 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="w-32 text-right">
                      <p className="font-bold text-zinc-900">
                        {formatNPR(item.price * item.quantity)}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        removeFromCart(item.partId)
                        toast.success('Item removed from cart')
                      }}
                      className="text-[#E60012] hover:text-[#C5000F]"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
            <div className="space-y-4">
              <div className="flex justify-between text-lg">
                <span className="text-zinc-600">Subtotal</span>
                <span className="font-semibold text-zinc-900">
                  {formatNPR(totalAmount)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-[#E60012]">{formatNPR(totalAmount)}</span>
              </div>
              <Button asChild size="lg" className="w-full mt-6 bg-[#E60012] hover:bg-[#C5000F]">
                <Link to="/checkout">Proceed to Checkout</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

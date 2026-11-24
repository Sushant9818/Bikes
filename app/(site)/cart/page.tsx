'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useCart } from '@/cart/CartContext'
import { formatNPR } from '@/lib/currency'
import { Minus, Plus, Trash2, ShoppingCart, AlertCircle } from 'lucide-react'

export default function CartPage() {
  const router = useRouter()
  const { isSignedIn } = useUser()
  const { items, totalAmount, updateQuantity, removeFromCart, clearCart } = useCart()
  const [mounted, setMounted] = useState(false)
  const [stockLimits, setStockLimits] = useState<Record<number, number>>({})

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && items.length > 0) {
      const fetchStockLimits = async () => {
        try {
          const limits: Record<number, number> = {}
          for (const item of items) {
            const res = await fetch(`/api/parts/${item.partId}`)
            if (res.ok) {
              const part = await res.json()
              limits[item.partId] = part.quantity ?? 0
            }
          }
          setStockLimits(limits)
        } catch (err) {
          console.error('Failed to fetch stock limits:', err)
        }
      }
      fetchStockLimits()
    }
  }, [mounted, items.length])

  const handleQuantityChange = (partId: number, newQuantity: number) => {
    const maxQty = stockLimits[partId] ?? 0
    if (newQuantity <= 0) {
      removeFromCart(partId)
    } else {
      updateQuantity(partId, newQuantity, maxQty)
    }
  }

  const handleCheckout = () => {
    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }
    router.push('/checkout')
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <ShoppingCart className="mx-auto h-16 w-16 text-zinc-400 animate-pulse" />
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading cart...</p>
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <ShoppingCart className="mx-auto h-16 w-16 text-zinc-400" />
            <h1 className="mt-6 text-2xl font-bold text-zinc-900 dark:text-white">Your cart is empty</h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">Start shopping to add items</p>
            <Link
              href="/parts"
              className="mt-6 inline-block px-6 py-3 bg-[#E60012] text-white rounded-lg hover:bg-[#C5000F] transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800">
              {items.map((item) => {
                const maxQty = stockLimits[item.partId] ?? item.maxQuantity ?? 0
                const isAtMax = item.quantity >= maxQty && maxQty > 0
                return (
                  <div
                    key={item.partId}
                    className="p-6 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                        {item.partName}
                      </h3>
                      <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                        {formatNPR(item.price)} each
                      </p>
                      {isAtMax && (
                        <div className="flex items-center gap-1 mt-2 text-sm text-orange-600 dark:text-orange-400">
                          <AlertCircle className="h-4 w-4" />
                          <span>Max stock reached ({maxQty} available)</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 ml-6">
                      <div className="flex items-center border border-zinc-300 dark:border-zinc-700 rounded-lg">
                        <button
                          onClick={() => handleQuantityChange(item.partId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="px-4 py-2 text-zinc-900 dark:text-white font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.partId, item.quantity + 1)}
                          disabled={isAtMax}
                          className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="text-right min-w-[100px]">
                        <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                          {formatNPR(item.price * item.quantity)}
                        </p>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.partId)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Remove from cart"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <Link href="/parts" className="mt-6 inline-block text-[#E60012] hover:underline">
              ← Continue Shopping
            </Link>
          </div>

          <div>
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                  <span>{formatNPR(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Shipping</span>
                  <span>TBD</span>
                </div>
              </div>

              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 mb-6">
                <div className="flex justify-between text-lg font-semibold text-zinc-900 dark:text-white">
                  <span>Total</span>
                  <span className="text-[#E60012]">{formatNPR(totalAmount)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full px-6 py-3 bg-[#E60012] text-white font-semibold rounded-lg hover:bg-[#C5000F] transition-colors mb-3"
              >
                Proceed to Checkout
              </button>

              <button
                onClick={clearCart}
                className="w-full px-6 py-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

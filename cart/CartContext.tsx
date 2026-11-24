'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Part } from '@prisma/client'

const CART_STORAGE_KEY = 'suzuki_cart'

export interface CartItem {
  partId: number
  partName: string
  price: number
  quantity: number
  maxQuantity: number
}

interface CartContextValue {
  items: CartItem[]
  totalItems: number
  totalAmount: number
  addToCart: (part: Part) => void
  updateQuantity: (partId: number, quantity: number, maxQty?: number) => void
  removeFromCart: (partId: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      if (stored) {
        const parsedItems = JSON.parse(stored) as CartItem[]
        setItems(parsedItems)
      }
    } catch {
      setItems([])
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    }
  }, [items, hydrated])

  const addToCart = (part: Part) => {
    const maxQty = part.quantity ?? 0
    setItems((prev) => {
      const existing = prev.find((item) => item.partId === part.id)
      if (existing) {
        const newQty = Math.min(existing.quantity + 1, maxQty)
        return prev.map((item) => (item.partId === part.id ? { ...item, quantity: newQty, maxQuantity: maxQty } : item))
      }
      return [...prev, { partId: part.id, partName: part.partName, price: part.price, quantity: 1, maxQuantity: maxQty }]
    })
  }

  const updateQuantity = (partId: number, quantity: number, maxQty?: number) => {
    if (quantity <= 0) { removeFromCart(partId); return }
    setItems((prev) => prev.map((item) => {
      if (item.partId === partId) {
        const max = maxQty ?? item.maxQuantity
        const clampedQty = Math.min(quantity, max)
        return { ...item, quantity: clampedQty, maxQuantity: max }
      }
      return item
    }))
  }

  const removeFromCart = (partId: number) => {
    setItems((prev) => prev.filter((item) => item.partId !== partId))
  }

  const clearCart = () => setItems([])

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <CartContext.Provider value={{ items, totalItems, totalAmount, addToCart, updateQuantity, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}

'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Part } from '@prisma/client'

const CART_STORAGE_KEY = 'suzuki_cart'

export interface CartItem {
  partId: number
  partName: string
  price: number
  quantity: number
}

interface CartContextValue {
  items: CartItem[]
  totalItems: number
  totalAmount: number
  addToCart: (part: Part) => void
  updateQuantity: (partId: number, quantity: number) => void
  removeFromCart: (partId: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = window.localStorage.getItem(CART_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addToCart = (part: Part) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.partId === part.id)
      if (existing) {
        return prev.map((item) => (item.partId === part.id ? { ...item, quantity: item.quantity + 1 } : item))
      }
      return [...prev, { partId: part.id, partName: part.partName, price: part.price, quantity: 1 }]
    })
  }

  const updateQuantity = (partId: number, quantity: number) => {
    if (quantity <= 0) { removeFromCart(partId); return }
    setItems((prev) => prev.map((item) => (item.partId === partId ? { ...item, quantity } : item)))
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

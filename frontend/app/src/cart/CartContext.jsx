import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext(null)

const CART_STORAGE_KEY = 'suzuki_cart'

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addToCart = (part) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.partId === part.id)
      if (existing) {
        return prev.map((item) =>
          item.partId === part.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [
        ...prev,
        {
          partId: part.id,
          partName: part.partName,
          price: part.price,
          quantity: 1,
        },
      ]
    })
  }

  const updateQuantity = (partId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(partId)
      return
    }
    setItems((prev) =>
      prev.map((item) =>
        item.partId === partId ? { ...item, quantity } : item
      )
    )
  }

  const removeFromCart = (partId) => {
    setItems((prev) => prev.filter((item) => item.partId !== partId))
  }

  const clearCart = () => {
    setItems([])
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalAmount,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}

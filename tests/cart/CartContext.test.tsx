import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CartProvider, useCart } from '@/cart/CartContext'
import type { Part } from '@prisma/client'

const samplePart = { id: 1, type: 'BIKE_PART', brand: 'Suzuki', partName: 'Air Filter', compatibleModel: null, price: 850, quantity: 50, imageUrl: null } as Part

function TestHarness() {
  const { items, totalAmount, addToCart, updateQuantity } = useCart()
  return (
    <div>
      <button onClick={() => addToCart(samplePart)}>add</button>
      <button onClick={() => updateQuantity(1, 3)}>set-qty-3</button>
      <span data-testid="count">{items.length}</span>
      <span data-testid="total">{totalAmount}</span>
    </div>
  )
}

describe('CartContext', () => {
  beforeEach(() => window.localStorage.clear())

  it('adds a part to the cart and increments quantity on repeat add', () => {
    render(<CartProvider><TestHarness /></CartProvider>)
    fireEvent.click(screen.getByText('add'))
    fireEvent.click(screen.getByText('add'))
    expect(screen.getByTestId('count').textContent).toBe('1')
    expect(screen.getByTestId('total').textContent).toBe('1700')
  })

  it('updates quantity directly', () => {
    render(<CartProvider><TestHarness /></CartProvider>)
    fireEvent.click(screen.getByText('add'))
    fireEvent.click(screen.getByText('set-qty-3'))
    expect(screen.getByTestId('total').textContent).toBe('2550')
  })
})

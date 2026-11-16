import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { CartProvider } from '@/cart/CartContext'
import PartDetailPage from '@/app/(site)/parts/[id]/page'

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ isSignedIn: true, user: null }),
}))

describe('PartDetailPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ id: 1, type: 'BIKE_PART', brand: 'Suzuki', partName: 'Air Filter', compatibleModel: null, price: 850, quantity: 50, imageUrl: null }),
    })) as unknown as typeof fetch
  })

  it('renders the fetched part', async () => {
    render(
      <CartProvider>
        <PartDetailPage />
      </CartProvider>
    )
    await waitFor(() => expect(screen.getByText('Air Filter')).toBeInTheDocument())
    expect(screen.getByText(/Rs 850/)).toBeInTheDocument()
  })
})

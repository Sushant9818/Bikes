import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import ProductDetailPage from '@/app/(site)/products/[id]/page'

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
  useRouter: () => ({ back: vi.fn() }),
}))

describe('ProductDetailPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ id: 1, type: 'BIKE', modelName: 'Gixxer 155', brand: 'Suzuki', year: 2024, price: 229000, quantity: 10, imageUrl: null, description: null }),
    })) as unknown as typeof fetch
  })

  it('renders the fetched vehicle', async () => {
    render(<ProductDetailPage />)
    await waitFor(() => expect(screen.getByText('Gixxer 155')).toBeInTheDocument())
    expect(screen.getByText(/2,29,000/)).toBeInTheDocument()
  })

  it('shows a "not found" message when the fetch returns 404', async () => {
    ;(global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false, json: async () => null })
    render(<ProductDetailPage />)
    await waitFor(() => expect(screen.getByText('Vehicle not found.')).toBeInTheDocument())
  })
})

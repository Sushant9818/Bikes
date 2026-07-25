import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import CheckoutSuccessPage from '@/app/(site)/checkout/success/page'

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('redirect_status=succeeded'),
}))

describe('CheckoutSuccessPage', () => {
  it('shows the success message when redirect_status=succeeded', () => {
    render(<CheckoutSuccessPage />)
    expect(screen.getByText('Payment Successful!')).toBeInTheDocument()
  })
})

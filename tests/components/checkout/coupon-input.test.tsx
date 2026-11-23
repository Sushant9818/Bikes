import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CouponInput from '@/components/checkout/CouponInput'

describe('CouponInput', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the promo code input and apply button', () => {
    render(<CouponInput orderTotal={1500} onDiscountChange={vi.fn()} />)

    expect(screen.getByLabelText(/Promo Code/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /apply/i })).toBeInTheDocument()
  })

  it('calls the validate endpoint on blur with the correct params', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ valid: true, discountAmount: 100 }),
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<CouponInput orderTotal={1500} onDiscountChange={vi.fn()} />)

    const input = screen.getByLabelText(/Promo Code/i)
    fireEvent.change(input, { target: { value: 'SAVE10' } })
    fireEvent.blur(input)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/coupons/validate',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'SAVE10', orderTotal: 1500 }),
      })
    )
  })

  it('displays the discount and calls onDiscountChange when the coupon is valid', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ valid: true, discountAmount: 150 }),
      })
    )
    const onDiscountChange = vi.fn()

    render(<CouponInput orderTotal={1500} onDiscountChange={onDiscountChange} />)

    const input = screen.getByLabelText(/Promo Code/i)
    fireEvent.change(input, { target: { value: 'SAVE10' } })
    fireEvent.blur(input)

    expect(await screen.findByText(/Discount: -Rs 150\.00/)).toBeInTheDocument()
    expect(screen.getByText(/Coupon applied successfully/i)).toBeInTheDocument()
    expect(onDiscountChange).toHaveBeenCalledWith(150)
  })

  it('displays an error reason when the coupon is invalid', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ valid: false, reason: 'EXPIRED' }),
      })
    )
    const onDiscountChange = vi.fn()

    render(<CouponInput orderTotal={1500} onDiscountChange={onDiscountChange} />)

    const input = screen.getByLabelText(/Promo Code/i)
    fireEvent.change(input, { target: { value: 'OLDCODE' } })
    fireEvent.blur(input)

    const errorMessage = await screen.findByText(/This coupon has expired/i)
    expect(errorMessage).toBeInTheDocument()
    expect(errorMessage).toHaveClass('text-red-600')
    expect(onDiscountChange).toHaveBeenLastCalledWith(null)
  })

  it('shows the minimum order amount reason when applicable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ valid: false, reason: 'MIN_AMOUNT_NOT_MET' }),
      })
    )

    render(<CouponInput orderTotal={500} onDiscountChange={vi.fn()} />)

    const input = screen.getByLabelText(/Promo Code/i)
    fireEvent.change(input, { target: { value: 'SAVE10' } })
    fireEvent.blur(input)

    expect(await screen.findByText(/Minimum order amount not met/i)).toBeInTheDocument()
  })

  it('handles network errors gracefully', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))

    render(<CouponInput orderTotal={1500} onDiscountChange={vi.fn()} />)

    const input = screen.getByLabelText(/Promo Code/i)
    fireEvent.change(input, { target: { value: 'SAVE10' } })
    fireEvent.blur(input)

    expect(await screen.findByText(/network error/i)).toBeInTheDocument()
  })

  it('clears the discount and resets state when "Remove code" is clicked', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ valid: true, discountAmount: 200 }),
      })
    )
    const onDiscountChange = vi.fn()

    render(<CouponInput orderTotal={1500} onDiscountChange={onDiscountChange} />)

    const input = screen.getByLabelText(/Promo Code/i)
    fireEvent.change(input, { target: { value: 'SAVE20' } })
    fireEvent.blur(input)

    await screen.findByText(/Discount: -Rs 200\.00/)

    fireEvent.click(screen.getByText(/Remove code/i))

    expect(screen.queryByText(/Discount: -Rs 200\.00/)).not.toBeInTheDocument()
    expect(onDiscountChange).toHaveBeenLastCalledWith(null)
    expect(screen.getByLabelText(/Promo Code/i)).toHaveValue('')
  })

  it('applies dark mode classes to success and error states', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ valid: false, reason: 'NOT_FOUND' }),
      })
    )

    render(<CouponInput orderTotal={1500} onDiscountChange={vi.fn()} />)

    const input = screen.getByLabelText(/Promo Code/i)
    fireEvent.change(input, { target: { value: 'BADCODE' } })
    fireEvent.blur(input)

    const errorMessage = await screen.findByText(/This coupon code is invalid/i)
    expect(errorMessage.className).toContain('dark:text-red-400')
  })
})

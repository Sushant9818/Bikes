import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CouponModal, { type CouponData } from '@/components/admin/CouponModal'

const baseCoupon: CouponData = {
  id: 1,
  code: 'SAVE10',
  description: 'Save 10%',
  discountPercent: 10,
  discountFixed: null,
  minAmount: 500,
  maxUses: 100,
  maxUsesPerUser: 1,
  usesCount: 5,
  expiryDate: '2030-01-01T00:00:00.000Z',
  isActive: true,
}

describe('CouponModal', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 1 }),
      })
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders create form fields when mode is create', () => {
    render(<CouponModal open mode="create" onOpenChange={vi.fn()} onSuccess={vi.fn()} />)

    expect(screen.getByText('Create Coupon')).toBeInTheDocument()
    expect(screen.getByLabelText(/Code/)).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument()
  })

  it('pre-fills the form with coupon data when mode is edit', () => {
    render(
      <CouponModal open mode="edit" coupon={baseCoupon} onOpenChange={vi.fn()} onSuccess={vi.fn()} />
    )

    expect(screen.getByText('Edit Coupon')).toBeInTheDocument()
    expect(screen.getByLabelText(/Code/)).toHaveValue('SAVE10')
    expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument()
  })

  it('does not render when open is false', () => {
    render(<CouponModal open={false} mode="create" onOpenChange={vi.fn()} onSuccess={vi.fn()} />)
    expect(screen.queryByText('Create Coupon')).not.toBeInTheDocument()
  })

  it('calls onOpenChange(false) when Cancel is clicked', () => {
    const onOpenChange = vi.fn()
    render(<CouponModal open mode="create" onOpenChange={onOpenChange} onSuccess={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows a validation error when neither percentage nor fixed discount is provided', async () => {
    render(<CouponModal open mode="create" onOpenChange={vi.fn()} onSuccess={vi.fn()} />)

    fireEvent.change(screen.getByLabelText(/Code/), { target: { value: 'NEWCODE' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    expect(await screen.findByText(/percentage or a fixed discount is required/i)).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('shows a validation error when both percentage and fixed discount are set', async () => {
    render(<CouponModal open mode="create" onOpenChange={vi.fn()} onSuccess={vi.fn()} />)

    fireEvent.change(screen.getByLabelText(/Code/), { target: { value: 'NEWCODE' } })

    // Fill in the percentage field while "Percentage" is selected.
    fireEvent.change(screen.getByLabelText(/Discount Percentage/), { target: { value: '15' } })

    // Switch to Fixed Amount and fill that field too, without clearing the percentage value.
    fireEvent.click(screen.getByLabelText('Fixed Amount'))
    fireEvent.change(screen.getByLabelText(/Fixed Discount Amount/), { target: { value: '500' } })

    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    expect(await screen.findByText(/not both/i)).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('rejects a code with invalid characters', async () => {
    render(<CouponModal open mode="create" onOpenChange={vi.fn()} onSuccess={vi.fn()} />)

    fireEvent.change(screen.getByLabelText(/Code/), { target: { value: 'bad code!' } })
    fireEvent.change(screen.getByLabelText(/Discount Percentage/), { target: { value: '10' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    expect(await screen.findByText(/alphanumeric uppercase/i)).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('submits a POST request with the entered data when valid and mode is create', async () => {
    const onSuccess = vi.fn()
    render(<CouponModal open mode="create" onOpenChange={vi.fn()} onSuccess={onSuccess} />)

    fireEvent.change(screen.getByLabelText(/Code/), { target: { value: 'newcode' } })
    fireEvent.change(screen.getByLabelText(/Discount Percentage/), { target: { value: '20' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))

    const [url, options] = (fetch as any).mock.calls[0]
    expect(url).toBe('/api/admin/coupons')
    expect(options.method).toBe('POST')
    const body = JSON.parse(options.body)
    expect(body.code).toBe('NEWCODE')
    expect(body.discountPercent).toBe(20)

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(await screen.findByText(/created successfully/i)).toBeInTheDocument()
  })

  it('submits a PUT request to the coupon id endpoint when mode is edit', async () => {
    render(
      <CouponModal open mode="edit" coupon={baseCoupon} onOpenChange={vi.fn()} onSuccess={vi.fn()} />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Update' }))

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
    const [url, options] = (fetch as any).mock.calls[0]
    expect(url).toBe('/api/admin/coupons/1')
    expect(options.method).toBe('PUT')
  })

  it('shows an API error message when the request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'A coupon with this code already exists' }),
      })
    )

    render(<CouponModal open mode="create" onOpenChange={vi.fn()} onSuccess={vi.fn()} />)

    fireEvent.change(screen.getByLabelText(/Code/), { target: { value: 'DUPLICATE' } })
    fireEvent.change(screen.getByLabelText(/Discount Percentage/), { target: { value: '10' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    expect(await screen.findByText('A coupon with this code already exists')).toBeInTheDocument()
  })
})

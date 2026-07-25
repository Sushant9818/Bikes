import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog'

describe('ConfirmDeleteDialog', () => {
  it('shows the item name in the default message', () => {
    render(<ConfirmDeleteDialog open onOpenChange={vi.fn()} onConfirm={vi.fn()} itemName="Gixxer 155" />)
    expect(screen.getByText(/Gixxer 155/)).toBeInTheDocument()
  })

  it('calls onConfirm when Delete is clicked', () => {
    const onConfirm = vi.fn()
    render(<ConfirmDeleteDialog open onOpenChange={vi.fn()} onConfirm={onConfirm} itemName="Gixxer 155" />)
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AdminCardActions from '@/components/AdminCardActions'

describe('AdminCardActions', () => {
  it('renders nothing when neither handler is provided', () => {
    const { container } = render(<AdminCardActions />)
    expect(container).toBeEmptyDOMElement()
  })

  it('calls onEdit and onDelete when their buttons are clicked', () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    render(<AdminCardActions onEdit={onEdit} onDelete={onDelete} />)
    fireEvent.click(screen.getByRole('button', { name: /edit/i }))
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(onEdit).toHaveBeenCalledOnce()
    expect(onDelete).toHaveBeenCalledOnce()
  })
})

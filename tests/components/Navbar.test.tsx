import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Navbar from '@/components/Navbar'

vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ isSignedIn: false, user: null }),
  useClerk: () => ({ signOut: vi.fn() }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('Navbar', () => {
  it('shows Login/Register when signed out', () => {
    render(<Navbar />)
    expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Register' })).toBeInTheDocument()
  })

  it('renders the primary nav links', () => {
    render(<Navbar />)
    expect(screen.getByRole('link', { name: 'Bikes' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Book Service' })).toBeInTheDocument()
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import VehicleCatalogPage from '@/components/VehicleCatalogPage'

vi.mock('@clerk/nextjs', () => ({ useUser: () => ({ user: null }) }))

describe('VehicleCatalogPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn(async (url: string) => ({
      ok: true,
      json: async () => (url.includes('type=SCOOTER') ? [{ id: 2, type: 'SCOOTER', modelName: 'Access 125', quantity: 5 }] : [{ id: 1, type: 'BIKE', modelName: 'Gixxer 155', quantity: 5 }]),
    })) as unknown as typeof fetch
  })

  it('requests vehicles filtered by the given type and renders the heading', async () => {
    render(<VehicleCatalogPage type="SCOOTER" heading="Suzuki Scooters" addLabel="Add Scooter" />)
    await waitFor(() => expect(screen.getByText('Access 125')).toBeInTheDocument())
    expect(screen.getByText('Suzuki Scooters')).toBeInTheDocument()
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('type=SCOOTER'))
  })
})

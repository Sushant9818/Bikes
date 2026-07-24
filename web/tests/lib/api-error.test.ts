import { describe, it, expect } from 'vitest'
import { z, ZodError } from 'zod'
import { ApiError, handleApiError } from '@/lib/api-error'

describe('handleApiError', () => {
  it('maps ApiError to its status and message', async () => {
    const res = handleApiError(new ApiError(404, 'Vehicle not found'))
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.message).toBe('Vehicle not found')
  })

  it('maps ZodError to 400 with field errors', async () => {
    const schema = z.object({ price: z.number() })
    let zodError: ZodError | undefined
    try {
      schema.parse({ price: 'not-a-number' })
    } catch (e) {
      zodError = e as ZodError
    }
    const res = handleApiError(zodError)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.message).toBe('Validation error')
    expect(body.errors).toHaveProperty('price')
  })

  it('maps unknown errors to 500', async () => {
    const res = handleApiError(new Error('boom'))
    expect(res.status).toBe(500)
  })
})

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

export function handleApiError(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json({ message: err.message }, { status: err.status })
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      { message: 'Validation error', errors: err.flatten().fieldErrors },
      { status: 400 }
    )
  }
  if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
    const { status, message } = err as { status: unknown; message: unknown }
    if (typeof status === 'number' && typeof message === 'string') {
      return NextResponse.json({ message }, { status })
    }
  }
  console.error('Unhandled API error:', err)
  return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
}

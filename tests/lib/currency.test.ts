import { describe, it, expect } from 'vitest'
import { formatNPR } from '@/lib/currency'

describe('formatNPR', () => {
  it('formats a positive number with Indian-style grouping', () => {
    expect(formatNPR(1234567)).toBe('Rs 12,34,567')
  })

  it('returns "Rs 0" for null or undefined', () => {
    expect(formatNPR(null)).toBe('Rs 0')
    expect(formatNPR(undefined)).toBe('Rs 0')
  })

  it('falls back to raw value for non-numeric input', () => {
    expect(formatNPR(Number('abc'))).toBe('Rs NaN')
  })
})

import { describe, it, expect } from 'vitest'
import { generatePickupCode, validatePickupCode } from '@/lib/pickup-code'

describe('pickup-code', () => {
  it('generatePickupCode returns PKP-YYYYMMDD-XXXX format', () => {
    const date = new Date('2026-11-21T10:00:00Z')
    const code = generatePickupCode(1, date)
    expect(code).toMatch(/^PKP-\d{8}-\d{4}$/)
  })

  it('generatePickupCode with same date increments counter', () => {
    const date = new Date('2026-11-21T10:00:00Z')
    const code1 = generatePickupCode(1, date)
    const code2 = generatePickupCode(2, date)
    expect(code1).not.toEqual(code2)
  })

  it('validatePickupCode returns true for valid format', () => {
    expect(validatePickupCode('PKP-20261121-0001')).toBe(true)
  })

  it('validatePickupCode returns false for invalid format', () => {
    expect(validatePickupCode('INVALID')).toBe(false)
  })
})

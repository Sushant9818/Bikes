import { describe, it, expect } from 'vitest'
import { getServiceLabel, SERVICE_TYPES, TIME_SLOTS } from '@/lib/appointmentConstants'

describe('appointmentConstants', () => {
  it('maps a known service value to its label', () => {
    expect(getServiceLabel('OIL_CHANGE')).toBe('Oil Change')
  })

  it('falls back to the raw value for an unknown service', () => {
    expect(getServiceLabel('SOMETHING_ELSE')).toBe('SOMETHING_ELSE')
  })

  it('has 20 service types and 9 time slots, matching the original app', () => {
    expect(SERVICE_TYPES).toHaveLength(20)
    expect(TIME_SLOTS).toHaveLength(9)
  })
})

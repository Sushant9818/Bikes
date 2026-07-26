import { describe, it, expect } from 'vitest'
import { config } from '@/middleware'

describe('middleware config', () => {
  it('matches API routes', () => {
    const apiMatcher = config.matcher[1]
    expect(apiMatcher).toBe('/(api|trpc)(.*)')
  })

  it('excludes static assets from the page matcher', () => {
    const pageMatcher = config.matcher[0]
    expect(pageMatcher).toContain('_next')
    expect(pageMatcher).toContain('css')
  })
})

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider, useTheme } from '@/components/ThemeProvider'

function Consumer() {
  const { theme, toggle } = useTheme()
  return <button onClick={toggle}>{theme}</button>
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('defaults to light and toggles to dark, updating the html class', () => {
    render(<ThemeProvider><Consumer /></ThemeProvider>)
    expect(screen.getByRole('button')).toHaveTextContent('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    fireEvent.click(screen.getByRole('button'))

    expect(screen.getByRole('button')).toHaveTextContent('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('reads an existing localStorage preference on mount', () => {
    localStorage.setItem('theme', 'dark')
    render(<ThemeProvider><Consumer /></ThemeProvider>)
    expect(screen.getByRole('button')).toHaveTextContent('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})

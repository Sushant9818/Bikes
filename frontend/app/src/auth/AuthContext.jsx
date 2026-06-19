import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

function decodeToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload
  } catch {
    return null
  }
}

function isTokenExpired(token) {
  const payload = decodeToken(token)
  if (!payload?.exp) return true
  return Date.now() / 1000 > payload.exp
}

function loadAuthState() {
  const token = localStorage.getItem('token')
  if (!token || isTokenExpired(token)) {
    // Clear any stale data
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('user')
    return { user: null, token: null, role: null }
  }
  // Always derive role from the token itself — never trust a separate localStorage entry
  const payload = decodeToken(token)
  const role = payload?.role ?? localStorage.getItem('role')
  const stored = localStorage.getItem('user')
  const user = stored ? JSON.parse(stored) : null
  return { user, token, role }
}

export function AuthProvider({ children }) {
  const initial = loadAuthState()
  const [user, setUser] = useState(initial.user)
  const [token, setToken] = useState(initial.token)
  const [role, setRole] = useState(initial.role)

  const login = (userData, authToken, userRole) => {
    // Double-check role from token itself
    const payload = decodeToken(authToken)
    const resolvedRole = payload?.role ?? userRole
    setUser(userData)
    setToken(authToken)
    setRole(resolvedRole)
    localStorage.setItem('token', authToken)
    localStorage.setItem('role', resolvedRole)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    setRole(null)
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('user')
  }

  const isAdmin = () => role === 'ADMIN'

  return (
    <AuthContext.Provider value={{ user, token, role, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

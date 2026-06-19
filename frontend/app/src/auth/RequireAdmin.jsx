import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function RequireAdmin({ children }) {
  const { isAdmin } = useAuth()
  return isAdmin() ? children : <Navigate to="/login" replace />
}

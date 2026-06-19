import axios from 'axios'
import { toast } from 'sonner'

const baseURL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8081/api'

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const method = (config.method || '').toUpperCase()
  const url = (config.url || '').toLowerCase()
  const isAdminOnlyMutation =
    ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) &&
    (url.startsWith('/vehicles') || url.startsWith('/parts'))
  if (isAdminOnlyMutation) {
    const role = localStorage.getItem('role')
    if (role !== 'ADMIN') {
      toast.error('Admin only')
      return Promise.reject(new Error('Admin only'))
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    if (status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('role')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    if (status === 403) {
      const url = (error.config?.url || '').toLowerCase()
      if (url.includes('/vehicles') || url.includes('/parts')) {
        toast.error('Admin access required to modify catalog')
      }
    }
    return Promise.reject(error)
  }
)

export default api

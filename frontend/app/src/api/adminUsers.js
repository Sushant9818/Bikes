import http from './http.js'

export function getUsers() {
  return http.get('/admin/users').then((r) => r.data)
}

export function getUser(id) {
  return http.get(`/admin/users/${id}`).then((r) => r.data)
}

export function updateUserRole(id, role) {
  return http.put(`/admin/users/${id}/role`, { role }).then((r) => r.data)
}

export function updateUserEnabled(id, enabled) {
  return http.put(`/admin/users/${id}/enable`, { enabled }).then((r) => r.data)
}

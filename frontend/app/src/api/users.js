import http from './http.js'

export function getMe() {
  return http.get('/users/me').then((r) => r.data)
}

export function updateMe(data) {
  return http.put('/users/me', data).then((r) => r.data)
}

export function changePassword(currentPassword, newPassword) {
  return http.put('/users/me/password', { currentPassword, newPassword }).then((r) => r.data)
}

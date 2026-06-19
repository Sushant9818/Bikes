import http from './http.js'

export function getVehicles(params = {}) {
  return http.get('/vehicles', { params }).then((r) => r.data)
}

export function getVehicle(id) {
  return http.get(`/vehicles/${id}`).then((r) => r.data)
}

export function createVehicle(data) {
  return http.post('/vehicles', data).then((r) => r.data)
}

export function updateVehicle(id, data) {
  return http.put(`/vehicles/${id}`, data).then((r) => r.data)
}

export function deleteVehicle(id) {
  return http.delete(`/vehicles/${id}`).then((r) => r.data)
}

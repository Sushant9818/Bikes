import http from './http.js'

export function getParts(params = {}) {
  return http.get('/parts', { params }).then((r) => r.data)
}

export function getPart(id) {
  return http.get(`/parts/${id}`).then((r) => r.data)
}

export function createPart(data) {
  return http.post('/parts', data).then((r) => r.data)
}

export function updatePart(id, data) {
  return http.put(`/parts/${id}`, data).then((r) => r.data)
}

export function deletePart(id) {
  return http.delete(`/parts/${id}`).then((r) => r.data)
}

import http from './http.js'

export function getOffers() {
  return http.get('/offers').then((r) => r.data)
}

export function createOffer(data) {
  return http.post('/offers', data).then((r) => r.data)
}

export function updateOffer(id, data) {
  return http.put(`/offers/${id}`, data).then((r) => r.data)
}

export function deleteOffer(id) {
  return http.delete(`/offers/${id}`).then((r) => r.data)
}

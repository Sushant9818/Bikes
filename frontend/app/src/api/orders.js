import http from './http.js'

export function createOrder(data) {
  return http.post('/orders', data).then((r) => r.data)
}

export function getMyOrders() {
  return http.get('/orders/my').then((r) => r.data)
}

export function getOrders() {
  return http.get('/orders').then((r) => r.data)
}

export function updateOrderStatus(id, status) {
  return http.put(`/orders/${id}/status`, { status }).then((r) => r.data)
}

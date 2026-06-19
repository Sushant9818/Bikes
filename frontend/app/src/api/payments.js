import http from './http.js'

export function createPaymentIntent(data) {
  return http.post('/payments/create-intent', data).then((r) => r.data)
}

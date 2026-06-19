import http from './http.js'

export function getAnalyticsSummary(from, to) {
  const params = {}
  if (from) params.from = from
  if (to) params.to = to
  return http.get('/analytics/summary', { params }).then((r) => r.data)
}

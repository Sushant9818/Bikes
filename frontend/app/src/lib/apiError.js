/** Extract a user-visible message from an Axios/API error. */
export function getApiErrorMessage(err, fallback = 'Request failed') {
  if (!err) return fallback
  return (
    err.response?.data?.message ||
    err.response?.data?.error ||
    err.message ||
    fallback
  )
}

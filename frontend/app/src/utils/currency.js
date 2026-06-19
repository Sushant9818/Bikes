/**
 * Format amount as Nepalese Rupee (Rs) for display.
 * Does not change stored numeric values.
 */
export function formatNPR(amount) {
  if (amount === null || amount === undefined) return 'Rs 0'
  const n = Number(amount)
  if (Number.isNaN(n)) return `Rs ${amount}`
  return `Rs ${n.toLocaleString('en-IN')}`
}

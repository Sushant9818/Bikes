export function formatNPR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return 'Rs 0'
  const n = Number(amount)
  if (Number.isNaN(n)) return `Rs ${amount}`
  return `Rs ${n.toLocaleString('en-IN')}`
}

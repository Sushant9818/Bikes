// In-memory counter for tracking codes per date
const counterByDate: Record<string, number> = {}

/**
 * Generates a pick-up code in the format PKP-YYYYMMDD-XXXX
 * @param orderId - The order ID (unused for format, can be any number)
 * @param createdAt - The date the order was created
 * @returns A pick-up code in the format PKP-YYYYMMDD-XXXX
 */
export function generatePickupCode(orderId: number, createdAt: Date): string {
  // Convert date to YYYYMMDD format
  const dateStr = createdAt.toISOString().slice(0, 10).replace(/-/g, '')

  // Increment counter for this date
  if (!counterByDate[dateStr]) {
    counterByDate[dateStr] = 0
  }
  counterByDate[dateStr]++

  // Pad counter to 4 digits
  const paddedCounter = String(counterByDate[dateStr]).padStart(4, '0')

  return `PKP-${dateStr}-${paddedCounter}`
}

/**
 * Validates a pick-up code format
 * @param code - The code to validate
 * @returns True if the code matches the PKP-YYYYMMDD-XXXX format, false otherwise
 */
export function validatePickupCode(code: string): boolean {
  return /^PKP-\d{8}-\d{4}$/.test(code)
}

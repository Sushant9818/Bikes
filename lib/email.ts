import { Resend } from 'resend'
import OrderConfirmationCustomer from '@/emails/OrderConfirmationCustomer'
import OrderAlertAdmin from '@/emails/OrderAlertAdmin'
import LowStockAlert from '@/emails/LowStockAlert'
import type { Order, OrderItem, Part } from '@prisma/client'

let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

function mailEnabled(): boolean {
  return process.env.MAIL_ENABLED === 'true'
}

function mailFrom(): string {
  return process.env.MAIL_FROM ?? 'noreply@example.com'
}

function adminEmail(): string {
  return process.env.ADMIN_EMAIL ?? 'admin@example.com'
}

export async function sendOrderConfirmationEmail(order: Order & { items: OrderItem[] }): Promise<void> {
  if (!mailEnabled() || !order.email) return
  await getResend().emails.send({
    from: mailFrom(),
    to: order.email,
    subject: `Order Confirmation #${order.id}`,
    react: OrderConfirmationCustomer({
      orderId: order.id,
      customerName: order.customerName,
      phone: order.phone,
      address: order.address,
      items: order.items.map((i) => ({ partName: i.partName, price: i.price, quantity: i.quantity })),
      totalAmount: order.totalAmount,
    }),
  })
}

export async function sendOrderAlertAdminEmail(order: Order & { items: OrderItem[] }): Promise<void> {
  if (!mailEnabled()) return
  await getResend().emails.send({
    from: mailFrom(),
    to: adminEmail(),
    subject: `New Paid Order #${order.id}`,
    react: OrderAlertAdmin({
      orderId: order.id,
      customerName: order.customerName,
      phone: order.phone,
      email: order.email,
      address: order.address,
      items: order.items.map((i) => ({ partName: i.partName, price: i.price, quantity: i.quantity })),
      totalAmount: order.totalAmount,
    }),
  })
}

export async function sendLowStockAlertEmail(part: Part): Promise<void> {
  if (!mailEnabled()) return
  await getResend().emails.send({
    from: mailFrom(),
    to: adminEmail(),
    subject: `Low Stock Alert: ${part.partName}`,
    react: LowStockAlert({ partName: part.partName, compatibleModel: part.compatibleModel, quantity: part.quantity }),
  })
}

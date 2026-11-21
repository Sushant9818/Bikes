import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

interface OrderEmailData {
  customerEmail: string
  customerName: string
  orderId: number
  items: Array<{ partName: string; quantity: number; price: number }>
  totalAmount: number
  orderDate: string
}

interface ReviewEmailData {
  adminEmail: string
  reviewerName: string
  partName: string
  rating: number
  title: string
  content?: string
}

interface AppointmentReminderData {
  customerEmail: string
  customerName: string
  appointmentId: number
  bikeModel: string
  appointmentDate: string
  appointmentTime: string
  services: string[]
}

export async function sendOrderConfirmation(data: OrderEmailData) {
  try {
    if (!resend) {
      console.log('Resend API key not configured, skipping email')
      return
    }

    const itemsList = data.items.map((item) => `${item.partName} x${item.quantity}`).join(', ')

    await resend.emails.send({
      from: 'Suzuki Bike <noreply@suzuki-bike.com>',
      to: data.customerEmail,
      subject: `Order Confirmation #${data.orderId}`,
      html: `
        <h1>Order Confirmed!</h1>
        <p>Hi ${data.customerName},</p>
        <p>Thank you for your order. Your order has been confirmed and is being processed.</p>

        <h2>Order Details</h2>
        <p><strong>Order ID:</strong> #${data.orderId}</p>
        <p><strong>Items:</strong> ${itemsList}</p>
        <p><strong>Total Amount:</strong> Rs ${data.totalAmount.toLocaleString()}</p>
        <p><strong>Order Date:</strong> ${data.orderDate}</p>

        <p>You can track your order in your account dashboard.</p>
        <p>Thank you for shopping with Suzuki Bike!</p>
      `,
    })
  } catch (error) {
    console.error('Failed to send order confirmation email:', error)
  }
}

export async function sendNewReviewAlert(data: ReviewEmailData) {
  try {
    if (!resend) {
      console.log('Resend API key not configured, skipping email')
      return
    }

    await resend.emails.send({
      from: 'Suzuki Bike <noreply@suzuki-bike.com>',
      to: data.adminEmail,
      subject: `New Review: ${data.partName} (${data.rating}★)`,
      html: `
        <h1>New Review Received</h1>
        <p>A new review has been submitted for <strong>${data.partName}</strong></p>

        <h2>Review Details</h2>
        <p><strong>Reviewer:</strong> ${data.reviewerName}</p>
        <p><strong>Rating:</strong> ${data.rating}★</p>
        <p><strong>Title:</strong> ${data.title}</p>
        ${data.content ? `<p><strong>Content:</strong> ${data.content}</p>` : ''}

        <p><a href="https://suzuki-bike.com/admin/reviews">View all reviews in admin panel</a></p>
      `,
    })
  } catch (error) {
    console.error('Failed to send review alert email:', error)
  }
}

export async function sendAppointmentReminder(data: AppointmentReminderData) {
  try {
    if (!resend) {
      console.log('Resend API key not configured, skipping email')
      return
    }

    const servicesList = data.services.join(', ')

    await resend.emails.send({
      from: 'Suzuki Bike <noreply@suzuki-bike.com>',
      to: data.customerEmail,
      subject: `Appointment Reminder: ${data.bikeModel}`,
      html: `
        <h1>Service Appointment Reminder</h1>
        <p>Hi ${data.customerName},</p>
        <p>This is a reminder about your upcoming service appointment.</p>

        <h2>Appointment Details</h2>
        <p><strong>Appointment ID:</strong> #${data.appointmentId}</p>
        <p><strong>Bike Model:</strong> ${data.bikeModel}</p>
        <p><strong>Date:</strong> ${data.appointmentDate}</p>
        <p><strong>Time:</strong> ${data.appointmentTime}</p>
        <p><strong>Services:</strong> ${servicesList}</p>

        <p>Please arrive 10 minutes early. If you need to reschedule, visit your account dashboard.</p>
        <p>Thank you for choosing Suzuki Bike service center!</p>
      `,
    })
  } catch (error) {
    console.error('Failed to send appointment reminder email:', error)
  }
}

export async function sendOrderStatusUpdate(
  customerEmail: string,
  customerName: string,
  orderId: number,
  status: string
) {
  try {
    if (!resend) {
      console.log('Resend API key not configured, skipping email')
      return
    }

    const statusMessages: Record<string, string> = {
      CONFIRMED: 'Your order has been confirmed and is being prepared for shipment.',
      SHIPPED: 'Your order is on its way! You can track your shipment.',
      DELIVERED: 'Your order has been delivered. Thank you for your purchase!',
      CANCELLED: 'Your order has been cancelled.',
    }

    const message = statusMessages[status] || 'Your order status has been updated.'

    await resend.emails.send({
      from: 'Suzuki Bike <noreply@suzuki-bike.com>',
      to: customerEmail,
      subject: `Order #${orderId} ${status}`,
      html: `
        <h1>Order Status Update</h1>
        <p>Hi ${customerName},</p>
        <p>${message}</p>

        <p><strong>Order ID:</strong> #${orderId}</p>
        <p>Log in to your account to view more details.</p>
        <p>Thank you for shopping with Suzuki Bike!</p>
      `,
    })
  } catch (error) {
    console.error('Failed to send order status update email:', error)
  }
}

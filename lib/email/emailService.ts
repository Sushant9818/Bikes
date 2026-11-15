import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('Email service not configured. Skipping email send.');
    return false;
  }

  try {
    await transporter.sendMail({
      from: `Suzuki Bike <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export function generateOrderConfirmationEmail(
  customerName: string,
  orderNumber: string,
  items: Array<{ partName: string; quantity: number; price: number }>,
  total: number,
  address: string
): string {
  const itemsHtml = items
    .map(
      item =>
        `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.partName}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #E60012;">Order Confirmation</h2>
      <p>Hi ${customerName},</p>
      <p>Thank you for your order! We're processing it now.</p>
      
      <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Status:</strong> PENDING</p>
      </div>

      <h3>Order Items</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="background: #f5f5f5;">
          <th style="padding: 8px; text-align: left;">Item</th>
          <th style="padding: 8px; text-align: center;">Qty</th>
          <th style="padding: 8px; text-align: right;">Price</th>
        </tr>
        ${itemsHtml}
        <tr>
          <td colspan="2" style="padding: 8px; text-align: right;"><strong>Total:</strong></td>
          <td style="padding: 8px; text-align: right; font-size: 18px; color: #E60012;"><strong>₹${total.toFixed(2)}</strong></td>
        </tr>
      </table>

      <h3>Delivery Address</h3>
      <p>${address}</p>

      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        Questions? Contact us at support@suzukibike.com
      </p>
    </div>
  `;
}

export function generateOrderStatusEmail(
  customerName: string,
  orderNumber: string,
  status: string,
  estimatedDelivery?: string
): string {
  const statusMessage = {
    CONFIRMED: 'Your order has been confirmed and is being prepared for shipment.',
    SHIPPED: 'Your order is on its way! Check tracking info in your account.',
    DELIVERED: 'Your order has been delivered. Thank you for shopping with us!',
    CANCELLED: 'Your order has been cancelled. A refund will be processed shortly.',
  } as Record<string, string>;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #E60012;">Order Status Update</h2>
      <p>Hi ${customerName},</p>
      <p>${statusMessage[status] || 'Your order status has been updated.'}</p>
      
      <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Current Status:</strong> <span style="color: #E60012; font-weight: bold;">${status}</span></p>
        ${estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>` : ''}
      </div>

      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        Questions? Contact us at support@suzukibike.com
      </p>
    </div>
  `;
}

export function generateAppointmentReminderEmail(
  customerName: string,
  appointmentDate: string,
  appointmentTime: string,
  serviceType: string
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #E60012;">Service Appointment Reminder</h2>
      <p>Hi ${customerName},</p>
      <p>This is a reminder about your upcoming service appointment.</p>
      
      <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <p><strong>Service Type:</strong> ${serviceType}</p>
        <p><strong>Date:</strong> ${appointmentDate}</p>
        <p><strong>Time:</strong> ${appointmentTime}</p>
      </div>

      <p>Please arrive 10 minutes early. If you need to reschedule, contact us as soon as possible.</p>

      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        Questions? Contact us at support@suzukibike.com
      </p>
    </div>
  `;
}

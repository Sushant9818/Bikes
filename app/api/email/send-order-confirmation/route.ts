import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, generateOrderConfirmationEmail } from '@/lib/email/emailService';

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Fetch order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { part: true },
        },
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (!order.user?.email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // Prepare email content
    const itemsData = order.items.map(item => ({
      partName: item.part.partName,
      quantity: item.quantity,
      price: item.price,
    }));

    const emailHtml = generateOrderConfirmationEmail(
      order.customerName,
      `#${order.id}`,
      itemsData,
      order.totalAmount,
      order.address
    );

    // Send email
    const sent = await sendEmail({
      to: order.user.email,
      subject: `Order Confirmation - Suzuki Bike Shop - Order #${order.id}`,
      html: emailHtml,
    });

    if (!sent) {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return NextResponse.json(
      { error: 'Failed to send order confirmation email' },
      { status: 500 }
    );
  }
}

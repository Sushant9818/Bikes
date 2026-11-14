import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');
    const transactionUuid = searchParams.get('transaction_uuid');
    const status = searchParams.get('status');
    const refCode = searchParams.get('ref_code');

    if (!orderId) {
      return NextResponse.redirect(new URL('/checkout?error=missing_order', request.url));
    }

    // Fetch order
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
    });

    if (!order) {
      return NextResponse.redirect(new URL('/checkout?error=order_not_found', request.url));
    }

    // Update order status to PAID if status is COMPLETE
    if (status === 'COMPLETE' || refCode) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          stripePaymentIntentId: refCode || `esewa-${transactionUuid}`,
        },
      });

      // Clear cart items for user
      if (order.userId) {
        await prisma.cartItem.deleteMany({
          where: { userId: order.userId },
        });
      }

      return NextResponse.redirect(
        new URL(`/checkout/success?order_id=${order.id}&ref_code=${refCode || transactionUuid}`, request.url)
      );
    }

    // Payment failed or cancelled
    return NextResponse.redirect(
      new URL(`/checkout?error=payment_failed&order_id=${order.id}`, request.url)
    );
  } catch (error) {
    console.error('Error processing eSewa success:', error);
    return NextResponse.redirect(new URL('/checkout?error=processing_failed', request.url));
  }
}

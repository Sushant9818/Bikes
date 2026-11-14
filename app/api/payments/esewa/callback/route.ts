import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

interface EsewaCallbackPayload {
  transaction_code: string;
  status: string;
  total_amount: number;
  transaction_uuid: string;
  product_code: string;
  signed_field_names: string;
  signature: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: EsewaCallbackPayload = await request.json();

    const {
      transaction_code,
      status,
      total_amount,
      transaction_uuid,
      product_code,
      signed_field_names,
      signature,
    } = body;

    // Verify signature
    const secretKey = process.env.ESEWA_SECRET_KEY || '';
    const signatureData = `${total_amount}|${transaction_uuid}|${product_code}|${signed_field_names}`;
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(signatureData)
      .digest('base64');

    if (signature !== expectedSignature) {
      console.error('Invalid eSewa signature');
      return NextResponse.json(
        { error: 'Invalid signature', success: false },
        { status: 401 }
      );
    }

    // Extract order ID from transaction_uuid (format: orderId-timestamp)
    const orderIdMatch = transaction_uuid.match(/^(\d+)-/);
    if (!orderIdMatch) {
      console.error('Invalid transaction_uuid format');
      return NextResponse.json(
        { error: 'Invalid transaction format', success: false },
        { status: 400 }
      );
    }

    const orderId = parseInt(orderIdMatch[1]);

    // Fetch order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found', success: false },
        { status: 404 }
      );
    }

    // Verify amount matches
    if (order.totalAmount !== total_amount) {
      console.error(`Amount mismatch: ${order.totalAmount} vs ${total_amount}`);
      return NextResponse.json(
        { error: 'Amount mismatch', success: false },
        { status: 400 }
      );
    }

    // Update order status based on payment status
    if (status === 'COMPLETE') {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          stripePaymentIntentId: transaction_code,
        },
      });

      // Clear cart for user
      if (order.userId) {
        await prisma.cartItem.deleteMany({
          where: { userId: order.userId },
        });
      }
    }

    // eSewa expects JSON response with success: true
    return NextResponse.json({
      success: true,
      transaction_code,
      message: 'Payment processed successfully',
    });
  } catch (error) {
    console.error('Error processing eSewa callback:', error);
    return NextResponse.json(
      { error: 'Processing failed', success: false },
      { status: 500 }
    );
  }
}

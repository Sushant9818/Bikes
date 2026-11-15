import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

interface InitiatePaymentBody {
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  items: Array<{ partId: number; quantity: number }>;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: InitiatePaymentBody = await request.json();
    const { customerName, phone, email, address, items } = body;

    if (!customerName || !phone || !address || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch parts and calculate total
    const parts = await prisma.part.findMany({
      where: {
        id: { in: items.map(i => i.partId) },
      },
    });

    let totalAmount = 0;
    const orderItems: Array<{
      partId: number;
      partName: string;
      price: number;
      quantity: number;
    }> = [];

    for (const item of items) {
      const part = parts.find(p => p.id === item.partId);
      if (!part) {
        return NextResponse.json(
          { error: `Part ${item.partId} not found` },
          { status: 404 }
        );
      }
      if (part.quantity < item.quantity) {
        return NextResponse.json(
          { error: `Part ${part.partName} out of stock` },
          { status: 400 }
        );
      }
      totalAmount += part.price * item.quantity;
      orderItems.push({
        partId: part.id,
        partName: part.partName,
        price: part.price,
        quantity: item.quantity,
      });
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        customerName,
        phone,
        email: email || null,
        address,
        totalAmount,
        status: 'PENDING',
        userId: user.id,
        items: {
          create: orderItems.map(item => ({
            partId: item.partId,
            partName: item.partName,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      },
    });

    // Generate eSewa payment hash
    const transactionUuid = `${order.id}-${Date.now()}`;
    const productCode = process.env.ESEWA_PRODUCT_CODE || 'SUZUKI_BIKE';
    const secretKey = process.env.ESEWA_SECRET_KEY || '';

    const signedFieldNames = 'total_amount,transaction_uuid,product_code';
    const signatureData = `${totalAmount}|${transactionUuid}|${productCode}|${signedFieldNames}`;
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(signatureData)
      .digest('base64');

    const esewaUrl = process.env.ESEWA_GATEWAY_URL || 'https://esewa.com.np/epay/pay';
    const successUrl = `${request.nextUrl.origin}/api/payments/esewa/success?order_id=${order.id}`;
    const failureUrl = `${request.nextUrl.origin}/checkout?error=payment_failed`;
    const cancelUrl = `${request.nextUrl.origin}/checkout`;

    const params = new URLSearchParams({
      amount: totalAmount.toString(),
      failure_url: failureUrl,
      product_delivery_charge: '0',
      product_service_charge: '0',
      product_code: productCode,
      signed_field_names: signedFieldNames,
      signature,
      success_url: successUrl,
      tax_amount: '0',
      total_amount: totalAmount.toString(),
      transaction_uuid: transactionUuid,
    });

    const redirectUrl = `${esewaUrl}?${params.toString()}`;

    return NextResponse.json({
      redirectUrl,
      orderId: order.id,
      transactionUuid,
    });
  } catch (error) {
    console.error('Error initiating eSewa payment:', error);
    return NextResponse.json(
      { error: 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}

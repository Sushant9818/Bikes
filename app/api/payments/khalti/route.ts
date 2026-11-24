import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { formatNPR } from '@/lib/currency'

export async function POST(req: Request) {
  try {
    const { userId: authUserId } = await auth()
    if (!authUserId) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 })
    }

    const user = await db.user.findUnique({ where: { clerkId: authUserId } })
    if (!user) {
      return new Response(JSON.stringify({ message: 'User not found' }), { status: 404 })
    }

    const body = await req.json()
    const { customerName, phone, email, address, pickupLocation, pickupTimeSlot, items, couponCode, discountAmount } = body

    const totalAmount = items.reduce((sum: number, item: any) => {
      return sum + item.quantity * (db.$queryRaw as any)`SELECT price FROM Part WHERE id = ${item.partId}`
    }, 0)

    const finalAmount = Math.max(0, totalAmount - (discountAmount ?? 0))

    const order = await db.order.create({
      data: {
        userId: user.id,
        customerName,
        phone,
        email: email || null,
        address,
        pickupLocation,
        pickupTimeSlot,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: 'KHALTI',
        totalAmount: finalAmount,
        items: {
          create: items.map((item: any) => ({
            partId: item.partId,
            quantity: item.quantity,
            priceAtTime: 0,
          })),
        },
      },
      include: { items: true },
    })

    // Mock Khalti payment URL
    // In production, integrate with Khalti API
    const khaltiPaymentUrl = `https://khalti.com/api/payment/?key=${process.env.KHALTI_PUBLIC_KEY}&amount=${finalAmount * 100}&mobile=&email=&product_identity=${order.id}&product_name=Suzuki%20Parts&success_url=${process.env.NEXT_PUBLIC_APP_URL}/checkout/success&failure_url=${process.env.NEXT_PUBLIC_APP_URL}/checkout/failed`

    return new Response(JSON.stringify({ paymentUrl: khaltiPaymentUrl, orderId: order.id }), { status: 200 })
  } catch (err) {
    console.error('Khalti payment error:', err)
    return new Response(
      JSON.stringify({ message: err instanceof Error ? err.message : 'Payment processing failed' }),
      { status: 500 }
    )
  }
}

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      include: {
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10000,
    });

    // Format CSV
    const headers = ['User ID', 'Username', 'Full Name', 'Email', 'Role', 'Status', 'Orders', 'Last Login', 'Created Date'];

    const rows = users.map(u => [
      u.id,
      u.username,
      u.fullName || '',
      u.email,
      u.role,
      u.status,
      u._count.orders,
      u.lastLogin ? new Date(u.lastLogin).toISOString().split('T')[0] : 'Never',
      new Date(u.createdAt).toISOString().split('T')[0],
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="users.csv"',
      },
    });
  } catch (error) {
    console.error('Error exporting users:', error);
    return NextResponse.json(
      { error: 'Failed to export users' },
      { status: 500 }
    );
  }
}

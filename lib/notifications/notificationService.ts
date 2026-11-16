import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client';

interface SendNotificationParams {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}

export async function sendNotification({
  userId,
  type,
  title,
  message,
  data,
}: SendNotificationParams) {
  try {
    // Get user preferences
    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: { userId },
      });
    }

    // Check if notification type is enabled
    const shouldNotify = shouldSendNotification(type, prefs);

    if (!shouldNotify) {
      return null;
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : null,
      },
    });

    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
    return null;
  }
}

function shouldSendNotification(type: NotificationType, prefs: any): boolean {
  const typeMap: Record<NotificationType, keyof typeof prefs> = {
    ORDER_CREATED: 'orderUpdates',
    ORDER_SHIPPED: 'orderUpdates',
    ORDER_DELIVERED: 'orderUpdates',
    ORDER_CANCELLED: 'orderUpdates',
    PAYMENT_RECEIVED: 'orderUpdates',
    REFUND_PROCESSED: 'orderUpdates',
    REVIEW_REPLY: 'reviews',
    COUPON_AVAILABLE: 'promotions',
    LOYALTY_POINTS: 'loyalty',
    APPOINTMENT_REMINDER: 'orderUpdates',
  };

  const prefKey = typeMap[type];
  return prefs[prefKey] !== false;
}

export async function markAsRead(notificationId: number, userId: number) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: {
      read: true,
      readAt: new Date(),
    },
  });
}

export async function deleteNotification(notificationId: number) {
  return prisma.notification.delete({
    where: { id: notificationId },
  });
}

export async function clearUnread(userId: number) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: {
      read: true,
      readAt: new Date(),
    },
  });
}

import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

interface WebhookPayload {
  event: string;
  timestamp: string;
  data: any;
}

export async function triggerWebhook(
  event: string,
  data: any,
  userId?: number
) {
  try {
    // Find webhooks subscribed to this event
    const webhooks = await prisma.webhook.findMany({
      where: {
        status: 'ACTIVE',
        events: { contains: event },
        ...(userId ? { userId } : {}),
      },
    });

    if (webhooks.length === 0) {
      return;
    }

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    // Send to all webhooks
    for (const webhook of webhooks) {
      deliverWebhook(webhook, payload);
    }
  } catch (error) {
    console.error('Error triggering webhook:', error);
  }
}

async function deliverWebhook(webhook: any, payload: WebhookPayload) {
  try {
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': payload.event,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const success = response.ok;
    const responseText = await response.text();

    // Log delivery
    await prisma.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        event: payload.event,
        payload: JSON.stringify(payload),
        statusCode: response.status,
        response: responseText,
        success,
        attempts: 1,
      },
    });

    // Update webhook stats
    if (!success) {
      await prisma.webhook.update({
        where: { id: webhook.id },
        data: {
          failureCount: { increment: 1 },
          ...(webhook.failureCount >= 9 ? { status: 'FAILED' } : {}),
        },
      });
    } else {
      await prisma.webhook.update({
        where: { id: webhook.id },
        data: {
          lastTriggered: new Date(),
          failureCount: 0,
        },
      });
    }
  } catch (error) {
    console.error(`Error delivering webhook ${webhook.id}:`, error);

    await prisma.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        event: payload.event,
        payload: JSON.stringify(payload),
        success: false,
        attempts: 1,
      },
    });

    await prisma.webhook.update({
      where: { id: webhook.id },
      data: {
        failureCount: { increment: 1 },
        ...(webhook.failureCount >= 9 ? { status: 'FAILED' } : {}),
      },
    });
  }
}

export function verifyWebhookSignature(
  signature: string,
  secret: string,
  payload: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

import { prisma } from '@/lib/prisma'
import type { User } from '@prisma/client'

export interface ActivityLogParams {
  userId: number
  action: string
  entityType: string
  entityId?: number
  changes?: Record<string, unknown>
}

export async function createActivityLog(params: ActivityLogParams): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        changes: params.changes || null,
      },
    })
  } catch (error) {
    // Log but don't throw - activity log failure shouldn't break the main operation
    console.error('Failed to create activity log:', error)
  }
}

export async function logBikeAction(
  user: User,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  bikeId?: number,
  changes?: Record<string, unknown>
): Promise<void> {
  await createActivityLog({
    userId: user.id,
    action,
    entityType: 'BIKE',
    entityId: bikeId,
    changes,
  })
}

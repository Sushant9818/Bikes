import { Role } from '@prisma/client'

/**
 * Permission helpers for admin actions.
 * Each function checks if a user with a given role can perform an action.
 */

export function canEditBikes(role: Role): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

export function canDeleteBikes(role: Role): boolean {
  return role === 'SUPER_ADMIN'
}

export function canEditParts(role: Role): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

export function canDeleteParts(role: Role): boolean {
  return role === 'SUPER_ADMIN'
}

export function canManageUsers(role: Role): boolean {
  return role === 'SUPER_ADMIN'
}

export function canManageRoles(role: Role): boolean {
  return role === 'SUPER_ADMIN'
}

export function canViewAnalytics(role: Role): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

export function canManageOffers(role: Role): boolean {
  return role === 'SUPER_ADMIN'
}

export function canViewActivityLog(role: Role): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

export function canApproveAppointments(role: Role): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

export function canViewSettings(role: Role): boolean {
  return role === 'SUPER_ADMIN'
}

/**
 * Grouped permission sets for different sections
 */
export const permissions = {
  bikes: {
    canEdit: canEditBikes,
    canDelete: canDeleteBikes,
  },
  parts: {
    canEdit: canEditParts,
    canDelete: canDeleteParts,
  },
  users: {
    canManage: canManageUsers,
    canManageRoles: canManageRoles,
  },
  analytics: {
    canView: canViewAnalytics,
  },
  offers: {
    canManage: canManageOffers,
  },
  activityLog: {
    canView: canViewActivityLog,
  },
  appointments: {
    canApprove: canApproveAppointments,
  },
  settings: {
    canView: canViewSettings,
  },
}

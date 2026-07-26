export interface AdminUserDto {
  id: string
  username: string | null
  email: string
  phoneNumber: string | null
  role: 'ADMIN' | 'CLIENT'
  enabled: boolean
  createdAt: string
}

interface ClerkUserLike {
  id: string
  username: string | null
  emailAddresses: { id: string; emailAddress: string }[]
  primaryEmailAddressId: string | null
  phoneNumbers: { id: string; phoneNumber: string }[]
  primaryPhoneNumberId: string | null
  publicMetadata: { role?: string }
  banned: boolean
  createdAt: number
}

export function toAdminUserDto(user: ClerkUserLike): AdminUserDto {
  const email = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress
    ?? user.emailAddresses[0]?.emailAddress ?? ''
  const phoneNumber = user.phoneNumbers.find((p) => p.id === user.primaryPhoneNumberId)?.phoneNumber ?? null
  const role: 'ADMIN' | 'CLIENT' = user.publicMetadata?.role === 'ADMIN' ? 'ADMIN' : 'CLIENT'

  return {
    id: user.id,
    username: user.username,
    email,
    phoneNumber,
    role,
    enabled: !user.banned,
    createdAt: new Date(user.createdAt).toISOString(),
  }
}

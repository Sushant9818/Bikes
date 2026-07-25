import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

let prismaClient: PrismaClient

if (!globalForPrisma.prisma) {
  // Only create a real connection if DATABASE_URL is set
  if (process.env.DATABASE_URL) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    })
    const adapter = new PrismaPg({ pool })
    prismaClient = new PrismaClient({ adapter })
  } else {
    // For testing without a database, create a client without connection
    // This will fail on actual queries but allows testing the client structure
    prismaClient = new PrismaClient({
      adapter: new PrismaPg({
        pool: new Pool({ connectionString: 'postgresql://localhost/test' }),
      }),
    })
  }

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaClient
  }
} else {
  prismaClient = globalForPrisma.prisma
}

export const prisma = prismaClient

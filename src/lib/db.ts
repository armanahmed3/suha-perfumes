import { PrismaClient } from '@prisma/client'
import path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getDatabaseUrl() {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('file:') && process.env.DATABASE_URL.includes(':')) {
    // Already absolute or non-relative
    const filePart = process.env.DATABASE_URL.replace(/^file:/, '')
    if (path.isAbsolute(filePart)) return process.env.DATABASE_URL
  }
  const resolved = path.resolve(process.cwd(), 'db', 'custom.db').replace(/\\/g, '/')
  return `file:${resolved}`
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export const hasDatabaseUrl = Boolean(
  process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')
);

if (!hasDatabaseUrl) {
  console.error('[Prisma] CRITICAL ERROR: DATABASE_URL is missing or invalid. Application will fail to connect to database.');
}

let dbUrl = process.env.DATABASE_URL || '';
// If using Supabase Transaction pool (port 6543) without pgbouncer flag, Prisma will throw prepared statement errors.
// Automatically append pgbouncer=true to prevent this.
if (dbUrl.includes('6543') && !dbUrl.includes('pgbouncer=true')) {
  dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'pgbouncer=true';
}

export const prisma = globalForPrisma.prisma || new PrismaClient({
  datasources: {
    db: {
      url: dbUrl
    }
  }
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

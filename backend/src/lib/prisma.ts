import { PrismaClient } from '@prisma/client';

const base = new PrismaClient();

// Prisma error codes meaning the DB connection itself was lost (not a query problem).
const CONNECTION_ERROR_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017', 'P2024']);

function isConnectionError(error: unknown): boolean {
  const e = error as { code?: string; message?: string; name?: string };
  if (e?.code && CONNECTION_ERROR_CODES.has(e.code)) return true;
  if (e?.name === 'PrismaClientInitializationError') return true;
  return /closed the connection|connection (reset|refused|terminated)|can't reach database/i.test(
    e?.message || ''
  );
}

// Single shared Prisma client for the whole app.
// Reusing one instance avoids opening a separate connection pool per route file.
//
// Pooled connections that sit idle overnight get dropped by the network/DB, so the
// first queries of the morning (usually the login) failed and needed several attempts.
// On a connection error we reconnect and retry the query once.
export const prisma = base.$extends({
  query: {
    async $allOperations({ args, query, operation, model }) {
      try {
        return await query(args);
      } catch (error) {
        if (!isConnectionError(error)) throw error;
        console.warn(`DB connection lost on ${model ?? ''}.${operation}, reconnecting and retrying`);
        await base.$disconnect().catch(() => {});
        await base.$connect();
        return query(args);
      }
    },
  },
});

/**
 * Establish the database connection before the server starts accepting traffic.
 * Retries a few times so a cold/idle database (e.g. first request of the day)
 * doesn't cause the first login attempts to fail.
 */
export async function connectWithRetry(retries = 10, delayMs = 3000): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      console.log('Database connection established');
      return;
    } catch (error) {
      console.error(
        `Database connection attempt ${attempt}/${retries} failed:`,
        error instanceof Error ? error.message : error
      );
      if (attempt === retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

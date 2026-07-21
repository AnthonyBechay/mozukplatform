import { PrismaClient } from '@prisma/client';

// Single shared Prisma client for the whole app.
// Reusing one instance avoids opening a separate connection pool per route file.
export const prisma = new PrismaClient();

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

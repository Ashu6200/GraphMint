import fs from 'node:fs';
import path from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import pg from 'pg';
import { Prisma, PrismaClient } from '../generated/prisma/client.ts';

const rootEnv = path.resolve(import.meta.dirname, '../../../.env');
if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
}
dotenv.config();

export function getDirectConnectionString(rawUrl = process.env.DATABASE_URL) {
  if (!rawUrl) return rawUrl;

  if (rawUrl.startsWith('prisma+postgres://')) {
    try {
      const parsed = new URL(rawUrl);
      const apiKey = parsed.searchParams.get('api_key');
      if (apiKey) {
        const decoded = JSON.parse(Buffer.from(apiKey, 'base64').toString('utf8'));
        if (decoded.databaseUrl) {
          return decoded.databaseUrl;
        }
      }
    } catch {
      // Fallback to rawUrl if parsing fails
    }
  }

  return rawUrl;
}

export function createPrismaClient() {
  const connectionString = getDirectConnectionString(process.env.DATABASE_URL);
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export { PrismaClient, Prisma };
export * from '../generated/prisma/client.ts';

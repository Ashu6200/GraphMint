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

export function createPrismaClient(options = {}) {
  const connectionString = getDirectConnectionString(
    options.connectionString || process.env.DATABASE_URL
  );

  const pool = new pg.Pool({
    connectionString,
    max:
      options.poolMax ||
      Number(process.env.DB_POOL_MAX) ||
      (process.env.NODE_ENV === 'production' ? 10 : 5),
    idleTimeoutMillis: options.idleTimeoutMillis || 30000,
    connectionTimeoutMillis: options.connectionTimeoutMillis || 5000,
  });

  const adapter = new PrismaPg(pool);

  const client = new PrismaClient({
    adapter,
    log:
      options.log ||
      (process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']),
  });

  // Attach pool reference so service can drain it on shutdown
  client.$pool = pool;
  return client;
}

export { PrismaClient, Prisma };
export { default as prismaPlugin } from './plugin.js';
export * from '../generated/prisma/client.ts';

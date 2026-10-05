import { randomUUID } from 'node:crypto';
import { redisPlugin } from '@graphmint/cache';
import { prismaPlugin } from '@graphmint/database';
import { registerHandlers, registerPlugins } from '@graphmint/service-config';
import { apiResponse } from '@graphmint/utils';
import fastify from 'fastify';

const app = fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
  },
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'reqId',
  genReqId(req) {
    return req.headers['x-request-id'] || randomUUID();
  },
});

await registerPlugins(app, {
  swaggerTitle: 'Core Service API',
  swaggerDescription: 'API documentation for GraphMint Core Service',
});

// Register Prisma & Redis Fastify plugins
await app.register(prismaPlugin, {
  poolMax: Number(process.env.DB_POOL_MAX) || 10,
});
await app.register(redisPlugin, {
  namespace: 'core',
});

registerHandlers(app, { serviceName: 'core-service' });

app.get('/health', async (request, reply) => {
  let dbStatus = 'healthy';
  try {
    await request.server.prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'unhealthy';
  }

  const isHealthy = dbStatus === 'healthy' && request.server.redis.isConnected();
  const statusCode = isHealthy ? 200 : 503;

  const data = {
    service: 'core-service',
    version: process.env.npm_package_version || '1.0.0',
    database: dbStatus,
    redis: request.server.redis.isConnected() ? 'healthy' : 'disconnected',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    memory: {
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      unit: 'MB',
    },
  };
  return apiResponse(
    request,
    reply,
    statusCode,
    isHealthy ? 'Service is healthy' : 'Service health check degraded',
    data
  );
});

export default app;
